// API service for Nego
const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('nego_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('nego_token', token);
    } else {
      localStorage.removeItem('nego_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('nego_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Auth endpoints
  async register(email, name, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Talent endpoints
  async getTalents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/talents${query ? `?${query}` : ''}`);
  }

  async getTalent(id) {
    return this.request(`/talents/${id}`);
  }

  // Content endpoints
  async getPrivateContent(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/content${query ? `?${query}` : ''}`);
  }

  async getUnlockedContent() {
    return this.request('/content/unlocked');
  }

  async unlockContent(contentId) {
    return this.request(`/content/${contentId}/unlock`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
export default api;
