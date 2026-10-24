import { Router } from 'express';
import { backendAssistanceService } from '../services/assistanceService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/v1/assistance-points
 * Query params: category, status, wheelchair_accessible, query
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await backendAssistanceService.getAssistancePoints(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistance-points/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await backendAssistanceService.getAssistancePointById(req.params.id);
    if (!result) {
      return next(new AppError(`Assistance Point with ID "${req.params.id}" not found`, 404, 'NOT_FOUND'));
    }
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
