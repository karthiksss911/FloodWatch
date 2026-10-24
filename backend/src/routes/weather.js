import { Router } from 'express';
import { weatherService } from '../services/weatherService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Default coordinates for Greater Kochi center
const DEFAULT_KOCHI_LAT = 9.9816;
const DEFAULT_KOCHI_LNG = 76.2999;

/**
 * GET /api/v1/weather
 * Query parameters:
 *  - latitude: number (-90 to 90) [optional, defaults to Greater Kochi]
 *  - longitude: number (-180 to 180) [optional, defaults to Greater Kochi]
 */
router.get('/', async (req, res, next) => {
  try {
    const rawLat = req.query.latitude != null ? req.query.latitude : DEFAULT_KOCHI_LAT;
    const rawLng = req.query.longitude != null ? req.query.longitude : DEFAULT_KOCHI_LNG;

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return next(
        new AppError('Query parameter "latitude" must be a valid number between -90 and 90.', 400, 'INVALID_LATITUDE')
      );
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return next(
        new AppError('Query parameter "longitude" must be a valid number between -180 and 180.', 400, 'INVALID_LONGITUDE')
      );
    }

    const weatherData = await weatherService.getWeather({ latitude: lat, longitude: lng });

    res.status(200).json({
      success: true,
      data: weatherData,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
