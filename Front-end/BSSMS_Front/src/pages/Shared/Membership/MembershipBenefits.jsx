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
      else setError(all.reason?.message || "Không tải được danh sách hạng thành viên.");
      if (me.status === "fulfilled") setMine(me.value);
      else setMineError(me.reason?.message || "Không tải được hạng thành viên của bạn.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, [isCustomer, attempt]);

  const next = mine?.nextTier;
  const progress = next ? Math.min(100, (Number(mine.lifetimeSpending) / Number(next.minSpending)) * 100) : 100;

  return <div className={isCustomer ? "public-service-page customer-membership-page" : "membership-benefits-page"}>
    {isCustomer && <section className="public-service-hero customer-membership-hero">
      <div className="public-service-hero-copy">
        <span className="seoul-eyebrow">ĐẶC QUYỀN · THÀNH VIÊN</span>
        <h1>Quyền lợi thành viên</h1>
        <p>Hạng thành viên được xét tự động theo tổng chi tiêu trọn đời tại Seoul Center.</p>
        <span className="public-service-hero-note"><i className="bi bi-stars" aria-hidden="true" /> Chăm sóc xứng tầm với bạn</span>
      </div>
      <img src={servicePhoto05} alt="Chăm sóc thư giãn tại Seoul Center" />
    </section>}
    <section className={isCustomer ? "public-service-content customer-membership-content" : "container py-4"}>
      {!isCustomer && <>
        <h1 className="fw-bold mb-2">Quyền lợi thành viên</h1>
        <p className="text-muted mb-4">Hạng thành viên và mức giảm áp dụng khi thanh toán dịch vụ và gói liệu trình.</p>
      </>}
      {loading ? <div role="status" className="py-4"><Spinner size="sm" className="me-2" />Đang tải thông tin thành viên…</div> : <>
        {isCustomer && <section aria-label="Hạng thành viên của bạn" className="mb-4">
          {mineError ? <Alert variant="warning">{mineError} <Button variant="outline-secondary" onClick={retry}>Thử lại</Button></Alert> : mine &&
            <Card className="customer-membership-current-card">
              <Card.Body>
                <div className="customer-membership-current-icon" aria-hidden="true"><i className="bi bi-gem" /></div>
                <div className="customer-membership-current-copy">
                  <span className="customer-membership-kicker">HẠNG THÀNH VIÊN HIỆN TẠI</span>
                  <h2>{mine.tierName}</h2>
                  <p className="customer-membership-member-name">Xin chào, {mine.customerName}</p>
                  <p className="customer-membership-current-description">Tổng chi tiêu trọn đời: <strong>{money(mine.lifetimeSpending)}</strong></p>
                  {next ? <>
                    <ProgressBar now={progress} variant="danger" className="my-2" style={{ height: 8 }} />
                    <small>Chi tiêu thêm <strong>{money(next.remaining)}</strong> để lên hạng <strong>{next.tierName}</strong> (giảm {percent(next.discountPercent)}).</small>
                  </> : <small>Bạn đang ở hạng cao nhất.</small>}
                </div>
                <div className="customer-membership-discount">
                  <span>ƯU ĐÃI THÀNH VIÊN</span>
                  <strong>{percent(mine.discountPercent)}</strong>
                  <small>giảm dịch vụ & gói</small>
                </div>
              </Card.Body>
            </Card>}
          <Alert variant="light" className="mt-3 mb-0 small">
            <i className="bi bi-info-circle me-1" /> Ưu đãi hạng được trừ trước, sau đó mới áp dụng voucher; tổng giảm tối đa 50% giá trị hóa đơn.
            Hoàn tiền sẽ trừ lại chi tiêu và hạng có thể được xét lại.
          </Alert>
        </section>}
        <div className="customer-membership-section-heading customer-membership-tiers-heading">
          <div className="customer-membership-heading-icon" aria-hidden="true"><i className="bi bi-award" /></div>
          <div><h2>Các hạng thành viên</h2><p>Điều kiện chi tiêu và mức ưu đãi của từng hạng.</p></div>
          {tiers.length > 0 && <span className="public-service-count">{tiers.length} hạng</span>}
        </div>
        {error && <Alert variant="danger">{error} <Button variant="outline-danger" onClick={retry}>Thử lại</Button></Alert>}
        <Row className="g-4">{tiers.map((tier) => {
          const selected = isCustomer && mine && tier.membershipTierId === mine.membershipTierId;
          return <Col key={tier.membershipTierId} xs={12} md={6} xl={4}>
            <Card className={`h-100 membership-tier-card${selected ? " is-current-tier" : ""}`}><Card.Body className="p-4">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div className="customer-membership-tier-title">
                  <span className="customer-membership-tier-crown" aria-hidden="true"><i className="bi bi-award" /></span>
                  <h3 className="h4 mb-0">{tier.tierName}</h3>
                </div>
                {selected && <Badge className="customer-membership-current-badge">Hạng hiện tại</Badge>}
              </div>
              <div className="customer-membership-tier-discount"><strong>{percent(tier.discountPercent)}</strong><span>giảm giá dịch vụ & gói</span></div>
              <div className="customer-membership-tier-benefit">
                <span className="customer-membership-tier-benefit-label"><i className="bi bi-check2-circle" aria-hidden="true" />Chi tiêu từ {money(tier.minSpending)}</span>
                <p>{tier.description || "Chưa có mô tả quyền lợi."}</p>
              </div>
              {!isCustomer && <small className="text-muted">{tier.customerCount} khách hàng</small>}
            </Card.Body></Card>
          </Col>;
        })}</Row>
      </>}
    </section>
  </div>;
}
