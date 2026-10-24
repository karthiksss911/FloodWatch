import express from 'express';
import helmet from 'helmet';
import corsMiddleware from './middleware/cors.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import incidentsRouter from './routes/incidents.js';
import assistanceRouter from './routes/assistance.js';
import riskRouter from './routes/risk.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing with configured origins
app.use(corsMiddleware);

// Body parsing with safe size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API v1 Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/incidents', incidentsRouter);
app.use('/api/v1/assistance-points', assistanceRouter);
app.use('/api/v1/risk', riskRouter);

// Fallback 404 for unmatched routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
