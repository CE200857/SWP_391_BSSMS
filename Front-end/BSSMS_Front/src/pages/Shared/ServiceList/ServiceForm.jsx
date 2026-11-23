import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import servicePhoto from "../../../assets/figma/service-card-exact-02.png";
import { imageFileToUpload } from "../../../utils/imageUpload";
import ServiceDetailExtras from "./ServiceDetailExtras";

const initialFormData = {
  serviceName: "",
  description: "",
  price: "",
  duration: "",
  category: "",
  requiredRoomType: "Facial",
  tourCount: "",
  technicianIds: [],
  status: "Active",
};

const ROOM_TYPES = [
  ["Facial", "Facial care room"],
  ["Massage", "Massage room"],
  ["HairWash", "Herbal hair wash room"],
  ["Body", "Body care room"],
];
const proposedTours = (duration) => Math.min(3, Math.max(1, Math.ceil(Number(duration || 0) / 60)));

const statusLabels = {
  Active: "Active",
  Inactive: "Deactivate",
};

const getRequestErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message || error.response?.data?.error;
  return typeof message === "string" ? message : fallback;
};

const ServiceForm = ({ isReadOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";
  const isEditing = Boolean(id);
  const requestKey = id ? `${id}:${loadAttempt}` : null;
  const loading = Boolean(id) && loadedRequestKey !== requestKey;

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    axios
      .get(`/api/service?id=${id}`)
      .then((response) => {
        if (cancelled) return;
        const service = response.data;
        setLoadError("");
        setImageUrl(service.imageUrl || "");
        setFormData({
          serviceName: service.serviceName || "",
          description: service.description || "",
          price: service.price ?? "",
          duration: service.duration ?? "",
          category: service.category || "",
          requiredRoomType: service.requiredRoomType || "Facial",
          tourCount: service.tourCount ?? "",
          technicianIds: [],
          status: service.status || "Active",
        });
      })
      .catch((error) => {
        console.error("Error fetching service data:", error);
        if (!cancelled) {
          setLoadError(
            getRequestErrorMessage(
              error,
              "Could not load the service information. Please try again.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedRequestKey(`${id}:${loadAttempt}`);
      });

    return () => {
      cancelled = true;
    };
  }, [id, loadAttempt]);

  const [technicians, setTechnicians] = useState([]);
  useEffect(() => {
    if (!isManager) return;
    axios
      .get(`/api/service?technicians=${id || 0}`)
      .then((response) => {
        const rows = Array.isArray(response.data) ? response.data : [];
        setTechnicians(rows);
        setFormData((current) => ({ ...current, technicianIds: rows.filter((t) => Number(t.qualified) === 1).map((t) => t.staffId) }));
      })
      .catch(() => setTechnicians([]));
  }, [id, isManager, loadAttempt]);

  const toggleTechnician = (staffId) =>
    setFormData((current) => ({
      ...current,
      technicianIds: current.technicianIds.includes(staffId)
        ? current.technicianIds.filter((x) => x !== staffId)
        : [...current.technicianIds, staffId],
    }));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setSaveError("");
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    try {
      setImageUpload(await imageFileToUpload(file));
      setRemoveImage(false);
    } catch (error) {
      setImageUpload(null);
      setImageError(error.message || "Could not process the image.");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveError("");
    const payload = {
      ...formData,
      serviceName: formData.serviceName.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      duration: Number(formData.duration),
      category: formData.category.trim() || null,
      tourCount: formData.tourCount === "" ? proposedTours(formData.duration) : Number(formData.tourCount),
    };

    try {
      let serviceId = id;
      if (isEditing) {
        await axios.put(`/api/service?id=${id}`, payload);
      } else {
        const response = await axios.post("/api/service", payload);
        serviceId = response.data?.serviceId;
      }

      let imageNotice = "";
      try {
        if (serviceId && imageUpload) {
          await axios.post(`/api/service-image/${serviceId}`, imageUpload);
        } else if (serviceId && isEditing && removeImage) {
          await axios.delete(`/api/service-image/${serviceId}`);
        }
      } catch (imageErr) {
        imageNotice = ` But the image could not be saved: ${getRequestErrorMessage(imageErr, "image upload error")}.`;
      }

      navigate("/services", {
        replace: true,
        state: {
          serviceNotice:
            (isEditing ? "Service information updated." : "New service added.") + imageNotice,
        },
      });
    } catch (error) {
      console.error("Error saving service:", error);
      setSaveError(
        getRequestErrorMessage(
          error,
          "Could not save the service. Please check the information and try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isReadOnly && !isManager) {
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
              <strong>{formData.serviceName || "Service details"}</strong>
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
          <div className="sc-container"><div className="sc-empty" role="status"><Spinner animation="border" size="sm" /> Loading service…</div></div>
        ) : loadError ? (
          <div className="sc-container">
            <div className="sc-empty" role="alert">
              <i className="bi bi-wifi-off" aria-hidden="true" />
              <strong>{loadError}</strong>
              <div className="sc-actions">
                <button type="button" className="sc-btn sc-btn-ghost" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</button>
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
                  alt={formData.serviceName}
                  decoding="async"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = fallbackPhoto; }
                  }}
                />
              </div>
              <div className="sc-detail-copy">
                <span className="sc-eyebrow">{(formData.category || "Service").toUpperCase()}</span>
                <h1>{formData.serviceName}</h1>
                <p className="sc-lead">{formData.description || "Our staff will advise you based on your needs."}</p>
                <dl className="sc-facts">
                  <div>
                    <dt>Price</dt>
                    <dd className="sc-price">{Number(formData.price || 0).toLocaleString("vi-VN")} <small>VND</small></dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{formData.duration || 0} minutes</dd>
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
            <ServiceDetailExtras serviceId={id} service={formData} isCustomer={isCustomerUser} />
          </>
        )}
      </div>
    );
  }

  const pageTitle = isReadOnly
    ? "Service details"
    : isEditing
      ? "Edit service"
      : "Add new service";

  return (
    <main className="service-admin-page">
      <nav className="service-admin-breadcrumb" aria-label="Navigation">
        <Link to="/services">Service management</Link>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span>{pageTitle}</span>
      </nav>

      <header className="service-admin-header">
        <span className="service-admin-eyebrow">
          <i className="bi bi-stars" aria-hidden="true" /> SERVICE CATALOG
        </span>
        <h1>{pageTitle}</h1>
        <p>
          {isReadOnly
            ? "View the information and current status of the service."
            : isEditing
              ? "Keep information up to date so customers and staff always have accurate data."
              : "Add a new service to the catalog so customers can learn about it and book it."}
        </p>
      </header>

      {loading ? (
        <section className="service-admin-state" role="status">
          <Spinner animation="border" size="sm" />
          <span>Loading service information...</span>
        </section>
      ) : loadError ? (
        <section className="service-admin-state service-admin-state--error" role="alert">
          <i className="bi bi-wifi-off" aria-hidden="true" />
          <span>{loadError}</span>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Try reloading
          </button>
        </section>
      ) : isReadOnly ? (
        <section className="service-admin-detail-card">
          <div className="service-admin-detail-top">
            <span className="service-admin-eyebrow">SERVICE INFORMATION</span>
            <span
              className={`service-admin-status service-admin-status--${String(
                formData.status,
              ).toLowerCase()}`}
            >
              <span aria-hidden="true" />
              {statusLabels[formData.status] || formData.status}
            </span>
          </div>
          <h2>{formData.serviceName}</h2>
          <p className="service-admin-detail-description">
            {formData.description || "This service has no description yet."}
          </p>
          <div className="service-admin-facts">
            <div>
              <span>
                <i className="bi bi-cash-coin" aria-hidden="true" /> Service price
              </span>
              <strong>
                {Number(formData.price || 0).toLocaleString("vi-VN")} VND
              </strong>
            </div>
            <div>
              <span>
                <i className="bi bi-clock" aria-hidden="true" /> Duration
              </span>
              <strong>{formData.duration || 0} minutes</strong>
            </div>
            <div>
              <span><i className="bi bi-door-open" aria-hidden="true" /> Room type</span>
              <strong>{(ROOM_TYPES.find(([value]) => value === formData.requiredRoomType) || [, formData.requiredRoomType])[1]}</strong>
            </div>
            <div>
              <span><i className="bi bi-arrow-repeat" aria-hidden="true" /> Tours</span>
              <strong>{formData.tourCount || proposedTours(formData.duration)} tour</strong>
            </div>
          </div>
          <div className="service-admin-actions">
            <Link to="/services" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2" aria-hidden="true" />
              Service list
            </Link>
            {isManager && (
              <Link
                to={`/services/edit/${id}`}
                className="btn btn-primary"
              >
                <i className="bi bi-pencil-square me-2" aria-hidden="true" />
                Edit
              </Link>
            )}
          </div>
        </section>
      ) : (
        <div className="service-admin-content">
          <section className="service-admin-form-card">
            <div className="service-admin-card-heading">
              <span className="service-admin-card-icon">
                <i
                  className={`bi ${isEditing ? "bi-pencil-square" : "bi-plus-lg"}`}
                  aria-hidden="true"
                />
              </span>
              <div>
                <h2>{isEditing ? "Update information" : "Service information"}</h2>
                <p>Fields marked * are required.</p>
              </div>
            </div>

            {saveError && (
              <div className="alert alert-danger" role="alert">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="service-admin-form-grid">
                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="serviceName">Service name *</label>
                  <input
                    id="serviceName"
                    className="form-control"
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleChange}
                    placeholder="Example: Intensive skin care"
                    autoComplete="off"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    className="form-control"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="A short description of the service and the customer experience..."
                    disabled={saving}
                  />
                  <small>This information helps customers understand the service better.</small>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="price">Service price (VND) *</label>
                  <div className="service-admin-input-with-suffix">
                    <input
                      id="price"
                      className="form-control"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0.01"
                      step="any"
                      placeholder="Enter the service price"
                      required
                      disabled={saving}
                    />
                    <span>VND</span>
                  </div>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="duration">Duration (minutes) *</label>
                  <div className="service-admin-input-with-suffix">
                    <input
                      id="duration"
                      className="form-control"
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      min="15"
                      max="600"
                      step="15"
                      placeholder="Multiple of 15, e.g. 60"
                      required
                      disabled={saving}
                    />
                    <span>minutes</span>
                  </div>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="requiredRoomType">Required room type *</label>
                  <select id="requiredRoomType" className="form-select" name="requiredRoomType" value={formData.requiredRoomType} onChange={handleChange} disabled={saving}>
                    {ROOM_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                  </select>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="tourCount">Tours</label>
                  <div className="service-admin-input-with-suffix">
                    <input id="tourCount" className="form-control" type="number" name="tourCount" value={formData.tourCount}
                      onChange={handleChange} min="1" max="10" step="1" placeholder={`Suggested: ${proposedTours(formData.duration)}`} disabled={saving} />
                    <span>tour</span>
                  </div>
                  <small>Default 30–60 minutes = 1 tour, 90–120 minutes = 2 tours. Leave blank to use the suggested value.</small>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="category">Service group</label>
                  <input id="category" className="form-control" name="category" value={formData.category} onChange={handleChange} maxLength={50} placeholder="Example: Skin care" disabled={saving} />
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label>Qualified technicians</label>
                  <div className="d-flex flex-wrap gap-3 border rounded p-2">
                    {technicians.length ? technicians.map((t) => (
                      <div className="form-check" key={t.staffId}>
                        <input className="form-check-input" type="checkbox" id={`tech-${t.staffId}`} checked={formData.technicianIds.includes(t.staffId)}
                          onChange={() => toggleTechnician(t.staffId)} disabled={saving} />
                        <label className="form-check-label" htmlFor={`tech-${t.staffId}`}>{t.fullName}</label>
                      </div>
                    )) : <small className="text-muted">No active technicians yet.</small>}
                  </div>
                  <small>Only the selected technicians can be assigned this service.</small>
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="serviceImage">Service image</label>
                  {(imageUpload || (imageUrl && !removeImage)) && (
                    <img
                      src={imageUpload ? `data:${imageUpload.contentType};base64,${imageUpload.data}` : imageUrl}
                      alt="Service image"
                      onError={(event) => { if (!imageUpload) event.currentTarget.style.display = "none"; }}
                      style={{ display: "block", width: 280, maxWidth: "100%", height: 170, objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                    />
                  )}
                  <input
                    id="serviceImage"
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving}
                    onChange={handleImageChange}
                  />
                  <small className="text-muted d-block mt-1">
                    JPEG, PNG or WebP; images are resized automatically when uploaded. Leave blank to keep the current image.
                  </small>
                  {imageError && <div className="text-danger small mt-1">{imageError}</div>}
                  {imageUrl && !removeImage && !imageUpload && (
                    <button type="button" className="btn btn-sm btn-outline-danger mt-2" disabled={saving} onClick={() => setRemoveImage(true)}>
                      Remove current image
                    </button>
                  )}
                  {removeImage && (
                    <div className="small text-muted mt-2">
                      The current image will be deleted when you save.{" "}
                      <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setRemoveImage(false)}>Undo</button>
                    </div>
                  )}
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Deactivate</option>
                  </select>
                </div>
              </div>

              <div className="service-admin-actions">
                <Link
                  to="/services"
                  className="btn btn-outline-secondary"
                  aria-disabled={saving}
                  onClick={(event) => {
                    if (saving) event.preventDefault();
                  }}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Saving
                    </>
                  ) : (
                    <>
                      <i
                        className={`bi ${isEditing ? "bi-check2" : "bi-plus-lg"} me-2`}
                        aria-hidden="true"
                      />
                      {isEditing ? "Save changes" : "Add service"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="service-admin-guidance">
            <div className="service-admin-guidance-icon">
              <i className="bi bi-lightbulb" aria-hidden="true" />
            </div>
            <h2>Notes when updating</h2>
            <p>
              The name, price and duration are used when customers view the service and
              booking.
            </p>
            <ul>
              <li>
                <i className="bi bi-check2" aria-hidden="true" />
                The service price must be greater than 0.
              </li>
              <li>
                <i className="bi bi-check2" aria-hidden="true" />
                Duration is in minutes.
              </li>
              <li>
                <i className="bi bi-check2" aria-hidden="true" />
                Inactive services are not shown to customers.
              </li>
            </ul>
          </aside>
        </div>
      )}
    </main>
  );
};

export default ServiceForm;
