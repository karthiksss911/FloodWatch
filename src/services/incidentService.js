import { INITIAL_INCIDENTS } from '../data/demoData.js';

const STORAGE_KEY = 'floodwatch_kerala_incidents_v1';

/**
 * Interface definition for Incident Data Adapters.
 * Allows swapping between LocalStorage/Mock, Express REST API, or Supabase PostgreSQL
 * without modifying UI components.
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
  async resetDemoData() {
    throw new Error('resetDemoData() must be implemented by adapter');
  }
}

/**
 * LocalStorage & In-Memory Adapter.
 * Preserves demo submissions across browser refreshes for hackathon showcase.
 */
export class LocalIncidentAdapter extends BaseIncidentAdapter {
  constructor(storageKey = STORAGE_KEY) {
    super();
    this.storageKey = storageKey;
  }

  _readFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[LocalIncidentAdapter] Could not read from storage, falling back to seed:', err);
    }
    return INITIAL_INCIDENTS;
  }

  _writeToStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      console.warn('[LocalIncidentAdapter] Could not persist to storage:', err);
    }
  }

  getAllSync() {
    return this._readFromStorage();
  }

  async getAll() {
    return this._readFromStorage();
  }

  async getById(id) {
    const list = this._readFromStorage();
    return list.find((item) => item.id === id) || null;
  }

  async create(incidentData) {
    const list = this._readFromStorage();
    const newId = incidentData.id || `INC-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncident = {
      ...incidentData,
      id: newId,
      status: incidentData.status || 'active',
      source_type: incidentData.source_type || 'community',
      verification_status: incidentData.verification_status || 'demo_unverified',
      created_at: incidentData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      observed_at: incidentData.observed_at || new Date().toISOString(),
      review_history: incidentData.review_history || [],
    };

    const updatedList = [newIncident, ...list];
    this._writeToStorage(updatedList);
    return newIncident;
  }

  async updateStatus(id, newVerification, newStatus, historyEntry) {
    const list = this._readFromStorage();
    let updatedRecord = null;

    const updatedList = list.map((item) => {
      if (item.id === id) {
        updatedRecord = {
          ...item,
          verification_status: newVerification,
          status: newStatus,
          updated_at: new Date().toISOString(),
          review_history: [...(item.review_history || []), historyEntry],
        };
        return updatedRecord;
      }
      return item;
    });

    if (updatedRecord) {
      this._writeToStorage(updatedList);
    }
    return updatedRecord;
  }

  async resetDemoData() {
    this._writeToStorage(INITIAL_INCIDENTS);
    return INITIAL_INCIDENTS;
  }
}

/**
 * REST API Adapter for Express backend
 * Connects frontend to http://localhost:5000/api/v1/incidents
 * and maintains fallback to LocalIncidentAdapter on network loss.
 */
export class ApiIncidentAdapter extends BaseIncidentAdapter {
  constructor(baseUrl = 'http://localhost:5000/api/v1', fallbackAdapter = new LocalIncidentAdapter()) {
    super();
    this.baseUrl = baseUrl;
    this.fallbackAdapter = fallbackAdapter;
    this.authoritySecret = 'kerala-emergency-authority-2026';
  }

  getAllSync() {
    return this.fallbackAdapter.getAllSync();
  }

  async getAll(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.severity && filters.severity !== 'all') queryParams.append('severity', filters.severity);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const url = `${this.baseUrl}/incidents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        this.fallbackAdapter._writeToStorage(body.data);
        return body.data;
      }
      throw new Error('Invalid API response');
    } catch (err) {
      console.warn('[ApiIncidentAdapter] API fetch failed, fallback to local store:', err.message);
      return this.fallbackAdapter.getAll();
    }
  }

  async getById(id) {
    try {
      const res = await fetch(`${this.baseUrl}/incidents/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.success && body.data) return body.data;
    } catch (err) {
      console.warn('[ApiIncidentAdapter] API getById failed, using fallback:', err.message);
    }
    return this.fallbackAdapter.getById(id);
  }

  async create(incidentData) {
    try {
      const res = await fetch(`${this.baseUrl}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Server error (HTTP ${res.status})`);
      }
      const body = await res.json();
      if (body.success && body.data) {
        const current = this.fallbackAdapter.getAllSync();
        this.fallbackAdapter._writeToStorage([body.data, ...current]);
        return body.data;
      }
    } catch (err) {
      console.warn('[ApiIncidentAdapter] API create failed, fallback to local storage:', err.message);
      return this.fallbackAdapter.create(incidentData);
    }
  }

  async updateStatus(id, newVerification, newStatus, historyEntry) {
    try {
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
        throw new Error(errJson.error?.message || `Authorized update failed (HTTP ${res.status})`);
      }
      const body = await res.json();
      if (body.success && body.data) {
        await this.fallbackAdapter.updateStatus(id, newVerification, newStatus, historyEntry);
        return body.data;
      }
    } catch (err) {
      console.warn('[ApiIncidentAdapter] API status update failed, fallback to local:', err.message);
      return this.fallbackAdapter.updateStatus(id, newVerification, newStatus, historyEntry);
    }
  }

  async resetDemoData() {
    try {
      const res = await fetch(`${this.baseUrl}/incidents/actions/reset-demo`, { method: 'POST' });
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          this.fallbackAdapter._writeToStorage(body.data);
          return body.data;
        }
      }
    } catch (err) {
      console.warn('[ApiIncidentAdapter] API reset failed, fallback to local:', err.message);
    }
    return this.fallbackAdapter.resetDemoData();
  }
}

/**
 * Incident Service facade.
 * Feature modules interact with this service rather than direct storage or API endpoints.
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
      : INITIAL_INCIDENTS;
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

  async resetDemoData() {
    return this.adapter.resetDemoData();
  }
}

export const incidentService = new IncidentService();
export default incidentService;
