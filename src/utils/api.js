import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ آی‌پی سیستم خودت را اینجا وارد کن
export const API_URL = 'http://192.168.8.131:3000/api'; // <--- کلمه export اضافه شد

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error setting auth header', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
// const API_URL = 'http://192.168.8.131:3000/api'; 