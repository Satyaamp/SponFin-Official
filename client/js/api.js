// SponFin Centralized API Fetch Engine

const API_BASE = '/api';

const API = {
  // Token Storage Helpers
  getToken() {
    return localStorage.getItem('sponfin_token');
  },

  setToken(token) {
    localStorage.setItem('sponfin_token', token);
  },

  clearToken() {
    localStorage.removeItem('sponfin_token');
    localStorage.removeItem('sponfin_user');
  },

  setUser(user) {
    localStorage.setItem('sponfin_user', JSON.stringify(user));
  },

  getUser() {
    const userStr = localStorage.getItem('sponfin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Central Request Handler
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    // Set headers
    const headers = options.headers || {};
    
    // If not sending FormData, set content-type JSON
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized token expired
        if (response.status === 401 && endpoint !== '/auth/login') {
          this.clearToken();
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Auth Operations
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.success && data.token) {
      this.setToken(data.token);
      this.setUser(data.user);
    }
    return data;
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Proceed with local logout anyway
    } finally {
      this.clearToken();
    }
  },

  async getMe() {
    return await this.request('/auth/me');
  },

  // Services CRUD
  async getServices(admin = false) {
    return await this.request(`/services?admin=${admin}`);
  },

  async getService(id) {
    return await this.request(`/services/${id}`);
  },

  async createService(formData) {
    return await this.request('/services', {
      method: 'POST',
      body: formData
    });
  },

  async updateService(id, formData) {
    return await this.request(`/services/${id}`, {
      method: 'PUT',
      body: formData
    });
  },

  async deleteService(id) {
    return await this.request(`/services/${id}`, {
      method: 'DELETE'
    });
  },

  // Projects CRUD
  async getProjects(params = {}) {
    let query = '';
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.featured) searchParams.append('featured', params.featured);
    const queryString = searchParams.toString();
    if (queryString) query = `?${queryString}`;
    
    return await this.request(`/projects${query}`);
  },

  async getProject(slug) {
    return await this.request(`/projects/${slug}`);
  },

  async createProject(formData) {
    return await this.request('/projects', {
      method: 'POST',
      body: formData
    });
  },

  async updateProject(id, formData) {
    return await this.request(`/projects/${id}`, {
      method: 'PUT',
      body: formData
    });
  },

  async deleteProject(id) {
    return await this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  // Blogs CRUD
  async getBlogs(admin = false) {
    return await this.request(`/blogs?admin=${admin}`);
  },

  async getBlog(slug, admin = false) {
    return await this.request(`/blogs/${slug}?admin=${admin}`);
  },

  async createBlog(formData) {
    return await this.request('/blogs', {
      method: 'POST',
      body: formData
    });
  },

  async updateBlog(id, formData) {
    return await this.request(`/blogs/${id}`, {
      method: 'PUT',
      body: formData
    });
  },

  async deleteBlog(id) {
    return await this.request(`/blogs/${id}`, {
      method: 'DELETE'
    });
  },

  // Leads CRUD
  async submitLead(leadData) {
    return await this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  },

  async getLeads() {
    return await this.request('/leads');
  },

  async updateLead(id, status, closedBy = '') {
    return await this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, closedBy })
    });
  },

  async deleteLead(id) {
    return await this.request(`/leads/${id}`, {
      method: 'DELETE'
    });
  },

  // Settings
  async getSettings() {
    return await this.request('/settings');
  },

  async updateSettings(formData) {
    return await this.request('/settings', {
      method: 'PUT',
      body: formData
    });
  },

  // Users Management
  async getUsers() {
    return await this.request('/users');
  },

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Activity Logs
  async getActivityLogs(fromDate = '', toDate = '') {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const queryString = params.toString();
    const query = queryString ? `?${queryString}` : '';
    return await this.request(`/logs${query}`);
  },

  // Subscription CRUD
  async getSubscriptions(admin = false) {
    return await this.request(`/subscriptions?admin=${admin}`);
  },

  async getSubscription(id) {
    return await this.request(`/subscriptions/${id}`);
  },

  async createSubscription(data) {
    return await this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateSubscription(id, data) {
    return await this.request(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteSubscription(id) {
    return await this.request(`/subscriptions/${id}`, {
      method: 'DELETE'
    });
  },

  // Subscription Requests CRUD
  async submitSubscriptionRequest(data) {
    return await this.request('/subscription-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getSubscriptionRequests() {
    return await this.request('/subscription-requests');
  },

  async updateSubscriptionRequest(id, status, closedBy = '') {
    return await this.request(`/subscription-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, closedBy })
    });
  },

  async deleteSubscriptionRequest(id) {
    return await this.request(`/subscription-requests/${id}`, {
      method: 'DELETE'
    });
  }
};
