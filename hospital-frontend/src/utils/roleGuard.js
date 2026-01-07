/**
 * ============================================
 * ROLE GUARD UTILITIES - Kiểm tra quyền
 * ============================================
 */

/**
 * Lấy role từ token
 * @returns {string|null} - Role của người dùng hoặc null nếu chưa đăng nhập
 */
export const getUserRole = () => {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return null;

        // Decode JWT token (base64 phần payload)
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const decoded = JSON.parse(atob(parts[1]));
        return decoded.role || null;
    } catch (error) {
        console.error('Lỗi khi decode token:', error);
        return null;
    }
};

/**
 * Kiểm tra người dùng có quyền truy cập không
 * @param {string|array} requiredRoles - Vai trò(s) cần thiết
 * @returns {boolean} - true nếu có quyền, false nếu không
 */
export const hasRole = (requiredRoles) => {
    const userRole = getUserRole();
    if (!userRole) return false;

    // Nếu requiredRoles là string, chuyển thành array
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userRole);
};

/**
 * Kiểm tra xem người dùng có phải Admin không
 */
export const isAdmin = () => hasRole('ADMIN');

/**
 * Kiểm tra xem người dùng có phải Doctor không
 */
export const isDoctor = () => hasRole('DOCTOR');

/**
 * Kiểm tra xem người dùng có phải Nurse không
 */
export const isNurse = () => hasRole('NURSE');

/**
 * Kiểm tra xem người dùng có phải Patient không
 */
export const isPatient = () => hasRole('PATIENT');

/**
 * Kiểm tra xem người dùng có phải Technician không
 */
export const isTechnician = () => hasRole('TECHNICIAN');

/**
 * Lấy tên vai trò hiển thị
 */
export const getRoleDisplayName = (role) => {
    const roleNames = {
        'ADMIN': 'Quản Trị Viên',
        'DOCTOR': 'Bác Sĩ',
        'NURSE': 'Y Tá',
        'PATIENT': 'Bệnh Nhân',
        'TECHNICIAN': 'Kỹ Thuật Viên'
    };
    return roleNames[role] || role;
};
