import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';

/**
 * Authority Authorization Guard Middleware
 * Verifies that the client provides a valid authority secret key before
 * permitting state transitions or verification changes.
 * Prevents arbitrary users from tampering with emergency incident statuses.
 */
export function requireAuthority(req, res, next) {
  const secretHeader = req.headers['x-authority-secret'];
  const authHeader = req.headers['authorization'];

  let token = null;
  if (secretHeader && typeof secretHeader === 'string') {
    token = secretHeader.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token || token !== config.authoritySecret) {
    return next(
      new AppError(
        'Unauthorized: Valid authority credentials (X-Authority-Secret or Bearer token) required for this action.',
        403,
        'FORBIDDEN_AUTHORITY_REQUIRED'
      )
    );
  }

  req.isAuthority = true;
  next();
}

export default requireAuthority;
