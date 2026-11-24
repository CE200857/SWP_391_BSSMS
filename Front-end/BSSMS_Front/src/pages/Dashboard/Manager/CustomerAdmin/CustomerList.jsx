import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";
import { StatusToggleButton, StatusChangeModal } from "../../../../components/StatusToggle";
import DeleteCustomerModal from "./DeleteCustomerModal";

const CustomerList = ({ user }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [refresh, setRefresh] = useState(0);

  // Delete lives in its own file (DeleteCustomerModal.jsx)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);

  // Bấm nhãn trạng thái: đổi Active <-> Inactive
  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const next = statusTarget.status === "Active" ? "Inactive" : "Active";
    setStatusBusy(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", customerId: statusTarget.customerId, status: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not change the status.");
      setCustomers((list) => list.map((c) => (c.customerId === statusTarget.customerId ? { ...c, status: next } : c)));
      setStatusTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusBusy(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/customers",
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Back-end connection error:", error);
      }
    };
    fetchData();
  }, [refresh]);

  const { filteredRows: filteredCustomers, toolbar } = useManagerSearchFilter(
    customers,
    [
      { key: "fullName", label: "Customer" },
      { key: "customerId", label: "Customer ID", filterable: false },
      { key: "phone", label: "Phone number", filterable: false },
      { key: "email", label: "Email", filterable: false },
      {
        key: "status",
        label: "Status",
        formatValue: (value) => value === "Active" ? "Active" : "Inactive",
      },
      {
        key: "membershipTier",
        label: "Membership tier",
        getValue: (row) => row.membership?.tierName || "No tier",
      },
    ],
    "Search by name, email, phone number...",
  );

  return (
    <Container fluid className="mt-4 px-4">
        <h2 className="manager-page-title fw-bold mb-4">Customer list</h2>

      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div className="manager-list-toolbar">{toolbar}</div>
        {(user?.role === "Receptionist" || user?.role === "Manager") && (
            <Button
              variant="danger"
              onClick={() => navigate("/receptionist/create-walkin")}
            >
              <i className="bi bi-person-plus-fill me-1"></i> Create customer account
            </Button>
        )}
      </div>

      <Table hover responsive className="align-middle manager-list-table customer-admin-list">
        <thead className="table-dark">
          <tr>
            <th>Full name</th>
            <th>Phone number</th>
            <th>Status</th>
            <th>Membership tier</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((c) => (
              <tr key={c.customerId}>
                <td className="fw-semibold text-dark" title={`Customer #${c.customerId}`}>{c.fullName}</td>
                <td>{c.phone}</td>
                <td>
                  {user?.role === "Manager" ? (
                    <StatusToggleButton active={c.status === "Active"} onClick={() => setStatusTarget(c)} />
                  ) : c.status === "Active" ? (
                    <Badge bg="success">Active</Badge>
                  ) : (
                    <Badge bg="secondary">Inactive</Badge>
                  )}
                </td>
                <td>
                  {c.membership?.tierName ? (
                    <Badge bg="warning" text="dark" className="px-2 py-1">
                      <i className="bi bi-award me-1" aria-hidden="true" />
                      {c.membership.tierName}
                    </Badge>
                  ) : (
                    <span className="text-muted">No tier</span>
                  )}
                </td>
                <td className="text-center">
                  <div className="manager-list-actions customer-admin-actions">
                  <Button
                    variant="link"
                    size="sm"
                    className="manager-list-action manager-list-action--view"
                    onClick={() => navigate(`/customers/detail/${c.customerId}`)}
                    aria-label={`View customer ${c.fullName}`}
                  >
                    <i className="bi bi-eye-fill me-1" aria-hidden="true" />
                    View
                  </Button>
                  {(user?.role === "Manager" ||
                    user?.role === "Receptionist") && (
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--view"
                      onClick={() => navigate(`/treatment-profile/${c.customerId}`)}
                      aria-label={`View treatment packages and sessions of ${c.fullName}`}
                    >
                      <i className="bi bi-box-seam" aria-hidden="true" /> Treatment plan
                    </Button>
                  )}
                  {(user?.role === "Manager" ||
                    user?.role === "Receptionist") && (
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--edit"
                      onClick={() => navigate(`/customers/edit/${c.customerId}`)}
                      aria-label={`Edit customer ${c.fullName}`}
                    >
                      <i className="bi bi-pencil-square" aria-hidden="true" /> Edit
                    </Button>
                  )}
                  {user?.role === "Manager" && (
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--delete"
                      onClick={() => setDeleteTarget(c)}
                      aria-label={`Delete customer ${c.fullName}`}
                    >
                      <i className="bi bi-trash" aria-hidden="true" /> Delete
                    </Button>
                  )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <DeleteCustomerModal
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); setRefresh((prev) => prev + 1); }}
      />

      <StatusChangeModal
        show={!!statusTarget}
        entity="customer"
        name={statusTarget?.fullName}
        nextActive={statusTarget?.status !== "Active"}
        busy={statusBusy}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </Container>
  );
};

export default CustomerList;