import { useState, useEffect } from "react";
import { Container, Table, Button, Badge, Form, InputGroup, Modal } from "react-bootstrap";

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [refresh, setRefresh] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/customers');
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

    const handleShowModal = (customer) => {
        setSelectedCustomer(customer);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCustomer(null);
    };

    const confirmDelete = async () => {
        if (!selectedCustomer) return;

        try {
            const response = await fetch(`/api/customers?id=${selectedCustomer.customerId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setRefresh(prev => prev + 1); 
            } else {
                alert("Lỗi: Không thể vô hiệu hóa tài khoản này.");
            }
        }finally {
            handleCloseModal(); 
        }
    };

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
                                        onClick={() => handleShowModal(c)}
                                    >
                                        <i className="bi bi-trash"></i> Xóa
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

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Xác nhận xóa tài khoản
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc chắn muốn xóa hóa tài khoản của khách hàng <span className="fw-bold text-primary">{selectedCustomer?.fullName}</span> không?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Hủy bỏ
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Xóa tài khoản
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CustomerList;