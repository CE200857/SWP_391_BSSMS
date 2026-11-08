import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Button, Modal, Spinner } from "react-bootstrap";
import servicePhoto01 from "../../../assets/figma/service-card-exact-01.png";
import servicePhoto02 from "../../../assets/figma/service-card-exact-02.png";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import servicePhoto04 from "../../../assets/figma/service-card-exact-04.png";
import servicePhoto05 from "../../../assets/figma/service-card-exact-05.png";
import servicePhoto06 from "../../../assets/figma/service-card-exact-06.png";
import servicePhoto07 from "../../../assets/figma/service-card-exact-07.png";
import servicePhoto08 from "../../../assets/figma/service-card-exact-08.png";
import servicePhoto09 from "../../../assets/figma/service-card-exact-09.png";
import servicePhoto10 from "../../../assets/figma/service-card-exact-10.png";
import servicePhoto11 from "../../../assets/figma/service-card-exact-11.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import { StatusToggleButton, StatusChangeModal } from "../../../components/StatusToggle";

const servicePhotos = [
  servicePhoto01,
  servicePhoto02,
  servicePhoto03,
  servicePhoto04,
  servicePhoto05,
  servicePhoto06,
  servicePhoto07,
  servicePhoto08,
  servicePhoto09,
  servicePhoto10,
  servicePhoto11,
];

