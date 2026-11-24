import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import servicePhoto01 from "../../../assets/figma/service-card-exact-01.png";
import servicePhoto02 from "../../../assets/figma/service-card-exact-02.png";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import servicePhoto04 from "../../../assets/figma/service-card-exact-04.png";
import servicePhoto05 from "../../../assets/figma/service-card-exact-05.png";
import servicePhoto06 from "../../../assets/figma/service-card-exact-06.png";
import servicePhoto07 from "../../../assets/figma/service-card-exact-07.png";
import servicePhoto08 from "../../../assets/figma/service-card-exact-08.png";
import servicePhoto09 from "../../../assets/figma/service-card-exact-09.png";
import servicePhoto10 from "../../../assets/figma/service-card-exact-10.png";
import servicePhoto11 from "../../../assets/figma/service-card-exact-11.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import { StatusToggleButton, StatusChangeModal } from "../../../components/StatusToggle";
import DeleteServiceModal from "./DeleteServiceModal";

const servicePhotos = [
  servicePhoto01,
  servicePhoto02,
  servicePhoto03,
  servicePhoto04,
  servicePhoto05,
  servicePhoto06,
  servicePhoto07,
  servicePhoto08,
  servicePhoto09,
  servicePhoto10,
  servicePhoto11,
];

const ServiceList = ({ user }) => {
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState(
    location.state?.serviceNotice || "",
  );

  const [refresh, setRefresh] = useState(0);

  const isManager = user?.role === "Manager";
  const isStaff = ["Manager", "Receptionist", "Technician"].includes(
    user?.role,
  );
  const isGuest = !user;
  const { filteredRows: staffServices, toolbar } = useManagerSearchFilter(
    services,
    [
      { key: "serviceId", label: "Service ID", filterable: false },
      { key: "serviceName", label: "Service", filterable: false },
      {
        key: "status",
        label: "Status",
        formatValue: (value) => value === "Active" ? "Active" : "Inactive",
      },
      {
        key: "priceRange",
        label: "Price range",
        getValue: (service) => Number(service.price) < 500000
          ? "under500"
          : Number(service.price) <= 1000000 ? "500to1m" : "over1m",
        formatValue: (value) => ({
          under500: "Under 500,000 VND",
          "500to1m": "500,000 – 1,000,000 VND",
          over1m: "Over 1,000,000 VND",
        }[value]),
      },
      {
        key: "durationRange",
        label: "Duration",
        getValue: (service) => Number(service.duration) < 60
          ? "under60"
          : Number(service.duration) <= 90 ? "60to90" : "over90",
        formatValue: (value) => ({
          under60: "Under 60 minutes",
          "60to90": "60 – 90 minutes",
          over90: "Over 90 minutes",
        }[value]),
      },
    ],
    "Search by service name or code...",
  );

  const filteredServices = services.filter((service) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      String(service.serviceId).toLowerCase().includes(search) ||
      service.serviceName?.toLowerCase().includes(search);
    const price = Number(service.price);
    const duration = Number(service.duration);
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under500" && price < 500000) ||
      (priceFilter === "500to1m" && price >= 500000 && price <= 1000000) ||
      (priceFilter === "over1m" && price > 1000000);
    const matchesDuration =
      durationFilter === "all" ||
      (durationFilter === "under60" && duration < 60) ||
      (durationFilter === "60to90" && duration >= 60 && duration <= 90) ||
      (durationFilter === "over90" && duration > 90);
    return matchesSearch && matchesPrice && matchesDuration;
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchServices = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await axios.get("/api/service", { signal: controller.signal });
        if (!Array.isArray(response.data)) throw new Error("Invalid service data.");
        if (controller.signal.aborted) return;
        setServices(response.data);
        setLoadError(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error loading list:", error);
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchServices();
    return () => controller.abort();
  }, [refresh]);

  if (!isStaff) {
    const activeServices = services.filter((service) => service.status === "Active");
    const categories = [...new Set(activeServices.map((service) => service.category).filter(Boolean))];
    const publicServices = filteredServices.filter(
      (service) => service.status === "Active" && (categoryFilter === "all" || service.category === categoryFilter),
    );
    const detailPath = (id) => (isGuest ? `/guest/services/${id}` : `/services/detail/${id}`);
    const photoFor = (service) =>
      servicePhotos[Math.max(0, services.findIndex((item) => item.serviceId === service.serviceId)) % servicePhotos.length];

    return (
      <div className="sc-page">
        <section className="public-service-hero">
          <div className="public-service-hero-copy">
            <span className="seoul-eyebrow">OUR SERVICES</span>
            <h1>Find your treatment</h1>
            <p>
              Every visit starts with a short consultation. Prices are per visit — members get their
              tier discount automatically.
            </p>
            <span className="public-service-hero-note">
              <i className="bi bi-heart" aria-hidden="true" /> Browse freely · Log in to book
            </span>
          </div>
          <img src={servicePhoto01} alt="Skin care at Seoul Center" />
        </section>

        <section className="sc-container sc-toolbar" aria-label="Filter services">
          <div className="sc-chips" role="group" aria-label="Category">
            {["all", ...categories].map((category) => (
              <button
                type="button"
                key={category}
                className={`sc-chip${categoryFilter === category ? " is-active" : ""}`}
                aria-pressed={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
              >
                {category === "all" ? "All" : category}
              </button>
            ))}
          </div>
          <div className="sc-toolbar-right">
            <select className="sc-select" aria-label="Price" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
              <option value="all">Any price</option>
              <option value="under500">Under 500.000 VND</option>
              <option value="500to1m">500.000 – 1.000.000 VND</option>
              <option value="over1m">Over 1.000.000 VND</option>
            </select>
            <select className="sc-select" aria-label="Duration" value={durationFilter} onChange={(event) => setDurationFilter(event.target.value)}>
              <option value="all">Any duration</option>
              <option value="under60">Under 60 min</option>
              <option value="60to90">60 – 90 min</option>
              <option value="over90">Over 90 min</option>
            </select>
            <label className="sc-search">
              <i className="bi bi-search" aria-hidden="true" />
              <span className="visually-hidden">Search services</span>
              <input type="search" placeholder="Search services" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </label>
          </div>
        </section>

        <section className="sc-container sc-section-tight">
          {loading && services.length === 0 ? (
            <div className="sc-empty" role="status"><Spinner animation="border" size="sm" /> Loading services…</div>
          ) : loadError ? (
            <div className="sc-empty" role="alert">
              <i className="bi bi-wifi-off" aria-hidden="true" />
              <strong>Could not load the service list</strong>
              <button type="button" className="sc-btn sc-btn-ghost" onClick={() => setRefresh((value) => value + 1)}>Try again</button>
            </div>
          ) : publicServices.length === 0 ? (
            <div className="sc-empty">
              <i className="bi bi-search" aria-hidden="true" />
              <strong>No matching services</strong>
              <span>Try another category, keyword or filter.</span>
            </div>
          ) : (
            <div className="sc-card-grid">
              {publicServices.map((service) => (
                <Link className="sc-service-card" to={detailPath(service.serviceId)} key={service.serviceId}>
                  <span className="sc-service-image">
                    <img
                      src={service.imageUrl || photoFor(service)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(event) => { const img = event.currentTarget; if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = photoFor(service); } }}
                    />
                  </span>
                  <span className="sc-service-body">
                    <span className="sc-meta">{(service.category || "Service").toUpperCase()} · {service.duration} MIN</span>
                    <span className="sc-service-name">{service.serviceName}</span>
                    <span className="sc-service-foot">
                      <span className="sc-price">{Number(service.price).toLocaleString("vi-VN")} <small>VND</small></span>
                      <span className="sc-link">View <i className="bi bi-arrow-right" aria-hidden="true" /></span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="sc-cta">
          <div className="sc-container sc-cta-inner">
            <div>
              <h2>Not sure where to start?</h2>
              <p>Call us and our team will suggest a treatment that suits you.</p>
            </div>
            <a className="sc-btn sc-btn-light" href="tel:+84914269346">Call (+84) 914 269 346</a>
          </div>
        </section>
      </div>
    );
  }

  const handleDelete = (service) => setServiceToDelete(service);

  const confirmStatusChange = async () => {
    if (!statusTarget || statusBusy) return;
    const next = statusTarget.status === "Active" ? "Inactive" : "Active";
    setStatusBusy(true);
    try {
      await axios.put(`/api/service?id=${statusTarget.serviceId}`, { ...statusTarget, status: next });
      setActionNotice(
        `Service "${statusTarget.serviceName}" ${next === "Active" ? "has been reactivated" : "has been deactivated"}.`,
      );
      setRefresh((prev) => prev + 1);
      setStatusTarget(null);
    } catch (error) {
      const message = error.response?.data?.message;
      alert(typeof message === "string" ? message : "Could not change the service status.");
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Service list</h2>
      {actionNotice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {actionNotice}
          <button
            type="button"
            className="btn-close"
            aria-label="Close notification"
            onClick={() => setActionNotice("")}
          />
        </div>
      )}
      {loadError && <div className="alert alert-danger" role="alert">Could not load the service list. <button className="btn btn-sm btn-outline-danger" onClick={() => setRefresh(n => n + 1)}>Try again</button></div>}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div className="manager-list-toolbar">{toolbar}</div>

        {isManager && (
          <Link to="/services/new" className="btn btn-primary ms-auto">
            Add new service
          </Link>
        )}
      </div>

      <p className="d-md-none small text-muted">Scroll the table horizontally to see all information and actions.</p>
      <div className="table-responsive" tabIndex={0} aria-label="Service list, scrolls horizontally">
        <table className="table table-hover align-middle mb-0 manager-list-table service-list-table">
          <thead className="table-dark">
            <tr>
              <th>Service name</th>
              <th>Price (VND)</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffServices.length > 0 ? (
              staffServices.map((s) => (
                <tr key={s.serviceId}>
                  <td>{s.serviceName}</td>
                  <td>{Number(s.price).toLocaleString("vi-VN")}</td>
                  <td>{s.duration}</td>
                  <td>
                    {isManager ? (
                      <StatusToggleButton active={s.status === "Active"} onClick={() => setStatusTarget(s)} />
                    ) : (
                      <span className={`badge ${s.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                        {s.status === "Active"
                          ? "Active"
                          : s.status === "Inactive"
                            ? "Inactive"
                            : s.status}
                      </span>
                    )}
                  </td>
                  <td><div className="manager-list-actions service-list-actions">
                    <Link
                      to={
                        isGuest
                          ? `/guest/services/${s.serviceId}`
                          : `/services/detail/${s.serviceId}`
                      }
                      className="manager-list-action manager-list-action--view"
                    >
                      <i className="bi bi-eye-fill" aria-hidden="true" /> View
                    </Link>

                    {isManager && (
                      <>
                        <Link
                          to={`/services/edit/${s.serviceId}`}
                          className="manager-list-action manager-list-action--edit"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(s)}
                          className="manager-list-action manager-list-action--delete"
                          aria-label={`Delete service ${s.serviceName}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                          Delete
                        </button>
                      </>
                    )}
                  </div></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted py-4">
                  {loading ? "Loading service list…" : loadError
                    ? "Could not load the service list. Check the backend and try reloading."
                    : services.length === 0
                      ? "No services yet."
                      : "No matching services."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DeleteServiceModal
        service={serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onDeleted={(message) => {
          setServiceToDelete(null);
          setActionNotice(message);
          setRefresh((prev) => prev + 1);
        }}
      />
      <StatusChangeModal
        show={Boolean(statusTarget)}
        entity="services"
        name={statusTarget?.serviceName}
        nextActive={statusTarget?.status !== "Active"}
        busy={statusBusy}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default ServiceList;
