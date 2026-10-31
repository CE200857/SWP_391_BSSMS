import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Form,
  InputGroup,
  Button,
  Modal,
  Dropdown,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StaffList = ({ user }) => {
  const [staffs, setStaffs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeData, setRoleChangeData] = useState({
    accountId: null,
    staffName: "",
    newRole: "",
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({
    accountId: null,
    staffName: "",
    newStatus: "",
  });

  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  const availableRoles = ["Manager", "Receptionist", "Technician"];
  const navigate = useNavigate();

  const currentUserAccountId = user?.account_id || user?.accountId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/staff", {
          credentials: "include",
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
  }, [refresh]);

  const handleShowModal = (staff) => {
    setSelectedStaff(staff);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
  };

  const confirmDelete = async () => {
    if (!selectedStaff) return;

    try {
      const response = await fetch(`/api/staff?id=${selectedStaff.staffId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setStaffs((prevStaffs) =>
          prevStaffs.filter((staff) => staff.staffId !== selectedStaff.staffId)
        );
        setMessage(`Đã xóa vĩnh viễn nhân viên ${selectedStaff.fullName}!`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert("Lỗi: Không thể xóa tài khoản nhân viên.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa nhân viên:", error);
      alert("Không thể kết nối đến Backend.");
    } finally {
      handleCloseModal();
    }
  };

  const handleShowRoleModal = (staff, newRole) => {
    if (staff.position === newRole) return;
    setRoleChangeData({
      accountId: staff.accountId,
      staffName: staff.fullName,
      newRole: newRole,
    });
    setShowRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setRoleChangeData({ accountId: null, staffName: "", newRole: "" });
  };

  const confirmRoleChange = async () => {
    try {
      const { accountId, newRole } = roleChangeData;
      const url = `/api/staff/assign-role?accountId=${accountId}&role=${newRole}`;
      const response = await axios.post(url, null, { withCredentials: true });

      if (response.status === 200) {
        setRefresh((prev) => prev + 1);
        setMessage(`Đã cấp quyền ${newRole} thành công!`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi đổi quyền:", error);
      alert("Đổi quyền thất bại. Vui lòng thử lại!");
    } finally {
      handleCloseRoleModal();
    }
  };

  const handleShowStatusModal = (staff) => {
    const nextStatus = staff.status === "Active" ? "Inactive" : "Active";
    setStatusChangeData({
      accountId: staff.accountId,
      staffName: staff.fullName,
      newStatus: nextStatus,
    });
    setShowStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setStatusChangeData({ accountId: null, staffName: "", newStatus: "" });
  };

  const confirmStatusChange = async () => {
    try {
      const { accountId, newStatus, staffName } = statusChangeData;
      const response = await axios.post(
        "/api/staff",
        {
          action: "update-status",
          accountId: accountId,
          status: newStatus,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setStaffs((prevStaffs) =>
          prevStaffs.map((s) =>
            s.accountId === accountId ? { ...s, status: newStatus } : s
          )
        );
        const statusText =
          newStatus === "Active" ? "Đang hoạt động" : "Không hoạt động";
        setMessage(
          `Đã chuyển trạng thái của ${staffName} sang "${statusText}"!`
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi đổi trạng thái:", error);
      alert("Đổi trạng thái thất bại. Vui lòng thử lại!");
    } finally {
      handleCloseStatusModal();
    }
  };

  const filteredStaffs = staffs.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="mt-4">
      <h2 className="mb-4 fw-bold text-uppercase">Danh sách nhân viên</h2>

      {message && (
        <div className="alert alert-success py-2 mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {message}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <InputGroup
          className="mb-3 w-50"
          style={{ marginBottom: "0 !important" }}
        >
          <InputGroup.Text>
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Tìm theo tên, username, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        {user?.role === "Manager" && (
          <Button
            variant="danger"
            onClick={() => navigate("/manager/create-staff")}
          >
            <i className="bi bi-person-plus-fill me-1"></i> Thêm nhân viên
          </Button>
        )}
      </div>

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
                <td>
                  {user?.role === "Manager" ? (
                    <Dropdown>
                      <Dropdown.Toggle
                        variant={
                          s.position === "Manager"
                            ? "dark"
                            : s.position === "Technician"
                              ? "info"
                              : "secondary"
                        }
                        size="sm"
                        className="w-100 text-start d-flex justify-content-between align-items-center"
                        disabled={
                          s.status !== "Active" ||
                          s.accountId === currentUserAccountId
                        }
                      >
                        {s.position}
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        renderOnMount={true}
                        style={{ position: "absolute", zIndex: 1050 }}
                      >
                        {availableRoles.map((role) => (
                          <Dropdown.Item
                            key={role}
                            active={s.position === role}
                            onClick={() => handleShowRoleModal(s, role)}
                          >
                            {role}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  ) : (
                    <span className="fw-bold text-secondary">{s.position}</span>
                  )}
                </td>

                <td className="text-center">
                  {user?.role === "Manager" ? (
                    <Button
                      variant={s.status === "Active" ? "success" : "secondary"}
                      size="sm"
                      className="w-100 fw-bold"
                      onClick={() => handleShowStatusModal(s)}
                      disabled={
                        s.position === "Manager" ||
                        s.accountId === currentUserAccountId
                      }
                      title="Bấm để đổi trạng thái"
                    >
                      {s.status === "Active"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </Button>
                  ) : (
                    <Badge bg={s.status === "Active" ? "success" : "secondary"}>
                      {s.status === "Active"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </Badge>
                  )}
                </td>

                <td>
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2 text-white"
                    onClick={() => navigate(`/staffs/detail/${s.staffId}`)}
                    disabled={s.accountId === currentUserAccountId}
                  >
                    <i className="bi bi-eye"></i> Xem
                  </Button>

                  <Button
                    variant="info"
                    size="sm"
                    className="me-2 text-white"
                    onClick={() => navigate(`/staffs/edit/${s.staffId}`)}
                    disabled={s.accountId === currentUserAccountId}
                  >
                    <i className="bi bi-pencil-square"></i> Chỉnh sửa
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowModal(s)}
                    disabled={
                      s.position === "Manager" ||
                      s.accountId === currentUserAccountId
                    }
                  >
                    <i className="bi bi-trash"></i> Xóa
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center text-muted">
                Không tìm thấy nhân viên nào.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Xác nhận xóa vĩnh viễn nhân viên
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Bạn có chắc chắn muốn <strong>xóa vĩnh viễn</strong> hồ sơ và tài khoản
          của nhân viên{" "}
          <span className="fw-bold text-primary">
            {selectedStaff?.fullName}
          </span>{" "}
          khỏi cơ sở dữ liệu không? Hành động này không thể hoàn tác.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Hủy bỏ
          </Button>

          <Button variant="danger" onClick={confirmDelete}>
            Xóa vĩnh viễn
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStatusModal} onHide={handleCloseStatusModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-warning fw-bold">
            <i className="bi bi-arrow-repeat me-2"></i> Xác nhận đổi trạng thái
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn chuyển trạng thái của nhân viên{" "}
          <span className="fw-bold text-primary">
            {statusChangeData.staffName}
          </span>{" "}
          sang{" "}
          <span
            className={`fw-bold ${
              statusChangeData.newStatus === "Active"
                ? "text-success"
                : "text-danger"
            }`}
          >
            {statusChangeData.newStatus === "Active"
              ? "Đang hoạt động"
              : "Không hoạt động"}
          </span>{" "}
          không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseStatusModal}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={confirmStatusChange}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRoleModal} onHide={handleCloseRoleModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold">
            <i className="bi bi-person-gear me-2"></i> Xác nhận phân quyền
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có muốn đổi quyền của nhân viên{" "}
          <span className="fw-bold text-danger">
            {roleChangeData.staffName}
          </span>{" "}
          sang chức vụ{" "}
          <span className="fw-bold text-success">{roleChangeData.newRole}</span>{" "}
          không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRoleModal}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={confirmRoleChange}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StaffList;