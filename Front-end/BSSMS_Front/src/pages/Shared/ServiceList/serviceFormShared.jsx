// Shared, presentation-only pieces used by CreateServiceForm and UpdateServiceForm.
// No API calls live here: each CRUD file owns its own data loading and saving,
// so a bug in one function does not break the others.
import { Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

export const initialServiceFormData = {
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

export const ROOM_TYPES = [
  ["Facial", "Facial care room"],
  ["Massage", "Massage room"],
  ["HairWash", "Herbal hair wash room"],
  ["Body", "Body care room"],
];

export const statusLabels = {
  Active: "Active",
  Inactive: "Deactivate",
};

export const proposedTours = (duration) =>
  Math.min(3, Math.max(1, Math.ceil(Number(duration || 0) / 60)));

export const getRequestErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message || error.response?.data?.error;
  return typeof message === "string" ? message : fallback;
};

export const buildServicePayload = (formData) => ({
  ...formData,
  serviceName: formData.serviceName.trim(),
  description: formData.description.trim(),
  price: Number(formData.price),
  duration: Number(formData.duration),
  category: formData.category.trim() || null,
  tourCount:
    formData.tourCount === "" ? proposedTours(formData.duration) : Number(formData.tourCount),
});

export const ServiceAdminHeader = ({ title, description }) => (
  <>
    <nav className="service-admin-breadcrumb" aria-label="Navigation">
      <Link to="/services">Service management</Link>
      <i className="bi bi-chevron-right" aria-hidden="true" />
      <span>{title}</span>
    </nav>
    <header className="service-admin-header">
      <span className="service-admin-eyebrow">
        <i className="bi bi-stars" aria-hidden="true" /> SERVICE CATALOG
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  </>
);

export const ServiceLoadState = ({ loading, loadError, onRetry }) => {
  if (loading) {
    return (
      <section className="service-admin-state" role="status">
        <Spinner animation="border" size="sm" />
        <span>Loading service information...</span>
      </section>
    );
  }
  return (
    <section className="service-admin-state service-admin-state--error" role="alert">
      <i className="bi bi-wifi-off" aria-hidden="true" />
      <span>{loadError}</span>
      <button type="button" className="btn btn-outline-primary" onClick={onRetry}>
        Try reloading
      </button>
    </section>
  );
};

export const ServiceGuidance = () => (
  <aside className="service-admin-guidance">
    <div className="service-admin-guidance-icon">
      <i className="bi bi-lightbulb" aria-hidden="true" />
    </div>
    <h2>Notes when updating</h2>
    <p>The name, price and duration are used when customers view the service and booking.</p>
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
);

/**
 * The input fields of the service form. Pure UI: the parent passes the state and handlers.
 * Image props: imageUpload (new file), imageUrl (current image, Update only),
 * removeImage / onRemoveImage / onUndoRemoveImage (Update only).
 */
export const ServiceFormFields = ({
  formData,
  onChange,
  saving,
  technicians,
  onToggleTechnician,
  imageUpload,
  imageUrl = "",
  imageError,
  onImageChange,
  removeImage = false,
  onRemoveImage,
  onUndoRemoveImage,
}) => (
  <div className="service-admin-form-grid">
    <div className="service-admin-field service-admin-field--wide">
      <label htmlFor="serviceName">Service name *</label>
      <input
        id="serviceName"
        className="form-control"
        type="text"
        name="serviceName"
        value={formData.serviceName}
        onChange={onChange}
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
        onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
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
      <select
        id="requiredRoomType"
        className="form-select"
        name="requiredRoomType"
        value={formData.requiredRoomType}
        onChange={onChange}
        disabled={saving}
      >
        {ROOM_TYPES.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </div>

    <div className="service-admin-field">
      <label htmlFor="tourCount">Tours</label>
      <div className="service-admin-input-with-suffix">
        <input
          id="tourCount"
          className="form-control"
          type="number"
          name="tourCount"
          value={formData.tourCount}
          onChange={onChange}
          min="1"
          max="10"
          step="1"
          placeholder={`Suggested: ${proposedTours(formData.duration)}`}
          disabled={saving}
        />
        <span>tour</span>
      </div>
      <small>
        Default 30–60 minutes = 1 tour, 90–120 minutes = 2 tours. Leave blank to use the suggested value.
      </small>
    </div>

    <div className="service-admin-field">
      <label htmlFor="category">Service group</label>
      <input
        id="category"
        className="form-control"
        name="category"
        value={formData.category}
        onChange={onChange}
        maxLength={50}
        placeholder="Example: Skin care"
        disabled={saving}
      />
    </div>

    <div className="service-admin-field service-admin-field--wide">
      <label>Qualified technicians</label>
      <div className="d-flex flex-wrap gap-3 border rounded p-2">
        {technicians.length ? (
          technicians.map((t) => (
            <div className="form-check" key={t.staffId}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`tech-${t.staffId}`}
                checked={formData.technicianIds.includes(t.staffId)}
                onChange={() => onToggleTechnician(t.staffId)}
                disabled={saving}
              />
              <label className="form-check-label" htmlFor={`tech-${t.staffId}`}>{t.fullName}</label>
            </div>
          ))
        ) : (
          <small className="text-muted">No active technicians yet.</small>
        )}
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
        onChange={onImageChange}
      />
      <small className="text-muted d-block mt-1">
        JPEG, PNG or WebP; images are resized automatically when uploaded. Leave blank to keep the current image.
      </small>
      {imageError && <div className="text-danger small mt-1">{imageError}</div>}
      {onRemoveImage && imageUrl && !removeImage && !imageUpload && (
        <button type="button" className="btn btn-sm btn-outline-danger mt-2" disabled={saving} onClick={onRemoveImage}>
          Remove current image
        </button>
      )}
      {removeImage && (
        <div className="small text-muted mt-2">
          The current image will be deleted when you save.{" "}
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onUndoRemoveImage}>Undo</button>
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
        onChange={onChange}
        disabled={saving}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Deactivate</option>
      </select>
    </div>
  </div>
);

export const ServiceFormActions = ({ saving, submitLabel, submitIcon }) => (
  <div className="service-admin-actions">
    <Link
      to="/services"
      className="btn btn-outline-secondary"
      aria-disabled={saving}
      onClick={(event) => { if (saving) event.preventDefault(); }}
    >
      Cancel
    </Link>
    <button type="submit" className="btn btn-primary" disabled={saving}>
      {saving ? (
        <>
          <Spinner animation="border" size="sm" className="me-2" />
          Saving
        </>
      ) : (
        <>
          <i className={`bi ${submitIcon} me-2`} aria-hidden="true" />
          {submitLabel}
        </>
      )}
    </button>
  </div>
);
