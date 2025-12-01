export default {
  apps: [{
    name: 'virtualvogue',
    script: 'src/bot.js',
    cwd: '/Users/Hido/Documents/VirtualVogueStudio',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};

