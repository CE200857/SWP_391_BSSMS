import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, ProgressBar, Row, Spinner } from "react-bootstrap";
import { api, money } from "../../../services/api";
import servicePhoto05 from "../../../assets/figma/service-card-exact-05.png";
import "./MembershipBenefits.css";

const percent = (value) => (value == null || !Number.isFinite(Number(value)) ? "—" : `${Number(value).toLocaleString("vi-VN")}%`);

export default function MembershipBenefits({ user }) {
  const [tiers, setTiers] = useState([]);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mineError, setMineError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const isCustomer = user?.role === "Customer";
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(""); setMineError("");
      const [all, me] = await Promise.allSettled([
        api("/api/membership-tiers"),
        isCustomer ? api("/api/membership-tiers?mine=1") : Promise.resolve(null),
      ]);
      if (!active) return;
      if (all.status === "fulfilled" && Array.isArray(all.value)) setTiers(all.value);
      else setError(all.reason?.message || "Could not load the membership tier list.");
      if (me.status === "fulfilled") setMine(me.value);
      else setMineError(me.reason?.message || "Could not load your membership tier.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, [isCustomer, attempt]);

  const next = mine?.nextTier;
  const progress = next ? Math.min(100, (Number(mine.lifetimeSpending) / Number(next.minSpending)) * 100) : 100;

  return <div className={isCustomer ? "public-service-page customer-membership-page" : "membership-benefits-page"}>
    {isCustomer && <section className="public-service-hero customer-membership-hero">
      <div className="public-service-hero-copy">
        <span className="seoul-eyebrow">PRIVILEGES · MEMBERS</span>
        <h1>Membership benefits</h1>
        <p>Membership tiers are assigned automatically based on lifetime spending at Seoul Center.</p>
        <span className="public-service-hero-note"><i className="bi bi-stars" aria-hidden="true" /> Care you deserve</span>
      </div>
      <img src={servicePhoto05} alt="Relaxing care at Seoul Center" />
    </section>}
    <section className={isCustomer ? "public-service-content customer-membership-content" : "container py-4"}>
      {!isCustomer && <>
        <h1 className="fw-bold mb-2">Membership benefits</h1>
        <p className="text-muted mb-4">Membership tiers and the discounts applied when paying for services and treatment packages.</p>
      </>}
      {loading ? <div role="status" className="py-4"><Spinner size="sm" className="me-2" />Loading membership information…</div> : <>
        {isCustomer && <section aria-label="Your membership tier" className="mb-4">
          {mineError ? <Alert variant="warning">{mineError} <Button variant="outline-secondary" onClick={retry}>Try again</Button></Alert> : mine &&
            <Card className="customer-membership-current-card">
              <Card.Body>
                <div className="customer-membership-current-icon" aria-hidden="true"><i className="bi bi-gem" /></div>
                <div className="customer-membership-current-copy">
                  <span className="customer-membership-kicker">CURRENT MEMBERSHIP TIER</span>
                  <h2>{mine.tierName}</h2>
                  <p className="customer-membership-member-name">Hello, {mine.customerName}</p>
                  <p className="customer-membership-current-description">Total spending: <strong>{money(mine.lifetimeSpending)}</strong></p>
                  {next ? <>
                    <ProgressBar now={progress} variant="danger" className="my-2" style={{ height: 8 }} />
                    <small>Spend another <strong>{money(next.remaining)}</strong> to reach tier <strong>{next.tierName}</strong> (discount {percent(next.discountPercent)}).</small>
                  </> : <small>You are at the highest tier.</small>}
                </div>
                <div className="customer-membership-discount">
                  <span>MEMBER OFFERS</span>
                  <strong>{percent(mine.discountPercent)}</strong>
                  <small>service discount & packages</small>
                </div>
              </Card.Body>
            </Card>}
          <Alert variant="light" className="mt-3 mb-0 small">
            <i className="bi bi-info-circle me-1" /> The tier discount is deducted first, then the voucher is applied; total discount up to 50% of the invoice amount.
            A refund deducts the spending, and the tier may be recalculated.
          </Alert>
        </section>}
        <div className="customer-membership-section-heading customer-membership-tiers-heading">
          <div className="customer-membership-heading-icon" aria-hidden="true"><i className="bi bi-award" /></div>
          <div><h2>Membership tiers</h2><p>Spending requirements and discounts for each tier.</p></div>
          {tiers.length > 0 && <span className="public-service-count">{tiers.length} tier</span>}
        </div>
        {error && <Alert variant="danger">{error} <Button variant="outline-danger" onClick={retry}>Try again</Button></Alert>}
        <Row className="g-4">{tiers.map((tier) => {
          const selected = isCustomer && mine && tier.membershipTierId === mine.membershipTierId;
          return <Col key={tier.membershipTierId} xs={12} md={6} xl={4}>
            <Card className={`h-100 membership-tier-card${selected ? " is-current-tier" : ""}`}><Card.Body className="p-4">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div className="customer-membership-tier-title">
                  <span className="customer-membership-tier-crown" aria-hidden="true"><i className="bi bi-award" /></span>
                  <h3 className="h4 mb-0">{tier.tierName}</h3>
                </div>
                {selected && <Badge className="customer-membership-current-badge">Current tier</Badge>}
              </div>
              <div className="customer-membership-tier-discount"><strong>{percent(tier.discountPercent)}</strong><span>service discount & packages</span></div>
              <div className="customer-membership-tier-benefit">
                <span className="customer-membership-tier-benefit-label"><i className="bi bi-check2-circle" aria-hidden="true" />Spending from {money(tier.minSpending)}</span>
                <p>{tier.description || "No benefit description yet."}</p>
              </div>
              {!isCustomer && <small className="text-muted">{tier.customerCount} customers</small>}
            </Card.Body></Card>
          </Col>;
        })}</Row>
      </>}
    </section>
  </div>;
}
