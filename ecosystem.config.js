
module.exports = {
    apps: [{
        name: "whatsapp-bot",
        script: "shell.js",
        node_args: "--experimental-repl-await",
        watch: false,
        env: {
            NODE_ENV: "production"
        },
        autorestart: true,
        max_restarts: 10,
        max_memory_restart: "1G"
    }]
}