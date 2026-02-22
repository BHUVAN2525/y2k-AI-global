/**
 * Sandbox Service — SSH-based isolated malware execution
 * Connects to user's VM via SSH, creates isolated temp dir,
 * uploads sample, executes it, collects artifacts, and cleans up.
 */
const { Client } = require('ssh2');
const { EventEmitter } = require('events');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const db = require('../config/db');

// In-memory session store
const sessions = new Map();

/**
 * Create a new SSH session to the user's VM
 */
function createSession(sshConfig) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const sessionId = crypto.randomUUID();
        const sandboxDir = `/tmp/sandbox_${sessionId.slice(0, 8)}`;

        conn.on('ready', () => {
            console.log(`[SSH] Connection ready for session: ${sessionId}`);
            console.log(`[SSH Tunnel] Establishing MongoDB port forward...`);

            // Create local server to listen for Mongoose traffic
            const proxyServer = net.createServer((socket) => {
                conn.forwardOut(socket.remoteAddress, socket.remotePort, '127.0.0.1', 27017, (err, stream) => {
                    if (err) {
                        socket.end();
                        return;
                    }
                    socket.pipe(stream);
                    stream.pipe(socket);
                });
            });

            proxyServer.on('error', (err) => {
                console.error('[SSH Tunnel] Proxy server error:', err.message);
                conn.end(); // Close SSH if proxy fails
                reject(new Error('Proxy server error: ' + err.message));
            });

            // Use 0 to let the OS assign an available port
            proxyServer.listen(0, '127.0.0.1', () => {
                const proxyPort = proxyServer.address().port;
                console.log(`[SSH Tunnel] Forwarding local port ${proxyPort} to remote 27017. Switching DB...`);
                // Switch the app's MongoDB connection to use the tunnel
                db.switchConnection(`mongodb://127.0.0.1:${proxyPort}/cerebus`).catch(err => {
                    console.error('[SSH Tunnel] DB switch failed:', err.message);
                });

                // Create isolated sandbox directory
                conn.exec(`mkdir -p ${sandboxDir} && echo "READY:${sandboxDir}"`, (err, stream) => {
                    if (err) {
                        proxyServer.close();
                        return reject(err);
                    }
                    let output = '';
                    stream.on('data', d => output += d.toString());
                    stream.on('error', (execErr) => {
                        proxyServer.close();
                        reject(execErr);
                    });
                    stream.on('close', () => {
                        if (output.includes('READY:')) {
                            const session = {
                                id: sessionId, conn, sandboxDir,
                                proxyServer, proxyPort,
                                config: { ...sshConfig, password: '***' },
                                artifacts: {}, status: 'connected', createdAt: new Date()
                            };
                            sessions.set(sessionId, session);
                            resolve({ sessionId, sandboxDir, proxyPort });
                        } else {
                            proxyServer.close();
                            reject(new Error('Failed to create sandbox directory'));
                        }
                    });
                });
            });
        });

        conn.on('error', err => {
            console.error(`[SSH Error] Session ${sessionId}:`, err);
            const msg = err.level === 'client-authentication'
                ? `Authentication failed for ${sshConfig.username}@${sshConfig.host} — check password or enable PasswordAuthentication in sshd_config`
                : `SSH connection failed: ${err.message}`;

            reject(new Error(msg));
        });

        conn.on('close', () => {
            console.log(`[SSH Close] Connection closed for session: ${sessionId}`);
        });

        conn.on('end', () => {
            console.log(`[SSH End] Connection ended for session: ${sessionId}`);
        });

        // Handle keyboard-interactive auth (used by many Linux VMs)
        conn.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
            console.log('[SSH] keyboard-interactive auth requested');
            finish([sshConfig.password || '']);
        });

        const connectConfig = {
            host: sshConfig.host,
            port: sshConfig.port || 22,
            username: sshConfig.username,
            readyTimeout: 30000,
            tryKeyboard: true,  // Enable keyboard-interactive fallback
            debug: (msg) => console.log(`[SSH Debug] ${msg}`)
        };

        // Support older SSH server algorithms
        connectConfig.algorithms = {
            kex: [
                'curve25519-sha256', 'curve25519-sha256@libssh.org',
                'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521',
                'diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha256',
                'diffie-hellman-group14-sha1', 'diffie-hellman-group1-sha1'
            ],
            serverHostKey: [
                'ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384',
                'ecdsa-sha2-nistp521', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'
            ],
            cipher: [
                'aes128-gcm', 'aes128-gcm@openssh.com', 'aes256-gcm', 'aes256-gcm@openssh.com',
                'aes128-ctr', 'aes192-ctr', 'aes256-ctr',
                'chacha20-poly1305@openssh.com'
            ]
        };

        if (sshConfig.authMethod === 'key') {
            connectConfig.privateKey = sshConfig.privateKey;
        } else {
            connectConfig.password = sshConfig.password;
        }

        console.log(`[SSH] Connecting to ${sshConfig.host}:${sshConfig.port || 22} as ${sshConfig.username} (timeout: 30s)`);
        try {
            conn.connect(connectConfig);
        } catch (e) {
            reject(new Error(`Failed to initiate SSH connection: ${e.message}`));
        }
    });
}

