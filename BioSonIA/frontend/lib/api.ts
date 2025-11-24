import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const api = {
  token: undefined as string | undefined,
  setToken(t?: string) { this.token = t; },
  async register(email: string, password: string) {
    const res = await axios.post(`${API_BASE}/auth/register`, { email, password });
    return res.data;
  },
  async login(email: string, password: string) {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return res.data; // { ok, accessToken, refreshToken }
  },
  async uploadAudio(file: File, token?: string) {
    const form = new FormData();
    form.append('file', file);
    const res = await axios.post(`${API_BASE}/upload`, form, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data; // { analysisId }
  },
  async getResult(id: string, token?: string) {
    const res = await axios.get(`${API_BASE}/results/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    return res.data;
  },
  async getHistory(token?: string) {
    const res = await axios.get(`${API_BASE}/history`, {
      headers: token ? { Authorization: `Bearer ${token}` } : this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    return res.data;
  }
};