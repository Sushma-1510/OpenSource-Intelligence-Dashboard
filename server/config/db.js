const mongoose = require('mongoose');

/**
 * Connects to MongoDB database.
 * Retries on initial failure up to 5 times.
 */
const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/osint_dashboard';
  let retries = 5;

  while (retries) {
    try {
      const conn = await mongoose.connect(connUri, {
        autoIndex: true, // Build indexes automatically in development
      });
      
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      break;
    } catch (err) {
      console.error(`[Database] Connection Error: ${err.message}`);
      retries -= 1;
      console.log(`[Database] Connection retries remaining: ${retries}`);
      
      if (retries === 0) {
        console.error('[Database] Failed to connect to MongoDB. Exiting application.');
        process.exit(1);
      }
      
      // Wait for 3 seconds before retrying
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
