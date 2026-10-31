import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";

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
  const [attempt, setAttempt] = useState(0);
  const isCustomer = user?.role === "Customer";
  const accountId = user?.accountId || user?.account_id;
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(""); setProfileError(""); setProfile(null);
      const requests = [getJson("/api/membership-tiers", controller.signal)];
      if (isCustomer) requests.push(getJson("/api/profile" + (accountId ? `?accountId=${encodeURIComponent(accountId)}&role=Customer` : ""), controller.signal));
      const results = await Promise.allSettled(requests);
      if (controller.signal.aborted) return;
      if (results[0].status === "fulfilled" && Array.isArray(results[0].value)) setTiers(results[0].value);
      else { setTiers([]); setError(results[0].reason?.message || "Danh sách hạng thành viên không hợp lệ."); }
      if (isCustomer) {
        const result = results[1];
        if (result.status === "fulfilled" && result.value && !Array.isArray(result.value) && typeof result.value === "object") setProfile(result.value);
        else setProfileError(result.reason?.message || "Không tải được hạng thành viên của bạn.");
      }
      setLoading(false);
    }
    load();
    return () => controller.abort();
  }, [accountId, isCustomer, attempt]);
  const currentId = profile?.membershipTierId ?? profile?.membership?.membershipTierId;
  const current = profile?.membership || tiers.find(tier => currentId != null && String(tier.membershipTierId) === String(currentId));
  return <Container className="py-4 membership-benefits-page">
    <h1 className="fw-bold mb-2">Quyền lợi thành viên</h1>
    <p className="text-muted mb-4">Hạng thành viên và quyền lợi áp dụng tại salon.</p>
    {loading ? <div role="status" className="py-4"><Spinner size="sm" className="me-2" />Đang tải thông tin thành viên…</div> : <>
      {isCustomer && <section aria-label="Hạng thành viên của bạn" className="mb-4">
        {profileError ? <Alert variant="warning">{profileError} <Button variant="outline-secondary" onClick={retry}>Thử lại</Button></Alert> :
          <Card><Card.Body className="p-4">
            <h2 className="h5">Hạng hiện tại của bạn</h2>
            <p className="text-muted">{profile?.fullName || user?.fullName}</p>
            <div className="d-flex flex-wrap align-items-center gap-3">
              <strong className="fs-3">{current?.tierName || (currentId != null ? "Chưa tải được tên hạng" : "Chưa được gán hạng thành viên")}</strong>
              {current && <Badge bg="light" text="dark">Giảm giá {percent(current.discountPercent)}</Badge>}
            </div>
            {current?.description && <p className="mt-3 mb-0">{current.description}</p>}
          </Card.Body></Card>}
      </section>}
      <h2 className="h4 mb-3">Các hạng thành viên</h2>
      {error && <Alert variant="danger">{error} <Button variant="outline-danger" onClick={retry}>Thử lại</Button></Alert>}
      {!error && !tiers.length && <Alert variant="info">Chưa có hạng thành viên nào trong hệ thống.</Alert>}
      <Row className="g-4">{tiers.map(tier => {
        const selected = isCustomer && currentId != null && String(tier.membershipTierId) === String(currentId);
        return <Col key={tier.membershipTierId} xs={12} md={6} xl={tiers.length > 2 ? 4 : 6}>
          <Card className="h-100 membership-tier-card"><Card.Body className="p-4">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
              <h3 className="h4 mb-0">{tier.tierName}</h3>
              {selected && <Badge bg="success">Hạng của bạn</Badge>}
            </div>
            <p className="fs-3 fw-bold">{percent(tier.discountPercent)} <span className="fs-6 fw-normal text-muted">giảm giá</span></p>
            <h4 className="h6">Điều kiện và quyền lợi</h4>
            <p className="mb-0">{tier.description || "Chưa có mô tả quyền lợi."}</p>
          </Card.Body></Card>
        </Col>;
      })}</Row>
    </>}
  </Container>;
}
