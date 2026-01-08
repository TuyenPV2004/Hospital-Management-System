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

// --- MODULE CẬN LÂM SÀNG (CLS) ---

// 1. Sửa chỉ định (Dành cho Bác sĩ, chỉ sửa được khi PENDING)
export const updateServiceRequest = async (requestId, data) => {
    // data structure: { service_id: int, quantity: int }
    const response = await api.put(`/service-requests/${requestId}`, data);
    return response.data;
};

// 2. Hủy chỉ định (Soft delete)
export const deleteServiceRequest = async (requestId) => {
    const response = await api.delete(`/service-requests/${requestId}`);
    return response.data;
};

// 3. Lấy lịch sử kết quả CLS của bệnh nhân
export const getPatientServiceResults = async (patientId, type = null) => {
    let url = `/patients/${patientId}/service-results`;
    if (type) url += `?service_type=${type}`; // type = 'LAB' hoặc 'IMAGING'
    const response = await api.get(url);
    return response.data;
};

// 4. Lấy dữ liệu chi tiết để in báo cáo
export const getServiceReport = async (resultId) => {
    const response = await api.get(`/service-results/${resultId}/report`);
    return response.data;
};

export default api;