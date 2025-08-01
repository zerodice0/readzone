/**
 * Database client with enhanced performance optimization
 * Re-exports optimized connection pool for backward compatibility
 */
export { 
  db, 
  connectionMonitor, 
  disconnectDb, 
  checkDbHealth 
} from './db/connection-pool'

// Maintain backward compatibility
export const prisma = require('./db/connection-pool').db