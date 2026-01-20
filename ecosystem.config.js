const fs = require('fs');
const path = require('path');

// Load .env file manually
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    const env = {};

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }

    return env;
}

const envVars = loadEnvFile();

module.exports = {
    apps: [{
        name: 'simplysolutions',
        script: 'npm',
        args: 'start',
        cwd: '/var/www/simplysolutions',
        env: {
            NODE_ENV: 'production',
            PORT: 3001,
            ...envVars
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
    }]
};
