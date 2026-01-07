/**
 * ============================================
 * PROTECTED ROUTE - Bảo vệ route dựa trên role
 * ============================================
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasRole } from '../utils/roleGuard';

/**
 * ProtectedRoute component - Kiểm tra quyền trước khi hiển thị component
 * @param {array} allowedRoles - Danh sách role được phép truy cập
 * @param {component} Component - Component cần bảo vệ
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ allowedRoles, Component, ...rest }) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Nếu chưa đăng nhập
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Nếu không có quyền truy cập
    if (allowedRoles && !hasRole(allowedRoles)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">🚫 Bị Từ Chối</h1>
                    <p className="text-xl text-gray-700 mb-8">Bạn không có quyền truy cập trang này.</p>
                    <a
                        href="/dashboard"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        ← Quay Lại Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Nếu đã xác thực và có quyền, hiển thị component
    return <Component {...rest} />;
};

export default ProtectedRoute;
