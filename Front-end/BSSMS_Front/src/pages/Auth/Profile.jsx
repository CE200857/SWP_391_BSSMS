import { useState, useEffect } from "react";
import { Container, Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const idToFetch = user?.account_id || user?.accountId;

      if (!idToFetch) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/profile?accountId=${idToFetch}&role=${user.role}`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error("Error loading the profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error calling the logout API:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      navigate(user?.role === "Customer" ? "/bssms-guest" : "/dashboard/login", { replace: true });
    }
  };

  if (!user) return null;

  const displayName = profileData?.fullName || user?.fullName || "User";
  const initial = displayName.charAt(0).toUpperCase();

  if (user.role === "Customer") {
    return (
      <main className="customer-profile-page">
        <section className="customer-page-banner customer-profile-banner">
          <div className="customer-page-container">
            <div className="customer-breadcrumb">
              <button type="button" onClick={() => navigate("/customer/home")}>Home</button>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <strong>My profile</strong>
            </div>
            <div className="customer-profile-banner-row">
              <div>
                <span className="home-eyebrow">YOUR ACCOUNT</span>
                <h1>My profile</h1>
                <p>Your information, for truly personal care experiences at Seoul Center.</p>
              </div>
              <Button variant="light" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left" aria-hidden="true" /> Back
              </Button>
            </div>
          </div>
        </section>

        <div className="customer-profile-container">
          <aside className="customer-profile-menu">
            <div className="customer-profile-identity">
              <span>{initial}</span>
              <h2>{displayName}</h2>
              <small>Customer</small>
            </div>
            <div className="customer-profile-menu-divider" />
            <button className="is-active" type="button" aria-current="page">
              <i className="bi bi-person" aria-hidden="true" /> My profile
            </button>
            <button type="button" onClick={() => navigate("/change-password")}>
              <i className="bi bi-key" aria-hidden="true" /> Change password
            </button>
            <div className="customer-profile-menu-divider" />
            <button className="customer-profile-logout" type="button" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" /> Log out
            </button>
          </aside>

          <section className="customer-profile-details">
            <div className="customer-profile-details-heading">
              <div>
                <h2>Personal information</h2>
                <p>Your contact details and account settings.</p>
              </div>
              <span><i className="bi bi-person" aria-hidden="true" /></span>
            </div>

            {isLoading ? <div className="ui-empty" role="status"><Spinner animation="border" variant="primary" /><p>Loading profile…</p></div> : !profileData ? <div className="alert alert-danger" role="alert">Could not load the profile. Please reload the page to try again.</div> : <>
            <div className="customer-profile-data-grid">
              <div><small>Username</small><strong>{profileData.username || "—"}</strong></div>
              <div><small>Full name</small><strong>{profileData.fullName || "—"}</strong></div>
              <div><small>Email</small><strong>{profileData.email || "—"}</strong></div>
              <div><small>Phone number</small><strong>{profileData.phone || "Not provided"}</strong></div>
              <div><small>Date of birth</small><strong>{profileData.dob || "Not provided"}</strong></div>
              <div>
                <small>Gender</small>
                <strong>
                  {profileData.gender === "Male" ? "Male" : profileData.gender === "Female" ? "Female" : "Other"}
                </strong>
              </div>
              <div><small>Address</small><strong>{profileData.address || "Not provided"}</strong></div>
              <div>
                <small>Account status</small>
                <strong>
                  <span className={`customer-profile-status${profileData.status === "Active" ? " is-active" : ""}`}>
                    <i className="bi bi-check-circle" aria-hidden="true" />
                    {profileData.status === "Active" ? "Active" : "Inactive"}
                  </span>
                </strong>
              </div>
            </div>

            <div className="customer-profile-actions">
              <Button
                variant="primary"
                onClick={() => navigate("/edit-profile", { state: { profileData } })}
              >
                <i className="bi bi-pencil-square" aria-hidden="true" /> Edit
              </Button>
            </div>
            </>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <Container fluid className="mt-4 px-4">
      <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-5">
          <h2 className="mb-5 fw-bold text-uppercase text-center">
            My profile
          </h2>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3 text-muted">Loading information...</p>
            </div>
          ) : !profileData ? (
            <div className="text-center py-5">
              <p className="mt-3 text-danger">
                Could not load the profile. Please try again later.
              </p>
              <Button variant="danger" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          ) : (
            <Row>
              <Col
                md={4}
                className="d-flex flex-column align-items-center justify-content-center border-end mb-4 mb-md-0"
              >
                <div
                  className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center mb-3 shadow"
                  style={{
                    width: "160px",
                    height: "160px",
                    fontSize: "60px",
                    fontWeight: "bold",
                  }}
                >
                  {initial}
                </div>
                <h4 className="fw-bold mt-2">{profileData.fullName}</h4>
                <span className="badge bg-success px-3 py-2 mt-1">
                  {profileData.role}
                </span>
              </Col>

              <Col md={8} className="ps-md-5 d-flex flex-column">
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">
                    Username
                  </label>
                  <div className="p-2 bg-light rounded border">
                    {profileData.username}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">Full name</label>
                  <div className="p-2 bg-light rounded border">
                    {profileData.fullName}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">Email</label>
                  <div className="p-2 bg-light rounded border">
                    {profileData.email}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">
                    Phone number
                  </label>
                  <div className="p-2 bg-light rounded border">
                    {profileData.phone || "Not provided"}
                  </div>
                </div>

                {profileData.role === "Customer" && (
                  <>
                    <Row>
                      <Col md={6} className="mb-3">
                        <label className="text-muted fw-bold mb-1">
                          Date of birth
                        </label>
                        <div className="p-2 bg-light rounded border">
                          {profileData.dob || "Not provided"}
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <label className="text-muted fw-bold mb-1">
                          Gender
                        </label>
                        <div className="p-2 bg-light rounded border">
                          {profileData.gender === "Male"
                            ? "Male"
                            : profileData.gender === "Female"
                              ? "Female"
                              : "Other"}
                        </div>
                      </Col>
                    </Row>
                    <div className="mb-3">
                      <label className="text-muted fw-bold mb-1">Address</label>
                      <div className="p-2 bg-light rounded border">
                        {profileData.address || "Not provided"}
                      </div>
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <label className="text-muted fw-bold mb-1">
                    Account status
                  </label>
                  <div className="p-2 bg-light rounded border">
                    {profileData.status === "Active"
                      ? "Active"
                      : "Inactive"}
                  </div>
                </div>

                {profileData.role === "Customer" && (
                  <Card className="border-0 bg-light mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h5 className="fw-bold mb-0">
                          Membership Information
                        </h5>

                        <span
                          className={`badge px-3 py-2 ${profileData.membership
                              ? "bg-success"
                              : "bg-secondary"
                            }`}
                        >
                          {profileData.membership?.tierName ||
                            (profileData.membershipTierId != null
                              ? "Tier not determined"
                              : "No tier")}
                        </span>
                      </div>

                      {profileData.membership ? (
                        <>
                          <Row>
                            <Col sm={6} className="mb-3">
                              <div className="text-muted small mb-1">
                                Discount
                              </div>
                              <div className="fw-bold fs-5">
                                {Number(
                                  profileData.membership.discountPercent
                                ).toLocaleString("vi-VN")}
                                %
                              </div>
                            </Col>

                            <Col sm={6} className="mb-3">
                              <div className="text-muted small mb-1">
                                Minimum Spending
                              </div>
                              <div className="fw-bold">
                                {Number(
                                  profileData.membership.minSpending
                                ).toLocaleString("vi-VN")}{" "}
                                ₫
                              </div>
                            </Col>
                          </Row>

                          <div className="text-muted small mb-1">
                            Benefits / Description
                          </div>
                          <p className="mb-0">
                            {profileData.membership.description ||
                              "No benefit description yet."}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted mb-0">
                          No membership tier information yet.
                          Please contact the receptionist for help.
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                )}

                <div className="d-flex justify-content-between mt-auto pt-3 flex-wrap gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Back
                  </Button>

                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="danger"
                      className="text-white"
                      onClick={() => navigate("/change-password")}
                    >
                      <i className="bi bi-key me-1"></i> Change password
                    </Button>

                    <Button
                      variant="danger"
                      className="text-white"
                      onClick={() =>
                        navigate("/edit-profile", { state: { profileData } })
                      }
                    >
                      <i className="bi bi-pencil-square me-1"></i> Edit
                    </Button>

                    <Button variant="danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-1"></i> Log out
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
