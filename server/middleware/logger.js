/**
 * Simple styled Console Logger for server events and request logs.
 */
const logger = {
  info: (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[36m[${timestamp}] [INFO]\x1b[0m ${msg}`);
  },
  warn: (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[33m[${timestamp}] [WARN]\x1b[0m ${msg}`);
  },
  error: (msg, err = '') => {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m[${timestamp}] [ERROR]\x1b[0m ${msg}`, err);
  },
  // Custom stream writer for morgan HTTP logging integration
  stream: {
    write: (message) => {
      // Morgan logs already contain a newline
      console.log(`\x1b[35m[HTTP]\x1b[0m ${message.trim()}`);
    }
  }
};

module.exports = logger;
