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

// --- MODULE NỘI TRÚ (INPATIENT) ---

// 0. Tạo hồ sơ nội trú mới
export const createInpatient = async (data) => {
    // data: { patient_id, bed_id, doctor_id, admission_reason, diagnosis }
    const response = await api.post('/inpatients', data);
    return response.data;
};

// 1. Lấy danh sách bệnh nhân nội trú
export const getInpatients = async (filters = {}) => {
    // filters: { status: 'ACTIVE', department_id: 1 }
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/inpatients?${params}`);
    return response.data;
};

// 2. Lấy chi tiết hồ sơ (kèm diễn tiến và lịch sử giường)
export const getInpatientDetail = async (id) => {
    const response = await api.get(`/inpatients/${id}`);
    return response.data;
};

// 3. Tạo diễn tiến hàng ngày (Daily Order)
export const createDailyOrder = async (id, data) => {
    const response = await api.post(`/inpatients/${id}/daily-orders`, data);
    return response.data;
};

// 4. Chuyển giường
export const transferBed = async (id, data) => {
    // data: { new_bed_id: 123, reason: "..." }
    const response = await api.post(`/inpatients/${id}/transfer-bed`, data);
    return response.data;
};

// 5. Xem trước viện phí
export const getBillingPreview = async (id) => {
    const response = await api.get(`/inpatients/${id}/billing-preview`);
    return response.data;
};

// 6. Lấy sơ đồ giường (Để chọn giường trống khi chuyển)
export const getBedMap = async () => {
    const response = await api.get('/beds/map');
    return response.data;
};

// --- MODULE BÁO CÁO ---
export const getDoctorPerformanceReport = async (fromDate, toDate) => {
    const response = await api.get(`/reports/doctors-performance?from_date=${fromDate}&to_date=${toDate}`);
    return response.data;
};

export const getServiceUsageReport = async (fromDate, toDate) => {
    const response = await api.get(`/reports/services-usage?from_date=${fromDate}&to_date=${toDate}`);
    return response.data;
};

export const getInpatientCensusReport = async () => {
    const response = await api.get(`/reports/inpatients/census`);
    return response.data;
};

export const getInpatientCostReport = async (fromDate, toDate) => {
    const response = await api.get(`/reports/inpatients/costs?from_date=${fromDate}&to_date=${toDate}`);
    return response.data;
};

// Hàm download Excel
export const exportReportExcel = async (type, fromDate, toDate) => {
    // Lưu ý: responseType: 'blob' là bắt buộc để tải file
    const response = await api.get(`/reports/export?report_type=${type}&from_date=${fromDate}&to_date=${toDate}`, {
        responseType: 'blob'
    });
    
    // Tạo link ảo để download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${type}_${fromDate}_${toDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export default api;