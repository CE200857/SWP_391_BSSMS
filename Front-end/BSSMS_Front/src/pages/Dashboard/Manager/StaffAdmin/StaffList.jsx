import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Dropdown,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";
import "./StaffAdmin.css";

const roleLabels = {
  Manager: "Quản lý",
  Receptionist: "Lễ tân",
  Technician: "Kỹ thuật viên",
};

const StaffList = ({ user }) => {
  const [staffs, setStaffs] = useState([]);

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
  const activeStaffCount = staffs.filter((staff) => staff.status === "Active").length;
  const inactiveStaffCount = staffs.length - activeStaffCount;

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

  const { filteredRows: filteredStaffs, toolbar } = useManagerSearchFilter(
    staffs,
    [
      { key: "fullName", label: "Nhân viên", filterable: false },
      { key: "username", label: "Tên đăng nhập", filterable: false },
      { key: "phone", label: "Số điện thoại", filterable: false },
      { key: "email", label: "Email", filterable: false },
      { key: "position", label: "Chức vụ", formatValue: (value) => ({
        Manager: "Quản lý",
        Receptionist: "Lễ tân",
        Technician: "Kỹ thuật viên",
      }[value] || value) },
      { key: "status", label: "Trạng thái", formatValue: (value) => value === "Active" ? "Đang hoạt động" : "Không hoạt động" },
    ],
    "Tìm theo tên, username, email, số điện thoại...",
  );

  return (
    <Container fluid className="staff-admin staff-list-page mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Danh sách nhân viên</h2>
          <p>Quản lý hồ sơ, chức vụ và trạng thái hoạt động của nhân sự.</p>
        </div>
        {user?.role === "Manager" && (
          <Button
            variant="primary"
            onClick={() => navigate("/manager/create-staff")}
          >
            <i className="bi bi-person-plus-fill" aria-hidden="true"></i>
            Thêm nhân viên
          </Button>
        )}
      </div>

      <div className="staff-summary-grid" aria-label="Thống kê nhân sự">
        <div className="staff-summary-card">
          <span className="staff-summary-icon"><i className="bi bi-people-fill" aria-hidden="true"></i></span>
          <div>
            <div className="staff-summary-value">{staffs.length}</div>
            <div className="staff-summary-label">Tổng nhân sự</div>
          </div>
        </div>
        <div className="staff-summary-card">
          <span className="staff-summary-icon"><i className="bi bi-person-check-fill" aria-hidden="true"></i></span>
          <div>
            <div className="staff-summary-value">{activeStaffCount}</div>
            <div className="staff-summary-label">Đang hoạt động</div>
          </div>
        </div>
        <div className="staff-summary-card">
          <span className="staff-summary-icon"><i className="bi bi-person-dash-fill" aria-hidden="true"></i></span>
          <div>
            <div className="staff-summary-value">{inactiveStaffCount}</div>
            <div className="staff-summary-label">Không hoạt động</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="alert alert-success py-2 mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {message}
        </div>
      )}

      <div className="staff-list-toolbar-row">
        <div className="manager-list-toolbar">{toolbar}</div>
      </div>

      <div className="staff-list-surface">
        <Table hover responsive className="align-middle manager-list-table staff-list-table">
        <thead>
          <tr>
            <th>Họ và Tên</th>
            <th>Chức vụ</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {filteredStaffs.length > 0 ? (
            filteredStaffs.map((s) => (
              <tr key={s.staffId}>
                <td>
                  <div className="staff-list-name">{s.fullName}</div>
                  <div className="staff-list-id">Mã nhân viên #{s.staffId}</div>
                </td>
                <td>
                  {user?.role === "Manager" ? (
                    <Dropdown className="staff-list-role">
                      <Dropdown.Toggle
                        variant="light"
                        disabled={
                          s.status !== "Active" ||
                          s.accountId === currentUserAccountId
                        }
                      >
                        {roleLabels[s.position] || s.position}
                      </Dropdown.Toggle>
                      <Dropdown.Menu renderOnMount>
                        {availableRoles.map((role) => (
                          <Dropdown.Item
                            key={role}
                            active={s.position === role}
                            onClick={() => handleShowRoleModal(s, role)}
                          >
                            {roleLabels[role] || role}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  ) : (
                    <span className="fw-semibold">{roleLabels[s.position] || s.position}</span>
                  )}
                </td>

                <td className="text-center">
                  {user?.role === "Manager" ? (
                    <Button
                      variant="link"
                      className={`staff-status-toggle${s.status !== "Active" ? " is-inactive" : ""}`}
                      onClick={() => handleShowStatusModal(s)}
                      disabled={
                        s.position === "Manager" ||
                        s.accountId === currentUserAccountId
                      }
                      title="Bấm để đổi trạng thái"
                    >
                      {s.status === "Active"
                        ? <><i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>Đang hoạt động</>
                        : <><i className="bi bi-pause-circle-fill me-1" aria-hidden="true"></i>Không hoạt động</>}
                    </Button>
                  ) : (
                    <Badge className={`staff-status-badge${s.status !== "Active" ? " is-inactive" : ""}`}>
                      {s.status === "Active"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </Badge>
                  )}
                </td>

                <td className="text-center">
                  <div className="manager-list-actions staff-list-actions">
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--view"
                      onClick={() => navigate(`/staffs/detail/${s.staffId}`)}
                      disabled={s.accountId === currentUserAccountId}
                    >
                      <i className="bi bi-eye" aria-hidden="true"></i> Xem
                    </Button>

                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--edit"
                      onClick={() => navigate(`/staffs/edit/${s.staffId}`)}
                      disabled={s.accountId === currentUserAccountId}
                    >
                      <i className="bi bi-pencil-square" aria-hidden="true"></i> Sửa
                    </Button>

                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--delete"
                      onClick={() => handleShowModal(s)}
                      disabled={
                        s.position === "Manager" ||
                        s.accountId === currentUserAccountId
                      }
                    >
                      <i className="bi bi-trash" aria-hidden="true"></i> Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="staff-empty-state">
                Không tìm thấy nhân viên nào.
              </td>
            </tr>
          )}
        </tbody>
        </Table>
      </div>

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