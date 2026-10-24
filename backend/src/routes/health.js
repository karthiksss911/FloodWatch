import { Router } from 'express';
import { config } from '../config/env.js';
import { checkDatabaseHealth } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/v1/health
 * Public health & liveness probe.
 * Returns uptime, service status, environment mode, and database connectivity.
 * Exposes zero sensitive tokens, keys, passwords, or connection strings.
 */
router.get('/', async (req, res, next) => {
  try {
    const dbStatus = await checkDatabaseHealth();

    res.status(200).json({
      status: 'healthy',
      service: 'floodwatch-kerala-api',
      version: '1.0.0',
      environment: config.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
