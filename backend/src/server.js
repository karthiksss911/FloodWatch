import app from './app.js';
import { config } from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`=================================================`);
  console.log(`🌊 FloodWatch Kerala API Server Active`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health: http://localhost:${config.port}/api/v1/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🛡️  CORS Origins: ${config.allowedOrigins.join(', ')}`);
  console.log(`=================================================`);
});

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server cleanly...`);
  server.close(() => {
    console.log('[Server] HTTP connections closed. Process terminating.');
    process.exit(0);
  });

  // Force shutdown if connections do not close in 5 seconds
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully terminating.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
