import app from './app';
import config from './config';
import { initDatabase, closeDatabase } from './services/db.service';
import { logger } from './services/logger.service';

async function main() {
  try {
    // Initialize database
    await initDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`WebTerm backend running on port ${config.port} [${config.nodeEnv}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await closeDatabase();
        logger.info('Server shut down');
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.warn('Force shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