const ServiceList = ({ user }) => {
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [statusTarget, setStatusTarget] = useState(null); // dịch vụ đang chờ xác nhận đổi trạng thái
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState(
    location.state?.serviceNotice || "",
  );

  // 1. THÊM BIẾN REFRESH ĐỂ KÍCH HOẠT LOAD LẠI DATA
  const [refresh, setRefresh] = useState(0);

  // Lấy thông tin user để phân quyền hiển thị nút bấm
  const isManager = user?.role === "Manager";
  const isStaff = ["Manager", "Receptionist", "Technician"].includes(
    user?.role,
  );
  const isGuest = !user; // Nếu không có user thì là khách vãng lai
  const { filteredRows: staffServices, toolbar } = useManagerSearchFilter(
    services,
    [
      { key: "serviceId", label: "Mã dịch vụ", filterable: false },
      { key: "serviceName", label: "Dịch vụ", filterable: false },
      {
        key: "status",
        label: "Trạng thái",
        formatValue: (value) => value === "Active" ? "Đang hoạt động" : "Ngừng hoạt động",
      },
      {
        key: "priceRange",
        label: "Mức giá",
        getValue: (service) => Number(service.price) < 500000
          ? "under500"
          : Number(service.price) <= 1000000 ? "500to1m" : "over1m",
        formatValue: (value) => ({
          under500: "Dưới 500.000 đ",
          "500to1m": "500.000 – 1.000.000 đ",
          over1m: "Trên 1.000.000 đ",
        }[value]),
      },
      {
        key: "durationRange",
        label: "Thời lượng",
        getValue: (service) => Number(service.duration) < 60
          ? "under60"
          : Number(service.duration) <= 90 ? "60to90" : "over90",
        formatValue: (value) => ({
          under60: "Dưới 60 phút",
          "60to90": "60 – 90 phút",
          over90: "Trên 90 phút",
        }[value]),
      },
    ],
    "Tìm theo tên hoặc mã dịch vụ...",
  );

  const filteredServices = services.filter((service) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      String(service.serviceId).toLowerCase().includes(search) ||
      service.serviceName?.toLowerCase().includes(search);
    const price = Number(service.price);
    const duration = Number(service.duration);
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under500" && price < 500000) ||
      (priceFilter === "500to1m" && price >= 500000 && price <= 1000000) ||
      (priceFilter === "over1m" && price > 1000000);
    const matchesDuration =
      durationFilter === "all" ||
      (durationFilter === "under60" && duration < 60) ||
      (durationFilter === "60to90" && duration >= 60 && duration <= 90) ||
      (durationFilter === "over90" && duration > 90);
    return matchesSearch && matchesPrice && matchesDuration;
  });

  // 2. ĐƯA TOÀN BỘ LOGIC GỌI API VÀO TRONG useEffect
  useEffect(() => {
    const controller = new AbortController();
    const fetchServices = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await axios.get("/api/service", { signal: controller.signal });
        if (!Array.isArray(response.data)) throw new Error("Dữ liệu dịch vụ không hợp lệ.");
        if (controller.signal.aborted) return;
        setServices(response.data);
        setLoadError(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Lỗi tải danh sách:", error);
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchServices();
    return () => controller.abort();
  }, [refresh]); // <-- Lắng nghe biến refresh. Mỗi lần biến này đổi, API sẽ tự động gọi lại.

  if (!isStaff) {
    const publicServices = filteredServices.filter(
      (service) => service.status === "Active",
    );

    return (
      <main className="public-service-page">
        <section className="public-service-hero">
          <div className="public-service-hero-copy">
            <span className="seoul-eyebrow">TRẢI NGHIỆM · DỊCH VỤ</span>
            <h1>Dành thời gian cho chính mình.</h1>
            <p>
              Từ buổi thư giãn đến chăm sóc sắc đẹp, tìm dịch vụ phù hợp với bạn
              tại Seoul Center.
            </p>
            <span className="public-service-hero-note">
              <i className="bi bi-heart" aria-hidden="true" /> Tư vấn tận tâm ·
              Không cần đăng nhập
            </span>
          </div>
          <img src={servicePhoto01} alt="Chăm sóc da tại Seoul Center" />
        </section>

        <section className="public-service-content">
          <div className="public-service-filter-card">
            <div className="public-service-filter-title">
              <strong>
                <i className="bi bi-sliders" aria-hidden="true" /> Tìm dịch vụ
                dành cho bạn
              </strong>
              <span>Được tư vấn theo nhu cầu của bạn</span>
            </div>
            <label className="public-service-search">
              <span className="visually-hidden">Tìm kiếm dịch vụ</span>
              <i className="bi bi-search" aria-hidden="true" />
              <input
                type="search"
                placeholder="Tìm theo tên hoặc ID dịch vụ..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label>
              <span>Giá tiền</span>
              <select
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value)}
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under500">Dưới 500.000 đ</option>
                <option value="500to1m">500.000 – 1.000.000 đ</option>
                <option value="over1m">Trên 1.000.000 đ</option>
              </select>
            </label>
            <label>
              <span>Thời lượng</span>
              <select
                value={durationFilter}
                onChange={(event) => setDurationFilter(event.target.value)}
              >
                <option value="all">Tất cả thời lượng</option>
                <option value="under60">Dưới 60 phút</option>
                <option value="60to90">60 – 90 phút</option>
                <option value="over90">Trên 90 phút</option>
              </select>
            </label>
          </div>

          <div className="public-service-list-heading">
            <div>
              <h2>Khám phá dịch vụ</h2>
              <span className="public-service-count">
                {loading ? "Đang tải…" : `${publicServices.length} dịch vụ`}
              </span>
            </div>
            <span className="public-service-updated">
              Hiển thị dịch vụ đang hoạt động
            </span>
          </div>

          {loading && services.length === 0 ? <div className="public-service-state" role="status">Đang tải danh sách dịch vụ…</div> : loadError ? (
            <div className="public-service-state" role="alert">
              <i className="bi bi-wifi-off" aria-hidden="true" />
              <strong>Không tải được danh sách dịch vụ</strong>
              <span>Hãy kiểm tra kết nối rồi thử lại.</span>
              <button
                type="button"
                onClick={() => setRefresh((value) => value + 1)}
              >
                Thử lại
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className="public-service-state">
              <i className="bi bi-flower1" aria-hidden="true" />
              <strong>Chưa có dịch vụ để hiển thị</strong>
              <span>Vui lòng quay lại sau.</span>
            </div>
          ) : publicServices.length === 0 ? (
            <div className="public-service-state">
              <i className="bi bi-search" aria-hidden="true" />
              <strong>Không tìm thấy dịch vụ phù hợp</strong>
              <span>Thử thay đổi từ khóa hoặc bộ lọc.</span>
            </div>
          ) : (
            <div className="public-service-grid">
              {publicServices.map((service) => {
                const imageIndex =
                  Math.max(
                    0,
                    services.findIndex(
                      (item) => item.serviceId === service.serviceId,
                    ),
                  ) % servicePhotos.length;

                return (
                  <article
                    className="public-service-card"
                    key={service.serviceId}
                  >
                    <Link
                      to={
                        isGuest
                          ? `/guest/services/${service.serviceId}`
                          : `/services/detail/${service.serviceId}`
                      }
                      className="public-service-card-image"
                      aria-label={`Xem dịch vụ ${service.serviceName}`}
                    >
                      <img src={service.imageUrl || servicePhotos[imageIndex]} alt="" loading="lazy" decoding="async" onLoad={(event) => event.currentTarget.classList.add("is-loaded")} onError={(event) => event.currentTarget.classList.add("is-loaded")} />
                    </Link>
                    <div className="public-service-card-body">
                      <span className="public-service-code">
                        ID {service.serviceId}
                      </span>
                      <h3>{service.serviceName}</h3>
                      <div className="public-service-card-meta">
                        <strong>
                          {Number(service.price).toLocaleString("vi-VN")}{" "}
                          <small>VNĐ</small>
                        </strong>
                        <span>
                          <i className="bi bi-clock" aria-hidden="true" />{" "}
                          {service.duration} phút
                        </span>
                      </div>
                      <Link
                        to={
                          isGuest
                            ? `/guest/services/${service.serviceId}`
                            : `/services/detail/${service.serviceId}`
                        }
                        className="public-service-detail-link"
                      >
                        Xem chi tiết{" "}
                        <i
                          className="bi bi-arrow-up-right"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="public-service-footnote">
            Giá niêm yết bằng VNĐ · Thời lượng tính bằng phút · Thông tin được
            xác nhận trước khi đặt lịch.
          </p>
          <div className="public-service-cta">
            <span>
              <i className="bi bi-stars" aria-hidden="true" /> BẠN MUỐN ĐƯỢC TƯ
              VẤN?
            </span>
            <h2>Bạn chưa biết bắt đầu từ đâu?</h2>
            <p>
              Chia sẻ nhu cầu của bạn, đội ngũ Seoul Center sẽ giúp bạn lựa chọn
              trải nghiệm phù hợp.
            </p>
            <a
              href="tel:+84914269346"
              className="home-button home-button-white"
            >
              Liên hệ tư vấn{" "}
              <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    );
  }

  const handleDelete = (service) => {
    setDeleteError("");
    setServiceToDelete(service);
  };

  // Bấm vào trạng thái -> hộp thoại xác nhận -> đổi trạng thái hoạt động / ngừng hoạt động của dịch vụ.
  const confirmStatusChange = async () => {
    if (!statusTarget || statusBusy) return;
    const next = statusTarget.status === "Active" ? "Inactive" : "Active";
    setStatusBusy(true);
    try {
      await axios.put(`/api/service?id=${statusTarget.serviceId}`, { ...statusTarget, status: next });
      setActionNotice(
        `Dịch vụ "${statusTarget.serviceName}" ${next === "Active" ? "đã được kích hoạt lại" : "đã chuyển sang ngừng hoạt động"}.`,
      );
      setRefresh((prev) => prev + 1);
      setStatusTarget(null);
    } catch (error) {
      const message = error.response?.data?.message;
      alert(typeof message === "string" ? message : "Không đổi được trạng thái dịch vụ.");
    } finally {
      setStatusBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!serviceToDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await axios.delete(`/api/service?id=${serviceToDelete.serviceId}`);
      setServiceToDelete(null);
      setActionNotice(
        `Đã xóa dịch vụ "${serviceToDelete.serviceName}".`,
      );
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa dịch vụ:", error);
      const message = error.response?.data?.message;
      setDeleteError(
        typeof message === "string"
          ? message
          : "Không thể xóa dịch vụ. Vui lòng thử lại.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Danh sách dịch vụ</h2>
      {actionNotice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {actionNotice}
          <button
            type="button"
            className="btn-close"
            aria-label="Đóng thông báo"
            onClick={() => setActionNotice("")}
          />
        </div>
      )}
      {loadError && <div className="alert alert-danger" role="alert">Không tải được danh sách dịch vụ. <button className="btn btn-sm btn-outline-danger" onClick={() => setRefresh(n => n + 1)}>Thử lại</button></div>}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div className="manager-list-toolbar">{toolbar}</div>

        {/* CHỈ MANAGER MỚI THẤY NÚT THÊM MỚI */}
        {isManager && (
          <Link to="/services/new" className="btn btn-primary ms-auto">
            Thêm dịch vụ mới
          </Link>
        )}
      </div>

      <p className="d-md-none small text-muted">Kéo ngang bảng để xem đầy đủ thông tin và thao tác.</p>
      <div className="table-responsive" tabIndex={0} aria-label="Danh sách dịch vụ, có thể cuộn ngang">
        <table className="table table-hover align-middle mb-0 manager-list-table">
          <thead className="table-dark">
            <tr>
              <th>Tên dịch vụ</th>
              <th>Giá (VNĐ)</th>
              <th>Thời lượng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {staffServices.length > 0 ? (
              staffServices.map((s) => (
                <tr key={s.serviceId}>
                  <td>{s.serviceName}</td>
                  <td>{Number(s.price).toLocaleString("vi-VN")}</td>
                  <td>{s.duration}</td>
                  <td>
                    {isManager ? (
                      <StatusToggleButton active={s.status === "Active"} onClick={() => setStatusTarget(s)} />
                    ) : (
                      <span className={`badge ${s.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                        {s.status === "Active"
                          ? "Đang hoạt động"
                          : s.status === "Inactive"
                            ? "Ngừng hoạt động"
                            : s.status}
                      </span>
                    )}
                  </td>
                  <td><div className="manager-list-actions">
                    {/* 1. NÚT XEM CHI TIẾT DÀNH CHO TẤT CẢ MỌI NGƯỜI */}
                    <Link
                      to={
                        isGuest
                          ? `/guest/services/${s.serviceId}`
                          : `/services/detail/${s.serviceId}`
                      }
                      className="manager-list-action manager-list-action--view"
                    >
                      <i className="bi bi-eye-fill" aria-hidden="true" /> Xem
                    </Link>

                    {/* 2. NÚT SỬA/XÓA CHỈ DÀNH RIÊNG CHO MANAGER */}
                    {isManager && (
                      <>
                        <Link
                          to={`/services/edit/${s.serviceId}`}
                          className="manager-list-action manager-list-action--edit"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true" />
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(s)}
                          className="manager-list-action manager-list-action--delete"
                          aria-label={`Xóa dịch vụ ${s.serviceName}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                          Xóa
                        </button>
                      </>
                    )}
                  </div></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted py-4">
                  {loading ? "Đang tải danh sách dịch vụ…" : loadError
                    ? "Không tải được danh sách dịch vụ. Hãy kiểm tra backend và thử tải lại."
                    : services.length === 0
                      ? "Chưa có dịch vụ nào."
                      : "Không tìm thấy dịch vụ phù hợp."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        show={Boolean(serviceToDelete)}
        onHide={() => {
          if (!deleting) setServiceToDelete(null);
        }}
        centered
        aria-labelledby="delete-service-title"
      >
        <Modal.Header closeButton={!deleting}>
          <Modal.Title id="delete-service-title">
            Xác nhận xóa dịch vụ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <div className="alert alert-danger mb-3" role="alert">
              {deleteError}
            </div>
          )}
          <p className="mb-2">
            Bạn có chắc muốn <strong>xóa vĩnh viễn</strong> dịch vụ{" "}
            <strong>{serviceToDelete?.serviceName}</strong>?
          </p>
          <p className="text-muted small mb-0">
            Thao tác không thể hoàn tác. Dịch vụ đã có lịch hẹn, hóa đơn, gói liệu
            trình hoặc đánh giá thì không xóa được; khi đó hãy bấm "Ngừng" để chuyển
            sang không hoạt động.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setServiceToDelete(null)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Đang xử lý
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2" aria-hidden="true" />
                Xóa vĩnh viễn
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <StatusChangeModal
        show={Boolean(statusTarget)}
        entity="dịch vụ"
        name={statusTarget?.serviceName}
        nextActive={statusTarget?.status !== "Active"}
        busy={statusBusy}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default ServiceList;
