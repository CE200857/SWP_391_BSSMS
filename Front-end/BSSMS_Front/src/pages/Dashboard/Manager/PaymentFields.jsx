import { Alert, Form } from "react-bootstrap";
import { money } from "../../../services/api";

const METHODS = [
  ["Cash", "Tiền mặt"],
  ["Bank Transfer", "Chuyển khoản"],
];

// Các ô trong hộp thoại "Thu tiền": hiện số cần thu, nhãn tiếng Việt, ô nào cần cho phương thức nào, và báo rõ thừa hoặc thiếu.
export default function PaymentFields({ action, setAction, invoice, busy }) {
  const due = Number(invoice?.outstandingAmount || 0);
  const received = Number(action.receivedAmount || 0);
  const isCash = action.paymentMethod === "Cash";
  const shortfall = Math.max(0, due - received);
  const change = isCash ? Math.max(0, received - due) : 0;
  const overTransfer = !isCash && received > due;

  const update = (patch) => setAction({ ...action, ...patch, requestKey: crypto.randomUUID() });

  return (
    <>
      <div
        className="d-flex justify-content-between align-items-center rounded px-3 py-2 mb-3"
        style={{ background: "#fdf2f5" }}
      >
        <span>Cần thu</span>
        <strong className="fs-5">{money(due)}</strong>
      </div>

      <Form.Group className="mb-3">
        <Form.Label>Phương thức</Form.Label>
        <Form.Select
          disabled={busy}
          value={action.paymentMethod}
          onChange={(e) => update({ paymentMethod: e.target.value, transactionCode: "" })}
        >
          {METHODS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group>
        <Form.Label>{isCash ? "Số tiền khách đưa (VND)" : "Số tiền đã chuyển (VND)"}</Form.Label>
        <Form.Control
          type="number"
          required
          min=".01"
          max={isCash ? undefined : due || undefined}
          step=".01"
          disabled={busy}
          value={action.receivedAmount}
          onChange={(e) => update({ receivedAmount: e.target.value })}
        />
      </Form.Group>

      {!isCash && (
        <Form.Group className="mt-3">
          <Form.Label>Mã giao dịch ngân hàng (nếu có)</Form.Label>
          <Form.Control
            disabled={busy}
            value={action.transactionCode || ""}
            onChange={(e) => setAction({ ...action, transactionCode: e.target.value })}
          />
        </Form.Group>
      )}

      <div className="mt-3">
        {overTransfer ? (
          <Alert variant="danger" className="mb-0 py-2">
            Số tiền chuyển lớn hơn số cần thu ({money(due)}). Hãy nhập đúng số tiền đã nhận.
          </Alert>
        ) : shortfall > 0 ? (
          <Alert variant="warning" className="mb-0 py-2">
            Thu một phần: còn thiếu <strong>{money(shortfall)}</strong>. Hóa đơn chưa thanh toán đủ.
          </Alert>
        ) : isCash ? (
          <p className="mb-0">
            Tiền thừa trả khách: <strong>{money(change)}</strong>
          </p>
        ) : (
          <p className="mb-0 text-success">Đủ số tiền cần thu.</p>
        )}
      </div>
    </>
  );
}
