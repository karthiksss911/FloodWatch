import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve and load the backend/.env file
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Validates and exposes application configuration from environment variables.
 * Fails fast on invalid configuration to prevent insecure runtime surprises.
 */
function validateConfig() {
  const rawPort = process.env.PORT || '5000';
  const port = parseInt(rawPort, 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`[Config Error] Invalid PORT specified: "${rawPort}". Must be between 1 and 65535.`);
  }

  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(nodeEnv)) {
    console.warn(`[Config Warning] Unknown NODE_ENV: "${nodeEnv}". Defaulting to "development".`);
  }

  // Parse comma-delimited allowed origins
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  let allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  if (rawOrigins && typeof rawOrigins === 'string') {
    allowedOrigins = rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() || '';
  const hasSupabaseConfigured = Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));

  const authoritySecret = process.env.AUTHORITY_SECRET?.trim() || 'kerala-emergency-authority-2026';

  return Object.freeze({
    port,
    nodeEnv: validEnvs.includes(nodeEnv) ? nodeEnv : 'development',
    isProduction: nodeEnv === 'production',
    allowedOrigins,
    authoritySecret,
    supabase: {
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceRoleKey,
      anonKey: supabaseAnonKey,
      isConfigured: hasSupabaseConfigured,
    },
  });
}

export const config = validateConfig();
export default config;
