/**
 * Sandbox Service — SSH-based isolated malware execution
 * Connects to user's VM via SSH, creates isolated temp dir,
 * uploads sample, executes it, collects artifacts, and cleans up.
 */
const { Client } = require('ssh2');
const { EventEmitter } = require('events');
const path = require('path');
const crypto = require('crypto');

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
            // Create isolated sandbox directory
            conn.exec(`mkdir -p ${sandboxDir} && echo "READY:${sandboxDir}"`, (err, stream) => {
                if (err) return reject(err);
                let output = '';
                stream.on('data', d => output += d.toString());
                stream.on('close', () => {
                    if (output.includes('READY:')) {
                        const session = { id: sessionId, conn, sandboxDir, config: { ...sshConfig, password: '***' }, artifacts: {}, status: 'connected', createdAt: new Date() };
                        sessions.set(sessionId, session);
                        resolve({ sessionId, sandboxDir });
                    } else {
                        reject(new Error('Failed to create sandbox directory'));
                    }
                });
            });
        });

        conn.on('error', err => {
            const msg = err.level === 'client-authentication'
                ? `Authentication failed for ${sshConfig.username}@${sshConfig.host} — check password or enable PasswordAuthentication in sshd_config`
                : `SSH connection failed: ${err.message}`;
            reject(new Error(msg));
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
            readyTimeout: 15000,
            tryKeyboard: true,  // Enable keyboard-interactive fallback
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

        console.log(`[SSH] Connecting to ${sshConfig.host}:${sshConfig.port || 22} as ${sshConfig.username}`);
        conn.connect(connectConfig);
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
 * Cleanup sandbox session — delete temp dir, close connection
 */
function cleanupSession(sessionId) {
    return new Promise((resolve) => {
        const session = sessions.get(sessionId);
        if (!session) return resolve({ cleaned: false });

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

module.exports = { createSession, uploadSample, executeInSandbox, collectArtifacts, cleanupSession, getSession, listSessions };
