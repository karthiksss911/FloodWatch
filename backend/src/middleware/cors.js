import cors from 'cors';
import { config } from '../config/env.js';

/**
 * Configured CORS middleware with explicit whitelist validation
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, cURL, health checks)
    if (!origin) {
      return callback(null, true);
    }

    if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error(`Origin "${origin}" is not allowed by CORS policy`);
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

export default corsMiddleware;
