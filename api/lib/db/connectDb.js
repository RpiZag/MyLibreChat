require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('~/config');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn && cached.conn?._readyState === 1) {
    return cached.conn;
  }

  const disconnected = cached.conn && cached.conn?._readyState !== 1;
  if (!cached.promise || disconnected) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true,
      writeConcern: {
        w: 'majority',
        wtimeout: 30000
      },
      readPreference: 'primary',
      readConcern: { level: 'local' }
    };

    mongoose.set('strictQuery', true);

    try {
      cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
        logger.info('Successfully connected to MongoDB');
        return mongoose;
      });
    } catch (error) {
      logger.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    logger.error('Error establishing MongoDB connection:', error);
    throw error;
  }
}

module.exports = connectDb;
