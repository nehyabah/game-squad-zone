// PM2 configuration for Azure deployment
module.exports = {
  apps: [{
    name: 'squadpot-backend',
    script: './dist/src/main.server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    node_args: '--max-old-space-size=2048',
    max_memory_restart: '2G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};