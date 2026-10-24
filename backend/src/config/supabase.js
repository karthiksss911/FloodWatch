import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabaseClient = null;
let isConnected = false;

if (config.supabase.isConfigured) {
  try {
    const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
    supabaseClient = createClient(config.supabase.url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    isConnected = true;
    console.log(`[Supabase] Client initialized for ${config.supabase.url} (Service Role Key: ${Boolean(config.supabase.serviceRoleKey)})`);
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err.message);
    supabaseClient = null;
    isConnected = false;
  }
} else {
  if (config.supabase.url && !config.supabase.serviceRoleKey && !config.supabase.anonKey) {
    console.log(`[Supabase] SUPABASE_URL configured (${config.supabase.url}), but SUPABASE_SERVICE_ROLE_KEY is missing. Running in DEMO DATA STORE mode.`);
  } else {
    console.log('[Supabase] No credentials configured. Backend active in in-memory DEMO MODE.');
  }
}

/**
 * Performs a live health check against the Supabase database.
 * Never leaks secret keys or credentials in response.
 */
export async function checkDatabaseHealth() {
  const urlHost = config.supabase.url
    ? new URL(config.supabase.url).host
    : null;

  if (!config.supabase.url) {
    return {
      connected: false,
      mode: 'demo_in_memory',
      target: null,
      message: 'SUPABASE_URL not configured. Running in local demo store mode.',
    };
  }

  if (!config.supabase.serviceRoleKey && !config.supabase.anonKey) {
    return {
      connected: false,
      mode: 'demo_in_memory',
      target: urlHost,
      message: 'SUPABASE_URL is set, but SUPABASE_SERVICE_ROLE_KEY is required to connect.',
    };
  }

  if (!supabaseClient) {
    return {
      connected: false,
      mode: 'demo_in_memory',
      target: urlHost,
      message: 'Supabase client failed to initialize.',
    };
  }

  const startTime = Date.now();
  try {
    // Perform a lightweight probe query
    const { error } = await supabaseClient
      .from('incidents')
      .select('id', { head: true, count: 'exact' });

    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        connected: false,
        mode: 'demo_in_memory_fallback',
        target: urlHost,
        latencyMs,
        message: `Database query error: ${error.message}`,
      };
    }

    return {
      connected: true,
      mode: 'supabase_postgresql',
      target: urlHost,
      latencyMs,
      message: 'Successfully connected to Supabase PostgreSQL.',
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'demo_in_memory_fallback',
      target: urlHost,
      latencyMs: Date.now() - startTime,
      message: `Database connection error: ${err.message}`,
    };
  }
}

export const supabase = supabaseClient;
export const isSupabaseConnected = () => isConnected;
export default supabase;

