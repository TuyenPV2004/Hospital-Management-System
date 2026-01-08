// src/components/ServiceRequestManager.jsx
import React, { useState } from 'react';
import { updateServiceRequest, deleteServiceRequest } from '../services/api';
import { toast } from 'react-toastify';

const ServiceRequestManager = ({ requests, onRefresh }) => {
    const [editingId, setEditingId] = useState(null);
    const [editQty, setEditQty] = useState(1);

    const handleEditStart = (req) => {
        setEditingId(req.request_id);
        setEditQty(req.quantity);
    };

    const handleSave = async (reqId) => {
        try {
            await updateServiceRequest(reqId, { quantity: parseInt(editQty) });
            toast.success("Đã cập nhật số lượng");
            setEditingId(null);
            onRefresh(); // Refresh lại danh sách cha
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleDelete = async (reqId) => {
        if (!window.confirm("Bạn muốn hủy chỉ định này?")) return;
        try {
            await deleteServiceRequest(reqId);
            toast.success("Đã hủy chỉ định");
            onRefresh();
        } catch (error) {
            toast.error("Lỗi: Chỉ có thể hủy khi chưa thực hiện");
        }
    };

    return (
        <div className="mt-4">
            <h4 className="font-bold text-gray-700 mb-2">Danh sách chỉ định trong lượt khám này:</h4>
            <ul className="space-y-2">
                {requests.map((req) => (
                    <li key={req.request_id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                        <div className="flex-1">
                            <span className="font-medium text-blue-700">{req.service_name}</span>
                            <span className="text-xs text-gray-500 ml-2">({req.status})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Chế độ xem */}
                            {editingId !== req.request_id && (
                                <>
                                    <span className="text-sm">SL: <strong>{req.quantity}</strong></span>
                                    {req.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => handleEditStart(req)} className="text-blue-600 hover:underline text-sm px-2">Sửa</button>
                                            <button onClick={() => handleDelete(req.request_id)} className="text-red-600 hover:underline text-sm px-2">Hủy</button>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Chế độ sửa */}
                            {editingId === req.request_id && (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={editQty} 
                                        onChange={(e) => setEditQty(e.target.value)}
                                        className="w-16 border rounded px-1 py-0.5"
                                    />
                                    <button onClick={() => handleSave(req.request_id)} className="text-green-600 font-bold text-sm">Lưu</button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm">Hủy</button>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
                {requests.length === 0 && <li className="text-gray-400 italic text-sm">Chưa có chỉ định nào.</li>}
            </ul>
        </div>
    );
};

export default ServiceRequestManager;