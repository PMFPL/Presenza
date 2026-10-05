module.exports = {
  apps: [
    {
      name: "presenza-api-prod",

      script: "./src/server.js",

      cwd: "/home/kamlesh/presenza-api",

      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
      },

      env_file: ".env.prod",

      autorestart: true,
      watch: false,

      max_memory_restart: "500M",

      error_file: "./logs/prod-error.log",
      out_file: "./logs/prod-out.log",

      time: true,
    },
  ],
};