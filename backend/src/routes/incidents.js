import { Router } from 'express';
import { backendIncidentService } from '../services/incidentService.js';
import { validateCreateIncident, validateUpdateIncidentStatus } from '../middleware/validation.js';
import { requireAuthority } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/v1/incidents
 * Query parameters: category, severity, status, verification_status, search, limit, offset
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await backendIncidentService.getIncidents(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/incidents/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await backendIncidentService.getIncidentById(req.params.id);
    if (!result) {
      return next(new AppError(`Incident with ID "${req.params.id}" not found`, 404, 'NOT_FOUND'));
    }
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/incidents
 * Creates a new community incident report
 */
router.post('/', validateCreateIncident, async (req, res, next) => {
  try {
    const result = await backendIncidentService.createIncident(req.body);
    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/incidents/:id
 * Protected route for authority status verification updates
 */
router.patch('/:id', requireAuthority, validateUpdateIncidentStatus, async (req, res, next) => {
  try {
    const { verification_status, status, reviewer, notes } = req.body;
    const result = await backendIncidentService.updateIncidentStatus(req.params.id, {
      verification_status,
      status,
      reviewer,
      notes,
    });

    if (!result) {
      return next(new AppError(`Incident with ID "${req.params.id}" not found`, 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/incidents/actions/reset-demo
 * Disabled in live database mode to prevent accidental data overwrites
 */
router.post('/actions/reset-demo', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Live Supabase database mode active. Resetting mock data is disabled.',
  });
});

export default router;
