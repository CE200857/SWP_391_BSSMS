import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { post } from "../../../services/api";
import servicePhoto01 from "../../../assets/figma/service-card-exact-01.png";
import servicePhoto02 from "../../../assets/figma/service-card-exact-02.png";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import servicePhoto04 from "../../../assets/figma/service-card-exact-04.png";
import "./PublicTreatmentPackages.css";
import FloatingAlert from "../../../components/FloatingAlert";

const photos = [servicePhoto01, servicePhoto02, servicePhoto03, servicePhoto04];
const vnd = (value) => `${Math.round(Number(value || 0)).toLocaleString("vi-VN")} VND`;
// Giá sau giảm theo hạng = giá gốc - làm tròn(giá gốc x %hạng / 100), tối đa giảm 50%
const tierPrice = (price, percent) => {
  const p = Number(price || 0);
  const off = Math.min(Math.round((p * Number(percent || 0)) / 100), Math.round(p * 0.5));
  return p - off;
};
const packageDescription = (description) =>
  description?.replace(/Sử dụng trong 180 ngày kể từ ngày mua\.?/gi, "").trim();
const normalizeQuote = (result, item, membership) => {
  const subtotal = Number(result?.subtotal ?? result?.packagePrice ?? result?.price ?? item?.price ?? 0);
  const tierPercent = Number(result?.tierPercent ?? result?.discountPercent ?? membership?.discountPercent ?? 0);
  const calculatedTierDiscount = Math.min(
    Math.round(subtotal * tierPercent / 100),
    Math.round(subtotal * 0.5),
  );
  const tierDiscount = Number(result?.tierDiscount ?? result?.membershipDiscount ?? calculatedTierDiscount);
  const voucherDiscount = Number(result?.voucherDiscount ?? result?.discountAmount ?? 0);
  const totalAmount = Number(result?.totalAmount ?? result?.amountToPay ?? Math.max(subtotal - tierDiscount - voucherDiscount, 0));

  return {
    ...result,
    subtotal,
    tierName: result?.tierName ?? membership?.tierName ?? "No tier",
    tierPercent,
    tierDiscount,
    voucherDiscount,
    voucherCode: result?.voucherCode ?? result?.appliedVoucherCode ?? null,
    voucherType: result?.voucherType ?? result?.type ?? null,
    voucherValue: Number(result?.voucherValue ?? result?.value ?? 0),
    totalAmount,
  };
};

