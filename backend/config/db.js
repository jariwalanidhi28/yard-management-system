const mongoose = require('mongoose');

let supportsTransactions = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/yms_db';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    
    // Check if replica set is enabled
    try {
      const adminDb = conn.connection.db.admin();
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      supportsTransactions = !!status && status.ok === 1;
      console.log(`[Database] Replica set detected: ${supportsTransactions} (Transactions ${supportsTransactions ? 'ENABLED' : 'SIMULATED/ATOMIC FALLBACK'})`);
    } catch {
      supportsTransactions = false;
      console.log('[Database] Running in standalone MongoDB mode. Atomic update fallback enabled.');
    }

    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Executes a callback within a MongoDB transaction if replica set is available,
 * or gracefully runs it without a session if running in standalone mode.
 * @param {Function} callback - async (session) => result
 */
const withTransaction = async (callback) => {
  if (supportsTransactions) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone fallback: execute directly
    return await callback(null);
  }
};

module.exports = {
  connectDB,
  withTransaction,
  isReplicaSet: () => supportsTransactions,
};
