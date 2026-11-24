// UC View Service Details — read-only service page.
// Routes: /guest/services/:id and /services/detail/:id.
// Guests/customers/staff see the public detail page; the Manager sees the admin detail card.
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import ServiceDetailExtras from "./ServiceDetailExtras";
import {
  initialServiceFormData,
  ROOM_TYPES,
  statusLabels,
  proposedTours,
  getRequestErrorMessage,
  ServiceAdminHeader,
  ServiceLoadState,
} from "./serviceFormShared";

const ViewServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(initialServiceFormData);
  const [imageUrl, setImageUrl] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";
  const requestKey = `${id}:${loadAttempt}`;
  const loading = loadedRequestKey !== requestKey;
  const retry = () => setLoadAttempt((attempt) => attempt + 1);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`/api/service?id=${id}`)
      .then((response) => {
        if (cancelled) return;
        const data = response.data;
        setLoadError("");
        setImageUrl(data.imageUrl || "");
        setService({
          serviceName: data.serviceName || "",
          description: data.description || "",
          price: data.price ?? "",
          duration: data.duration ?? "",
          category: data.category || "",
          requiredRoomType: data.requiredRoomType || "Facial",
          tourCount: data.tourCount ?? "",
          technicianIds: [],
          status: data.status || "Active",
        });
      })
      .catch((error) => {
        console.error("Error fetching service data:", error);
        if (!cancelled) {
          setLoadError(getRequestErrorMessage(error, "Could not load the service information. Please try again."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedRequestKey(`${id}:${loadAttempt}`);
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadAttempt]);

  // ---- Public detail page (guest, customer, receptionist, technician) ----
  if (!isManager) {
    const isCustomerUser = user?.role === "Customer";
    const listPath = isCustomerUser ? "/services" : "/guest/services";
    const homePath = isCustomerUser ? "/customer/home" : "/bssms-guest";
    const staffView = ["Technician", "Manager"].includes(user?.role);
    // Same illustration as on the Services page when the service has no uploaded image
    const photoNo = String((Math.max(1, Number(id) || 1) - 1) % 11 + 1).padStart(2, "0");
    const fallbackPhoto = new URL(`../../../assets/figma/service-card-exact-${photoNo}.png`, import.meta.url).href;

    return (
      <div className="sc-page sc-page--detail">
        <section className="customer-page-banner">
          <div className="customer-page-container">
            <div className="customer-breadcrumb">
              <Link to={homePath}>Home</Link>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <Link to={listPath}>Services</Link>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <strong>{service.serviceName || "Service details"}</strong>
            </div>
            <div className="public-detail-banner-title">
              <p className="public-detail-banner-heading">Service details</p>
              <button type="button" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left" aria-hidden="true" /> Back
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="sc-container">
            <div className="sc-empty" role="status"><Spinner animation="border" size="sm" /> Loading service…</div>
          </div>
        ) : loadError ? (
          <div className="sc-container">
            <div className="sc-empty" role="alert">
              <i className="bi bi-wifi-off" aria-hidden="true" />
              <strong>{loadError}</strong>
              <div className="sc-actions">
                <button type="button" className="sc-btn sc-btn-ghost" onClick={retry}>Try again</button>
                <Link className="sc-btn sc-btn-ghost" to={listPath}>Back to services</Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="sc-container sc-detail">
              <div className="sc-detail-image">
                <img
                  src={imageUrl || fallbackPhoto}
                  alt={service.serviceName}
                  decoding="async"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = fallbackPhoto; }
                  }}
                />
              </div>
              <div className="sc-detail-copy">
                <span className="sc-eyebrow">{(service.category || "Service").toUpperCase()}</span>
                <h1>{service.serviceName}</h1>
                <p className="sc-lead">{service.description || "Our staff will advise you based on your needs."}</p>
                <dl className="sc-facts">
                  <div>
                    <dt>Price</dt>
                    <dd className="sc-price">{Number(service.price || 0).toLocaleString("vi-VN")} <small>VND</small></dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{service.duration || 0} minutes</dd>
                  </div>
                </dl>
                <Link
                  className="sc-btn sc-btn-primary sc-btn-block"
                  to={staffView ? "/appointments" : `/slots?serviceId=${encodeURIComponent(id)}`}
                >
                  {staffView ? "View appointments" : user ? "Book this service" : "Log in to book"}
                </Link>
                <p className="sc-note">
                  Book at least 2 hours ahead · Reschedule or cancel up to 2 hours before ·{" "}
                  <Link to="/faq">Booking policy</Link>
                </p>
              </div>
            </section>
            <ServiceDetailExtras serviceId={id} service={service} isCustomer={isCustomerUser} />
          </>
        )}
      </div>
    );
  }

  // ---- Manager detail card ----
  return (
    <main className="service-admin-page">
      <ServiceAdminHeader
        title="Service details"
        description="View the information and current status of the service."
      />

      {loading || loadError ? (
        <ServiceLoadState loading={loading} loadError={loadError} onRetry={retry} />
      ) : (
        <section className="service-admin-detail-card">
          <div className="service-admin-detail-top">
            <span className="service-admin-eyebrow">SERVICE INFORMATION</span>
            <span className={`service-admin-status service-admin-status--${String(service.status).toLowerCase()}`}>
              <span aria-hidden="true" />
              {statusLabels[service.status] || service.status}
            </span>
          </div>
          <h2>{service.serviceName}</h2>
          <p className="service-admin-detail-description">
            {service.description || "This service has no description yet."}
          </p>
          <div className="service-admin-facts">
            <div>
              <span><i className="bi bi-cash-coin" aria-hidden="true" /> Service price</span>
              <strong>{Number(service.price || 0).toLocaleString("vi-VN")} VND</strong>
            </div>
            <div>
              <span><i className="bi bi-clock" aria-hidden="true" /> Duration</span>
              <strong>{service.duration || 0} minutes</strong>
            </div>
            <div>
              <span><i className="bi bi-door-open" aria-hidden="true" /> Room type</span>
              <strong>
                {(ROOM_TYPES.find(([value]) => value === service.requiredRoomType) || [, service.requiredRoomType])[1]}
              </strong>
            </div>
            <div>
              <span><i className="bi bi-arrow-repeat" aria-hidden="true" /> Tours</span>
              <strong>{service.tourCount || proposedTours(service.duration)} tour</strong>
            </div>
          </div>
          <div className="service-admin-actions">
            <Link to="/services" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2" aria-hidden="true" />
              Service list
            </Link>
            <Link to={`/services/edit/${id}`} className="btn btn-primary">
              <i className="bi bi-pencil-square me-2" aria-hidden="true" />
              Edit
            </Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default ViewServiceDetail;
