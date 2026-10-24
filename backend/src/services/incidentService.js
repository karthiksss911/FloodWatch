import { supabase, isSupabaseConnected } from '../config/supabase.js';
import { INITIAL_INCIDENTS } from '../data/seedData.js';

// In-memory demo store initialized from seed
let inMemoryIncidents = [...INITIAL_INCIDENTS];

/**
 * Backend Incident Service
 * Interacts with Supabase PostgreSQL when available, or transparently falls back
 * to an in-memory demo store with clear labeling.
 */
class BackendIncidentService {
  /**
   * Retrieves incidents with filtering, text search, and pagination
   */
  async getIncidents({
    category,
    severity,
    status,
    verification_status,
    search,
    limit = 50,
    offset = 0,
  } = {}) {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    if (isSupabaseConnected() && supabase) {
      try {
        let query = supabase
          .from('incidents')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        if (severity && severity !== 'all') {
          query = query.eq('severity', severity);
        }
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        if (verification_status && verification_status !== 'all') {
          query = query.eq('verification_status', verification_status);
        }
        if (search && search.trim()) {
          const q = search.trim();
          query = query.or(`title.ilike.%${q}%,location_label.ilike.%${q}%,description.ilike.%${q}%`);
        }

        query = query.range(parsedOffset, parsedOffset + parsedLimit - 1);

        const { data, count, error } = await query;

        if (error) {
          console.warn('[BackendIncidentService] Supabase query failed, falling back to demo store:', error.message);
          return this._getInMemoryIncidents({ category, severity, status, verification_status, search, limit: parsedLimit, offset: parsedOffset });
        }

        return {
          total: count ?? data.length,
          limit: parsedLimit,
          offset: parsedOffset,
          dataSource: 'supabase',
          isDemoMode: false,
          data: data || [],
        };
      } catch (err) {
        console.error('[BackendIncidentService] Supabase exception, fallback:', err.message);
      }
    }

    return this._getInMemoryIncidents({ category, severity, status, verification_status, search, limit: parsedLimit, offset: parsedOffset });
  }

  _getInMemoryIncidents({ category, severity, status, verification_status, search, limit, offset }) {
    let result = [...inMemoryIncidents];

    if (category && category !== 'all') {
      result = result.filter((i) => i.category === category);
    }
    if (severity && severity !== 'all') {
      result = result.filter((i) => i.severity === severity);
    }
    if (status && status !== 'all') {
      result = result.filter((i) => i.status === status);
    }
    if (verification_status && verification_status !== 'all') {
      result = result.filter((i) => i.verification_status === verification_status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.location_label.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      dataSource: 'demo_seed',
      isDemoMode: true,
      data: paginated,
    };
  }

  /**
   * Retrieves single incident by ID
   */
  async getIncidentById(id) {
    if (isSupabaseConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return { data, dataSource: 'supabase', isDemoMode: false };
        }
      } catch (err) {
        console.warn('[BackendIncidentService] Supabase getById failed:', err.message);
      }
    }

    const found = inMemoryIncidents.find((i) => i.id === id);
    return found ? { data: found, dataSource: 'demo_seed', isDemoMode: true } : null;
  }

  /**
   * Creates a new incident report with server-side validation and sanitization
   */
  async createIncident(payload) {
    const nowIso = new Date().toISOString();
    const newId = `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord = {
      id: newId,
      title: payload.title.trim(),
      category: payload.category,
      severity: payload.severity,
      status: 'active',
      source_type: 'community',
      // Ensure community submissions always start unverified
      verification_status: isSupabaseConnected() ? 'unverified' : 'demo_unverified',
      location_label: (payload.location_label || payload.location?.label || 'Kerala Location').trim(),
      latitude: Number(payload.latitude ?? payload.location?.lat),
      longitude: Number(payload.longitude ?? payload.location?.lng),
      water_depth_cm: Number(payload.water_depth_cm || 0),
      passable_for: (payload.passable_for || 'Unknown').trim(),
      description: (payload.description || '').trim(),
      rainfall_value: Number(payload.rainfall_value || 0),
      rainfall_source: payload.rainfall_source || 'Community Sensor / Observed',
      confidence_score: 65,
      reporter_notes: payload.reporter_notes || 'Submitted via public reporting console',
      is_demo: !isSupabaseConnected(),
      review_history: [],
      created_at: nowIso,
      updated_at: nowIso,
      observed_at: payload.observed_at || nowIso,
    };

    if (isSupabaseConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .insert([newRecord])
          .select()
          .single();

        if (error) {
          throw new Error(`Database error saving incident: ${error.message}`);
        }

        return { data, dataSource: 'supabase', isDemoMode: false };
      } catch (err) {
        console.error('[BackendIncidentService] Failed to write to Supabase:', err.message);
        throw err; // Do not pretend data was saved if DB write failed
      }
    }

    // Demo store fallback
    inMemoryIncidents = [newRecord, ...inMemoryIncidents];
    return { data: newRecord, dataSource: 'demo_seed', isDemoMode: true };
  }

  /**
   * Updates incident status and verification (Privileged Authority Action)
   */
  async updateIncidentStatus(id, { verification_status, status, reviewer = 'Duty Officer', notes = '' }) {
    const nowIso = new Date().toISOString();
    const historyEntry = {
      timestamp: nowIso,
      reviewer,
      action: `Status updated to ${status} (${verification_status})`,
      notes,
    };

    if (isSupabaseConnected() && supabase) {
      try {
        // Fetch current record
        const { data: existing, error: fetchErr } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr || !existing) {
          throw new Error(`Incident "${id}" not found in database.`);
        }

        const updatedHistory = [...(existing.review_history || []), historyEntry];

        const { data, error } = await supabase
          .from('incidents')
          .update({
            verification_status,
            status,
            review_history: updatedHistory,
            updated_at: nowIso,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(`Database error updating incident: ${error.message}`);
        }

        // Insert into audit trail table
        const { error: auditError } = await supabase.from('incident_reviews').insert([{
          incident_id: id,
          reviewer,
          action: historyEntry.action,
          previous_status: existing.status,
          new_status: status,
          previous_verification: existing.verification_status,
          new_verification: verification_status,
          notes,
        }]);

        if (auditError) {
          console.warn('[BackendIncidentService] Audit log warning:', auditError.message);
        }

        return { data, dataSource: 'supabase', isDemoMode: false };
      } catch (err) {
        console.error('[BackendIncidentService] Failed to update incident in Supabase:', err.message);
        throw err;
      }
    }

    // Demo store update
    let updatedRecord = null;
    inMemoryIncidents = inMemoryIncidents.map((item) => {
      if (item.id === id) {
        updatedRecord = {
          ...item,
          verification_status,
          status,
          updated_at: nowIso,
          review_history: [...(item.review_history || []), historyEntry],
        };
        return updatedRecord;
      }
      return item;
    });

    if (!updatedRecord) {
      return null;
    }

    return { data: updatedRecord, dataSource: 'demo_seed', isDemoMode: true };
  }

  /**
   * Resets demo store to baseline dataset
   */
  resetDemoData() {
    inMemoryIncidents = [...INITIAL_INCIDENTS];
    return { data: inMemoryIncidents, dataSource: 'demo_seed', isDemoMode: true };
  }
}

export const backendIncidentService = new BackendIncidentService();
export default backendIncidentService;
