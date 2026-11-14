import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { post } from "../../../services/api";
import servicePhoto01 from "../../../assets/figma/service-card-exact-01.png";
import servicePhoto02 from "../../../assets/figma/service-card-exact-02.png";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import servicePhoto04 from "../../../assets/figma/service-card-exact-04.png";

const photos = [servicePhoto01, servicePhoto02, servicePhoto03, servicePhoto04];
const packageDescription = (description) =>
  description?.replace(/Sử dụng trong 180 ngày kể từ ngày mua\.?/gi, "").trim();

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
  const isCustomer = user?.role === "Customer";
  const navigate = useNavigate();

  const confirmPurchase = async () => {
    if (!buying || buyBusy) return;
    setBuyBusy(true);
    setBuyError("");
    let invoiceId = null;
    try {
      const created = await post("/api/package-purchases", { treatmentPackageId: buying.treatmentPackageId, voucherCode: voucherCode.trim() || null });
      invoiceId = created.invoiceId;
      const payment = await post("/api/payments/vnpay/create", { invoiceId });
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      setBuyError(
        invoiceId
          ? `Đã tạo hóa đơn #${invoiceId} nhưng chưa mở được cổng VNPay (${error.message}). Bạn có thể thanh toán lại trong "Hóa đơn của tôi".`
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

  return (
    <main className="public-service-page">
      <section className="public-service-hero">
        <div className="public-service-hero-copy">
          <span className="seoul-eyebrow">LIỆU TRÌNH · BẢNG GIÁ</span>
          <h1>Gói liệu trình chăm sóc.</h1>
          <p>
            Chăm sóc theo lộ trình với số buổi và giá ưu đãi rõ ràng.{" "}
            {isCustomer
              ? "Bạn có thể mua gói ngay trên web (thanh toán VNPay) hoặc tại quầy; sau khi thanh toán, theo dõi số buổi còn lại và hạn dùng ở mục \"Liệu trình của tôi\"."
              : "Gói được bán tại quầy hoặc trên web sau khi bạn đăng nhập tài khoản khách hàng."}
          </p>
          <span className="public-service-hero-note">
            <i className="bi bi-heart" aria-hidden="true" />{" "}
            {isCustomer ? "Mua gói ngay trên web" : user ? "Liên hệ lễ tân để mua gói" : "Chỉ xem · Không cần đăng nhập"}
          </span>
        </div>
        <img src={servicePhoto01} alt="Gói liệu trình tại Seoul Center" />
      </section>

      <section className="public-service-content">
        <div className="public-service-filter-card">
          <div className="public-service-filter-title">
            <strong>
              <i className="bi bi-sliders" aria-hidden="true" /> Tìm gói liệu trình
            </strong>
            <span>Theo tên gói</span>
          </div>
          <label className="public-service-search">
            <span className="visually-hidden">Tìm gói liệu trình</span>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm theo tên gói..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>

        <div className="public-service-list-heading">
          <div>
            <h2>Các gói liệu trình</h2>
            <span className="public-service-count">
              {loading ? "Đang tải…" : `${visible.length} gói`}
            </span>
          </div>
          <span className="public-service-updated">Hiển thị gói đang bán</span>
        </div>

        {loading && packages.length === 0 ? (
          <div className="public-service-state" role="status">Đang tải danh sách gói liệu trình…</div>
        ) : loadError ? (
          <div className="public-service-state" role="alert">
            <i className="bi bi-wifi-off" aria-hidden="true" />
            <strong>Không tải được danh sách gói liệu trình</strong>
            <span>Hãy kiểm tra kết nối rồi thử lại.</span>
            <button type="button" onClick={() => setRefresh((value) => value + 1)}>Thử lại</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="public-service-state">
            <i className="bi bi-search" aria-hidden="true" />
            <strong>Chưa có gói liệu trình phù hợp</strong>
            <span>Thử thay đổi từ khóa hoặc quay lại sau.</span>
          </div>
        ) : (
          <div className="public-service-grid">
            {visible.map((item, index) => (
              <article className="public-service-card public-treatment-package-card" key={item.treatmentPackageId}>
                <div className="public-service-card-image">
                  <img
                    src={`/api/service-image/${item.serviceIds?.[0]}`}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = photos[index % photos.length];
                    }}
                  />
                </div>
                <div className="public-service-card-body">
                  <span className="public-service-code">{item.numberOfSessions} buổi</span>
                  <h3>{item.packageName}</h3>
                  <p className="small text-muted mb-2">
                    Dịch vụ: {(item.services || []).map((service) => service.serviceName).join(", ")}
                  </p>
                  {packageDescription(item.description) && (
                    <p className="small mb-2">{packageDescription(item.description)}</p>
                  )}
                  <div className="public-service-card-meta">
                    <strong>
                      {Number(item.price).toLocaleString("vi-VN")} <small>VNĐ</small>
                    </strong>
                    <span>
                      <i className="bi bi-calendar-check" aria-hidden="true" /> {item.numberOfSessions} buổi
                    </span>
                  </div>
                  {isCustomer && (
                    <div className="public-treatment-package-action">
                      <Button
                        className="w-100"
                        onClick={() => {
                          setBuyError("");
                          setBuying(item);
                        }}
                      >
                        Mua gói
                      </Button>
                    </div>
                  )}
                  {!user && (
                    <div className="public-treatment-package-action">
                      <Button
                        className="w-100"
                        onClick={() => navigate("/login", { state: { from: "/treatment-packages" } })}
                      >
                        Mua gói
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal show={!!buying} onHide={() => !buyBusy && setBuying(null)} centered>
        <Modal.Header closeButton={!buyBusy}>
          <Modal.Title>Mua gói liệu trình</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {buyError && <Alert variant="danger">{buyError}</Alert>}
          <p className="mb-1">
            <strong>{buying?.packageName}</strong> · {buying?.numberOfSessions} buổi · hạn dùng {buying?.validityDays} ngày
          </p>
          <p className="small text-muted mb-1">Áp dụng cho: {(buying?.services || []).map((service) => service.serviceName).join(", ")}</p>
          <p className="fs-5 fw-bold">{Number(buying?.price || 0).toLocaleString("vi-VN")} VNĐ</p>
          <Form.Group className="mb-3">
            <Form.Label className="small">Mã voucher (nếu có)</Form.Label>
            <Form.Control size="sm" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} disabled={buyBusy} />
          </Form.Group>
          <ul className="small text-muted ps-3 mb-0">
            <li>Bạn sẽ được chuyển sang VNPay để thanh toán; liên kết có hiệu lực 15 phút.</li>
            <li>Ưu đãi theo hạng thành viên được trừ trước, sau đó đến voucher (tổng giảm tối đa 50%).</li>
            <li>Gói được kích hoạt ngay khi thanh toán thành công; hạn dùng tính từ ngày mua.</li>
            <li>Nếu thanh toán không thành công, hóa đơn gói sẽ bị hủy và bạn có thể mua lại.</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={buyBusy} onClick={() => setBuying(null)}>
            Quay lại
          </Button>
          <Button disabled={buyBusy} onClick={confirmPurchase}>
            {buyBusy ? "Đang xử lý…" : "Mua và thanh toán"}
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
