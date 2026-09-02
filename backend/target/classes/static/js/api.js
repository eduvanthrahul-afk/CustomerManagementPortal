/**
 * Verdant CRM - API Fetch Client
 * Handles JWT bearer authentication, error interception, and JSON serialization.
 */

const API = {
  BASE_URL: '/api',

  getToken() {
    return localStorage.getItem('verdant_token');
  },

  setToken(token) {
    localStorage.setItem('verdant_token', token);
  },

  removeToken() {
    localStorage.removeItem('verdant_token');
    localStorage.removeItem('verdant_user');
  },

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Unauthorized
        this.removeToken();
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
          window.location.href = '/login.html';
        }
        throw new Error('Session expired. Please sign in again.');
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || (data.validationErrors ? Object.values(data.validationErrors).join(', ') : 'Request failed');
        throw new Error(errorMessage);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          query.append(key, val);
        }
      });
      const queryString = query.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.API = API;
