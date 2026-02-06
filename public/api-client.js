// api-client.js
// MoodVibes frontend ↔ Rails backend API client

const API_BASE_URL = 'http://localhost:3000/api'; // Rails API base URL

class MoodVibesAPI {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // --- Helper: headers ---
  getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // --- Registration ---
  async register(email, password, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({
          user: { email, password, password_confirmation: password, name }
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return { success: response.ok, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // --- Login ---
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return { success: response.ok, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // --- Logout ---
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // --- Auth helpers ---
  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // --- Song methods ---
  async saveSongSuggestions(mood, moodDescription, songs) {
    if (!this.isAuthenticated()) return { success: false, error: 'Not authenticated' };

    try {
      const formattedSongs = songs.map(song => ({
        spotify_id: song.spotify_id || `generated-${Date.now()}-${Math.random()}`,
        title: song.title,
        artist: song.artist,
        duration_ms: this.parseDuration(song.duration),
        spotify_uri: song.spotify_uri || '',
        spotify_url: song.external_url || ''
      }));

      const response = await fetch(`${API_BASE_URL}/songs/suggestions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ mood, mood_description: moodDescription, songs: formattedSongs })
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Save suggestions error:', error);
      return { success: false, error: error.message };
    }
  }

  parseDuration(duration) {
    if (!duration) return 180000;
    if (typeof duration === 'number') return duration;

    const parts = duration.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]);
      const seconds = parseInt(parts[1]);
      return (minutes * 60 + seconds) * 1000;
    }

    return 180000;
  }

  async getRecentSuggestions() {
    if (!this.isAuthenticated()) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_BASE_URL}/songs/recent`, {
        headers: this.getHeaders()
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Get recent suggestions error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUserInfo() {
    if (!this.isAuthenticated()) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (response.ok) localStorage.setItem('user', JSON.stringify(data.user));
      return { success: response.ok, data };
    } catch (error) {
      console.error('Get user info error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create global instance - NO EXPORT
const api = new MoodVibesAPI();