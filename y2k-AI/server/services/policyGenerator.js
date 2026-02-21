/**
 * Policy Generator Service — Generates security hardening configs
 * 
 * Generates: UFW rules, SSH hardening, fail2ban configs, password policies
 */

const policyTemplates = {
    ufw: {
        name: 'UFW Firewall Rules',
        description: 'Secure firewall configuration with default deny',
        generate: (options = {}) => {
            const allowedPorts = options.allowed_ports || [22, 80, 443];
            const lines = [
                '#!/bin/bash',
                '# Y2K Cyber AI — Auto-generated UFW Policy',
                `# Generated: ${new Date().toISOString()}`,
                '',
                '# Reset UFW',
                'sudo ufw --force reset',
                '',
                '# Default policies',
                'sudo ufw default deny incoming',
                'sudo ufw default allow outgoing',
                '',
                '# Allow essential ports',
                ...allowedPorts.map(p => `sudo ufw allow ${p}/tcp`),
                '',
                '# Rate limiting on SSH',
                'sudo ufw limit 22/tcp',
                '',
                '# Enable UFW',
                'sudo ufw --force enable',
                '',
                '# Show status',
                'sudo ufw status verbose',
            ];
            return { script: lines.join('\n'), filename: 'ufw_policy.sh', language: 'bash' };
        }
    },
    ssh: {
        name: 'SSH Hardening',
        description: 'Secure SSH server configuration',
        generate: (options = {}) => {
            const config = [
                '# Y2K Cyber AI — SSH Hardening Config',
                `# Generated: ${new Date().toISOString()}`,
                '',
                'Protocol 2',
                'PermitRootLogin no',
                'PasswordAuthentication no',
                'PermitEmptyPasswords no',
                'MaxAuthTries 3',
                'MaxSessions 3',
                'LoginGraceTime 30',
                'ClientAliveInterval 300',
                'ClientAliveCountMax 2',
                'X11Forwarding no',
                'AllowAgentForwarding no',
                'AllowTcpForwarding no',
                '',
                '# Allowed users (customize)',
                `AllowUsers ${options.allowed_users || 'admin deploy'}`,
                '',
                '# Strong ciphers only',
                'Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com',
                'MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com',
                'KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512',
                '',
                '# Logging',
                'LogLevel VERBOSE',
            ];
            return { script: config.join('\n'), filename: 'sshd_config_secure', language: 'text' };
        }
    },
    fail2ban: {
        name: 'Fail2Ban Configuration',
        description: 'Intrusion prevention against brute force',
        generate: (options = {}) => {
            const maxRetry = options.max_retry || 3;
            const banTime = options.ban_time || 3600;
            const config = [
                '# Y2K Cyber AI — Fail2Ban Config',
                `# Generated: ${new Date().toISOString()}`,
                '',
                '[DEFAULT]',
                `bantime = ${banTime}`,
                'findtime = 600',
                `maxretry = ${maxRetry}`,
                'banaction = ufw',
                'backend = systemd',
                '',
                '[sshd]',
                'enabled = true',
                'port = ssh',
                'filter = sshd',
                'logpath = /var/log/auth.log',
                `maxretry = ${maxRetry}`,
                `bantime = ${banTime}`,
                '',
                '[nginx-http-auth]',
                'enabled = true',
                'port = http,https',
                'filter = nginx-http-auth',
                'logpath = /var/log/nginx/error.log',
                'maxretry = 5',
                '',
                '[nginx-limit-req]',
                'enabled = true',
                'port = http,https',
                'filter = nginx-limit-req',
                'logpath = /var/log/nginx/error.log',
                'maxretry = 10',
            ];
            return { script: config.join('\n'), filename: 'jail.local', language: 'ini' };
        }
    },
    password: {
        name: 'Password Policy',
        description: 'Strong password requirements configuration',
        generate: (options = {}) => {
            const minLen = options.min_length || 14;
            const config = [
                '# Y2K Cyber AI — Password Policy',
                `# Generated: ${new Date().toISOString()}`,
                '',
                '# /etc/security/pwquality.conf',
                `minlen = ${minLen}`,
                'dcredit = -1',
                'ucredit = -1',
                'ocredit = -1',
                'lcredit = -1',
                'minclass = 3',
                'maxrepeat = 2',
                'gecoscheck = 1',
                'dictcheck = 1',
                '',
                '# /etc/login.defs additions',
                'PASS_MAX_DAYS 90',
                'PASS_MIN_DAYS 7',
                `PASS_MIN_LEN ${minLen}`,
                'PASS_WARN_AGE 14',
            ];
            return { script: config.join('\n'), filename: 'password_policy.conf', language: 'ini' };
        }
    },
    sysctl: {
        name: 'Kernel Hardening (sysctl)',
        description: 'Network and kernel security parameters',
        generate: () => {
            const config = [
                '# Y2K Cyber AI — Kernel Hardening',
                `# Generated: ${new Date().toISOString()}`,
                '',
                '# IP Spoofing protection',
                'net.ipv4.conf.all.rp_filter = 1',
                'net.ipv4.conf.default.rp_filter = 1',
                '',
                '# Disable source packet routing',
                'net.ipv4.conf.all.accept_source_route = 0',
                'net.ipv6.conf.all.accept_source_route = 0',
                '',
                '# Ignore ICMP redirects',
                'net.ipv4.conf.all.accept_redirects = 0',
                'net.ipv6.conf.all.accept_redirects = 0',
                '',
                '# Ignore send redirects',
                'net.ipv4.conf.all.send_redirects = 0',
                '',
                '# SYN flood protection',
                'net.ipv4.tcp_syncookies = 1',
                'net.ipv4.tcp_max_syn_backlog = 2048',
                'net.ipv4.tcp_synack_retries = 2',
                '',
                '# Log Martians',
                'net.ipv4.conf.all.log_martians = 1',
                '',
                '# Disable ICMP ping',
                'net.ipv4.icmp_echo_ignore_broadcasts = 1',
                '',
                '# ASLR',
                'kernel.randomize_va_space = 2',
            ];
            return { script: config.join('\n'), filename: 'sysctl_hardening.conf', language: 'ini' };
        }
    }
};

const policyGenerator = {
    getAvailablePolicies() {
        return Object.entries(policyTemplates).map(([key, val]) => ({
            id: key,
            name: val.name,
            description: val.description,
        }));
    },

    generatePolicy(policyType, options = {}) {
        const template = policyTemplates[policyType];
        if (!template) {
            return { error: true, message: `Unknown policy type: ${policyType}` };
        }
        return {
            policy_type: policyType,
            name: template.name,
            ...template.generate(options),
            generated_at: new Date().toISOString(),
        };
    },

    generateAll(options = {}) {
        return Object.keys(policyTemplates).map(key => ({
            policy_type: key,
            ...this.generatePolicy(key, options)
        }));
    }
};

module.exports = policyGenerator;
