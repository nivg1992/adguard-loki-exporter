const pino = require('pino');

module.exports = pino({
    transport: {
        target: 'pino-pretty',
        level: process.env.LOG_LEVEL || "info"
    },
});