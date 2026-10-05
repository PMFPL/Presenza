module.exports = {
  apps: [
    {
      name: "presenza-api-uat",

      script: "./src/server.js",

      cwd: "/home/ubuntu/presenza-api",

      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "uat",
      },

      env_file: ".env.uat",

      autorestart: true,
      watch: false,

      max_memory_restart: "500M",

      error_file: "./logs/uat-error.log",
      out_file: "./logs/uat-out.log",

      time: true,
    },
  ],
};