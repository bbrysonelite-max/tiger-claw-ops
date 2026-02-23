/**
 * Tiger Bot Scout - PM2 Ecosystem Configuration
 * Production deployment configuration for worker cluster
 */

module.exports = {
  apps: [
    // Gateway - Single instance (stateless HTTP server)
    {
      name: 'tiger-gateway',
      script: 'dist/src/gateway/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        GATEWAY_PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        GATEWAY_PORT: 3000,
      },
      // Logging
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },

    // Fleet Workers - Clustered for parallel message processing
    {
      name: 'tiger-worker',
      script: 'dist/src/fleet/worker.js',
      instances: 4, // Adjust based on CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 10,
      },
      env_development: {
        NODE_ENV: 'development',
        WORKER_CONCURRENCY: 5,
      },
      // Logging
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      // Graceful shutdown
      kill_timeout: 10000, // Give workers time to finish jobs
      wait_ready: true,
      listen_timeout: 15000,
      // Cluster-specific
      increment_var: 'WORKER_ID',
    },

    // Tiger Bot API (Express — admin commands, AI CRM, daily reports)
    {
      name: 'tiger-bot',
      script: 'api/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/tiger-bot-error.log',
      out_file: './logs/tiger-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 2000,
      kill_timeout: 5000,
    },

    // Provision Worker (BullMQ — creates new bots via BotFather)
    {
      name: 'provision-worker',
      script: 'dist/src/provisioner/provision-worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/provision-error.log',
      out_file: './logs/provision-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10000,
    },

    // Prospect Scheduler (hunts Reddit daily at 5 AM Bangkok, notifies customers)
    {
      name: 'prospect-scheduler',
      script: 'dist/src/fleet/prospect-scheduler.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/scheduler-error.log',
      out_file: './logs/scheduler-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },

    // Health Monitor (watchdog — checks Redis, DB, webhooks every 60s)
    {
      name: 'health-monitor',
      script: 'dist/src/monitoring/health-monitor.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '128M',
      error_file: './logs/monitor-error.log',
      out_file: './logs/monitor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: '208.113.131.83',
      ref: 'origin/main',
      repo: 'git@github.com:bbrysonelite-max/tiger-bot-scout.git',
      path: '/home/ubuntu/tiger-bot-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npm run build && npm run db:generate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'ubuntu',
      host: 'staging.tigerbotscout.com',
      ref: 'origin/develop',
      repo: 'git@github.com:bbrysonelite-max/tiger-bot-scout.git',
      path: '/home/ubuntu/tiger-bot-scout-staging',
      'post-deploy': 'npm ci && npm run build && npm run db:generate && pm2 reload ecosystem.config.js --env development',
      env: {
        NODE_ENV: 'development',
      },
    },
  },
};
