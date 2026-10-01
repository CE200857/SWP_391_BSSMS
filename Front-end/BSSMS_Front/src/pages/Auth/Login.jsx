import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data); 
                
                setSuccessMsg(`Đăng nhập thành công! Chào mừng ${data.fullName} (${data.role})`);
                
                // KHI ĐĂNG NHẬP THÀNH CÔNG: Kiểm tra role để chuyển trang tương ứng
                setTimeout(() => {
                    if (data.role === 'Customer') {
                        navigate('/profile'); // Khách hàng vào thẳng Profile
                    } else {
                        navigate('/customers'); // Nhân viên vào danh sách
                    }
                }, 1500);
            } else {
                setError(data.message || 'Đăng nhập thất bại!');
                setIsLoading(false); 
            }
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Lỗi kết nối đến máy chủ!');
            setIsLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Card style={{ width: '400px', padding: '20px', border: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Card.Body>
                    <h3 className="text-center mb-4 fw-bold text-uppercase">Đăng nhập</h3>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    {successMsg && <Alert variant="success">{successMsg}</Alert>}

                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3 text-start" controlId="formBasicEmail">
                            <Form.Label className="fw-bold">Email*</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="Vui lòng nhập email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading || successMsg !== ''}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4 text-start" controlId="formBasicPassword">
                            <Form.Label className="fw-bold">Mật khẩu*</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="Vui lòng nhập mật khẩu" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading || successMsg !== ''}
                            />
                        </Form.Group>

                        <Button 
                            variant="danger" 
                            type="submit" 
                            className="w-100 mb-4 fw-bold" 
                            style={{ height: '45px' }}
                            disabled={isLoading || successMsg !== ''}
                        >
                            {isLoading ? 'Đang xử lý...' : (successMsg ? 'Đang chuyển hướng...' : 'Đăng nhập')}
                        </Button>
                    </Form>

                    <div className="d-flex flex-column text-start" style={{ fontSize: '15px' }}>
                        <a href="/forgot-password" style={{ textDecoration: 'none', color: '#0d6efd', marginBottom: '8px' }}>
                            Forgot Password
                        </a>
                        <span>
                            Chưa có tài khoản? <a href="/register" style={{ textDecoration: 'none', color: '#0d6efd' }}>Đăng ký</a>
                        </span>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;