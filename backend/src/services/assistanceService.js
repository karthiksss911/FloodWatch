import { supabase, isSupabaseConnected } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Backend Assistance Points Service
 * Queries public.assistance_points directly from Supabase PostgreSQL.
 * Silent mock fallbacks have been removed.
 */
class BackendAssistanceService {
  async getAssistancePoints({ category, status, wheelchair_accessible, query } = {}) {
    if (!isSupabaseConnected() || !supabase) {
      throw new AppError(
        'Database unavailable: Supabase PostgreSQL is not connected. Please check backend configuration.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    let dbQuery = supabase.from('assistance_points').select('*');

    if (category && category !== 'all') {
      dbQuery = dbQuery.eq('category', category);
    }
    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status);
    }
    if (wheelchair_accessible === true || wheelchair_accessible === 'true') {
      dbQuery = dbQuery.eq('wheelchair_accessible', true);
    }
    if (query && query.trim()) {
      const q = query.trim();
      dbQuery = dbQuery.or(`name.ilike.%${q}%,location_label.ilike.%${q}%,category_label.ilike.%${q}%`);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw new AppError(`Supabase assistance points query error: ${error.message}`, 500, 'DATABASE_QUERY_ERROR');
    }

    return {
      total: data ? data.length : 0,
      dataSource: 'supabase',
      isDemoMode: false,
      data: data || [],
    };
  }

  async getAssistancePointById(id) {
    if (!isSupabaseConnected() || !supabase) {
      throw new AppError('Database unavailable: Supabase PostgreSQL is not connected.', 503, 'DATABASE_UNAVAILABLE');
    }

    const { data, error } = await supabase
      .from('assistance_points')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return { data, dataSource: 'supabase', isDemoMode: false };
  }
}

export const backendAssistanceService = new BackendAssistanceService();
export default backendAssistanceService;
