import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const api = {
  async uploadAudio(file: File, token?: string) {
    const form = new FormData();
    form.append('file', file);
    const res = await axios.post(`${API_BASE}/upload`, form, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data; // { analysisId }
  },
  async getResult(id: string, token?: string) {
    const res = await axios.get(`${API_BASE}/results/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data;
  },
  async getHistory(token?: string) {
    const res = await axios.get(`${API_BASE}/history`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data;
  }
};