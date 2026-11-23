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
  Manager: "Manager",
  Receptionist: "Receptionist",
  Technician: "Technician",
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
        console.error("Back-end connection error:", error);
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
        setMessage(`Permanently deleted staff member ${selectedStaff.fullName}!`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert("Error: Could not delete the staff account.");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Could not connect to the back-end.");
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
        setMessage(`Role changed to ${newRole} successful!`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error changing role:", error);
      alert("Failed to change the role. Please try again!");
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
          newStatus === "Active" ? "Active" : "Inactive";
        setMessage(
          `Changed the status of ${staffName} to "${statusText}"!`
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error changing status:", error);
      alert("Failed to change the status. Please try again!");
    } finally {
      handleCloseStatusModal();
    }
  };

  const { filteredRows: filteredStaffs, toolbar } = useManagerSearchFilter(
    staffs,
    [
      { key: "fullName", label: "Staff", filterable: false },
      { key: "username", label: "Username", filterable: false },
      { key: "phone", label: "Phone number", filterable: false },
      { key: "email", label: "Email", filterable: false },
      { key: "position", label: "Position", formatValue: (value) => ({
        Manager: "Manager",
        Receptionist: "Receptionist",
        Technician: "Technician",
      }[value] || value) },
      { key: "status", label: "Status", formatValue: (value) => value === "Active" ? "Active" : "Inactive" },
    ],
    "Search by name, username, email, phone number...",
  );

  return (
    <Container fluid className="staff-admin staff-list-page mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Staff list</h2>
          <p>Manage staff profiles, positions and active status.</p>
        </div>
        {user?.role === "Manager" && (
          <Button
            variant="primary"
            onClick={() => navigate("/manager/create-staff")}
          >
            <i className="bi bi-person-plus-fill" aria-hidden="true"></i>
            Add staff
          </Button>
        )}
      </div>

      <div className="staff-summary-grid" aria-label="Staff statistics">
        <div className="staff-summary-card">
          <span className="staff-summary-icon"><i className="bi bi-people-fill" aria-hidden="true"></i></span>
          <div>
            <div className="staff-summary-value">{staffs.length}</div>
            <div className="staff-summary-label">Total staff</div>
          </div>
        </div>
        <div className="staff-summary-card">
          <span className="staff-summary-icon"><i className="bi bi-person-check-fill" aria-hidden="true"></i></span>
          <div>
            <div className="staff-summary-value">{activeStaffCount}</div>
            <div className="staff-summary-label">Active</div>
          </div>
        </div>
        <div className="staff-summary-card">
          <span className="staff-summary-icon"><i className="bi bi-person-dash-fill" aria-hidden="true"></i></span>
          <div>
            <div className="staff-summary-value">{inactiveStaffCount}</div>
            <div className="staff-summary-label">Inactive</div>
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
            <th>Full name</th>
            <th>Position</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredStaffs.length > 0 ? (
            filteredStaffs.map((s) => (
              <tr key={s.staffId}>
                <td title={`Staff ID #${s.staffId}`}>
                  <div className="staff-list-name">{s.fullName}</div>
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
                      title="Click to change status"
                    >
                      {s.status === "Active"
                        ? <><i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>Active</>
                        : <><i className="bi bi-pause-circle-fill me-1" aria-hidden="true"></i>Inactive</>}
                    </Button>
                  ) : (
                    <Badge className={`staff-status-badge${s.status !== "Active" ? " is-inactive" : ""}`}>
                      {s.status === "Active"
                        ? "Active"
                        : "Inactive"}
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
                      <i className="bi bi-eye" aria-hidden="true"></i> View
                    </Button>

                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--edit"
                      onClick={() => navigate(`/staffs/edit/${s.staffId}`)}
                      disabled={s.accountId === currentUserAccountId}
                    >
                      <i className="bi bi-pencil-square" aria-hidden="true"></i> Edit
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
                      <i className="bi bi-trash" aria-hidden="true"></i> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="staff-empty-state">
                No staff found.
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
            Confirm staff deletion
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Delete staff member{" "}
          <span className="fw-bold text-primary">
            {selectedStaff?.fullName}
          </span>
          ? The account can no longer log in and is removed from the staff list. Their work history
          (appointments, invoices) is kept in the database.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>

          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStatusModal} onHide={handleCloseStatusModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-warning fw-bold">
            <i className="bi bi-arrow-repeat me-2"></i> Confirm status change
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to change the status of staff member{" "}
          <span className="fw-bold text-primary">
            {statusChangeData.staffName}
          </span>{" "}
          to{" "}
          <span
            className={`fw-bold ${
              statusChangeData.newStatus === "Active"
                ? "text-success"
                : "text-danger"
            }`}
          >
            {statusChangeData.newStatus === "Active"
              ? "Active"
              : "Inactive"}
          </span>{" "}
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseStatusModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmStatusChange}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRoleModal} onHide={handleCloseRoleModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold">
            <i className="bi bi-person-gear me-2"></i> Confirm role change
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Do you want to change the role of staff member{" "}
          <span className="fw-bold text-danger">
            {roleChangeData.staffName}
          </span>{" "}
          to the position{" "}
          <span className="fw-bold text-success">{roleChangeData.newRole}</span>{" "}
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRoleModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmRoleChange}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StaffList;