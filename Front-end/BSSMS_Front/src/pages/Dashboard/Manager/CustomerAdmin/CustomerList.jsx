import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Badge,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";
import { StatusToggleButton, StatusChangeModal } from "../../../../components/StatusToggle";

const CustomerList = ({ user }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);
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
      const response = await fetch(
        `/api/customers?id=${selectedCustomer.customerId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setRefresh((prev) => prev + 1);
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.message || "Error: Could not delete this customer.");
      }
    } finally {
      handleCloseModal();
    }
  };

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
                <td className="text-center">
                  <div className="manager-list-actions customer-admin-actions">
                  <Button
                    variant="link"
                    size="sm"
                    className="manager-list-action manager-list-action--view"
                    onClick={() => setDetailCustomer(c)}
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
                      onClick={() => handleShowModal(c)}
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
              <td colSpan="4" className="text-center text-muted">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal
        className="customer-detail-modal"
        show={!!detailCustomer}
        onHide={() => setDetailCustomer(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-vcard" aria-hidden="true" />
            Customer information
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <dl className="customer-detail-grid">
            <dt>Customer ID</dt>
            <dd>#{detailCustomer?.customerId || "—"}</dd>
            <dt>Full name</dt>
            <dd>{detailCustomer?.fullName || "—"}</dd>
            <dt>Phone number</dt>
            <dd>{detailCustomer?.phone || "—"}</dd>
            <dt>Email</dt>
            <dd>{detailCustomer?.email || "—"}</dd>
            <dt>Status</dt>
            <dd>
              {detailCustomer?.status ? (
                <Badge bg={detailCustomer.status === "Active" ? "success" : "secondary"}>
                  {detailCustomer.status === "Active" ? "Active" : "Inactive"}
                </Badge>
              ) : "—"}
            </dd>
          </dl>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setDetailCustomer(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirm account deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete customer{" "}
          <span className="fw-bold text-primary">
            {selectedCustomer?.fullName}
          </span>
          ? The account can no longer log in and is removed from the customer list. Their appointments,
          invoices and packages are kept in the database. Customers with upcoming appointments or unpaid
          invoices cannot be deleted.
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
