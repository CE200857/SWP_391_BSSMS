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
import DeleteStaffModal from "./DeleteStaffModal";
import AssignRoleModal from "./AssignRoleModal";

const roleLabels = {
  Manager: "Manager",
  Receptionist: "Receptionist",
  Technician: "Technician",
};

const StaffList = ({ user }) => {
  const [staffs, setStaffs] = useState([]);

  // Delete and Assign Role live in their own files (DeleteStaffModal.jsx, AssignRoleModal.jsx)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleChange, setRoleChange] = useState(null);

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

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleShowRoleModal = (staff, newRole) => {
    if (staff.position === newRole) return;
    setRoleChange({ accountId: staff.accountId, staffName: staff.fullName, newRole });
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
                      onClick={() => setDeleteTarget(s)}
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

      <DeleteStaffModal
        staff={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(staff, text) => {
          setStaffs((prev) => prev.filter((x) => x.staffId !== staff.staffId));
          setDeleteTarget(null);
          showMessage(text);
        }}
      />

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

      <AssignRoleModal
        change={roleChange}
        onClose={() => setRoleChange(null)}
        onAssigned={(text) => {
          setRoleChange(null);
          setRefresh((prev) => prev + 1);
          showMessage(text);
        }}
      />
    </Container>
  );
};

export default StaffList;