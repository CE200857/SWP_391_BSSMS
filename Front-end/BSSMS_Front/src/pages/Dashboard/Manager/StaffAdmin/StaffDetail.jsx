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
import "./StaffAdmin.css";

const roleLabels = {
  Manager: "Manager",
  Receptionist: "Receptionist",
  Technician: "Technician",
};

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaffDetail = async () => {
      try {
        const response = await fetch(`/api/staff?id=${id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStaff(data);
        } else {
          setError("Staff information not found.");
        }
      } catch (error) {
        console.error("Error loading staff details:", error);
        setError("Could not load the staff profile. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <Container className="staff-admin d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!staff) {
    return (
      <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
        <Alert variant="danger" role="alert">
          {error || "Staff information not found."}
        </Alert>
        <Button variant="outline-secondary" onClick={() => navigate("/staffs")}>
          <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to list
        </Button>
      </Container>
    );
  }

  const role = staff.role || staff.position;
  const hireDate = staff.hireDate
    ? staff.hireDate.substring(0, 10).split("-").reverse().join("/")
    : "Not provided";

  return (
    <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Staff profile</h2>
          <p>The staff member’s contact and job information.</p>
        </div>
      </div>

      <Card className="staff-detail-card">
        <div className="staff-detail-banner">
          <div className="staff-detail-identity">
            <div className="staff-detail-avatar" aria-hidden="true">
              {staff.fullName?.trim()?.charAt(0)?.toUpperCase() || "N"}
            </div>
            <div>
              <h3>{staff.fullName || "Staff"}</h3>
              <p>{roleLabels[role] || role || "Not provided"} · Staff ID #{staff.staffId}</p>
            </div>
          </div>
          {staff.status && (
            <Badge className={`staff-status-badge${staff.status !== "Active" ? " is-inactive" : ""}`}>
              {staff.status === "Active" ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>

        <Card.Body className="staff-detail-content">
          <h3 className="staff-detail-section-title">
            <i className="bi bi-person-lines-fill me-2" aria-hidden="true"></i>
            Detailed information
          </h3>
          <div className="staff-detail-grid">
            <div className="staff-detail-item">
              <span>Staff ID</span>
              <strong>#{staff.staffId}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Username</span>
              <strong>{staff.username || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Email</span>
              <strong>{staff.email || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Phone number</span>
              <strong>{staff.phone || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Position</span>
              <strong>{roleLabels[role] || role || "Not provided"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Start date</span>
              <strong>{hireDate}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Status</span>
              <strong>{staff.status === "Active" ? "Working" : staff.status === "Locked" ? "Locked" : "Inactive"}</strong>
            </div>
          </div>

          <div className="staff-detail-footer">
            <Button variant="outline-secondary" onClick={() => navigate("/staffs")}>
              <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to list
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StaffDetail;
