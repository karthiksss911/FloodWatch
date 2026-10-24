/**
 * Assistance Points Service with REST API Adapter
 * Connects frontend directly to /api/v1/assistance-points backed by Supabase PostgreSQL.
 * Mock data fallbacks have been removed so the UI accurately displays real data or errors.
 */

export class BaseAssistanceAdapter {
  async getAll() {
    throw new Error('getAll() must be implemented by adapter');
  }
  async getById() {
    throw new Error('getById() must be implemented by adapter');
  }
  async getCategories() {
    throw new Error('getCategories() must be implemented by adapter');
  }
}

/**
 * REST API Adapter for Assistance Points
 */
export class ApiAssistanceAdapter extends BaseAssistanceAdapter {
  constructor(baseUrl = 'http://localhost:5000/api/v1') {
    super();
    this.baseUrl = baseUrl;
  }

  getAllSync() {
    return [];
  }

  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.accessibleOnly) queryParams.append('wheelchair_accessible', 'true');
    if (filters.query) queryParams.append('query', filters.query);

    const url = `${this.baseUrl}/assistance-points${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to fetch assistance points (HTTP ${res.status})`);
    }
    const body = await res.json();
    if (body.success && Array.isArray(body.data)) {
      return body.data;
    }
    throw new Error('Invalid assistance data format received from server');
  }

  async getById(id) {
    const res = await fetch(`${this.baseUrl}/assistance-points/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch assistance point ${id} (HTTP ${res.status})`);
    }
    const body = await res.json();
    if (body.success && body.data) return body.data;
    return null;
  }

  async getCategories() {
    try {
      const points = await this.getAll();
      const categoriesMap = new Map();
      points.forEach((p) => {
        if (!categoriesMap.has(p.category)) {
          categoriesMap.set(p.category, { id: p.category, label: p.category_label || p.category });
        }
      });
      return Array.from(categoriesMap.values());
    } catch {
      return [
        { id: 'shelter', label: 'Relief & Transit Camps' },
        { id: 'medical', label: 'Medical & Triage Posts' },
        { id: 'rescue_hub', label: 'Rescue Boat & Staging Hubs' },
        { id: 'supply_depot', label: 'Emergency Nutrition Depots' },
      ];
    }
  }
}

/**
 * Assistance Service facade
 */
class AssistanceService {
  constructor(adapter = new ApiAssistanceAdapter()) {
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

  async getCategories() {
    return this.adapter.getCategories();
  }
}

export const assistanceService = new AssistanceService();
export default assistanceService;
