import { useState, useEffect } from "react";
import { Container, Table, Badge, Form, InputGroup } from "react-bootstrap";

const StaffList = () => {
    const [staffs, setStaffs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/staffs");

                if (response.ok) {
                    const data = await response.json();
                    setStaffs(data);
                }
            } catch (error) {
                console.error("Lỗi kết nối đến Backend:", error);
            }
        };

        fetchData();
    }, []);

    const filteredStaffs = staffs.filter((s) =>
        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container className="mt-4">
            <h2 className="mb-4 fw-bold text-uppercase">
                Danh sách nhân viên
            </h2>

            <InputGroup className="mb-3 w-50">
                <InputGroup.Text>
                    <i className="bi bi-search"></i>
                </InputGroup.Text>

                <Form.Control
                    placeholder="Tìm theo tên, username, email, số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            <Table striped bordered hover responsive className="align-middle">
                <thead className="table-dark">
                    <tr>
                        <th>Staff ID</th>
                        <th>Username</th>
                        <th>Họ và Tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Chức vụ</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredStaffs.length > 0 ? (
                        filteredStaffs.map((s) => (
                            <tr key={s.staffId}>
                                <td>{s.staffId}</td>
                                <td>{s.username}</td>
                                <td>{s.fullName}</td>
                                <td>{s.email}</td>
                                <td>{s.phone}</td>
                                <td>{s.position}</td>
                                <td>
                                    {s.status === "Active" ? (
                                        <Badge bg="success">
                                            Đang hoạt động
                                        </Badge>
                                    ) : (
                                        <Badge bg="danger">
                                            Không hoạt động
                                        </Badge>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center text-muted">
                                Không tìm thấy nhân viên nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default StaffList;