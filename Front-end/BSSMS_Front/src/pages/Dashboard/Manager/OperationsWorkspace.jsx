import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Spinner,
  Table,
  Modal,
} from "react-bootstrap";
import { api, post, today } from "../../../services/api";

const titles = {
  scheduling: "Ca làm việc & kỹ năng",
  "catalog-rules": "Định mức vật tư & thiết bị",
  stock: "Tồn kho & lịch sử biến động",
  policy: "Chính sách & chốt hoa hồng",
};
const initialForm = (kind) =>
  kind === "scheduling"
    ? { action: "shift", date: today(), start: "08:30", end: "18:30" }
    : kind === "catalog-rules"
      ? { action: "material", quantity: 1 }
      : {};
const Select = ({ label, value, onChange, rows = [], id, name, ...props }) => (
  <Form.Group>
    <Form.Label>{label}</Form.Label>
    <Form.Select
      required
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value))}
      {...props}
    >
      <option value="">Chọn {label.toLowerCase()}</option>
      {rows.map((r) => (
        <option key={r[id]} value={r[id]}>
          {r[name]}
        </option>
      ))}
    </Form.Select>
  </Form.Group>
);

export default function OperationsWorkspace({ kind }) {
  const [date, setDate] = useState(today);
  const [data, setData] = useState({});
  const [form, setForm] = useState(() => initialForm(kind));
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [confirm, setConfirm] = useState(null);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function load() {
    setLoading(true);
    try {
      const result = await api(`/api/operations/${kind}?date=${date}`);
      setData(result);
      if (kind === "policy") setForm({ ...result.policy, action: "save" });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    setLoading(true);
    setError("");
    setSuccess("");
    setData({});
    setForm(initialForm(kind));
    api(`/api/operations/${kind}?date=${date}`)
      .then((result) => {
        if (active) {
          setData(result);
          if (kind === "policy") setForm({ ...result.policy, action: "save" });
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, date]);
  async function save(payload) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await post(
        kind === "stock" ? "/api/purchase-orders" : `/api/operations/${kind}`,
        payload,
      );
      setConfirm(null);
      setSuccess("Đã cập nhật thành công.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    if (kind === "policy") {
      setConfirm(form);
      return;
    }
    save(form);
  }
  const remove = (payload) => setConfirm(payload);
  const field = (label, key, type = "text", props = {}) => (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        required
        type={type}
        value={form[key] ?? ""}
        onChange={(e) =>
          update(
            key,
            type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
        {...props}
      />
    </Form.Group>
  );
  const table = (headers, rows) => (
    <div className="table-responsive">
      <Table hover>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
      {!rows.length && <p className="ui-empty">Chưa có dữ liệu.</p>}
    </div>
  );
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>{titles[kind]}</h1>
          <p>Quản lý dữ liệu vận hành và theo dõi thay đổi của salon.</p>
        </div>
        <Button
          variant="outline-primary"
          onClick={load}
          disabled={loading || busy}
        >
          Làm mới
        </Button>
      </div>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}
      {loading ? (
        <div className="ui-empty">
          <Spinner animation="border" />
          <p>Đang tải dữ liệu…</p>
        </div>
      ) : (
        <>
          {kind === "scheduling" && (
            <>
              <div className="ui-toolbar">
                <Form.Group>
                  <Form.Label>Ngày xem lịch</Form.Label>
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Form.Group>
              </div>
              <Card className="mb-4">
                <Card.Body>
                  <Form onSubmit={submit}>
                    <fieldset disabled={busy}>
                      <div className="ui-form-grid">
                        <Form.Group>
                          <Form.Label>Thao tác</Form.Label>
                          <Form.Select
                            value={form.action}
                            onChange={(e) =>
                              setForm(
                                e.target.value === "leave"
                                  ? {
                                      action: "leave",
                                      start: today(),
                                      end: today(),
                                    }
                                  : e.target.value === "skill"
                                    ? { action: "skill" }
                                    : initialForm(kind),
                              )
                            }
                          >
                            <option value="shift">Thêm ca làm</option>
                            <option value="leave">Đăng ký ngày nghỉ</option>
                            <option value="skill">Gán kỹ năng dịch vụ</option>
                          </Form.Select>
                        </Form.Group>
                        <Select
                          label="Nhân viên"
                          value={form.staffId}
                          onChange={(v) => update("staffId", v)}
                          rows={(data.staff || []).filter(
                            (s) =>
                              form.action !== "skill" ||
                              s.role === "Technician",
                          )}
                          id="staffId"
                          name="fullName"
                        />
                        {form.action === "shift" && (
                          <>
                            {field("Ngày làm việc", "date", "date")}
                            {field("Bắt đầu", "start", "time")}
                            {field("Kết thúc", "end", "time")}
                          </>
                        )}
                        {form.action === "leave" && (
                          <>
                            {field("Từ ngày", "start", "date")}
                            {field("Đến ngày", "end", "date")}
                            {field("Lý do", "reason", "text", {
                              maxLength: 500,
                            })}
                          </>
                        )}
                        {form.action === "skill" && (
                          <Select
                            label="Dịch vụ"
                            value={form.serviceId}
                            onChange={(v) => update("serviceId", v)}
                            rows={data.services}
                            id="serviceId"
                            name="serviceName"
                          />
                        )}
                      </div>
                      <Button type="submit" className="mt-3">
                        {busy ? "Đang lưu…" : "Lưu"}
                      </Button>
                    </fieldset>
                  </Form>
                </Card.Body>
              </Card>
              <h2>Ca làm ngày {date}</h2>
              {table(
                ["Nhân viên", "Bắt đầu", "Kết thúc", "Thao tác"],
                (data.shifts || []).map((r) => (
                  <tr key={r.staffShiftId}>
                    <td>{r.fullName}</td>
                    <td>{r.startTime}</td>
                    <td>{r.endTime}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          remove({ action: "deleteShift", id: r.staffShiftId })
                        }
                      >
                        Xóa ca
                      </Button>
                    </td>
                  </tr>
                )),
              )}
              <h2>Ngày nghỉ</h2>
              {table(
                ["Nhân viên", "Từ ngày", "Đến ngày", "Lý do", "Thao tác"],
                (data.leaves || []).map((r) => (
                  <tr key={r.leaveId}>
                    <td>{r.fullName}</td>
                    <td>{r.startDate}</td>
                    <td>{r.endDate}</td>
                    <td>{r.reason}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          remove({ action: "deleteLeave", id: r.leaveId })
                        }
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                )),
              )}
              <h2>Kỹ năng đã gán</h2>
              {table(
                ["Kỹ thuật viên", "Dịch vụ", "Thao tác"],
                (data.skills || []).map((r) => (
                  <tr key={`${r.staffId}-${r.serviceId}`}>
                    <td>{r.fullName}</td>
                    <td>{r.serviceName}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          remove({
                            action: "deleteSkill",
                            staffId: r.staffId,
                            serviceId: r.serviceId,
                          })
                        }
                      >
                        Bỏ gán
                      </Button>
                    </td>
                  </tr>
                )),
              )}
            </>
          )}
          {kind === "catalog-rules" && (
            <>
              <Card className="mb-4">
                <Card.Body>
                  <Form onSubmit={submit}>
                    <fieldset disabled={busy}>
                      <div className="ui-form-grid">
                        <Select
                          label="Dịch vụ"
                          value={form.serviceId}
                          onChange={(v) => update("serviceId", v)}
                          rows={data.services}
                          id="serviceId"
                          name="serviceName"
                        />
                        <Form.Group>
                          <Form.Label>Loại định mức</Form.Label>
                          <Form.Select
                            value={form.action}
                            onChange={(e) => update("action", e.target.value)}
                          >
                            <option value="material">Vật tư tiêu hao</option>
                            <option value="equipment">Thiết bị bắt buộc</option>
                          </Form.Select>
                        </Form.Group>
                        {form.action === "material" ? (
                          <>
                            <Select
                              label="Vật tư"
                              value={form.productId}
                              onChange={(v) => update("productId", v)}
                              rows={data.products}
                              id="productId"
                              name="productName"
                            />
                            {field("Số lượng mỗi buổi", "quantity", "number", {
                              min: 0.001,
                              step: 0.001,
                            })}
                          </>
                        ) : (
                          <Select
                            label="Thiết bị"
                            value={form.equipmentId}
                            onChange={(v) => update("equipmentId", v)}
                            rows={data.equipment}
                            id="equipmentId"
                            name="equipmentName"
                          />
                        )}
                      </div>
                      <Button type="submit" className="mt-3">
                        Lưu định mức
                      </Button>
                    </fieldset>
                  </Form>
                </Card.Body>
              </Card>
              <h2>Vật tư tiêu hao</h2>
              {table(
                ["Dịch vụ", "Vật tư", "Định mức", "Thao tác"],
                (data.materials || []).map((r) => (
                  <tr key={`${r.serviceId}-${r.productId}`}>
                    <td>{r.serviceName}</td>
                    <td>{r.productName}</td>
                    <td>
                      {r.quantity} {r.unit}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          remove({
                            action: "deleteMaterial",
                            serviceId: r.serviceId,
                            productId: r.productId,
                          })
                        }
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                )),
              )}
              <h2>Thiết bị bắt buộc</h2>
              {table(
                ["Dịch vụ", "Thiết bị", "Thao tác"],
                (data.requirements || []).map((r) => (
                  <tr key={`${r.serviceId}-${r.equipmentId}`}>
                    <td>{r.serviceName}</td>
                    <td>{r.equipmentName}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          remove({
                            action: "deleteEquipment",
                            serviceId: r.serviceId,
                            equipmentId: r.equipmentId,
                          })
                        }
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                )),
              )}
            </>
          )}
          {kind === "stock" && (
            <>
              {(data.products || []).some(
                (p) => p.stockQuantity < p.reorderLevel,
              ) && (
                <Alert variant="warning">
                  Có sản phẩm dưới mức tồn tối thiểu. Kiểm tra và lập đơn nhập
                  hàng.
                </Alert>
              )}
              <Card className="mb-4">
                <Card.Body>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setConfirm({ ...form, action: "adjustStock" });
                    }}
                  >
                    <fieldset disabled={busy}>
                      <div className="ui-form-grid">
                        <Select
                          label="Sản phẩm"
                          value={form.productId}
                          onChange={(v) => update("productId", v)}
                          rows={data.products}
                          id="productId"
                          name="productName"
                        />
                        {field(
                          "Số lượng thay đổi (+ nhập / − giảm)",
                          "quantityChange",
                          "number",
                          { step: 0.001 },
                        )}
                        {field("Lý do điều chỉnh", "reason", "text", {
                          maxLength: 500,
                        })}
                      </div>
                      <Button type="submit" className="mt-3">
                        Điều chỉnh tồn kho
                      </Button>
                    </fieldset>
                  </Form>
                </Card.Body>
              </Card>
              {table(
                ["Sản phẩm", "Loại", "Tồn kho", "Mức tối thiểu"],
                (data.products || []).map((r) => (
                  <tr key={r.productId}>
                    <td>{r.productName}</td>
                    <td>{r.productType}</td>
                    <td
                      className={
                        r.stockQuantity < r.reorderLevel
                          ? "text-danger fw-bold"
                          : ""
                      }
                    >
                      {r.stockQuantity} {r.unit}
                    </td>
                    <td>{r.reorderLevel}</td>
                  </tr>
                )),
              )}
              <h2>300 biến động gần nhất</h2>
              {table(
                ["Thời gian", "Sản phẩm", "Loại", "Thay đổi", "Lý do"],
                (data.movements || []).map((r) => (
                  <tr key={r.movementId}>
                    <td>{r.createdAt}</td>
                    <td>{r.productName}</td>
                    <td>{r.movementType}</td>
                    <td>{r.quantityChange}</td>
                    <td>{r.reason}</td>
                  </tr>
                )),
              )}
            </>
          )}
          {kind === "policy" && (
            <>
              <Card className="mb-4">
                <Card.Body>
                  <Form onSubmit={submit}>
                    <fieldset disabled={busy}>
                      <div className="ui-form-grid">
                        {field(
                          "Số lịch hoàn thành để lên VIP",
                          "vipCompletedThreshold",
                          "number",
                          { min: 1, step: 1 },
                        )}
                        {field(
                          "Giảm giá VIP (%)",
                          "vipDiscountPercent",
                          "number",
                          { min: 0, max: 100, step: 0.01 },
                        )}
                        {field(
                          "Hoa hồng dịch vụ (%)",
                          "commissionPercent",
                          "number",
                          { min: 0, max: 100, step: 0.01 },
                        )}
                      </div>
                      <p className="text-muted mt-3">
                        Ưu đãi áp dụng lần lượt: VIP → sinh nhật → voucher. Thay
                        đổi chỉ áp dụng cho nghiệp vụ mới.
                      </p>
                      <Button type="submit">Lưu chính sách</Button>
                    </fieldset>
                  </Form>
                </Card.Body>
              </Card>
              <div className="ui-toolbar">
                <Button
                  disabled={busy}
                  onClick={() => setConfirm({ action: "issueBenefits" })}
                >
                  Cấp voucher tháng hiện tại
                </Button>
                <Form.Group>
                  <Form.Label>Tháng hoa hồng cần chốt</Form.Label>
                  <Form.Control
                    type="month"
                    value={form.closeMonth || ""}
                    onChange={(e) => update("closeMonth", e.target.value)}
                  />
                </Form.Group>
                <Button
                  disabled={busy || !form.closeMonth}
                  onClick={() =>
                    setConfirm({
                      action: "closeMonth",
                      month: form.closeMonth + "-01",
                    })
                  }
                >
                  Chốt tháng
                </Button>
              </div>
              {table(
                ["Tháng", "Trạng thái", "Chốt lúc"],
                (data.periods || []).map((r) => (
                  <tr key={r.periodId}>
                    <td>{r.periodMonth}</td>
                    <td>{r.status}</td>
                    <td>{r.closedAt || "—"}</td>
                  </tr>
                )),
              )}
              <h2>Thông báo Zalo gần nhất</h2>
              <p className="text-muted">
                Sending có thể đã được nhà cung cấp tiếp nhận. Kiểm tra mã BSSMS
                + ID trước khi gửi lại để tránh trùng tin.
              </p>
              {table(
                [
                  "ID",
                  "Khách hàng",
                  "Mẫu",
                  "Trạng thái",
                  "Kết quả",
                  "Thao tác",
                ],
                (data.notifications || []).map((r) => (
                  <tr key={r.notificationId}>
                    <td>{r.notificationId}</td>
                    <td>{r.fullName}</td>
                    <td>{r.templateCode}</td>
                    <td>{r.status}</td>
                    <td>{r.providerMessageId || r.lastError || "—"}</td>
                    <td>
                      {["Failed", "Sending"].includes(r.status) && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() =>
                            setConfirm({
                              action: "retryNotification",
                              id: r.notificationId,
                              confirmedProviderCheck: true,
                            })
                          }
                        >
                          Đã đối soát, gửi lại
                        </Button>
                      )}
                    </td>
                  </tr>
                )),
              )}
            </>
          )}
        </>
      )}
      <Modal show={!!confirm} onHide={() => !busy && setConfirm(null)} centered>
        <Modal.Header closeButton={!busy}>
          <Modal.Title>Xác nhận thay đổi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {kind === "stock"
            ? `Điều chỉnh ${confirm?.quantityChange || 0} đơn vị. `
            : ""}
          Bạn muốn thực hiện thao tác này?
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setConfirm(null)}
          >
            Quay lại
          </Button>
          <Button disabled={busy} onClick={() => save(confirm)}>
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
