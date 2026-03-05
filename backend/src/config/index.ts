import path from 'path';

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security
  masterSecret: process.env.MASTER_SECRET || 'dev-master-secret-change-in-production-32chars!',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Database
  rocksdbPath: process.env.ROCKSDB_PATH || path.join(__dirname, '../../data/rocksdb'),

  // Limits
  maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '5', 10),
  sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10),

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export default config;
