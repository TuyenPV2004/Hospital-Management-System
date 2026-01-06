// src/services/api.js
import axios from 'axios';

// Tạo instance của axios với cấu hình mặc định
const api = axios.create({
    baseURL: 'http://localhost:8000', // Địa chỉ Backend FastAPI
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Token vào mỗi request nếu có
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;