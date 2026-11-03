import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { money } from "../../../services/api";
import servicePhoto05 from "../../../assets/figma/service-card-exact-05.png";
import "./MembershipBenefits.css";

const voucherValue = voucher => voucher.discountType === "Percentage" ? `${Number(voucher.discountValue).toLocaleString("vi-VN")}%` : money(voucher.discountValue);
const voucherDate = value => value ? String(value).slice(0, 10) : "Không giới hạn";
const percent = value => value == null || !Number.isFinite(Number(value)) ? "—" : `${Number(value).toLocaleString("vi-VN")}%`;
async function getJson(url, signal) {
  const response = await fetch(url, { credentials: "include", signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Không tải được dữ liệu (HTTP ${response.status}).`);
  return data;
}
export default function MembershipBenefits({ user }) {
  const [tiers, setTiers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [benefits, setBenefits] = useState(null);
  const [benefitsError, setBenefitsError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const isCustomer = user?.role === "Customer";
  const accountId = user?.accountId || user?.account_id;
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(""); setProfileError(""); setProfile(null); setBenefits(null); setBenefitsError("");
      const requests = [getJson("/api/membership-tiers", controller.signal)];
      if (isCustomer) requests.push(getJson("/api/profile" + (accountId ? `?accountId=${encodeURIComponent(accountId)}&role=Customer` : ""), controller.signal));
      if (isCustomer) requests.push(getJson("/api/my-vouchers", controller.signal));
      const results = await Promise.allSettled(requests);
      if (controller.signal.aborted) return;
      if (results[0].status === "fulfilled" && Array.isArray(results[0].value)) setTiers(results[0].value);
      else { setTiers([]); setError(results[0].reason?.message || "Danh sách hạng thành viên không hợp lệ."); }
      if (isCustomer) {
        const result = results[1];
        if (result.status === "fulfilled" && result.value && !Array.isArray(result.value) && typeof result.value === "object") setProfile(result.value);
        else setProfileError(result.reason?.message || "Không tải được hạng thành viên của bạn.");
        const voucherResult = results[2];
        if (voucherResult?.status === "fulfilled" && voucherResult.value && Array.isArray(voucherResult.value.vouchers)) setBenefits(voucherResult.value);
        else setBenefitsError(voucherResult?.reason?.message || "Không tải được voucher của bạn.");
      }
      setLoading(false);
    }
    load();
    return () => controller.abort();
  }, [accountId, isCustomer, attempt]);
  const currentId = profile?.membershipTierId ?? profile?.membership?.membershipTierId;
  const current = profile?.membership || tiers.find(tier => currentId != null && String(tier.membershipTierId) === String(currentId));
  return <div className={isCustomer ? "public-service-page customer-membership-page" : "membership-benefits-page"}>
    {isCustomer && <section className="public-service-hero customer-membership-hero">
      <div className="public-service-hero-copy">
        <span className="seoul-eyebrow">ĐẶC QUYỀN · THÀNH VIÊN</span>
        <h1>Quyền lợi thành viên</h1>
        <p>Khám phá hạng thành viên, ưu đãi dành riêng và những quyền lợi tại Seoul Center.</p>
        <span className="public-service-hero-note">
          <i className="bi bi-stars" aria-hidden="true" /> Chăm sóc xứng tầm với bạn
        </span>
      </div>
      <img src={servicePhoto05} alt="Chăm sóc thư giãn tại Seoul Center" />
    </section>}
    <section className={isCustomer ? "public-service-content customer-membership-content" : "container py-4"}>
    {!isCustomer && <>
      <h1 className="fw-bold mb-2">Quyền lợi thành viên</h1>
      <p className="text-muted mb-4">Hạng thành viên và quyền lợi áp dụng tại salon.</p>
    </>}
    {loading ? <div role="status" className="py-4"><Spinner size="sm" className="me-2" />Đang tải thông tin thành viên…</div> : <>
      {isCustomer && <section aria-label="Hạng thành viên của bạn" className="mb-4">
        {profileError ? <Alert variant="warning">{profileError} <Button variant="outline-secondary" onClick={retry}>Thử lại</Button></Alert> :
            <Card className="customer-membership-current-card">
              <Card.Body>
                <div className="customer-membership-current-icon" aria-hidden="true">
                  <i className="bi bi-gem" />
                </div>
                <div className="customer-membership-current-copy">
                  <span className="customer-membership-kicker">HẠNG THÀNH VIÊN HIỆN TẠI</span>
                  <h2>{current?.tierName || (currentId != null ? "Chưa tải được tên hạng" : "Chưa được gán hạng thành viên")}</h2>
                  <p className="customer-membership-member-name">
                    Xin chào, {profile?.fullName || user?.fullName || "Quý khách"}
                  </p>
                  {current?.description && <p className="customer-membership-current-description">{current.description}</p>}
                </div>
                <div className="customer-membership-discount">
                  <span>ƯU ĐÃI THÀNH VIÊN</span>
                  <strong>{current ? percent(current.discountPercent) : "—"}</strong>
                  <small>giảm giá dịch vụ</small>
                </div>
              </Card.Body>
            </Card>}
        </section>}
        {isCustomer && <section aria-label="Voucher và ưu đãi của bạn" className="mb-4">
          <div className="customer-membership-section-heading">
            <div className="customer-membership-heading-icon" aria-hidden="true"><i className="bi bi-ticket-perforated" /></div>
            <div>
              <h2>Voucher dành riêng cho bạn</h2>
              <p>Các ưu đãi đang có trong tài khoản thành viên.</p>
            </div>
            {benefits && <span className="public-service-count">{benefits.vouchers.length} ưu đãi</span>}
          </div>
          {benefitsError && <Alert variant="warning">{benefitsError} <Button variant="outline-secondary" onClick={retry}>Thử lại</Button></Alert>}
          {benefits?.birthdayEligibleThisMonth && <Alert className="customer-membership-birthday-alert" variant={benefits.birthdayBenefitUsedThisYear ? "secondary" : "info"}>
          {benefits.birthdayBenefitUsedThisYear
            ? "Bạn đã dùng ưu đãi giảm thêm 10% nhân dịp sinh nhật trong năm nay."
            : "Tháng này là tháng sinh nhật của bạn: bạn được giảm thêm 10% cho một hóa đơn dịch vụ hoặc sản phẩm (dùng một lần). Hãy báo lễ tân khi thanh toán."}
        </Alert>}
        {benefits && !benefits.vouchers.length && <div className="customer-membership-empty">
          <i className="bi bi-ticket-perforated" aria-hidden="true" />
          <strong>Chưa có voucher dành cho bạn</strong>
          <span>Các ưu đãi mới sẽ xuất hiện tại đây.</span>
        </div>}
        <Row className="g-3 customer-membership-vouchers">{(benefits?.vouchers || []).map(voucher => <Col key={voucher.voucherId} xs={12} md={6} xl={4}>
          <Card className={`customer-membership-voucher h-100 ${voucher.status === "Active" ? "is-active" : "is-inactive"}`}>
            <Card.Body>
              <div className="customer-membership-voucher-top">
                <span className="customer-membership-voucher-icon" aria-hidden="true"><i className="bi bi-stars" /></span>
                <Badge bg={voucher.status === "Active" ? "success" : "secondary"}>{voucher.status === "Active" ? "Còn hiệu lực" : voucher.status === "Used" ? "Đã dùng" : "Hết hạn"}</Badge>
              </div>
              <strong className="customer-membership-voucher-name">{voucher.voucherName || voucher.voucherCode}</strong>
              <div className="customer-membership-voucher-value">Giảm {voucherValue(voucher)}</div>
              <div className="customer-membership-voucher-code">
                <span>MÃ ƯU ĐÃI</span>
                <strong>{voucher.voucherCode}</strong>
              </div>
              <div className="customer-membership-voucher-details">
                {voucher.applicableCategory && <span><i className="bi bi-check2-circle" aria-hidden="true" />Áp dụng: {voucher.applicableCategory}</span>}
                {Number(voucher.minOrderAmount) > 0 && <span><i className="bi bi-receipt" aria-hidden="true" />Đơn tối thiểu: {money(voucher.minOrderAmount)}</span>}
                <span><i className="bi bi-calendar3" aria-hidden="true" />Đến {voucherDate(voucher.endDate)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>)}</Row>
      </section>}
      <div className="customer-membership-section-heading customer-membership-tiers-heading">
        <div className="customer-membership-heading-icon" aria-hidden="true"><i className="bi bi-award" /></div>
        <div>
          <h2>Các hạng thành viên</h2>
          <p>Tìm hiểu các ưu đãi và điều kiện của từng hạng.</p>
        </div>
        {tiers.length > 0 && <span className="public-service-count">{tiers.length} hạng</span>}
      </div>
      {error && <Alert variant="danger">{error} <Button variant="outline-danger" onClick={retry}>Thử lại</Button></Alert>}
      {!error && !tiers.length && <Alert variant="info">Chưa có hạng thành viên nào trong hệ thống.</Alert>}
      <Row className="g-4">{tiers.map(tier => {
        const selected = isCustomer && currentId != null && String(tier.membershipTierId) === String(currentId);
        return <Col key={tier.membershipTierId} xs={12} md={6} xl={tiers.length > 2 ? 4 : 6}>
          <Card className={`h-100 membership-tier-card${selected ? " is-current-tier" : ""}`}><Card.Body className="p-4">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
              <div className="customer-membership-tier-title">
                <span className="customer-membership-tier-crown" aria-hidden="true"><i className="bi bi-award" /></span>
                <h3 className="h4 mb-0">{tier.tierName}</h3>
              </div>
              {selected && <Badge className="customer-membership-current-badge">Hạng hiện tại</Badge>}
            </div>
            <div className="customer-membership-tier-discount">
              <strong>{percent(tier.discountPercent)}</strong>
              <span>giảm giá dịch vụ</span>
            </div>
            <div className="customer-membership-tier-benefit">
              <span className="customer-membership-tier-benefit-label"><i className="bi bi-check2-circle" aria-hidden="true" />Điều kiện và quyền lợi</span>
              <p>{tier.description || "Chưa có mô tả quyền lợi."}</p>
            </div>
          </Card.Body></Card>
        </Col>;
      })}</Row>
    </>}
    </section>
  </div>;
}
