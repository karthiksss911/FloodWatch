import { Router } from 'express';
import { backendRiskService } from '../services/riskService.js';

const router = Router();

/**
 * GET /api/v1/risk/zones
 * Returns configured Greater Kochi sub-basins and calibrated thresholds
 */
router.get('/zones', (req, res) => {
  const result = backendRiskService.getZones();
  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * POST /api/v1/risk/evaluate
 * Computes deterministic multi-factor risk scores across all zones
 * Body: { simulatedRainfall, rainfallMultiplier, decayHalfLife }
 */
router.post('/evaluate', async (req, res, next) => {
  try {
    const result = await backendRiskService.evaluateRisk(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