/**
 * Upload a file to the sandbox via SFTP
 */
function uploadSample(sessionId, fileBuffer, filename) {
    return new Promise((resolve, reject) => {
        const session = sessions.get(sessionId);
        if (!session) return reject(new Error('Session not found'));

        session.conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const remotePath = `${session.sandboxDir}/${filename}`;
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.on('close', () => {
                // Compute hash info
                const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
                const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                session.artifacts.filename = filename;
                session.artifacts.remotePath = remotePath;
                session.artifacts.md5 = md5;
                session.artifacts.sha256 = sha256;
                session.artifacts.fileSize = fileBuffer.length;
                resolve({ remotePath, md5, sha256, size: fileBuffer.length });
            });
            writeStream.on('error', reject);
            writeStream.end(fileBuffer);
        });
    });
}

/**
 * Execute the sample in the sandbox and stream output
 * Returns an EventEmitter that emits 'data', 'error', 'close'
 */
function executeInSandbox(sessionId, options = {}) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const emitter = new EventEmitter();
    const { timeout = 30, captureNetwork = true, captureProcesses = true } = options;
    const { sandboxDir, artifacts } = session;
    const filename = artifacts.filename;

    if (!filename) {
        emitter.emit('error', 'No sample uploaded yet');
        return emitter;
    }

    session.status = 'executing';
    session.artifacts.output = '';
    session.artifacts.startTime = new Date().toISOString();

    // Build execution command with artifact collection
    const commands = [
        // Snapshot before
        captureProcesses ? `ps aux > ${sandboxDir}/before_procs.txt 2>/dev/null` : 'true',
        captureNetwork ? `ss -tunap > ${sandboxDir}/before_net.txt 2>/dev/null || netstat -tunap > ${sandboxDir}/before_net.txt 2>/dev/null` : 'true',
        `ls -la ${sandboxDir}/ > ${sandboxDir}/before_files.txt 2>/dev/null`,

        // Execute with timeout
        `cd ${sandboxDir} && timeout ${timeout} ./${filename} 2>&1 || true`,

        // Snapshot after
        captureProcesses ? `ps aux > ${sandboxDir}/after_procs.txt 2>/dev/null` : 'true',
        captureNetwork ? `ss -tunap > ${sandboxDir}/after_net.txt 2>/dev/null || netstat -tunap > ${sandboxDir}/after_net.txt 2>/dev/null` : 'true',
        `ls -la ${sandboxDir}/ > ${sandboxDir}/after_files.txt 2>/dev/null`,
        `echo "EXECUTION_COMPLETE"`,
    ].join(' && ');

    // Make executable first
    session.conn.exec(`chmod +x ${sandboxDir}/${filename} && ${commands}`, (err, stream) => {
        if (err) { emitter.emit('error', err.message); return; }

        stream.on('data', data => {
            const text = data.toString();
            session.artifacts.output += text;
            emitter.emit('data', text);
        });
        stream.stderr.on('data', data => {
            const text = data.toString();
            session.artifacts.output += `[STDERR] ${text}`;
            emitter.emit('data', `[STDERR] ${text}`);
        });
        stream.on('close', (code) => {
            session.artifacts.exitCode = code;
            session.artifacts.endTime = new Date().toISOString();
            session.status = 'executed';
            emitter.emit('close', code);
        });
    });

    return emitter;
}

