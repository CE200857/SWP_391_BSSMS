import { Button, Modal } from "react-bootstrap";
import "./StatusToggle.css";

// Huy hiệu trạng thái bấm được (giống danh sách nhân viên): bấm vào sẽ mở hộp thoại xác nhận đổi trạng thái.
export function StatusToggleButton({ active, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`status-toggle${active ? "" : " is-inactive"}`}
      onClick={onClick}
      disabled={disabled}
      title="Bấm để đổi trạng thái"
    >
      <i className={`bi ${active ? "bi-check-circle-fill" : "bi-pause-circle-fill"}`} aria-hidden="true" />
      {active ? "Đang hoạt động" : "Không hoạt động"}
    </button>
  );
}

// Hộp thoại "Xác nhận đổi trạng thái" dùng chung. entity: "dịch vụ" | "voucher"...; nextActive: trạng thái sẽ chuyển tới.
export function StatusChangeModal({ show, entity, name, nextActive, busy = false, onCancel, onConfirm }) {
  return (
    <Modal show={show} onHide={() => !busy && onCancel()} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="text-warning fw-bold">
          <i className="bi bi-arrow-repeat me-2" aria-hidden="true" /> Xác nhận đổi trạng thái
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Bạn có chắc chắn muốn chuyển trạng thái của {entity} <span className="fw-bold text-primary">{name}</span> sang{" "}
        <span className={`fw-bold ${nextActive ? "text-success" : "text-danger"}`}>
          {nextActive ? "Đang hoạt động" : "Không hoạt động"}
        </span>{" "}
        không?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Hủy bỏ
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={busy}>
          {busy ? "Đang xử lý…" : "Xác nhận"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
