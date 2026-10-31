import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Modal,
  Table,
  Spinner,
} from "react-bootstrap";
import { api, post, money } from "../../../services/api";
export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]),
    [products, setProducts] = useState([]),
    [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(null),
    [confirm, setConfirm] = useState(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const [o, p, s] = await Promise.all([
        api("/api/purchase-orders"),
        api("/api/products"),
        api("/api/suppliers"),
      ]);
      setOrders(o);
      setProducts(p);
      setSuppliers(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    load();
  }, []);
  async function send(payload) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await post("/api/purchase-orders", payload);
      setSuccess("Đã cập nhật đơn nhập.");
      setConfirm(null);
      setForm(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function editLine(index, key, value) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) =>
        i === index ? { ...item, [key]: Number(value) } : item,
      ),
    }));
  }
  const emptyLine = () => ({ productId: "", quantity: 1, unitPrice: 0 });
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Đơn nhập hàng</h1>
          <p>Lập đơn nháp → gửi nhà cung cấp → xác nhận nhận hàng.</p>
        </div>
        <Button
          onClick={() => {
            setError("");
            setForm({ supplierId: "", expectedDate: "", items: [emptyLine()] });
          }}
        >
          Tạo đơn nhập
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {loading ? (
        <div className="ui-empty">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Nhà cung cấp</th>
                    <th>Dự kiến</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.purchaseOrderId}>
                      <td>#{o.purchaseOrderId}</td>
                      <td>{o.supplierName}</td>
                      <td>{o.expectedDate?.slice(0, 10) || "—"}</td>
                      <td>{money(o.totalAmount)}</td>
                      <td>{o.status}</td>
                      <td className="d-flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() =>
                            setForm({
                              ...o,
                              expectedDate: o.expectedDate?.slice(0, 10) || "",
                              readOnly: o.status !== "Draft",
                            })
                          }
                        >
                          {o.status === "Draft" ? "Xem / sửa" : "Chi tiết"}
                        </Button>
                        {o.status === "Draft" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              setConfirm({
                                action: "send",
                                purchaseOrderId: o.purchaseOrderId,
                              })
                            }
                          >
                            Đánh dấu đã gửi
                          </Button>
                        )}
                        {o.status === "Sent" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              setConfirm({
                                action: "receive",
                                purchaseOrderId: o.purchaseOrderId,
                              })
                            }
                          >
                            Nhận hàng
                          </Button>
                        )}
                        {["Draft", "Sent"].includes(o.status) && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() =>
                              setConfirm({
                                action: "cancel",
                                purchaseOrderId: o.purchaseOrderId,
                              })
                            }
                          >
                            Hủy
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!orders.length && <p className="ui-empty">Chưa có đơn nhập.</p>}
            </div>
          </Card.Body>
        </Card>
      )}
      <Modal
        show={!!form}
        onHide={() => !busy && setForm(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton={!busy}>
          <Modal.Title>
            {form?.purchaseOrderId
              ? `Đơn nhập #${form.purchaseOrderId}`
              : "Tạo đơn nhập"}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            send({
              ...form,
              expectedDate: form.expectedDate || null,
              ...(form.purchaseOrderId ? { action: "update" } : {}),
            });
          }}
        >
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {form && (
              <fieldset disabled={busy || form.readOnly}>
                <div className="ui-form-grid">
                  <Form.Group>
                    <Form.Label>Nhà cung cấp</Form.Label>
                    <Form.Select
                      required
                      disabled={!!form.purchaseOrderId}
                      value={form.supplierId}
                      onChange={(e) =>
                        setForm({ ...form, supplierId: Number(e.target.value) })
                      }
                    >
                      <option value="">Chọn nhà cung cấp</option>
                      {suppliers
                        .filter(
                          (s) =>
                            s.status === "Active" ||
                            s.supplierId === form.supplierId,
                        )
                        .map((s) => (
                          <option key={s.supplierId} value={s.supplierId}>
                            {s.supplierName}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Ngày nhận dự kiến</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.expectedDate}
                      onChange={(e) =>
                        setForm({ ...form, expectedDate: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="table-responsive mt-3">
                  <Table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Giá nhập</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <Form.Select
                              aria-label={`Sản phẩm dòng ${i + 1}`}
                              required
                              value={item.productId}
                              onChange={(e) =>
                                editLine(i, "productId", e.target.value)
                              }
                            >
                              <option value="">Chọn sản phẩm</option>
                              {products.map((p) => (
                                <option key={p.productId} value={p.productId}>
                                  {p.productName}
                                </option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Control
                              aria-label={`Số lượng dòng ${i + 1}`}
                              type="number"
                              required
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) =>
                                editLine(i, "quantity", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <Form.Control
                              aria-label={`Giá nhập dòng ${i + 1}`}
                              type="number"
                              required
                              min="0"
                              step=".01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                editLine(i, "unitPrice", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <Button
                              variant="outline-danger"
                              disabled={form.items.length === 1}
                              onClick={() =>
                                setForm({
                                  ...form,
                                  items: form.items.filter((_, n) => n !== i),
                                })
                              }
                            >
                              Bỏ
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <Button
                  variant="outline-primary"
                  onClick={() =>
                    setForm({ ...form, items: [...form.items, emptyLine()] })
                  }
                >
                  Thêm dòng
                </Button>
                <p className="mt-3 fw-bold">
                  Tổng:{" "}
                  {money(
                    form.items.reduce(
                      (sum, i) =>
                        sum + Number(i.quantity) * Number(i.unitPrice),
                      0,
                    ),
                  )}
                </p>
              </fieldset>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setForm(null)}
            >
              Đóng
            </Button>
            {!form?.readOnly && (
              <Button type="submit" disabled={busy}>
                {busy ? "Đang lưu…" : "Lưu đơn nháp"}
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={!!confirm} onHide={() => !busy && setConfirm(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đơn #{confirm?.purchaseOrderId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirm?.action === "receive"
            ? "Chỉ xác nhận khi đã nhận đủ hàng. Tồn kho sẽ được cộng đúng một lần."
            : confirm?.action === "send"
              ? "Đánh dấu đơn đã gửi cho nhà cung cấp."
              : "Hủy đơn nhập này?"}
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setConfirm(null)}
          >
            Quay lại
          </Button>
          <Button disabled={busy} onClick={() => send(confirm)}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