export default function PublicTreatmentPackages({ user = null }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [buying, setBuying] = useState(null);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [tier, setTier] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const isCustomer = user?.role === "Customer";
  const navigate = useNavigate();

  // Hạng thành viên của khách (để hiện giá sau giảm trên thẻ gói)
  useEffect(() => {
    if (!isCustomer) return;
    axios.get("/api/membership-tiers?mine=1")
      .then((r) => setTier(r.data || null))
      .catch(() => setTier(null));
  }, [isCustomer]);

  // Hóa đơn tạm: hỏi back-end tính tiền (không tạo hóa đơn)
  const loadQuote = async (item, code) => {
    setQuoteBusy(true);
    setBuyError("");
    try {
      const result = await post("/api/package-purchases", { treatmentPackageId: item.treatmentPackageId, voucherCode: code || null, preview: true });
      setQuote(normalizeQuote(result, item, tier));
      setVoucherError("");
      return true;
    } catch (error) {
      if (code) setVoucherError(error.message);
      else setBuyError(error.message);
      return false;
    } finally {
      setQuoteBusy(false);
    }
  };

  const openBuy = (item) => {
    setBuyError("");
    setVoucherError("");
    setVoucherCode("");
    setQuote(null);
    setBuying(item);
    loadQuote(item, "");
  };

  const applyVoucher = () => {
    if (!buying) return;
    loadQuote(buying, voucherCode.trim());
  };

  const removeVoucher = () => {
    setVoucherCode("");
    if (buying) loadQuote(buying, "");
  };

  const confirmPurchase = async () => {
    if (!buying || buyBusy) return;
    setBuyBusy(true);
    setBuyError("");
    let invoiceId = null;
    try {
      const created = await post("/api/package-purchases", { treatmentPackageId: buying.treatmentPackageId, voucherCode: quote?.voucherCode || null });
      invoiceId = created.invoiceId;
      const payment = await post("/api/payments/vnpay/create", { invoiceId });
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      setBuyError(
        invoiceId
          ? `Created invoice #${invoiceId} but could not open the VNPay gateway (${error.message}). You can pay again within "My invoices".`
          : error.message,
      );
      setBuyBusy(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const packageResponse = await axios.get("/api/treatment-packages?activeOnly=true", { signal: controller.signal });
        setPackages(Array.isArray(packageResponse.data) ? packageResponse.data : []);
      } catch (error) {
        if (!axios.isCancel(error)) setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [refresh]);

  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return packages
      .filter((item) => !item.status || item.status === "Active")
      .filter((item) => !term || `${item.packageName} ${(item.services || []).map((service) => service.serviceName).join(" ")}`.toLowerCase().includes(term));
  }, [packages, searchTerm]);

  const tierPercent = isCustomer ? Number(tier?.discountPercent || 0) : 0;

  return (
    <div className="sc-page">
      <section className="public-service-hero">
        <div className="public-service-hero-copy">
          <span className="seoul-eyebrow">TREATMENT PACKAGES</span>
          <h1>Come back more, pay less</h1>
          <p>Buy a set of sessions once and book each visit when it suits you. The validity period starts on the purchase date.</p>
          <span className="public-service-hero-note">
            <i className="bi bi-heart" aria-hidden="true" />{" "}
            {tierPercent > 0
              ? `Your ${tier.tierName} discount (−${tierPercent}%) is already applied below`
              : isCustomer ? "Buy online with VNPay" : user ? "Sold at the counter" : "Log in to buy online and see your member price"}
          </span>
        </div>
        <img src={servicePhoto01} alt="Treatment packages at Seoul Center" />
      </section>

      <section className="sc-container sc-toolbar" aria-label="Search packages">
        <span className="sc-muted">{loading ? "Loading…" : `${visible.length} package${visible.length === 1 ? "" : "s"} available`}</span>
        <label className="sc-search">
          <i className="bi bi-search" aria-hidden="true" />
          <span className="visually-hidden">Search packages</span>
          <input type="search" placeholder="Search packages or services" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </label>
      </section>

      <section className="sc-container sc-section-tight">
        {loading && packages.length === 0 ? (
          <div className="sc-empty" role="status">Loading packages…</div>
        ) : loadError ? (
          <div className="sc-empty" role="alert">
            <i className="bi bi-wifi-off" aria-hidden="true" />
            <strong>Could not load the treatment packages</strong>
            <button type="button" className="sc-btn sc-btn-ghost" onClick={() => setRefresh((value) => value + 1)}>Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="sc-empty">
            <i className="bi bi-search" aria-hidden="true" />
            <strong>No packages found</strong>
            <span>Try another keyword or come back later.</span>
          </div>
        ) : (
          <div className="sc-package-grid">
            {visible.map((item, index) => {
              const serviceNames = (item.services || []).map((service) => service.serviceName).join(", ");
              const description = packageDescription(item.description);
              const memberPrice = tierPercent > 0 ? tierPrice(item.price, tierPercent) : null;
              return (
                <article className="sc-package-card" key={item.treatmentPackageId}>
                  <img
                    src={`/api/service-image/${item.serviceIds?.[0]}`}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = photos[index % photos.length];
                    }}
                  />
                  <div className="sc-package-body">
                    <h2>{item.packageName}</h2>
                    <span className="sc-muted">
                      {item.numberOfSessions} sessions{item.validityDays ? ` · valid for ${item.validityDays} days` : ""}
                    </span>
                    {serviceNames && <span className="sc-package-services">{serviceNames}</span>}
                    {description && <p className="sc-package-desc">{description}</p>}
                    <div className="sc-package-price">
                      {memberPrice !== null ? (
                        <>
                          <span className="sc-price">{memberPrice.toLocaleString("vi-VN")} <small>VND</small></span>
                          <del>{vnd(item.price)}</del>
                        </>
                      ) : (
                        <span className="sc-price">{Number(item.price).toLocaleString("vi-VN")} <small>VND</small></span>
                      )}
                    </div>
                    <span className="sc-muted sc-small">
                      ≈ {Math.round((memberPrice ?? Number(item.price || 0)) / Math.max(1, Number(item.numberOfSessions || 1))).toLocaleString("vi-VN")} VND per session
                    </span>
                    {isCustomer && (
                      <button type="button" className="sc-btn sc-btn-primary" onClick={() => openBuy(item)}>Buy package</button>
                    )}
                    {!user && (
                      <button type="button" className="sc-btn sc-btn-primary" onClick={() => navigate("/login", { state: { from: "/treatment-packages" } })}>
                        Log in to buy
                      </button>
                    )}
                    {user && !isCustomer && <span className="sc-muted sc-small">Sold at the counter by the receptionist.</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        show={!!buying}
        onHide={() => !buyBusy && setBuying(null)}
        centered
        scrollable
        size="lg"
        dialogClassName="package-summary-modal"
      >
        <Modal.Header closeButton={!buyBusy}>
          <div>
            <span className="package-summary-eyebrow">TREATMENT PACKAGE</span>
            <Modal.Title>Preliminary invoice</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body>
          <FloatingAlert message={buyError} onClose={() => setBuyError("")} />
          <div className="package-summary-customer">
            <div className="package-summary-customer-icon"><i className="bi bi-person" aria-hidden="true" /></div>
            <div className="package-summary-customer-info">
              <strong>{user?.fullName || "Customer"}</strong>
              <span>{user?.phoneNumber || user?.phone || "Customer account"} · Tier {quote?.tierName || tier?.tierName || "No tier"}</span>
            </div>
            <div className="package-summary-meta">
              <span>PRE-PAYMENT REVIEW</span>
              <strong>Draft invoice</strong>
              <small>{new Date().toLocaleString("vi-VN")}</small>
            </div>
          </div>

          <section className="package-summary-section">
            <div className="package-summary-section-heading"><i className="bi bi-list-ul" aria-hidden="true" /> Details</div>
            <div className="package-summary-table-wrap">
              <table className="table package-summary-table mb-0">
                <thead>
                  <tr><th>Item</th><th>Time / Sessions</th><th className="text-end">Unit price</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="package-summary-item-name">
                      {buying?.packageName}
                      <small>Applies to: {(buying?.services || []).map((service) => service.serviceName).join(", ") || "Selected treatments"}</small>
                    </td>
                    <td>{buying?.numberOfSessions} sessions · valid for {buying?.validityDays} days</td>
                    <td className="text-end">{vnd(buying?.price)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="package-summary-totals">
              <div><span>Subtotal</span><strong>{vnd(quote?.subtotal ?? buying?.price)}</strong></div>
              {Number(quote?.tierDiscount) > 0 && (
                <div><span>Tier discount ({quote.tierName} · {Number(quote.tierPercent)}%)</span><strong className="text-success">− {vnd(quote.tierDiscount)}</strong></div>
              )}
              <div><span>Voucher {quote?.voucherCode ? `(${quote.voucherCode})` : ""}</span><strong className={quote?.voucherCode ? "text-success" : ""}>− {vnd(quote?.voucherDiscount)}</strong></div>
              <div className="package-summary-grand-total"><span>Amount to pay</span><strong>{vnd(quote?.totalAmount)}</strong></div>
            </div>
          </section>

          <section className="package-summary-voucher-section">
            <div className="package-summary-voucher-heading">
              <div><i className="bi bi-ticket-perforated" aria-hidden="true" /> Voucher code</div>
              {quote?.discountCapped && <span className="package-summary-capped">Discount capped at 50%</span>}
            </div>
            <Form.Group>
              <div className="d-flex gap-2">
                <Form.Control
                  size="sm"
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  isInvalid={!!voucherError}
                  onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => event.key === "Enter" && voucherCode.trim() && applyVoucher()}
                  disabled={buyBusy || quoteBusy}
                />
                {quote?.voucherCode ? (
                  <Button size="sm" variant="outline-secondary" disabled={buyBusy || quoteBusy} onClick={removeVoucher}>Remove</Button>
                ) : (
                  <Button size="sm" variant="outline-primary" disabled={buyBusy || quoteBusy || !voucherCode.trim()} onClick={applyVoucher}>Apply</Button>
                )}
              </div>
              {voucherError && <div className="small text-danger mt-1">{voucherError}</div>}
            </Form.Group>
          </section>

          {(!quote || quoteBusy) && (
            <div className="package-summary-loading">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              <span>{quoteBusy ? "Calculating your invoice…" : "Preparing invoice…"}</span>
            </div>
          )}
          <p className="package-summary-note mb-0">
            <i className="bi bi-info-circle" aria-hidden="true" />
            The package is activated after successful payment. VNPay payment link is valid for 15 minutes.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={buyBusy} onClick={() => setBuying(null)}>
            Back
          </Button>
          <Button disabled={buyBusy || quoteBusy || !quote} onClick={confirmPurchase}>
            {buyBusy ? "Processing…" : `Confirm and pay${quote ? ` ${vnd(quote.totalAmount)}` : ""}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
