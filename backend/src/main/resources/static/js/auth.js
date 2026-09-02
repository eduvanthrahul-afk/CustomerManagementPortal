/**
 * Authentication Module
 */

const Auth = {
  currentUser: null,

  async init() {
    const token = API.getToken();
    if (!token) {
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = '/login.html';
      }
      return null;
    }

    try {
      this.currentUser = await API.get('/auth/me');
      localStorage.setItem('verdant_user', JSON.stringify(this.currentUser));
      this.updateUserUI();
      return this.currentUser;
    } catch (err) {
      console.warn('Authentication check failed:', err);
      API.removeToken();
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = '/login.html';
      }
      return null;
    }
  },

  async login(email, password) {
    const res = await API.post('/auth/login', { email, password });
    API.setToken(res.token);
    this.currentUser = res.user;
    localStorage.setItem('verdant_user', JSON.stringify(res.user));
    return res;
  },

  async register(fullName, email, password, role = 'STAFF') {
    const res = await API.post('/auth/register', { fullName, email, password, role });
    API.setToken(res.token);
    this.currentUser = res.user;
    localStorage.setItem('verdant_user', JSON.stringify(res.user));
    return res;
  },

  async logout() {
    try {
      await API.post('/auth/logout', {});
    } catch (e) {
      // Ignore
    } finally {
      API.removeToken();
      window.location.href = '/login.html';
    }
  },

  updateUserUI() {
    if (!this.currentUser) return;

    const userNames = document.querySelectorAll('.user-name-display');
    const userRoles = document.querySelectorAll('.user-role-display');
    const userAvatars = document.querySelectorAll('.user-avatar-display');

    userNames.forEach(el => el.textContent = this.currentUser.fullName || 'User');
    userRoles.forEach(el => el.textContent = this.currentUser.role || 'STAFF');
    userAvatars.forEach(el => {
      if (el.tagName === 'IMG') {
        el.src = this.currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      }
    });

    // Admin-only UI toggles
    if (this.currentUser.role !== 'ADMIN') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
  },

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'ADMIN';
  }
};

window.Auth = Auth;
