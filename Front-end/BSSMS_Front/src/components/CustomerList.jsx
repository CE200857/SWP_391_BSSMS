import { useState, useEffect } from "react";
import { Container, Table, Button, Badge, Form, InputGroup, Modal } from "react-bootstrap";

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [refresh, setRefresh] = useState(0);

    // --- CÁC BIẾN STATE DÀNH CHO MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Lấy dữ liệu từ Backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8080/BSSMS-back/api/customers');
                if (response.ok) {
                    const data = await response.json();
                    setCustomers(data);
                }
            } catch (error) {
                console.error("Lỗi kết nối đến Backend:", error);
            }
        };

        fetchData();
    }, [refresh]);

    // --- CÁC HÀM XỬ LÝ MODAL ---
    // Mở hộp thoại và lưu lại thông tin khách hàng đang được chọn
    const handleShowModal = (customer) => {
        setSelectedCustomer(customer);
        setShowModal(true);
    };

    // Đóng hộp thoại
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCustomer(null);
    };

    // --- HÀM XÓA CHÍNH THỨC (Chạy khi bấm nút Xác nhận trong Modal) ---
    const confirmDelete = async () => {
        if (!selectedCustomer) return;

        try {
            const response = await fetch('http://localhost:8080/BSSMS-back/api/customers?id=${selectedCustomer.customerId}', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Kích hoạt load lại bảng dữ liệu
                setRefresh(prev => prev + 1); 
            } else {
                alert("Lỗi: Không thể vô hiệu hóa tài khoản này.");
            }
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
        } finally {
            // Dù thành công hay thất bại cũng đóng Modal lại
            handleCloseModal(); 
        }
    };

    // Lọc danh sách theo từ khóa
    const filteredCustomers = customers.filter(c => 
        c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container className="mt-4">
            <h2 className="mb-4 fw-bold text-uppercase">Danh sách khách hàng</h2>
            
            <InputGroup className="mb-3 w-50">
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control 
                    placeholder="Tìm theo tên, email, số điện thoại..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            <Table striped bordered hover responsive className="align-middle">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Họ và Tên</th>
                        <th>Số điện thoại</th>
                        <th>Email</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => (
                            <tr key={c.customerId}> 
                                <td>{c.customerId}</td>
                                <td>{c.fullName}</td>
                                <td>{c.phone}</td>
                                <td>{c.email}</td>
                                <td>
                                    {c.status === 'Active' ? (
                                        <Badge bg="success">Đang hoạt động</Badge>
                                    ) : (
                                        <Badge bg="danger">Không hoạt động</Badge>
                                    )}
                                </td>
                                <td>
                                    <Button variant="warning" size="sm" className="me-2 text-white">
                                        <i className="bi bi-pencil-square"></i> Chỉnh sửa
                                    </Button>
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        // Đổi onClick thành hàm gọi Modal
                                        onClick={() => handleShowModal(c)}
                                        disabled={c.status === 'Inactive'}
                                    >
                                        <i className="bi bi-trash"></i> Hủy
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">
                                Không tìm thấy khách hàng nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {/* --- GIAO DIỆN MODAL XÁC NHẬN --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Xác nhận vô hiệu hóa
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc chắn muốn vô hiệu hóa tài khoản của khách hàng <span className="fw-bold text-primary">{selectedCustomer?.fullName}</span> không?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Hủy bỏ
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Vô hiệu hóa
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default CustomerList;