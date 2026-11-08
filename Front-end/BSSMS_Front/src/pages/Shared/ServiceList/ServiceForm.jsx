import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import servicePhoto from "../../../assets/figma/service-card-exact-02.png";
import { imageFileToUpload } from "../../../utils/imageUpload";

const initialFormData = {
  serviceName: "",
  description: "",
  price: "",
  duration: "",
  status: "Active",
};

const statusLabels = {
  Active: "Đang hoạt động",
  Inactive: "Ngừng hoạt động",
};

const getRequestErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message || error.response?.data?.error;
  return typeof message === "string" ? message : fallback;
};

const ServiceForm = ({ isReadOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUpload, setImageUpload] = useState(null); // ảnh mới đã thu nhỏ, chờ lưu
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";
  const isEditing = Boolean(id);
  const requestKey = id ? `${id}:${loadAttempt}` : null;
  const loading = Boolean(id) && loadedRequestKey !== requestKey;

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    axios
      .get(`/api/service?id=${id}`)
      .then((response) => {
        if (cancelled) return;
        const service = response.data;
        setLoadError("");
        setImageUrl(service.imageUrl || "");
        setFormData({
          serviceName: service.serviceName || "",
          description: service.description || "",
          price: service.price ?? "",
          duration: service.duration ?? "",
          status: service.status || "Active",
        });
      })
      .catch((error) => {
        console.error("Lỗi lấy dữ liệu dịch vụ:", error);
        if (!cancelled) {
          setLoadError(
            getRequestErrorMessage(
              error,
              "Không thể tải thông tin dịch vụ. Vui lòng thử lại.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedRequestKey(`${id}:${loadAttempt}`);
      });

    return () => {
      cancelled = true;
    };
  }, [id, loadAttempt]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setSaveError("");
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    try {
      setImageUpload(await imageFileToUpload(file));
      setRemoveImage(false);
    } catch (error) {
      setImageUpload(null);
      setImageError(error.message || "Không xử lý được ảnh.");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveError("");
    const payload = {
      ...formData,
      serviceName: formData.serviceName.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      duration: Number(formData.duration),
    };

    try {
      let serviceId = id;
      if (isEditing) {
        await axios.put(`/api/service?id=${id}`, payload);
      } else {
        const response = await axios.post("/api/service", payload);
        serviceId = response.data?.serviceId;
      }

      // Ảnh dịch vụ: tải ảnh mới lên hoặc xóa ảnh hiện tại (dịch vụ đã được lưu trước)
      let imageNotice = "";
      try {
        if (serviceId && imageUpload) {
          await axios.post(`/api/service-image/${serviceId}`, imageUpload);
        } else if (serviceId && isEditing && removeImage) {
          await axios.delete(`/api/service-image/${serviceId}`);
        }
      } catch (imageErr) {
        imageNotice = ` Nhưng chưa lưu được ảnh: ${getRequestErrorMessage(imageErr, "lỗi tải ảnh")}.`;
      }

      navigate("/services", {
        replace: true,
        state: {
          serviceNotice:
            (isEditing ? "Đã cập nhật thông tin dịch vụ." : "Đã thêm dịch vụ mới.") + imageNotice,
        },
      });
    } catch (error) {
      console.error("Lỗi lưu dịch vụ:", error);
      setSaveError(
        getRequestErrorMessage(
          error,
          "Không thể lưu dịch vụ. Vui lòng kiểm tra thông tin và thử lại.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isReadOnly && !isManager) {
    return (
      <main className="public-service-detail-page">
        <section className="customer-page-banner">
          <div className="customer-page-container">
            <div className="customer-breadcrumb">
              <Link to="/bssms-guest">Trang chủ</Link>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <Link to="/guest/services">Danh sách dịch vụ</Link>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <strong>Chi tiết dịch vụ</strong>
            </div>
            <div className="public-detail-banner-title">
              <h1>Chi tiết dịch vụ</h1>
              <button type="button" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left" aria-hidden="true" /> Quay lại
              </button>
            </div>
          </div>
        </section>
        <section className="public-detail-content">
          {loading ? (
            <div className="customer-empty-state" role="status">
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
              <strong>Đang tải thông tin dịch vụ</strong>
            </div>
          ) : loadError ? (
            <div className="customer-empty-state" role="alert">
              <i className="bi bi-wifi-off" aria-hidden="true" />
              <strong>{loadError}</strong>
              <button
                type="button"
                className="home-button home-button-white"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              >
                Thử tải lại
              </button>
              <Link className="home-button home-button-white" to="/guest/services">
                Quay lại danh sách
              </Link>
            </div>
          ) : (
            <div className="public-detail-grid">
              <div className="public-detail-image">
                <img
                  src={imageUrl || servicePhoto}
                  alt={`Trải nghiệm dịch vụ ${formData.serviceName}`}
                  loading="lazy"
                  decoding="async"
                  onLoad={(event) =>
                    event.currentTarget.classList.add("is-loaded")
                  }
                  onError={(event) =>
                    event.currentTarget.classList.add("is-loaded")
                  }
                />
                <div>
                  <span>SEOUL CENTER · SALON &amp; SPA</span>
                  <small>Hình ảnh dịch vụ mang tính minh họa.</small>
                </div>
              </div>
              <div className="public-detail-copy">
                <span className="home-eyebrow">DỊCH VỤ</span>
                <h2>{formData.serviceName}</h2>
                <span className="public-detail-description-label">Mô tả</span>
                <p>
                  {formData.description ||
                    "Thông tin chi tiết sẽ được tư vấn theo nhu cầu của bạn."}
                </p>
                <div className="public-detail-facts">
                  <span>
                    <small>Giá tiền</small>
                    <strong>
                      {Number(formData.price || 0).toLocaleString("vi-VN")} VNĐ
                    </strong>
                  </span>
                  <span>
                    <small>Thời lượng</small>
                    <strong>
                      <i className="bi bi-clock" aria-hidden="true" />{" "}
                      {formData.duration || 0} phút
                    </strong>
                  </span>
                </div>
                <Link
                  className="home-button home-button-primary public-detail-booking"
                  to={
                    ["Technician", "Manager"].includes(user?.role)
                      ? "/appointments"
                      : `/slots?serviceId=${encodeURIComponent(id)}`
                  }
                >
                  <i className="bi bi-calendar2-check" aria-hidden="true" />{" "}
                  {["Technician", "Manager"].includes(user?.role)
                    ? "Xem lịch hẹn"
                    : user
                      ? "Xem lịch trống và đặt lịch"
                      : "Đăng nhập để đặt lịch"}
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  const pageTitle = isReadOnly
    ? "Chi tiết dịch vụ"
    : isEditing
      ? "Chỉnh sửa dịch vụ"
      : "Thêm dịch vụ mới";

  return (
    <main className="service-admin-page">
      <nav className="service-admin-breadcrumb" aria-label="Điều hướng">
        <Link to="/services">Quản lý dịch vụ</Link>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span>{pageTitle}</span>
      </nav>

      <header className="service-admin-header">
        <span className="service-admin-eyebrow">
          <i className="bi bi-stars" aria-hidden="true" /> DANH MỤC DỊCH VỤ
        </span>
        <h1>{pageTitle}</h1>
        <p>
          {isReadOnly
            ? "Xem thông tin và trạng thái hiện tại của dịch vụ."
            : isEditing
              ? "Cập nhật thông tin để khách hàng và nhân viên luôn có dữ liệu chính xác."
              : "Bổ sung dịch vụ mới vào danh mục để khách hàng có thể tìm hiểu và đặt lịch."}
        </p>
      </header>

      {loading ? (
        <section className="service-admin-state" role="status">
          <Spinner animation="border" size="sm" />
          <span>Đang tải thông tin dịch vụ...</span>
        </section>
      ) : loadError ? (
        <section className="service-admin-state service-admin-state--error" role="alert">
          <i className="bi bi-wifi-off" aria-hidden="true" />
          <span>{loadError}</span>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Thử tải lại
          </button>
        </section>
      ) : isReadOnly ? (
        <section className="service-admin-detail-card">
          <div className="service-admin-detail-top">
            <span className="service-admin-eyebrow">THÔNG TIN DỊCH VỤ</span>
            <span
              className={`service-admin-status service-admin-status--${String(
                formData.status,
              ).toLowerCase()}`}
            >
              <span aria-hidden="true" />
              {statusLabels[formData.status] || formData.status}
            </span>
          </div>
          <h2>{formData.serviceName}</h2>
          <p className="service-admin-detail-description">
            {formData.description || "Dịch vụ chưa có mô tả."}
          </p>
          <div className="service-admin-facts">
            <div>
              <span>
                <i className="bi bi-cash-coin" aria-hidden="true" /> Giá dịch vụ
              </span>
              <strong>
                {Number(formData.price || 0).toLocaleString("vi-VN")} VNĐ
              </strong>
            </div>
            <div>
              <span>
                <i className="bi bi-clock" aria-hidden="true" /> Thời lượng
              </span>
              <strong>{formData.duration || 0} phút</strong>
            </div>
          </div>
          <div className="service-admin-actions">
            <Link to="/services" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2" aria-hidden="true" />
              Danh sách dịch vụ
            </Link>
            {isManager && (
              <Link
                to={`/services/edit/${id}`}
                className="btn btn-primary"
              >
                <i className="bi bi-pencil-square me-2" aria-hidden="true" />
                Chỉnh sửa
              </Link>
            )}
          </div>
        </section>
      ) : (
        <div className="service-admin-content">
          <section className="service-admin-form-card">
            <div className="service-admin-card-heading">
              <span className="service-admin-card-icon">
                <i
                  className={`bi ${isEditing ? "bi-pencil-square" : "bi-plus-lg"}`}
                  aria-hidden="true"
                />
              </span>
              <div>
                <h2>{isEditing ? "Cập nhật thông tin" : "Thông tin dịch vụ"}</h2>
                <p>Các trường có dấu * là bắt buộc.</p>
              </div>
            </div>

            {saveError && (
              <div className="alert alert-danger" role="alert">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="service-admin-form-grid">
                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="serviceName">Tên dịch vụ *</label>
                  <input
                    id="serviceName"
                    className="form-control"
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleChange}
                    placeholder="Ví dụ: Chăm sóc da chuyên sâu"
                    autoComplete="off"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="description">Mô tả</label>
                  <textarea
                    id="description"
                    className="form-control"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả ngắn về dịch vụ và trải nghiệm khách hàng..."
                    disabled={saving}
                  />
                  <small>Thông tin này giúp khách hàng hiểu rõ hơn về dịch vụ.</small>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="price">Giá dịch vụ (VNĐ) *</label>
                  <div className="service-admin-input-with-suffix">
                    <input
                      id="price"
                      className="form-control"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0.01"
                      step="any"
                      placeholder="Nhập giá dịch vụ"
                      required
                      disabled={saving}
                    />
                    <span>VNĐ</span>
                  </div>
                </div>

                <div className="service-admin-field">
                  <label htmlFor="duration">Thời lượng (phút) *</label>
                  <div className="service-admin-input-with-suffix">
                    <input
                      id="duration"
                      className="form-control"
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      placeholder="Ví dụ: 60"
                      required
                      disabled={saving}
                    />
                    <span>phút</span>
                  </div>
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="serviceImage">Ảnh dịch vụ</label>
                  {(imageUpload || (imageUrl && !removeImage)) && (
                    <img
                      src={imageUpload ? `data:${imageUpload.contentType};base64,${imageUpload.data}` : imageUrl}
                      alt="Ảnh dịch vụ"
                      style={{ display: "block", width: 280, maxWidth: "100%", height: 170, objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                    />
                  )}
                  <input
                    id="serviceImage"
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving}
                    onChange={handleImageChange}
                  />
                  <small className="text-muted d-block mt-1">
                    JPEG, PNG hoặc WebP; ảnh được tự thu nhỏ khi tải lên. Bỏ trống để giữ ảnh hiện tại.
                  </small>
                  {imageError && <div className="text-danger small mt-1">{imageError}</div>}
                  {imageUrl && !removeImage && !imageUpload && (
                    <button type="button" className="btn btn-sm btn-outline-danger mt-2" disabled={saving} onClick={() => setRemoveImage(true)}>
                      Xóa ảnh hiện tại
                    </button>
                  )}
                  {removeImage && (
                    <div className="small text-muted mt-2">
                      Ảnh hiện tại sẽ bị xóa khi lưu.{" "}
                      <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setRemoveImage(false)}>Hoàn tác</button>
                    </div>
                  )}
                </div>

                <div className="service-admin-field service-admin-field--wide">
                  <label htmlFor="status">Trạng thái</label>
                  <select
                    id="status"
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Active">Đang hoạt động</option>
                    <option value="Inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="service-admin-actions">
                <Link
                  to="/services"
                  className="btn btn-outline-secondary"
                  aria-disabled={saving}
                  onClick={(event) => {
                    if (saving) event.preventDefault();
                  }}
                >
                  Hủy
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Đang lưu
                    </>
                  ) : (
                    <>
                      <i
                        className={`bi ${isEditing ? "bi-check2" : "bi-plus-lg"} me-2`}
                        aria-hidden="true"
                      />
                      {isEditing ? "Lưu thay đổi" : "Thêm dịch vụ"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="service-admin-guidance">
            <div className="service-admin-guidance-icon">
              <i className="bi bi-lightbulb" aria-hidden="true" />
            </div>
            <h2>Lưu ý khi cập nhật</h2>
            <p>
              Tên, giá và thời lượng sẽ được dùng khi khách hàng xem dịch vụ và
              đặt lịch.
            </p>
            <ul>
              <li>
                <i className="bi bi-check2" aria-hidden="true" />
                Giá dịch vụ phải lớn hơn 0.
              </li>
              <li>
                <i className="bi bi-check2" aria-hidden="true" />
                Thời lượng được tính theo phút.
              </li>
              <li>
                <i className="bi bi-check2" aria-hidden="true" />
                Dịch vụ ngừng hoạt động sẽ không hiển thị với khách hàng.
              </li>
            </ul>
          </aside>
        </div>
      )}
    </main>
  );
};

export default ServiceForm;
