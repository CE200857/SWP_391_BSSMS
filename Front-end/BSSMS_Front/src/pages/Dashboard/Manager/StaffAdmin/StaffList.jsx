import { useState, useEffect } from "react";
import {
    Container,
    Table,
    Badge,
    Form,
    InputGroup,
    Button,
    Modal
} from "react-bootstrap";

const StaffList = () => {
    const [staffs, setStaffs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/staff", {
                    credentials: "include"
                });

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

    const handleShowModal = (staff) => {
        setSelectedStaff(staff);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStaff(null);
    };

    const confirmDelete = async () => {
        if (!selectedStaff) {
            return;
        }

        try {
            const response = await fetch(
                `/api/staff?id=${selectedStaff.staffId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (response.ok) {
                // Cập nhật trạng thái ngay trên giao diện
                setStaffs((prevStaffs) =>
                    prevStaffs.map((staff) =>
                        staff.staffId === selectedStaff.staffId
                            ? { ...staff, status: "Inactive" }
                            : staff
                    )
                );
            } else {
                alert("Lỗi: Không thể vô hiệu hóa tài khoản nhân viên.");
            }
        } catch (error) {
            console.error("Lỗi khi vô hiệu hóa nhân viên:", error);
            alert("Không thể kết nối đến Backend.");
        } finally {
            handleCloseModal();
        }
    };

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
                        <th>Hành động</th>
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

                                <td>
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        className="me-2 text-white"
                                    >
                                        <i className="bi bi-pencil-square"></i>{" "}
                                        Chỉnh sửa
                                    </Button>

                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleShowModal(s)}
                                        disabled={s.status !== "Active"}
                                    >
                                        <i className="bi bi-trash"></i>{" "}
                                        Xóa
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="8"
                                className="text-center text-muted"
                            >
                                Không tìm thấy nhân viên nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Modal
                show={showModal}
                onHide={handleCloseModal}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Xác nhận xóa nhân viên
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Bạn có chắc chắn muốn vô hiệu hóa tài khoản của nhân viên{" "}
                    <span className="fw-bold text-primary">
                        {selectedStaff?.fullName}
                    </span>{" "}
                    không?
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCloseModal}
                    >
                        Hủy bỏ
                    </Button>

                    <Button
                        variant="danger"
                        onClick={confirmDelete}
                    >
                        Xóa nhân viên
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default StaffList;