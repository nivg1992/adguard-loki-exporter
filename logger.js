const pino = require('pino');

const transport = pino.transport({
      target: 'pino-pretty',
      level: process.env.LOG_LEVEL || "info",
      options: {
          colorize: true,
          minimumLevel: process.env.LOG_LEVEL || "info"
      }
})

module.exports = pino({level: process.env.LOG_LEVEL || "info"}, transport);
