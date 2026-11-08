import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Badge,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";

const CustomerList = ({ user }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/customers",
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Lỗi kết nối đến Backend:", error);
      }
    };
    fetchData();
  }, [refresh]);

  const handleShowModal = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(
        `/api/customers?id=${selectedCustomer.customerId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setRefresh((prev) => prev + 1);
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.message || "Lỗi: Không thể xóa khách hàng này.");
      }
    } finally {
      handleCloseModal();
    }
  };

  const { filteredRows: filteredCustomers, toolbar } = useManagerSearchFilter(
    customers,
    [
      { key: "fullName", label: "Khách hàng" },
      { key: "customerId", label: "Mã khách hàng", filterable: false },
      { key: "phone", label: "Số điện thoại", filterable: false },
      { key: "email", label: "Email", filterable: false },
      {
        key: "status",
        label: "Trạng thái",
        formatValue: (value) => value === "Active" ? "Đang hoạt động" : "Không hoạt động",
      },
    ],
    "Tìm theo tên, email, số điện thoại...",
  );

  return (
    <Container fluid className="mt-4 px-4">
        <h2 className="manager-page-title fw-bold mb-4">Danh sách khách hàng</h2>

      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div className="manager-list-toolbar">{toolbar}</div>
        {user?.role === "Receptionist" && (
            <Button
              variant="danger"
              onClick={() => navigate("/receptionist/create-walkin")}
            >
              <i className="bi bi-person-plus-fill me-1"></i> Tạo tài khoản khách hàng
            </Button>
        )}
      </div>

      <Table hover responsive className="align-middle manager-list-table customer-admin-list">
        <thead className="table-dark">
          <tr>
            <th>Họ và Tên</th>
            <th>Số điện thoại</th>
            <th>Trạng thái</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((c) => (
              <tr key={c.customerId}>
                <td>
                  <strong>{c.fullName}</strong>
                  <div className="small text-muted">#{c.customerId}</div>
                </td>
                <td>{c.phone}</td>
                <td>
                  {c.status === "Active" ? (
                    <Badge bg="success">Đang hoạt động</Badge>
                  ) : (
                    <Badge bg="danger">Không hoạt động</Badge>
                  )}
                </td>
                <td className="text-center">
                  <div className="manager-list-actions customer-admin-actions">
                  <Button
                    variant="link"
                    size="sm"
                    className="manager-list-action manager-list-action--view"
                    onClick={() => setDetailCustomer(c)}
                    aria-label={`Xem khách hàng ${c.fullName}`}
                  >
                    <i className="bi bi-eye-fill me-1" aria-hidden="true" />
                    Xem
                  </Button>
                  {(user?.role === "Manager" ||
                    user?.role === "Receptionist") && (
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--view"
                      onClick={() => navigate(`/treatment-profile/${c.customerId}`)}
                      aria-label={`Xem gói liệu trình và số buổi của ${c.fullName}`}
                    >
                      <i className="bi bi-box-seam" aria-hidden="true" /> Liệu trình
                    </Button>
                  )}
                  {(user?.role === "Manager" ||
                    user?.role === "Receptionist") && (
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--edit"
                      onClick={() => navigate(`/customers/edit/${c.customerId}`)}
                      aria-label={`Sửa khách hàng ${c.fullName}`}
                    >
                      <i className="bi bi-pencil-square" aria-hidden="true" /> Sửa
                    </Button>
                  )}
                  {user?.role === "Manager" && (
                    <Button
                      variant="link"
                      size="sm"
                      className="manager-list-action manager-list-action--delete"
                      onClick={() => handleShowModal(c)}
                      aria-label={`Xóa khách hàng ${c.fullName}`}
                    >
                      <i className="bi bi-trash" aria-hidden="true" /> Xóa
                    </Button>
                  )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                Không tìm thấy khách hàng nào.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal
        className="customer-detail-modal"
        show={!!detailCustomer}
        onHide={() => setDetailCustomer(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-vcard" aria-hidden="true" />
            Thông tin khách hàng
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <dl className="customer-detail-grid">
            <dt>Mã khách hàng</dt>
            <dd>#{detailCustomer?.customerId || "—"}</dd>
            <dt>Họ và tên</dt>
            <dd>{detailCustomer?.fullName || "—"}</dd>
            <dt>Số điện thoại</dt>
            <dd>{detailCustomer?.phone || "—"}</dd>
            <dt>Email</dt>
            <dd>{detailCustomer?.email || "—"}</dd>
            <dt>Trạng thái</dt>
            <dd>
              {detailCustomer?.status ? (
                <Badge bg={detailCustomer.status === "Active" ? "success" : "secondary"}>
                  {detailCustomer.status === "Active" ? "Đang hoạt động" : "Không hoạt động"}
                </Badge>
              ) : "—"}
            </dd>
          </dl>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setDetailCustomer(null)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Xác nhận xóa tài khoản
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn <strong>xóa vĩnh viễn</strong> khách hàng{" "}
          <span className="fw-bold text-primary">
            {selectedCustomer?.fullName}
          </span>{" "}
          không? Thao tác này không thể hoàn tác. Khách đã có lịch hẹn, hóa đơn
          hoặc gói liệu trình thì không xóa được; khi đó hãy bấm <strong>Sửa</strong> và
          đổi trạng thái sang "Không hoạt động".
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Hủy bỏ
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Xóa vĩnh viễn
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CustomerList;
