import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";
import { api, money } from "../../../services/api";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
const empty = {
  productName: "",
  description: "",
  productType: "Retail",
  unit: "cái",
  unitPrice: 0,
  stockQuantity: 0,
  reorderLevel: 10,
  status: "Active",
};
export default function ProductList({ user }) {
  const manager = user?.role === "Manager";
  const [rows, setRows] = useState([]),
    [form, setForm] = useState(null),
    [detailProduct, setDetailProduct] = useState(null),
    [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      setRows(await api("/api/products"));
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
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/products", {
        method: form.productId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setForm(null);
      setSuccess("Đã lưu sản phẩm.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function deactivate() {
    setBusy(true);
    try {
      await api(`/api/products?id=${confirm.productId}`, { method: "DELETE" });
      setConfirm(null);
      setSuccess("Đã ngừng kinh doanh sản phẩm.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (label, key, type = "text", props = {}) => (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        value={form[key] ?? ""}
        required
        onChange={(e) =>
          setForm({
            ...form,
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          })
        }
        {...props}
      />
    </Form.Group>
  );
  const { filteredRows, toolbar } = useManagerSearchFilter(
    rows,
    [
      { key: "productName", label: "Sản phẩm", filterable: false },
      { key: "description", label: "Mô tả", filterable: false },
      {
        key: "productType",
        label: "Loại sản phẩm",
        formatValue: (value) => value === "Retail" ? "Bán lẻ" : "Tiêu hao",
      },
      {
        key: "status",
        label: "Trạng thái",
        formatValue: (value) => value === "Active" ? "Đang kinh doanh" : "Ngừng kinh doanh",
      },
      {
        key: "stockState",
        label: "Tình trạng tồn kho",
        getValue: (product) =>
          Number(product.stockQuantity) < Number(product.reorderLevel)
            ? "Low"
            : "Available",
        formatValue: (value) => value === "Low" ? "Dưới mức tồn tối thiểu" : "Đủ tồn kho",
      },
    ],
    "Tìm theo tên sản phẩm, mô tả...",
  );
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Sản phẩm & vật tư</h1>
          <p>Danh mục bán lẻ, vật tư tiêu hao và mức tồn tối thiểu.</p>
        </div>
        {manager && (
          <Button
            onClick={() => {
              setError("");
              setForm({ ...empty });
            }}
          >
            Thêm sản phẩm
          </Button>
        )}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <div className="ui-toolbar">
        <div className="manager-list-toolbar">{toolbar}</div>
        {manager && (
          <>
            <Link
              className="btn btn-outline-primary"
              to="/manager/purchase-orders"
            >
              Đơn nhập hàng
            </Link>
            <Link className="btn btn-outline-primary" to="/manager/stock">
              Điều chỉnh tồn kho
            </Link>
          </>
        )}
      </div>
      <Card>
        <Card.Body>
          {loading ? (
            <div className="ui-empty">
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="manager-list-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                      <tr key={r.productId}>
                        <td>
                          <strong>{r.productName}</strong>
                          <div className="text-muted small">
                            {r.productType === "Retail" ? "Bán lẻ" : "Tiêu hao"}
                          </div>
                        </td>
                        <td>{money(r.unitPrice)}</td>
                        <td
                          className={
                            r.stockQuantity < r.reorderLevel
                              ? "text-danger fw-bold"
                              : ""
                          }
                        >
                          {r.stockQuantity} {r.unit}
                        </td>
                        <td>{r.status}</td>
                        <td>
                          <div className="manager-list-actions">
                            <Button
                              size="sm"
                              variant="link"
                              className="manager-list-action manager-list-action--view"
                              onClick={() => setDetailProduct(r)}
                            >
                              <i className="bi bi-eye-fill" aria-hidden="true" /> Xem
                            </Button>
                            {manager && (
                              <>
                              <Button
                                size="sm"
                                variant="link"
                                className="manager-list-action manager-list-action--edit"
                                onClick={() => {
                                  setError("");
                                  setForm({ ...r });
                                }}
                              >
                                <i className="bi bi-pencil-square" aria-hidden="true" />
                                Sửa
                              </Button>
                              {r.status === "Active" && (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="manager-list-action manager-list-action--delete"
                                  onClick={() => setConfirm(r)}
                                >
                                  <i className="bi bi-trash" aria-hidden="true" />
                                  Ngừng bán
                                </Button>
                              )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              {!rows.length && <p className="ui-empty">Chưa có sản phẩm.</p>}
            </div>
          )}
        </Card.Body>
      </Card>
      <Modal
        show={!!detailProduct}
        onHide={() => setDetailProduct(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <dl className="row mb-0">
            <dt className="col-sm-5">Tên sản phẩm</dt>
            <dd className="col-sm-7">{detailProduct?.productName || "—"}</dd>
            <dt className="col-sm-5">Mô tả</dt>
            <dd className="col-sm-7">{detailProduct?.description || "—"}</dd>
            <dt className="col-sm-5">Loại</dt>
            <dd className="col-sm-7">
              {detailProduct?.productType === "Retail" ? "Bán lẻ" : "Tiêu hao"}
            </dd>
            <dt className="col-sm-5">Đơn vị</dt>
            <dd className="col-sm-7">{detailProduct?.unit || "—"}</dd>
            <dt className="col-sm-5">Mức tồn tối thiểu</dt>
            <dd className="col-sm-7">{detailProduct?.reorderLevel ?? "—"}</dd>
          </dl>
        </Modal.Body>
      </Modal>
      <Modal
        show={!!form}
        onHide={() => !busy && setForm(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton={!busy}>
          <Modal.Title>
            {form?.productId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={save}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {form && (
              <fieldset disabled={busy}>
                <div className="ui-form-grid">
                  {field("Tên sản phẩm", "productName", "text", {
                    maxLength: 150,
                  })}
                  {field("Mô tả", "description", "text", { required: false })}
                  <Form.Group>
                    <Form.Label>Loại sản phẩm</Form.Label>
                    <Form.Select
                      value={form.productType}
                      onChange={(e) =>
                        setForm({ ...form, productType: e.target.value })
                      }
                    >
                      <option value="Retail">Bán lẻ</option>
                      <option value="Consumable">Tiêu hao</option>
                    </Form.Select>
                  </Form.Group>
                  {field("Đơn vị", "unit", "text", { maxLength: 30 })}
                  {field("Đơn giá", "unitPrice", "number", {
                    min: 0,
                    step: 0.01,
                  })}
                  {field("Tồn kho ban đầu", "stockQuantity", "number", {
                    min: 0,
                    step: 0.001,
                    disabled: !!form.productId,
                  })}
                  {field("Mức tồn tối thiểu", "reorderLevel", "number", {
                    min: 0,
                    step: 0.001,
                  })}
                  <Form.Group>
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="Active">Hoạt động</option>
                      <option value="Inactive">Ngừng bán</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                {form.productId && (
                  <p className="text-muted mt-3">
                    Thay đổi số lượng tại chức năng Điều chỉnh tồn kho để lưu lý
                    do và lịch sử.
                  </p>
                )}
              </fieldset>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setForm(null)}
              disabled={busy}
            >
              Đóng
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={!!confirm} onHide={() => !busy && setConfirm(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ngừng kinh doanh</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Ngừng bán “{confirm?.productName}”? Lịch sử giao dịch được giữ lại.
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Quay lại
          </Button>
          <Button variant="danger" disabled={busy} onClick={deactivate}>
            Ngừng bán
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
