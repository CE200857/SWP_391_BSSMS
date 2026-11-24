import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import "../StaffAdmin/StaffAdmin.css";

// Show "yyyy-MM-dd" as "dd/MM/yyyy"
const formatDate = (value) =>
  value ? value.substring(0, 10).split("-").reverse().join("/") : "Not provided";

const formatMoney = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      try {
        const response = await fetch(`/api/customers?id=${id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
        } else {
          const data = await response.json().catch(() => null);
          setError(data?.message || "Customer information not found.");
        }
      } catch (err) {
        console.error("Error loading customer details:", err);
        setError("Could not load the customer profile. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetail();
  }, [id]);

  if (loading) {
    return (
      <Container className="staff-admin d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!customer || !customer.customerId) {
    return (
      <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
        <Alert variant="danger" role="alert">
          {error || "Customer information not found."}
        </Alert>
        <Button variant="outline-secondary" onClick={() => navigate("/customers")}>
          <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to list
        </Button>
      </Container>
    );
  }

  const membership = customer.membership;
  const isActive = customer.status === "Active";

  return (
    <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Customer profile</h2>
          <p>The customer’s contact, personal and membership information.</p>
        </div>
      </div>

      <Card className="staff-detail-card">
        <div className="staff-detail-banner">
          <div className="staff-detail-identity">
            <div className="staff-detail-avatar" aria-hidden="true">
              {customer.fullName?.trim()?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <h3>{customer.fullName || "Customer"}</h3>
              <p>
                {membership?.tierName || "No membership tier"} · Customer ID #{customer.customerId}
              </p>
            </div>
          </div>
          {customer.status && (
            <Badge className={`staff-status-badge${isActive ? "" : " is-inactive"}`}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>

        <Card.Body className="staff-detail-content">
          <h3 className="staff-detail-section-title">
            <i className="bi bi-person-lines-fill me-2" aria-hidden="true"></i>
            Personal information
          </h3>
          <div className="staff-detail-grid">
            <div className="staff-detail-item">
              <span>Customer ID</span>
              <strong>#{customer.customerId}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Username</span>
              <strong>{customer.username || "No account"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Full name</span>
              <strong>{customer.fullName || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Phone number</span>
              <strong>{customer.phone || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Email</span>
              <strong>{customer.email || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Gender</span>
              <strong>{customer.gender || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Date of birth</span>
              <strong>{formatDate(customer.dob)}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Address</span>
              <strong>{customer.address || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Status</span>
              <strong>{isActive ? "Active" : "Inactive (account locked)"}</strong>
            </div>
          </div>

          <h3 className="staff-detail-section-title mt-4">
            <i className="bi bi-award me-2" aria-hidden="true"></i>
            Membership tier
          </h3>
          {membership ? (
            <div className="staff-detail-grid">
              <div className="staff-detail-item">
                <span>Tier</span>
                <strong>
                  <Badge bg="warning" text="dark" className="px-2 py-1">{membership.tierName}</Badge>
                </strong>
              </div>
              <div className="staff-detail-item">
                <span>Discount</span>
                <strong>{Number(membership.discountPercent ?? 0).toLocaleString("vi-VN")}%</strong>
              </div>
              <div className="staff-detail-item">
                <span>Required spending</span>
                <strong>{formatMoney(membership.minSpending)}</strong>
              </div>
              {membership.description && (
                <div className="staff-detail-item">
                  <span>Description</span>
                  <strong>{membership.description}</strong>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted mb-0">This customer does not have a membership tier yet.</p>
          )}

          <div className="staff-detail-footer">
            <Button variant="outline-secondary" onClick={() => navigate("/customers")}>
              <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to list
            </Button>
            <Button variant="outline-danger" onClick={() => navigate(`/treatment-profile/${customer.customerId}`)}>
              <i className="bi bi-box-seam me-1" aria-hidden="true"></i>Treatment plan
            </Button>
            <Button variant="danger" onClick={() => navigate(`/customers/edit/${customer.customerId}`)}>
              <i className="bi bi-pencil-square me-1" aria-hidden="true"></i>Edit
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerDetail;
