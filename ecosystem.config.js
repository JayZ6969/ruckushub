module.exports = {
  apps: [{
    name: 'ruckushub',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ruckushub',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
