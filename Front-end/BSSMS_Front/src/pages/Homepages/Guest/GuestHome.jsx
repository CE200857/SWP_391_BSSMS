import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import heroPhoto from "../../../assets/figma/login-spa-original.jpeg";
import photo01 from "../../../assets/figma/service-card-exact-01.png";
import photo02 from "../../../assets/figma/service-card-exact-02.png";
import photo03 from "../../../assets/figma/service-card-exact-03.png";
import photo04 from "../../../assets/figma/service-card-exact-04.png";
import photo05 from "../../../assets/figma/service-card-exact-05.png";
import photo06 from "../../../assets/figma/service-card-exact-06.png";
import photo07 from "../../../assets/figma/service-card-exact-07.png";
import photo08 from "../../../assets/figma/service-card-exact-08.png";
import photo09 from "../../../assets/figma/service-card-exact-09.png";
import photo10 from "../../../assets/figma/service-card-exact-10.png";
import photo11 from "../../../assets/figma/service-card-exact-11.png";

// Same illustration per service as the Services page, used when a service has no uploaded image
const PHOTOS = [photo01, photo02, photo03, photo04, photo05, photo06, photo07, photo08, photo09, photo10, photo11];
const photoFor = (service) => PHOTOS[Math.max(0, Number(service.serviceId) - 1) % PHOTOS.length];

const steps = [
  {
    number: "01",
    title: "Choose a service & time",
    text: "Only available time slots are shown. Book at least 2 hours ahead, up to 30 days.",
  },
  {
    number: "02",
    title: "We confirm",
    text: "Our receptionist confirms your appointment. Pay at the counter or online with VNPay.",
  },
  {
    number: "03",
    title: "Relax & enjoy",
    text: "Arrive a few minutes early. Members get a discount on every visit.",
  },
];

const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const GuestHome = ({ user }) => {
  const isCustomer = user?.role === "Customer";
  const servicesPath = isCustomer ? "/services" : "/guest/services";
  const reviewsPath = isCustomer ? "/feedback" : "/guest/feedback";
  const detailPath = (id) => (isCustomer ? `/services/detail/${id}` : `/guest/services/${id}`);

  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    axios.get("/api/service", { signal: controller.signal })
      .then((res) => Array.isArray(res.data) && setServices(res.data.filter((s) => s.status === "Active")))
      .catch(() => {});
    axios.get("/api/feedback", { signal: controller.signal })
      .then((res) => Array.isArray(res.data) && setReviews(res.data))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const featured = services.slice(0, 3);
  const rated = reviews.filter((r) => Number(r.rating) > 0);
  const average = rated.length ? (rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length).toFixed(1) : null;
  const latestReview = [...rated]
    .filter((r) => r.comment && String(r.comment).trim().length > 20 && Number(r.rating) >= 4)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];

  return (
    <div className="sc-page">
      {/* Hero */}
      <section className="sc-hero">
        <div className="sc-container sc-hero-grid">
          <div className="sc-hero-copy">
            <span className="sc-eyebrow">KOREAN BEAUTY &amp; SPA · CAN THO</span>
            <h1>
              Slow down.
              <br />
              <em>Feel like yourself again.</em>
            </h1>
            <p className="sc-lead">
              Facials, massages and herbal head spa by trained therapists. Book online in a minute
              and we will confirm your appointment.
            </p>
            <div className="sc-actions">
              <Link className="sc-btn sc-btn-primary" to="/slots">Book an appointment</Link>
              <Link className="sc-btn sc-btn-ghost" to={servicesPath}>See services</Link>
            </div>
            <dl className="sc-stats">
              {average && (
                <div>
                  <dt>{average}</dt>
                  <dd>Average rating</dd>
                </div>
              )}
              <div>
                <dt>{services.length || "—"}</dt>
                <dd>Signature services</dd>
              </div>
              <div>
                <dt>08:30–18:30</dt>
                <dd>Open every day</dd>
              </div>
            </dl>
          </div>
          <div className="sc-hero-visual">
            <img src={heroPhoto} alt="A therapist giving a relaxing facial at Seoul Center" />
            <div className="sc-float-card">
              <span className="sc-float-icon"><i className="bi bi-calendar2-check" aria-hidden="true" /></span>
              <span>
                <strong>Book online, anytime</strong>
                <small>Up to 30 days ahead</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="sc-section sc-section-white">
        <div className="sc-container">
          <div className="sc-section-head">
            <div>
              <span className="sc-eyebrow">OUR SERVICES</span>
              <h2>Treatments loved by our guests</h2>
            </div>
            <Link className="sc-link" to={servicesPath}>
              View all {services.length ? `${services.length} ` : ""}services <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="sc-card-grid">
            {(featured.length ? featured : [null, null, null]).map((s, i) => (
              s ? (
                <Link className="sc-service-card" to={detailPath(s.serviceId)} key={s.serviceId}>
                  <span className="sc-service-image">
                    <img
                      src={s.imageUrl || photoFor(s)}
                      alt=""
                      loading="lazy"
                      onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = photoFor(s); } }}
                    />
                  </span>
                  <span className="sc-service-body">
                    <span className="sc-meta">{(s.category || "Service").toUpperCase()} · {s.duration} MIN</span>
                    <span className="sc-service-name">{s.serviceName}</span>
                    <span className="sc-from">From <span className="sc-price">{money(s.price)} <small>VND</small></span></span>
                  </span>
                </Link>
              ) : (
                <div className="sc-service-card is-loading" key={i} aria-hidden="true">
                  <span className="sc-service-image" />
                  <span className="sc-service-body"><span className="sc-skeleton" /><span className="sc-skeleton short" /></span>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="sc-section">
        <div className="sc-container">
          <div className="sc-section-head sc-center">
            <div>
              <span className="sc-eyebrow">HOW IT WORKS</span>
              <h2>Three easy steps</h2>
            </div>
          </div>
          <ol className="sc-steps">
            {steps.map((step) => (
              <li key={step.number}>
                <span className="sc-step-number">{step.number}</span>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Review */}
      {latestReview && (
        <section className="sc-section sc-section-pink" id="reviews">
          <div className="sc-container sc-review-grid">
            <div>
              <span className="sc-eyebrow">REVIEWS</span>
              <h2>What our guests say</h2>
              <Link className="sc-link" to={reviewsPath}>
                Read all reviews <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            <figure className="sc-quote">
              <span className="sc-stars" role="img" aria-label={`${latestReview.rating} out of 5 stars`}>
                {"★".repeat(Number(latestReview.rating))}{"☆".repeat(5 - Number(latestReview.rating))}
              </span>
              <blockquote>“{String(latestReview.comment).trim()}”</blockquote>
              <figcaption>
                {latestReview.customerName || "Seoul Center guest"} · {latestReview.serviceName}
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="sc-section sc-cta-wrap">
        <div className="sc-container">
          <div className="sc-cta-box">
            <div>
              <h2>Your first visit, made simple.</h2>
              <p>Free reschedule or cancel up to 2 hours before your appointment.</p>
            </div>
            <Link className="sc-btn sc-btn-light" to="/slots">Book an appointment</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuestHome;
