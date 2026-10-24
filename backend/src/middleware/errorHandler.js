import { config } from '../config/env.js';

/**
 * Standard Application Error with HTTP status code support
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Route Not Found Handler
 */
export function notFoundHandler(req, res, next) {
  const error = new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(error);
}

/**
 * Centralized Global Error Handler
 * Ensures consistent JSON response structure and shields internal stack traces
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  if (!config.isProduction && statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  });
}