/**
 * Collect artifacts from the sandbox after execution
 */
function collectArtifacts(sessionId) {
    return new Promise((resolve, reject) => {
        const session = sessions.get(sessionId);
        if (!session) return reject(new Error('Session not found'));

        const { sandboxDir } = session;

        const readFile = (path) => new Promise((res) => {
            session.conn.exec(`cat ${path} 2>/dev/null || echo ""`, (err, stream) => {
                if (err) return res('');
                let data = '';
                stream.on('data', d => data += d.toString());
                stream.on('close', () => res(data.trim()));
            });
        });

        Promise.all([
            readFile(`${sandboxDir}/before_procs.txt`),
            readFile(`${sandboxDir}/after_procs.txt`),
            readFile(`${sandboxDir}/before_net.txt`),
            readFile(`${sandboxDir}/after_net.txt`),
            readFile(`${sandboxDir}/before_files.txt`),
            readFile(`${sandboxDir}/after_files.txt`),
        ]).then(([beforeProcs, afterProcs, beforeNet, afterNet, beforeFiles, afterFiles]) => {
            const artifacts = {
                ...session.artifacts,
                processes: { before: beforeProcs, after: afterProcs },
                network: { before: beforeNet, after: afterNet },
                files: { before: beforeFiles, after: afterFiles },
                collectedAt: new Date().toISOString(),
            };
            session.artifacts = artifacts;
            resolve(artifacts);
        }).catch(reject);
    });
}

/**
 * Restore sandbox to a clean state
 */
function restoreSnapshot(sessionId) {
    return new Promise((resolve, reject) => {
        const session = sessions.get(sessionId);
        if (!session) return reject(new Error('Session not found'));

        // Soft reset: remove and recreate sandbox directory
        session.conn.exec(`rm -rf ${session.sandboxDir} && mkdir -p ${session.sandboxDir} && echo "RESTORED"`, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('data', d => output += d.toString());
            stream.on('close', () => {
                if (output.includes('RESTORED')) {
                    session.status = 'connected'; // Reset status
                    session.artifacts = {}; // Clear old artifacts
                    resolve({ status: 'restored', sessionId });
                } else {
                    reject(new Error('Failed to restore snapshot'));
                }
            });
        });
    });
}

/**
 * Cleanup sandbox session — delete temp dir, close connection
 */
function cleanupSession(sessionId) {
    return new Promise((resolve) => {
        const session = sessions.get(sessionId);
        if (!session) return resolve({ cleaned: false });

        // Switch Mongoose back to local DB
        console.log(`[SSH Tunnel] Reverting MongoDB connection to local...`);
        db.switchConnection(process.env.MONGO_URI || 'mongodb://localhost:27017/cerebus').catch(console.error);

        // Close proxy server if it was created
        if (session.proxyServer) {
            session.proxyServer.close();
        }

        session.conn.exec(`rm -rf ${session.sandboxDir}`, (err, stream) => {
            if (stream) stream.on('close', () => {
                session.conn.end();
                sessions.delete(sessionId);
                resolve({ cleaned: true, sessionId });
            });
            else {
                session.conn.end();
                sessions.delete(sessionId);
                resolve({ cleaned: true, sessionId });
            }
        });
    });
}

/**
 * Create an interactive shell for the session
 */
function createShell(sessionId, windowOptions = {}) {
    return new Promise((resolve, reject) => {
        const session = sessions.get(sessionId);
        if (!session) return reject(new Error('Session not found'));

        session.conn.shell(windowOptions, (err, stream) => {
            if (err) return reject(err);
            resolve(stream);
        });
    });
}

/**
 * Get session info
 */
function getSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    return {
        id: session.id,
        status: session.status,
        sandboxDir: session.sandboxDir,
        createdAt: session.createdAt,
        artifacts: session.artifacts,
        config: session.config,
    };
}

function listSessions() {
    return Array.from(sessions.values()).map(s => ({
        id: s.id, status: s.status, createdAt: s.createdAt,
        host: s.config.host, filename: s.artifacts.filename
    }));
}

module.exports = { createSession, uploadSample, executeInSandbox, collectArtifacts, cleanupSession, getSession, listSessions, createShell, restoreSnapshot };
