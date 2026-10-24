import { AppError } from './errorHandler.js';

const VALID_CATEGORIES = [
  'waterlogging',
  'road_blockage',
  'river_overflow',
  'landslide_risk',
  'tree_fall',
];

const VALID_SEVERITIES = ['low', 'moderate', 'high', 'severe'];

const VALID_STATUSES = ['active', 'investigating', 'resolved', 'archived'];

const VALID_VERIFICATIONS = [
  'verified_official',
  'community_confirmed',
  'unverified',
  'rejected_spam',
  'demo_reviewed',
  'demo_community_confirmed',
  'demo_unverified',
];

/**
 * Validates request payload for creating a new community incident report
 */
export function validateCreateIncident(req, res, next) {
  const { title, category, severity, latitude, longitude, location } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return next(new AppError('Field "title" is required and must be at least 3 characters.', 400, 'VALIDATION_FAILED'));
  }
  if (title.trim().length > 200) {
    return next(new AppError('Field "title" must not exceed 200 characters.', 400, 'VALIDATION_FAILED'));
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return next(
      new AppError(
        `Field "category" must be one of: ${VALID_CATEGORIES.join(', ')}`,
        400,
        'VALIDATION_FAILED'
      )
    );
  }

  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    return next(
      new AppError(
        `Field "severity" must be one of: ${VALID_SEVERITIES.join(', ')}`,
        400,
        'VALIDATION_FAILED'
      )
    );
  }

  const lat = Number(latitude ?? location?.lat);
  const lng = Number(longitude ?? location?.lng);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return next(new AppError('Valid latitude coordinate (-90 to 90) is required.', 400, 'VALIDATION_FAILED'));
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return next(new AppError('Valid longitude coordinate (-180 to 180) is required.', 400, 'VALIDATION_FAILED'));
  }

  next();
}

/**
 * Validates request payload for updating an incident status and review verification
 */
export function validateUpdateIncidentStatus(req, res, next) {
  const { status, verification_status } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return next(
      new AppError(
        `Field "status" must be one of: ${VALID_STATUSES.join(', ')}`,
        400,
        'VALIDATION_FAILED'
      )
    );
  }

  if (verification_status && !VALID_VERIFICATIONS.includes(verification_status)) {
    return next(
      new AppError(
        `Field "verification_status" must be one of: ${VALID_VERIFICATIONS.join(', ')}`,
        400,
        'VALIDATION_FAILED'
      )
    );
  }

  if (!status && !verification_status) {
    return next(
      new AppError(
        'At least one of "status" or "verification_status" must be provided for update.',
        400,
        'VALIDATION_FAILED'
      )
    );
  }

  next();
}
