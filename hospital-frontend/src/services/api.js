// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // --- NÂNG CẤP: Kiểm tra cả 2 nơi lưu trữ ---
        // Ưu tiên localStorage (Ghi nhớ), nếu không có thì tìm sessionStorage (Phiên tạm)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Schedule API ---
export const getSchedules = async () => {
    const response = await api.get('/schedules');
    return response.data;
};

export const getDoctorSchedules = async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}/schedules`);
    return response.data;
};

export const updateSchedule = async (id, data) => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
};

// --- Appointment Management API ---
export const getAppointments = async (filters = {}) => {
    // filters object: { doctor_id, patient_id, date_str, status }
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/appointments?${params}`);
    return response.data;
};

export const updateAppointment = async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
};

export const cancelAppointment = async (id) => {
    const response = await api.post(`/appointments/${id}/cancel`);
    return response.data;
};

export const deleteAppointment = async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
};

export default api;