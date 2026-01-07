import { useState, useEffect } from 'react';
import api from '../services/api';

const TechnicianDashboard = () => {
    const [queue, setQueue] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    
    // Form data
    const [resultData, setResultData] = useState('');
    const [conclusion, setConclusion] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = () => {
        api.get('/service-requests?status=PENDING')
           .then(res => setQueue(res.data))
           .catch(err => console.error(err));
    };

    const handleSelect = (req) => {
        setSelectedReq(req);
        setResultData('');
        setConclusion('');
        setImageUrl('');
    };

    const handleSubmit = async () => {
        if (!selectedReq) return;
        try {
            await api.post('/service-results', {
                request_id: selectedReq.request_id,
                result_data: resultData,
                image_url: imageUrl,
                conclusion: conclusion
            });
            alert("Đã trả kết quả thành công!");
            setSelectedReq(null);
            loadQueue(); // Refresh lại hàng đợi
        } catch (error) {
            alert("Lỗi gửi kết quả");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Cột trái: Hàng đợi */}
            <div className="w-1/3 bg-white border-r p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-blue-800">Danh sách chờ thực hiện</h2>
                {queue.length === 0 && <p className="text-gray-500">Không có chỉ định nào.</p>}
                {queue.map(req => (
                    <div key={req.request_id} 
                        onClick={() => handleSelect(req)}
                        className={`p-3 mb-2 border rounded cursor-pointer hover:bg-blue-50 ${selectedReq?.request_id === req.request_id ? 'bg-blue-100 border-blue-500' : ''}`}>
                        <div className="font-bold text-gray-700">Phiếu #{req.request_id} - {req.service_name}</div>
                        <div className="text-sm text-gray-500">Mã khám: {req.visit_id}</div>
                        <span className="text-xs bg-yellow-200 px-2 py-1 rounded text-yellow-800 font-bold">CHỜ THỰC HIỆN</span>
                    </div>
                ))}
            </div>

            {/* Cột phải: Nhập kết quả */}
            <div className="w-2/3 p-6">
                {selectedReq ? (
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-green-700">
                            Nhập kết quả: {selectedReq.service_name}
                        </h2>
                        
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Kết quả / Chỉ số:</label>
                            <textarea className="w-full p-2 border rounded h-32" 
                                placeholder="Nhập các chỉ số xét nghiệm (Hồng cầu, Bạch cầu...)"
                                value={resultData} onChange={e => setResultData(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="block font-medium mb-1">Link Ảnh (nếu có):</label>
                            <input type="text" className="w-full p-2 border rounded" 
                                placeholder="https://..."
                                value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block font-medium mb-1">Kết luận:</label>
                            <textarea className="w-full p-2 border rounded h-20" 
                                placeholder="Kết luận của bác sĩ/KTV..."
                                value={conclusion} onChange={e => setConclusion(e.target.value)}
                            ></textarea>
                        </div>

                        <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                            Xác nhận & Gửi bác sĩ
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Chọn một phiếu bên trái để nhập kết quả
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicianDashboard;