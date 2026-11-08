import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Form, Spinner } from "react-bootstrap";
import { api, post } from "../../../services/api";

const Check = ({ ok, label, hint }) => (
  <li className="d-flex align-items-center gap-2 mb-1">
    <Badge bg={ok ? "success" : "secondary"}>{ok ? "Đã có" : "Chưa có"}</Badge>
    <span>{label}</span>
    {!ok && hint && <small className="text-muted">({hint})</small>}
  </li>
);

// Manager xem cấu hình thanh toán VNPay, Zalo ZNS, email và gửi thử một tin ZNS tới một số điện thoại.
export default function IntegrationPanel() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [phone, setPhone] = useState("");
  const [template, setTemplate] = useState("INVOICE_PAID");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    let active = true;
    api("/api/integrations/status")
      .then((result) => {
        if (active) {
          setStatus(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  async function sendTest(event) {
    event.preventDefault();
    if (testing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await post("/api/integrations/zalo-test", { phone, templateCode: template });
      setTestResult(
        result.ok
          ? { ok: true, text: "Đã gửi thử thành công. Kiểm tra Zalo của số điện thoại này." }
          : { ok: false, text: `Zalo từ chối (mã ${result.zaloError ?? "?"}): ${result.zaloMessage || "không rõ lý do"}` },
      );
    } catch (e) {
      setTestResult({ ok: false, text: e.message });
    } finally {
      setTesting(false);
    }
  }

  const v = status?.vnpay;
  const z = status?.zalo;
  const m = status?.email;
  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h2 className="h5 mb-1">Kết nối bên ngoài</h2>
            <p className="text-muted small mb-0">
              Cấu hình đọc từ tệp <code>{status?.configFile || "~/.bssms/config.properties"}</code> hoặc biến môi trường.
            </p>
          </div>
          <Button size="sm" variant="outline-primary" onClick={() => setRevision((r) => r + 1)}>
            Kiểm tra lại
          </Button>
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        {!status && !error && <Spinner animation="border" size="sm" />}
        {status && (
          <div className="row g-4">
            <div className="col-md-4">
              <h3 className="h6">Thanh toán VNPay</h3>
              <ul className="list-unstyled mb-0 small">
                <Check ok={v.tmnCode} label="Mã website (VNPAY_TMN_CODE)" hint="bắt buộc" />
                <Check ok={v.hashSecret} label="Chuỗi bí mật (VNPAY_HASH_SECRET)" hint="bắt buộc" />
                <Check ok={v.refundServerIp} label="IP máy chủ để hoàn tiền (VNPAY_SERVER_IP)" hint="chỉ cần khi hoàn tiền" />
                <li className="mb-1">Địa chỉ quay về: {v.returnUrl}</li>
                <li className="mb-1">
                  Xác nhận ngay khi khách quay về: <strong>{v.confirmOnReturn ? "bật" : "tắt"}</strong>
                </li>
              </ul>
            </div>
            <div className="col-md-4">
              <h3 className="h6">Zalo ZNS</h3>
              <ul className="list-unstyled mb-0 small">
                <Check ok={z.jobsEnabled} label="Tiến trình gửi tin (BSSMS_JOBS_ENABLED)" hint="đặt true rồi khởi động lại" />
                <Check ok={z.accessToken || z.mode === "simulate"} label="Access token" hint="không cần khi mô phỏng" />
                <Check ok={z.canRefresh} label="Tự làm mới token (app id, secret, refresh token)" />
                <Check ok={z.templates.length > 0} label={`Mẫu tin: ${z.templates.join(", ") || "chưa có"}`} />
                <li className="mb-1">
                  Hàng đợi tin: chờ gửi <strong>{z.queue?.pending ?? 0}</strong> (đến hạn <strong>{z.queue?.dueNow ?? 0}</strong>) · lỗi{" "}
                  <strong>{z.queue?.failed ?? 0}</strong> · đã gửi <strong>{z.queue?.sent ?? 0}</strong>
                </li>
                <li className="mb-1">
                  Tiến trình gửi tin:{" "}
                  <strong>
                    {z.lastTickAt
                      ? `chạy lần cuối ${z.lastTickAt}`
                      : z.jobsEnabled
                        ? "chưa chạy lượt nào"
                        : "đang tắt"}
                  </strong>
                </li>
                <li className="mb-1">
                  Chế độ: <strong>{z.mode === "simulate" ? "mô phỏng (chưa gửi tới Zalo)" : z.mode === "development" ? "thử nghiệm" : "chính thức"}</strong>
                  {z.tokenMinutesLeft != null && ` · token còn ${z.tokenMinutesLeft} phút`}
                </li>
              </ul>
            </div>
            <div className="col-md-4">
              <h3 className="h6">Email (mã xác thực)</h3>
              <ul className="list-unstyled mb-0 small">
                <Check ok={m.smtpUser} label="Tài khoản gửi (BSSMS_SMTP_USER)" />
                <Check ok={m.smtpPassword} label="Mật khẩu ứng dụng (BSSMS_SMTP_PASSWORD)" />
              </ul>
            </div>
          </div>
        )}
        {status && (z.queue?.dueNow ?? 0) > 0 && !z.lastTickAt && (
          <Alert variant="warning" className="mt-3 mb-0">
            Có <strong>{z.queue.dueNow}</strong> tin đã đến hạn gửi nhưng tiến trình gửi tin chưa chạy. Kiểm tra
            <code> BSSMS_JOBS_ENABLED=true </code>trong tệp cấu hình, đã chép bản backend mới, rồi khởi động lại Tomcat.
          </Alert>
        )}
        {status && z.queue?.error && (
          <Alert variant="danger" className="mt-3 mb-0">
            {z.queue.error}
          </Alert>
        )}
        <hr />
        <Form onSubmit={sendTest} className="d-flex flex-wrap align-items-end gap-3">
          <Form.Group>
            <Form.Label className="mb-1">Gửi thử ZNS tới số điện thoại</Form.Label>
            <Form.Control required placeholder="0901234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label className="mb-1">Mẫu tin</Form.Label>
            <Form.Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {(status?.zalo?.templates?.length ? status.zalo.templates : ["INVOICE_PAID", "APPOINTMENT_BOOKED", "APPOINTMENT_REMINDER", "PACKAGE_REMINDER"]).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Button type="submit" disabled={testing}>
            {testing ? "Đang gửi…" : "Gửi thử"}
          </Button>
        </Form>
        {testResult && (
          <Alert className="mt-3 mb-0" variant={testResult.ok ? "success" : "danger"}>
            {testResult.text}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}
