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
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]),
    [products, setProducts] = useState([]),
    [suppliers, setSuppliers] = useState([]),
    [supplierPrices, setSupplierPrices] = useState([]);
  const [form, setForm] = useState(null),
    [confirm, setConfirm] = useState(null),
    [showSuggest, setShowSuggest] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const [o, p, s, prices] = await Promise.all([
        api("/api/purchase-orders"),
        api("/api/products"),
        api("/api/suppliers"),
        api("/api/supplier-prices"),
      ]);
      setOrders(o);
      setProducts(p);
      setSuppliers(s);
      setSupplierPrices(prices);
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
    if (
      ["create", "update"].includes(payload.action || "create") &&
      payload.items?.some((item) => !item.productId || item.unitPrice === "")
    ) {
      setError("Chọn nhà cung cấp và sản phẩm có giá đã thỏa thuận trước khi lưu.");
      return;
    }
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
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => {
        if (i !== index) return item;
        if (key === "productId") {
          const productId = Number(value);
          const supplierPrice = supplierPrices.find(
            (price) =>
              Number(price.supplierId) === Number(current.supplierId) &&
              Number(price.productId) === productId,
          );
          return {
            ...item,
            productId,
            unitPrice: supplierPrice ? Number(supplierPrice.unitPrice) : "",
          };
        }
        return { ...item, [key]: Number(value) };
      }),
    }));
  }
  const emptyLine = () => ({ productId: "", quantity: 1, unitPrice: "" });
  // 6.8: suggest purchase orders from low-stock warnings, grouped by supplier.
  const pendingProductIds = new Set(
    orders
      .filter((o) => ["Draft", "Sent"].includes(o.status))
      .flatMap((o) => (o.items || []).map((i) => Number(i.productId))),
  );
  const suggestionGroups = Object.values(
    products
      .filter(
        (p) =>
          p.status === "Active" &&
          Number(p.reorderLevel) > 0 &&
          Number(p.stockQuantity) < Number(p.reorderLevel) &&
          !pendingProductIds.has(Number(p.productId)),
      )
      .reduce((groups, p) => {
        const key = p.supplierId || 0;
        const supplier = suppliers.find((s) => s.supplierId === p.supplierId);
        groups[key] ||= {
          supplierId: p.supplierId || "",
          supplierName: supplier?.supplierName || "Chưa gán nhà cung cấp",
          items: [],
        };
        groups[key].items.push({
          productId: p.productId,
          productName: p.productName,
          unitPrice: supplierPrices.find(
            (price) =>
              Number(price.supplierId) === Number(p.supplierId) &&
              Number(price.productId) === Number(p.productId),
          )?.unitPrice ?? "",
          stockQuantity: Number(p.stockQuantity),
          reorderLevel: Number(p.reorderLevel),
          quantity: Math.max(
            1,
            Math.ceil(Number(p.reorderLevel) * 2 - Number(p.stockQuantity)),
          ),
        });
        return groups;
      }, {}),
  );
  const suggestionCount = suggestionGroups.reduce(
    (sum, g) => sum + g.items.length,
    0,
  );
  const { filteredRows: filteredOrders, toolbar } = useManagerSearchFilter(
    orders,
    [
      { key: "purchaseOrderId", label: "Mã đơn nhập", filterable: false },
      { key: "supplierName", label: "Nhà cung cấp" },
      {
        key: "status",
        label: "Trạng thái",
        formatValue: (value) =>
          value === "Received"
            ? "Đã nhận hàng"
            : value === "Cancelled"
              ? "Đã hủy"
              : value === "Sent"
                ? "Chờ nhà cung cấp giao"
                : value === "Draft"
                  ? "Bản nháp"
                  : value,
      },
      { key: "expectedDate", label: "Ngày nhận dự kiến", type: "date" },
    ],
    "Tìm theo mã đơn hoặc nhà cung cấp...",
  );
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Đơn nhập hàng</h1>
          <p>Tạo đơn đặt hàng → chờ nhà cung cấp giao → xác nhận nhận hàng.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="outline-primary"
            disabled={loading || !suggestionCount}
            onClick={() => setShowSuggest(true)}
          >
            Gợi ý từ cảnh báo tồn kho ({suggestionCount})
          </Button>
          <Button
            onClick={() => {
              setError("");
              setForm({ supplierId: "", expectedDate: "", items: [emptyLine()] });
            }}
          >
            Tạo đơn nhập
          </Button>
        </div>
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
            <div className="manager-list-toolbar mb-3">{toolbar}</div>
            <div className="table-responsive">
              <Table hover className="manager-list-table purchase-orders-table">
                <thead>
                  <tr>
                    <th>Nhà cung cấp</th>
                    <th>Ngày nhận dự kiến</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th className="purchase-orders-action-column">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.purchaseOrderId}>
                      <td>
                        <strong>{o.supplierName}</strong>
                        <div className="small text-muted">#{o.purchaseOrderId}</div>
                      </td>
                      <td>{o.expectedDate?.slice(0, 10) || "—"}</td>
                      <td>{money(o.totalAmount)}</td>
                      <td>
                        <span className={`badge ${o.status === "Received" ? "bg-success" : o.status === "Cancelled" ? "bg-secondary" : o.status === "Sent" ? "bg-primary" : o.status === "Draft" ? "bg-warning text-dark" : "bg-secondary"}`}>
                          {o.status === "Received" ? "Đã nhận hàng" : o.status === "Cancelled" ? "Đã hủy" : o.status === "Sent" ? "Chờ nhà cung cấp giao" : o.status === "Draft" ? "Bản nháp" : o.status}
                        </span>
                      </td>
                      <td className="purchase-orders-action-column">
                        <div className="manager-list-actions">
                        <Button
                          size="sm"
                          variant="link"
                          className={`manager-list-action ${
                            o.status === "Draft"
                              ? "manager-list-action--edit"
                              : "manager-list-action--view"
                          }`}
                          onClick={() =>
                            setForm({
                              ...o,
                              expectedDate: o.expectedDate?.slice(0, 10) || "",
                              readOnly: o.status !== "Draft",
                            })
                          }
                        >
                          <i
                            className={`bi ${
                              o.status === "Draft"
                                ? "bi-pencil-square"
                                : "bi-eye-fill"
                            }`}
                            aria-hidden="true"
                          />
                          {o.status === "Draft" ? "Xem / sửa" : "Chi tiết"}
                        </Button>
                        {o.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="link"
                            className="manager-list-action manager-list-action--view"
                            onClick={() =>
                              setConfirm({
                                action: "send",
                                purchaseOrderId: o.purchaseOrderId,
                              })
                            }
                          >
                            <i className="bi bi-send" aria-hidden="true" />
                            Đặt hàng
                          </Button>
                        )}
                        {o.status === "Sent" && (
                          <Button
                            size="sm"
                            variant="link"
                            className="manager-list-action manager-list-action--view"
                            onClick={() =>
                              setConfirm({
                                action: "receive",
                                purchaseOrderId: o.purchaseOrderId,
                              })
                            }
                          >
                            <i className="bi bi-box-seam" aria-hidden="true" />
                            Nhận
                          </Button>
                        )}
                        {["Draft", "Sent"].includes(o.status) && (
                          <Button
                            size="sm"
                            variant="link"
                            className="manager-list-action manager-list-action--delete"
                            onClick={() =>
                              setConfirm({
                                action: "cancel",
                                purchaseOrderId: o.purchaseOrderId,
                              })
                            }
                          >
                            <i className="bi bi-x-circle" aria-hidden="true" />
                            Hủy
                          </Button>
                        )}
                        </div>
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
                      disabled={!!form.purchaseOrderId || form.items.some((item) => item.productId)}
                      value={form.supplierId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          supplierId: Number(e.target.value),
                          items: form.items.map((item) => ({
                            ...item,
                            productId: "",
                            unitPrice: "",
                          })),
                        })
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
                {!form.readOnly && (
                  <p className="small text-muted mt-3 mb-0">
                    Chọn nhà cung cấp và sản phẩm để tự điền giá đã thỏa thuận.
                  </p>
                )}
                <div className="table-responsive mt-3">
                  <Table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Giá nhà cung cấp</th>
                        {!form.readOnly && <th />}
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <Form.Select
                              aria-label={`Sản phẩm dòng ${i + 1}`}
                              required
                              disabled={!form.supplierId}
                              value={item.productId}
                              onChange={(e) =>
                                editLine(i, "productId", e.target.value)
                              }
                            >
                              <option value="">Chọn sản phẩm</option>
                              {products
                                .filter((product) =>
                                  supplierPrices.some(
                                    (price) =>
                                      Number(price.supplierId) === Number(form.supplierId) &&
                                      Number(price.productId) === Number(product.productId),
                                  ),
                                )
                                .map((p) => (
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
                              aria-label={`Giá nhà cung cấp dòng ${i + 1}`}
                              type="text"
                              readOnly
                              value={item.unitPrice === "" ? "" : money(item.unitPrice)}
                              placeholder="Chọn sản phẩm"
                            />
                          </td>
                          {!form.readOnly && (
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
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {!form.readOnly && (
                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      setForm({ ...form, items: [...form.items, emptyLine()] })
                    }
                  >
                    Thêm dòng
                  </Button>
                )}
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
      <Modal show={showSuggest} onHide={() => setShowSuggest(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Gợi ý nhập hàng từ cảnh báo tồn kho</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Các sản phẩm đang dưới mức tồn tối thiểu và chưa nằm trong đơn nháp
            hoặc đơn đã gửi. Số lượng gợi ý đưa tồn kho lên gấp đôi mức tối
            thiểu; bạn có thể chỉnh lại và nhập giá nhập trước khi lưu.
          </p>
          {suggestionGroups.map((g) => (
            <Card key={g.supplierId || "none"} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
                  <strong>{g.supplierName}</strong>
                  <Button
                    size="sm"
                    onClick={() => {
                      setError("");
                      setShowSuggest(false);
                      setForm({
                        supplierId: g.supplierId,
                        expectedDate: "",
                        items: g.items.map((i) => ({
                          productId: i.productId,
                          quantity: i.quantity,
                          unitPrice: i.unitPrice,
                        })),
                      });
                    }}
                  >
                    Tạo đơn nháp
                  </Button>
                </div>
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Tồn</th>
                      <th>Tối thiểu</th>
                      <th>Gợi ý nhập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((i) => (
                      <tr key={i.productId}>
                        <td>{i.productName}</td>
                        <td>{i.stockQuantity}</td>
                        <td>{i.reorderLevel}</td>
                        <td>{i.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ))}
          {!suggestionGroups.length && (
            <p className="ui-empty">Không có sản phẩm nào cần nhập thêm.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuggest(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={!!confirm} onHide={() => !busy && setConfirm(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đơn #{confirm?.purchaseOrderId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirm?.action === "receive"
            ? "Chỉ xác nhận khi đã nhận đủ hàng từ nhà cung cấp. Tồn kho sẽ được cộng đúng một lần."
            : confirm?.action === "send"
              ? "Xác nhận đặt đơn với nhà cung cấp. Sau đó, trạng thái sẽ chuyển thành chờ nhà cung cấp giao hàng."
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
