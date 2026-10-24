import { supabase, isSupabaseConnected } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Backend Incident Service
 * Interacts exclusively with Supabase PostgreSQL as the single source of truth.
 * Silent mock fallbacks have been removed in favor of truthful error and empty states.
 */
class BackendIncidentService {
  /**
   * Retrieves real incidents with filtering, text search, and pagination from Supabase
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
    if (!isSupabaseConnected() || !supabase) {
      throw new AppError(
        'Database unavailable: Supabase PostgreSQL is not connected. Please check backend configuration.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

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
      throw new AppError(`Supabase incident query error: ${error.message}`, 500, 'DATABASE_QUERY_ERROR');
    }

    return {
      total: count ?? (data ? data.length : 0),
      limit: parsedLimit,
      offset: parsedOffset,
      dataSource: 'supabase',
      isDemoMode: false,
      data: data || [],
    };
  }

  /**
   * Retrieves single real incident by ID from Supabase
   */
  async getIncidentById(id) {
    if (!isSupabaseConnected() || !supabase) {
      throw new AppError('Database unavailable: Supabase PostgreSQL is not connected.', 503, 'DATABASE_UNAVAILABLE');
    }

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return { data, dataSource: 'supabase', isDemoMode: false };
  }

  /**
   * Creates a new real incident report in Supabase
   */
  async createIncident(payload) {
    if (!isSupabaseConnected() || !supabase) {
      throw new AppError(
        'Cannot submit incident: Database is currently unavailable. Please try again later.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const nowIso = new Date().toISOString();
    const newId = `INC-${Date.now().toString().slice(-6)}`;

    const newRecord = {
      id: newId,
      title: payload.title.trim(),
      category: payload.category,
      severity: payload.severity,
      status: 'active',
      source_type: 'community',
      verification_status: 'unverified',
      location_label: (payload.location_label || payload.location?.label || 'Kerala Location').trim(),
      latitude: Number(payload.latitude ?? payload.location?.lat),
      longitude: Number(payload.longitude ?? payload.location?.lng),
      water_depth_cm: Number(payload.water_depth_cm || 0),
      passable_for: (payload.passable_for || 'Unknown').trim(),
      description: (payload.description || '').trim(),
      rainfall_value: Number(payload.rainfall_value || 0),
      rainfall_source: payload.rainfall_source ? payload.rainfall_source.trim() : null,
      confidence_score: 50,
      reporter_notes: (payload.reporter_notes || 'Citizen field report submitted via FloodWatch portal').trim(),
      is_demo: false,
      review_history: [],
      created_at: nowIso,
      updated_at: nowIso,
      observed_at: payload.observed_at || nowIso,
    };

    const { data, error } = await supabase
      .from('incidents')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to persist incident to database: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
    }

    return { data, dataSource: 'supabase', isDemoMode: false };
  }

  /**
   * Updates incident status and verification in Supabase with audit logging (Privileged Authority Action)
   */
  async updateIncidentStatus(id, { verification_status, status, reviewer = 'Duty Officer', notes = '' }) {
    if (!isSupabaseConnected() || !supabase) {
      throw new AppError('Cannot update incident: Database unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const nowIso = new Date().toISOString();
    const historyEntry = {
      timestamp: nowIso,
      reviewer,
      action: `Status updated to ${status} (${verification_status})`,
      notes,
    };

    const { data: existing, error: fetchErr } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      throw new AppError(`Incident "${id}" not found in database.`, 404, 'NOT_FOUND');
    }

    const updatedHistory = [...(existing.review_history || []), historyEntry];

    const verificationMap = {
      official_verified: 'verified_official',
      verified_official: 'verified_official',
      community_verified: 'community_confirmed',
      community_confirmed: 'community_confirmed',
      unverified: 'unverified',
      rejected: 'rejected_spam',
      rejected_spam: 'rejected_spam',
      demo_reviewed: 'demo_reviewed',
      demo_community_confirmed: 'demo_community_confirmed',
      demo_unverified: 'demo_unverified',
    };

    const statusMap = {
      active: 'active',
      investigating: 'investigating',
      resolved: 'resolved',
      cleared: 'resolved',
      dismissed: 'archived',
      archived: 'archived',
    };

    const targetVerification = verificationMap[verification_status] || verification_status;
    const targetStatus = statusMap[status] || status;

    const { data, error } = await supabase
      .from('incidents')
      .update({
        verification_status: targetVerification,
        status: targetStatus,
        review_history: updatedHistory,
        updated_at: nowIso,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update incident status in database: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
    }

    // Insert into audit trail table
    const { error: auditError } = await supabase.from('incident_reviews').insert([{
      incident_id: id,
      reviewer,
      action: historyEntry.action,
      previous_status: existing.status,
      new_status: targetStatus,
      previous_verification: existing.verification_status,
      new_verification: targetVerification,
      notes,
    }]);

    if (auditError) {
      console.warn('[BackendIncidentService] Review audit trail insertion warning:', auditError.message);
    }

    return { data, dataSource: 'supabase', isDemoMode: false };
  }
}

export const backendIncidentService = new BackendIncidentService();
export default backendIncidentService;
