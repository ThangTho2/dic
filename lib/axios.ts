// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true, // cookie sẽ tự động gửi lên backend
});

export default api;
