import { Link } from 'react-router-dom';

const GuestHome = () => {
    return (
        <div className="container mt-5 text-center">
            <h1>Trang chủ Khách Vãng Lai (Guest)</h1>
            <p className="mt-3">Chào mừng bạn đến với hệ thống. Vui lòng đăng nhập để sử dụng dịch vụ.</p>
            
            <div className="mt-4 d-flex justify-content-center gap-3">
                <Link to="/login" className="btn btn-primary">
                    Đi đến trang Đăng nhập
                </Link>
                
                {/* NÚT XEM DỊCH VỤ DÀNH CHO KHÁCH TẠI ĐÂY */}
                <Link to="/guest/services" className="btn btn-outline-info">
                    Xem danh sách Dịch vụ
                </Link>
            </div>
        </div>
    );
};

export default GuestHome;