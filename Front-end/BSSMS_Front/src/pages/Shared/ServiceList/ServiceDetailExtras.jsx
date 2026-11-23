import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./ServiceDetailExtras.css";

// Các bước chính của buổi làm, theo loại phòng của dịch vụ
const STEPS = {
  Facial: [
    ["Skin consultation", "We check your skin type, allergies and the result you want."],
    ["Cleansing", "Makeup removal, double cleansing and gentle exfoliation."],
    ["Main treatment", "The core facial steps, adjusted to your skin."],
    ["Mask & finishing", "Soothing mask, serum, moisturiser and sunscreen."],
  ],
  Massage: [
    ["Consultation", "Tell us about tension areas and your preferred pressure."],
    ["Warm-up", "Relaxing music, warm towels and essential oils."],
    ["Massage", "The full massage technique of this service."],
    ["Rest & tea", "A few minutes to rest with a cup of herbal tea."],
  ],
  HairWash: [
    ["Consultation", "We check your scalp and hair condition."],
    ["Herbal wash", "Washing with natural herbal products."],
    ["Scalp & neck massage", "Gentle acupressure on the scalp, neck and shoulders."],
    ["Drying & styling", "Your hair is dried and lightly styled."],
  ],
  Body: [
    ["Consultation", "We check your skin and the area to be treated."],
    ["Preparation", "Cleansing and gentle exfoliation of the area."],
    ["Main treatment", "The body treatment with professional products."],
    ["Finishing", "Moisturising and simple care tips for home."],
  ],
};

const money = (value) => `${Math.round(Number(value || 0)).toLocaleString("vi-VN")} VND`;

const Stars = ({ value }) => (
  <span className="sc-stars" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <i key={n} className={`bi ${Number(value) >= n ? "bi-star-fill" : Number(value) >= n - 0.5 ? "bi-star-half" : "bi-star"}`} aria-hidden="true" />
    ))}
  </span>
);

const ServiceDetailExtras = ({ serviceId, service, isCustomer = false }) => {
  const [packages, setPackages] = useState([]);
  const [rating, setRating] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const id = Number(serviceId);
    // Gói liệu trình đang bán có chứa dịch vụ này
    axios.get("/api/treatment-packages")
      .then((r) => {
        const rows = Array.isArray(r.data) ? r.data : [];
        setPackages(rows.filter((p) => p.status !== "Inactive" && (p.services || []).some((s) => Number(s.serviceId) === id)));
      })
      .catch(() => setPackages([]));
    // Điểm trung bình và 3 đánh giá mới nhất của dịch vụ
    axios.get("/api/feedback/service-ratings")
      .then((r) => setRating((Array.isArray(r.data) ? r.data : []).find((x) => Number(x.serviceId) === id) || null))
      .catch(() => setRating(null));
    axios.get(`/api/feedback?serviceId=${id}`)
      .then((r) => setReviews((Array.isArray(r.data) ? r.data : []).slice(0, 3)))
      .catch(() => setReviews([]));
  }, [serviceId]);

  const steps = STEPS[service?.requiredRoomType] || STEPS.Facial;
  const packagesPath = isCustomer ? "/treatment-packages" : "/guest/treatment-packages";

  const minutes = Number(service?.duration || 0);

  return (
    <>
      <section className="sc-section sc-section-white">
        <div className="sc-container sc-included">
          <div>
            <span className="sc-eyebrow">WHAT’S INCLUDED</span>
            <h2>{minutes ? `Your ${minutes} minutes, step by step` : "Step by step"}</h2>
          </div>
          <ol className="sc-included-steps">
            {steps.map(([title, text], i) => (
              <li key={title}>
                <span className="sc-step-number">{i + 1}</span>
                <span><strong>{title}</strong><span>{text}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {packages.length > 0 && (
        <section className="sc-container sc-section-tight">
          {packages.map((p) => {
            const sessions = Number(p.numberOfSessions || 1);
            const perSession = Number(p.price || 0) / sessions;
            const single = Number(service?.price || 0);
            const saving = single > 0 && p.services?.length === 1 ? Math.round((1 - perSession / single) * 100) : 0;
            return (
              <Link key={p.treatmentPackageId} className="sc-offer" to={packagesPath}>
                <span>
                  <strong>Coming back often? Save with {p.packageName}</strong>
                  <span>
                    {sessions} sessions · {money(p.price)} · about {money(perSession)} per session
                    {saving > 0 ? ` (save ${saving}%)` : ""}
                  </span>
                </span>
                <span className="sc-link">See package <i className="bi bi-arrow-right" aria-hidden="true" /></span>
              </Link>
            );
          })}
        </section>
      )}

      <section className="sc-section">
        <div className="sc-container">
          <div className="sc-section-head">
            <div>
              <span className="sc-eyebrow">REVIEWS</span>
              <h2>{rating ? `Guests rate it ${Number(rating.avgRating).toFixed(1)} / 5` : "No reviews yet"}</h2>
            </div>
            {rating && <span className="sc-muted">{rating.reviewCount} review{Number(rating.reviewCount) > 1 ? "s" : ""}</span>}
          </div>
          {reviews.length > 0 ? (
            <div className="sc-card-grid">
              {reviews.map((r) => (
                <figure className="sc-review-card" key={r.feedbackId}>
                  <Stars value={r.rating} />
                  <blockquote>{r.comment || "No comment."}</blockquote>
                  <figcaption>{r.customerName} · {String(r.createdAt || "").slice(0, 10).split("-").reverse().join("/")}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="sc-muted">Be the first to review this service after your visit.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default ServiceDetailExtras;
