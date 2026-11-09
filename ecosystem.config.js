module.exports = {
  apps: [
    {
      name: 'nevdakhin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001 -H 127.0.0.1',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
