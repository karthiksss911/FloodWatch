import { supabase, isSupabaseConnected } from '../config/supabase.js';
import { ASSISTANCE_POINTS } from '../data/seedData.js';

class BackendAssistanceService {
  async getAssistancePoints({ category, status, wheelchair_accessible, query } = {}) {
    if (isSupabaseConnected() && supabase) {
      try {
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
        if (!error && data) {
          return {
            total: data.length,
            dataSource: 'supabase',
            isDemoMode: false,
            data,
          };
        }
      } catch (err) {
        console.warn('[BackendAssistanceService] Supabase query failed, falling back:', err.message);
      }
    }

    // In-memory demo fallback
    let result = [...ASSISTANCE_POINTS];

    if (category && category !== 'all') {
      result = result.filter((p) => p.category === category);
    }
    if (status && status !== 'all') {
      result = result.filter((p) => p.status === status);
    }
    if (wheelchair_accessible === true || wheelchair_accessible === 'true') {
      result = result.filter((p) => p.wheelchair_accessible === true);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location_label.toLowerCase().includes(q) ||
          p.category_label.toLowerCase().includes(q) ||
          (p.operating_authority || '').toLowerCase().includes(q)
      );
    }

    return {
      total: result.length,
      dataSource: 'demo_seed',
      isDemoMode: true,
      data: result,
    };
  }

  async getAssistancePointById(id) {
    if (isSupabaseConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('assistance_points')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return { data, dataSource: 'supabase', isDemoMode: false };
        }
      } catch (err) {
        console.warn('[BackendAssistanceService] Supabase getById failed:', err.message);
      }
    }

    const found = ASSISTANCE_POINTS.find((p) => p.id === id);
    return found ? { data: found, dataSource: 'demo_seed', isDemoMode: true } : null;
  }
}

export const backendAssistanceService = new BackendAssistanceService();
export default backendAssistanceService;
