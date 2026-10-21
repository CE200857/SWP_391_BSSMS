import React, { useState, useEffect } from 'react';
import { getTechnicianCommissions } from '../../../services/commissionService'; 
const PersonalCommission = () => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            setLoading(true);
            const data = await getTechnicianCommissions();
            setCommissions(data);
            
            // Tính tổng tiền
            const total = data.reduce((sum, item) => sum + item.commissionAmount, 0);
            setTotalAmount(total);
        } catch (err) {
            setError('Không thể tải dữ liệu hoa hồng của bạn. Vui lòng kiểm tra lại đăng nhập.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        // Chuyển đổi timestamp từ Java Date sang chuỗi hiển thị
        return new Date(dateString).toLocaleDateString('vi-VN', options); 
    };

    if (loading) return <div className="text-center p-10 text-gray-600">Đang tải dữ liệu...</div>;
    
    if (error) return <div className="p-6 bg-red-50 text-red-600 text-center rounded border border-red-200 m-4">{error}</div>;

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Hoa Hồng Cá Nhân</h2>

            {/* Thẻ Tổng tiền */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 mb-8 text-white max-w-sm">
                <h3 className="text-lg font-medium opacity-90 mb-1">Tổng hoa hồng tích lũy</h3>
                <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>

            {/* Bảng Chi tiết */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-700">Lịch sử nhận hoa hồng</h3>
                </div>
                
                {commissions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HH</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hóa Đơn</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời Gian</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ Lệ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số Tiền</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {commissions.map((c) => (
                                    <tr key={c.commissionId} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{c.commissionId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                            HD-{c.invoiceId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(c.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs font-medium">
                                                {c.commissionRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                            + {formatCurrency(c.commissionAmount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Bạn chưa có lịch sử nhận hoa hồng nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalCommission;