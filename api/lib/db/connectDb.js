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
      bufferCommands: true,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      maxPoolSize: 50,
      minPoolSize: 10,
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
      logger.info('Connecting to MongoDB...');
      cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
        logger.info('Successfully connected to MongoDB');
        return mongoose;
      });
    } catch (error) {
      logger.error('Error connecting to MongoDB:', error);
      cached.conn = null;
      cached.promise = null;
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    logger.error('Error establishing MongoDB connection:', error);
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDb;
