import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import { api, post, money, today } from "../../../services/api";

export default function CreateInvoice({ packageOnly = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(packageOnly ? "package" : "appointment");
  const [form, setForm] = useState({
    customerId: "",
    appointmentId: "",
    treatmentPackageId: "",
    voucherId: "",
    useBirthday: false,
    quantities: {},
  });
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let active = true;
    Promise.all(
      [
        "/api/invoices/eligible-appointments",
        "/api/invoices/products",
        "/api/customers",
        "/api/treatment-packages",
        "/api/vouchers",
      ].map((url) => api(url)),
    )
      .then(([appointments, products, customers, packages, vouchers]) => {
        if (active)
          setData({ appointments, products, customers, packages, vouchers });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setRequestKey(crypto.randomUUID());
  };
  const appointment = data?.appointments.find(
    (a) => Number(a.appointmentId) === Number(form.appointmentId),
  );
  const customerId =
    mode === "appointment" ? appointment?.customerId : Number(form.customerId);
  const pack = data?.packages.find(
    (p) => Number(p.treatmentPackageId) === Number(form.treatmentPackageId),
  );
  const products = (data?.products || []).filter(
    (p) => Number(form.quantities[p.productId]) > 0,
  );
  const subtotal =
    (mode === "appointment"
      ? Number(appointment?.servicePrice || 0)
      : mode === "package"
        ? Number(pack?.price || 0)
        : 0) +
    products.reduce(
      (s, p) => s + Number(p.unitPrice) * Number(form.quantities[p.productId]),
      0,
    );
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await post("/api/invoices", {
        customerId,
        appointmentId:
          mode === "appointment" ? Number(form.appointmentId) : null,
        treatmentPackageId:
          mode === "package" ? Number(form.treatmentPackageId) : null,
        voucherId: form.voucherId ? Number(form.voucherId) : null,
        useBirthday: form.useBirthday,
        productItems: products.map((p) => ({
          productId: p.productId,
          quantity: Number(form.quantities[p.productId]),
        })),
        requestKey,
      });
      navigate("/invoices", { state: { createdInvoiceId: result.invoiceId } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>{packageOnly ? "Bán gói liệu trình" : "Tạo hóa đơn"}</h1>
          <p>
            Lập hóa đơn, kiểm tra ưu đãi thực tế rồi thu tiền trong trang hóa
            đơn.
          </p>
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {!data ? (
        <Spinner animation="border" />
      ) : (
        <Form onSubmit={submit}>
          <fieldset disabled={busy}>
            <Card className="mb-3">
              <Card.Body>
                {!packageOnly && (
                  <Form.Group className="mb-3">
                    <Form.Label>Loại hóa đơn</Form.Label>
                    <Form.Select
                      value={mode}
                      onChange={(e) => {
                        setMode(e.target.value);
                        update({ voucherId: "", useBirthday: false });
                      }}
                    >
                      <option value="appointment">Dịch vụ đã hoàn thành</option>
                      <option value="retail">Bán sản phẩm</option>
                      <option value="package">Bán gói liệu trình</option>
                    </Form.Select>
                  </Form.Group>
                )}
                {mode === "appointment" ? (
                  <Form.Group className="mb-3">
                    <Form.Label>Lịch hẹn đã hoàn thành</Form.Label>
                    <Form.Select
                      required
                      value={form.appointmentId}
                      onChange={(e) =>
                        update({ appointmentId: e.target.value, voucherId: "" })
                      }
                    >
                      <option value="">Chọn lịch hẹn</option>
                      {data.appointments.map((a) => (
                        <option key={a.appointmentId} value={a.appointmentId}>
                          #{a.appointmentId} · {a.customerName} ·{" "}
                          {a.serviceName} · {a.appointmentDate}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label>Khách hàng</Form.Label>
                    <Form.Select
                      required
                      value={form.customerId}
                      onChange={(e) =>
                        update({ customerId: e.target.value, voucherId: "" })
                      }
                    >
                      <option value="">Chọn khách hàng</option>
                      {data.customers
                        .filter((c) => !c.status || c.status === "Active")
                        .map((c) => (
                          <option key={c.customerId} value={c.customerId}>
                            {c.fullName} · {c.phone}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                )}
                {mode === "package" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Gói liệu trình</Form.Label>
                    <Form.Select
                      required
                      value={form.treatmentPackageId}
                      onChange={(e) =>
                        update({ treatmentPackageId: e.target.value })
                      }
                    >
                      <option value="">Chọn gói</option>
                      {data.packages
                        .filter((p) => p.status === "Active")
                        .map((p) => (
                          <option
                            key={p.treatmentPackageId}
                            value={p.treatmentPackageId}
                          >
                            {p.packageName} · {money(p.price)} ·{" "}
                            {p.numberOfSessions} buổi
                          </option>
                        ))}
                    </Form.Select>
                    <Form.Text>
                      Chỉ đặt lịch sử dụng gói sau khi hóa đơn đã thanh toán đủ.
                    </Form.Text>
                  </Form.Group>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Voucher</Form.Label>
                  <Form.Select
                    value={form.voucherId}
                    onChange={(e) => update({ voucherId: e.target.value })}
                  >
                    <option value="">Không sử dụng</option>
                    {data.vouchers
                      .filter(
                        (v) =>
                          v.status === "Active" &&
                          (!v.customerId ||
                            Number(v.customerId) === customerId) &&
                          String(v.endDate).slice(0, 10) >= today(),
                      )
                      .map((v) => (
                        <option key={v.voucherId} value={v.voucherId}>
                          {v.voucherCode} ·{" "}
                          {v.discountType === "Percentage"
                            ? `${v.discountValue}%`
                            : money(v.discountValue)}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
                <Form.Check
                  label="Áp dụng ưu đãi sinh nhật 10% (một lần trong năm, đúng tháng sinh nhật)"
                  checked={form.useBirthday}
                  onChange={(e) => update({ useBirthday: e.target.checked })}
                />
              </Card.Body>
            </Card>
            <Card className="mb-3">
              <Card.Body>
                <h2>Sản phẩm bán kèm</h2>
                <div className="table-responsive">
                  <Table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Tồn kho</th>
                        <th>Số lượng mua</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.products.map((p) => (
                        <tr key={p.productId}>
                          <td>{p.productName}</td>
                          <td>{money(p.unitPrice)}</td>
                          <td>{p.stockQuantity}</td>
                          <td>
                            <Form.Control
                              aria-label={`Số lượng ${p.productName}`}
                              type="number"
                              min="0"
                              max={Math.floor(p.stockQuantity)}
                              step="1"
                              value={form.quantities[p.productId] || ""}
                              onChange={(e) =>
                                update({
                                  quantities: {
                                    ...form.quantities,
                                    [p.productId]: e.target.value,
                                  },
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
            <Alert variant="info">
              Tạm tính trước ưu đãi: <strong>{money(subtotal)}</strong>. Hệ
              thống tính VIP, sinh nhật và voucher theo điều kiện tại thời điểm
              lập hóa đơn. Kiểm tra số tiền cuối cùng trước khi thu.
            </Alert>
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => navigate("/invoices")}>
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={
                  !customerId || (mode === "retail" && !products.length)
                }
              >
                {busy ? "Đang tạo…" : "Tạo hóa đơn"}
              </Button>
            </div>
          </fieldset>
        </Form>
      )}
    </section>
  );
}
