import { ASSISTANCE_POINTS } from '../data/demoData.js';

/**
 * Interface definition for Assistance Points Data Adapters.
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
 * Local Demonstration Adapter for Assistance Points
 */
export class LocalAssistanceAdapter extends BaseAssistanceAdapter {
  constructor(initialData = ASSISTANCE_POINTS) {
    super();
    this.data = initialData;
  }

  getAllSync(filters = {}) {
    return this._filterData(filters);
  }

  async getAll(filters = {}) {
    return this._filterData(filters);
  }

  _filterData(filters = {}) {
    let result = [...this.data];

    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.accessibleOnly) {
      result = result.filter((p) => p.wheelchair_accessible === true);
    }

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.location_label.toLowerCase().includes(q) ||
          p.category_label.toLowerCase().includes(q) ||
          (p.operating_authority || '').toLowerCase().includes(q)
        );
      });
    }

    return result;
  }

  async getById(id) {
    return this.data.find((p) => p.id === id) || null;
  }

  async getCategories() {
    const categoriesMap = new Map();
    this.data.forEach((p) => {
      if (!categoriesMap.has(p.category)) {
        categoriesMap.set(p.category, { id: p.category, label: p.category_label });
      }
    });
    return Array.from(categoriesMap.values());
  }
}

/**
 * REST API Adapter for Assistance Points
 * Connects frontend to http://localhost:5000/api/v1/assistance-points
 */
export class ApiAssistanceAdapter extends BaseAssistanceAdapter {
  constructor(baseUrl = 'http://localhost:5000/api/v1', fallbackAdapter = new LocalAssistanceAdapter()) {
    super();
    this.baseUrl = baseUrl;
    this.fallbackAdapter = fallbackAdapter;
  }

  getAllSync(filters = {}) {
    return this.fallbackAdapter.getAllSync(filters);
  }

  async getAll(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.accessibleOnly) queryParams.append('wheelchair_accessible', 'true');
      if (filters.query) queryParams.append('query', filters.query);

      const url = `${this.baseUrl}/assistance-points${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        return body.data;
      }
    } catch (err) {
      console.warn('[ApiAssistanceAdapter] API fetch failed, fallback to local store:', err.message);
    }
    return this.fallbackAdapter.getAll(filters);
  }

  async getById(id) {
    try {
      const res = await fetch(`${this.baseUrl}/assistance-points/${encodeURIComponent(id)}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) return body.data;
      }
    } catch (err) {
      console.warn('[ApiAssistanceAdapter] API getById failed:', err.message);
    }
    return this.fallbackAdapter.getById(id);
  }

  async getCategories() {
    return this.fallbackAdapter.getCategories();
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

  getAllSync(filters) {
    return typeof this.adapter.getAllSync === 'function'
      ? this.adapter.getAllSync(filters)
      : ASSISTANCE_POINTS;
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
