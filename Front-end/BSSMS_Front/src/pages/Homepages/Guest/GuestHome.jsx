import { Link } from 'react-router-dom';
import logo from '../../../images/seoul-center-logo-transparent.png';

const GuestHome = () => {
    const featureCards = [
        {
            title: 'Đặt lịch nhanh',
            text: 'Tiếp cận dịch vụ chỉ trong vài bước, tiện lợi và rõ ràng.',
            icon: '✨',
        },
        {
            title: 'Hỗ trợ 24/7',
            text: 'Nhận phản hồi và hướng dẫn kịp thời mọi lúc, mọi nơi.',
            icon: '💬',
        },
        {
            title: 'Trải nghiệm hiện đại',
            text: 'Thiết kế thân thiện, dễ dùng và phù hợp với mọi thiết bị.',
            icon: '🎯',
        },
    ];

    return (
        <div
            className="min-vh-100"
            style={{
                background: 'linear-gradient(135deg, #fff5fb 0%, #fdf2f8 25%, #fce7f3 55%, #fdf2f8 100%)',
                padding: '48px 0',
            }}
        >
            <div className="container">
                <img
                    className="d-block mx-auto mb-5"
                    src={logo}
                    alt="Seoul Center"
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        height: 'auto',
                        objectFit: 'contain',
                    }}
                />

                <div className="row align-items-center g-5">
                    <div className="col-lg-7">
                        <h1
                            className="fw-bold mb-3"
                            style={{
                                fontSize: 'clamp(3rem, 5vw, 6rem)',
                                lineHeight: 1.1,
                                color: '#1f2937',
                                letterSpacing: '-0.04em',
                            }}
                        >
                            <span style={{ display: 'block' }}>Khám phá trải nghiệm dịch vụ</span>
                            <span style={{ display: 'block' }}>
                                <span style={{ color: '#ec4899' }}>thân thiện</span> và
                                <span style={{ color: '#ec4899', display: 'block' }}>hiện đại.</span>
                            </span>
                        </h1>

                        <p
                            className="mb-4"
                            style={{
                                fontSize: '1.2rem',
                                lineHeight: 1.8,
                                color: '#4b5563',
                                maxWidth: '700px',
                                fontStyle: 'italic',
                            }}
                        >
                            Chào mừng bạn đến với hệ thống BSSMS. Dễ dàng xem dịch vụ, tìm hiểu thông tin và trải nghiệm quy trình đáng tin cậy ngay từ lần đầu tiên.
                        </p>

                        <div className="d-flex flex-wrap gap-3 mb-5">
                            <Link
                                to="/login"
                                className="btn btn-lg px-4 shadow-sm"
                                style={{
                                    background: 'linear-gradient(135deg, #ec4899, #f472b6)',
                                    border: 'none',
                                    color: '#fff',
                                    borderRadius: '14px',
                                    fontWeight: 600,
                                }}
                            >
                                Đăng nhập ngay
                            </Link>

                            <Link
                                to="/guest/services"
                                className="btn btn-lg px-4 shadow-sm"
                                style={{
                                    background: '#fff',
                                    color: '#be185d',
                                    border: '1px solid rgba(236, 72, 153, 0.25)',
                                    borderRadius: '14px',
                                    fontWeight: 600,
                                }}
                            >
                                Xem dịch vụ
                            </Link>
                        </div>

                        <div className="d-flex flex-wrap align-items-center gap-4">
                            <div>
                                <div className="fw-bold" style={{ color: '#111827', fontSize: '1.6rem' }}>10K+</div>
                                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Khách hàng tin tưởng</div>
                            </div>
                            <div>
                                <div className="fw-bold" style={{ color: '#111827', fontSize: '1.6rem' }}>4.9/5</div>
                                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Đánh giá trải nghiệm</div>
                            </div>
                            <div>
                                <div className="fw-bold" style={{ color: '#111827', fontSize: '1.6rem' }}>24/7</div>
                                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Hỗ trợ liên tục</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div
                            className="rounded-4 shadow-lg p-4"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(236, 72, 153, 0.12)',
                            }}
                        >
                            <div
                                className="rounded-4 p-4 mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f9a8d4 100%)',
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="fw-semibold" style={{ color: '#831843' }}>Tình trạng hệ thống</span>
                                    <span
                                        className="badge rounded-pill px-3 py-2"
                                        style={{ background: '#fff', color: '#be185d' }}
                                    >
                                        Online
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <div className="fw-bold" style={{ color: '#4c0519', fontSize: '2rem' }}>98.7%</div>
                                    <div style={{ color: '#6b7280' }}>Mức độ sẵn sàng dịch vụ</div>
                                </div>

                                <div className="progress" style={{ height: '10px', background: 'rgba(255,255,255,0.7)' }}>
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: '98.7%', background: 'linear-gradient(90deg, #ec4899, #f9a8d4)' }}
                                        aria-valuenow="98.7"
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    />
                                </div>
                            </div>

                            <div className="row g-3">
                                {featureCards.map((item) => (
                                    <div key={item.title} className="col-12">
                                        <div
                                            className="d-flex align-items-start gap-3 rounded-3 p-3"
                                            style={{ background: '#fff', border: '1px solid rgba(236, 72, 153, 0.08)' }}
                                        >
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle"
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    fontSize: '1.3rem',
                                                    background: 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
                                                }}
                                            >
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="fw-bold mb-1" style={{ color: '#1f2937' }}>{item.title}</div>
                                                <div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.text}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mt-4">
                    <div className="col-md-6 col-xl-4">
                        <div className="h-100 rounded-4 p-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(236, 72, 153, 0.08)' }}>
                            <div className="fw-bold mb-2" style={{ color: '#1f2937' }}>Dịch vụ nổi bật</div>
                            <p className="mb-3" style={{ color: '#6b7280', lineHeight: 1.7 }}>
                                Lựa chọn nhanh các dịch vụ phù hợp với nhu cầu của bạn mà không mất thời gian.
                            </p>
                            <Link to="/guest/services" className="btn btn-link p-0" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 600 }}>
                                Khám phá ngay →
                            </Link>
                        </div>
                    </div>

                    <div className="col-md-6 col-xl-4">
                        <div className="h-100 rounded-4 p-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(236, 72, 153, 0.08)' }}>
                            <div className="fw-bold mb-2" style={{ color: '#1f2937' }}>Đánh giá khách hàng</div>
                            <p className="mb-3" style={{ color: '#6b7280', lineHeight: 1.7 }}>
                                Xem phản hồi thực tế từ người dùng trước để yên tâm hơn khi lựa chọn dịch vụ.
                            </p>
                            <Link to="/guest/feedback" className="btn btn-link p-0" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 600 }}>
                                Xem đánh giá →
                            </Link>
                        </div>
                    </div>

                    <div className="col-md-12 col-xl-4">
                        <div className="h-100 rounded-4 p-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', border: '1px solid rgba(236, 72, 153, 0.08)' }}>
                            <div className="fw-bold mb-2" style={{ color: '#1f2937' }}>Bắt đầu ngay</div>
                            <p className="mb-3" style={{ color: '#374151', lineHeight: 1.7 }}>
                                Hãy đăng nhập để trải nghiệm đầy đủ dịch vụ và quản lý lịch hẹn dễ dàng hơn.
                            </p>
                            <Link to="/login" className="btn fw-semibold" style={{ background: '#fff', color: '#be185d', borderRadius: '12px' }}>
                                Đi đến đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestHome;