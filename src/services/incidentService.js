/**
 * Incident Service with REST API Adapter for Express backend
 * Connects frontend directly to /api/v1/incidents backed by Supabase PostgreSQL.
 * Silent mock fallbacks have been removed so the UI shows authentic data or honest error states.
 */

export class BaseIncidentAdapter {
  async getAll() {
    throw new Error('getAll() must be implemented by adapter');
  }
  async getById() {
    throw new Error('getById() must be implemented by adapter');
  }
  async create() {
    throw new Error('create() must be implemented by adapter');
  }
  async updateStatus() {
    throw new Error('updateStatus() must be implemented by adapter');
  }
}

/**
 * REST API Adapter connecting to http://localhost:5000/api/v1/incidents
 */
export class ApiIncidentAdapter extends BaseIncidentAdapter {
  constructor(baseUrl = 'http://localhost:5000/api/v1') {
    super();
    this.baseUrl = baseUrl;
    this.authoritySecret = 'kerala-emergency-authority-2026';
  }

  getAllSync() {
    // Initial synchronous state is an empty array (no hardcoded mock data)
    return [];
  }

  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.severity && filters.severity !== 'all') queryParams.append('severity', filters.severity);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);

    const url = `${this.baseUrl}/incidents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Server responded with HTTP ${res.status}`);
    }
    const body = await res.json();
    if (body.success && Array.isArray(body.data)) {
      return body.data;
    }
    throw new Error('Invalid incident data format received from server');
  }

  async getById(id) {
    const res = await fetch(`${this.baseUrl}/incidents/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch incident ${id} (HTTP ${res.status})`);
    }
    const body = await res.json();
    if (body.success && body.data) return body.data;
    return null;
  }

  async create(incidentData) {
    const res = await fetch(`${this.baseUrl}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Submission failed (HTTP ${res.status})`);
    }
    const body = await res.json();
    if (body.success && body.data) {
      return body.data;
    }
    throw new Error('Failed to create incident report');
  }

  async updateStatus(id, newVerification, newStatus, historyEntry) {
    const res = await fetch(`${this.baseUrl}/incidents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Authority-Secret': this.authoritySecret,
      },
      body: JSON.stringify({
        verification_status: newVerification,
        status: newStatus,
        reviewer: historyEntry?.reviewer || 'Duty Officer',
        notes: historyEntry?.notes || '',
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Status update rejected (HTTP ${res.status})`);
    }
    const body = await res.json();
    if (body.success && body.data) {
      return body.data;
    }
    throw new Error('Failed to update incident status');
  }
}

/**
 * Incident Service facade
 */
class IncidentService {
  constructor(adapter = new ApiIncidentAdapter()) {
    this.adapter = adapter;
  }

  setAdapter(newAdapter) {
    this.adapter = newAdapter;
  }

  getAllSync() {
    return typeof this.adapter.getAllSync === 'function'
      ? this.adapter.getAllSync()
      : [];
  }

  async getAll(filters) {
    return this.adapter.getAll(filters);
  }

  async getById(id) {
    return this.adapter.getById(id);
  }

  async create(incidentData) {
    return this.adapter.create(incidentData);
  }

  async updateStatus(id, newVerification, newStatus, historyEntry) {
    return this.adapter.updateStatus(id, newVerification, newStatus, historyEntry);
  }
}

export const incidentService = new IncidentService();
export default incidentService;
