import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from "react-bootstrap";

const initialForm = {
    customerId: "",
    serviceId: "",
    appointmentDate: "",
    startTime: "",
    technicianId: "",
    notes: ""
};

const initialNewCustomer = {
    fullName: "",
    phone: "",
    gender: "Female"
};

const DRAFT_STORAGE_KEY = "bssms.walkInAppointmentDraft";

const readAppointmentDraft = () => {
    try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const fetchJson = async (url) => {
    const response = await fetch(url, {
        credentials: "include"
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
        localStorage.removeItem("user");
        throw new Error("Vui lòng đăng nhập để tiếp tục!");
    }

    if (!response.ok) {
        throw new Error(
            data?.message || `Không thể tải dữ liệu từ ${url}.`
        );
    }

    return data;
};

const CreateWalkInAppointment = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(() => {
        const draft = readAppointmentDraft();

        return {
            ...initialForm,
            ...(draft.formData || {})
        };
    });

    const [customerSearch, setCustomerSearch] = useState(() => {
        return readAppointmentDraft().customerSearch || "";
    });
    const [customerMode, setCustomerMode] = useState(() => {
        return readAppointmentDraft().customerMode || "existing";
    });
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [newCustomer, setNewCustomer] = useState(() => ({
        ...initialNewCustomer,
        ...(readAppointmentDraft().newCustomer || {})
    }));

    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [technicians, setTechnicians] = useState([]);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const loadFormData = async () => {
            setIsLoadingData(true);
            setError("");

            try {
                const [customerData, serviceData, staffData] =
                    await Promise.all([
                        fetchJson("/api/customers"),
                        fetchJson("/api/service"),
                        fetchJson("/api/appointments/technicians")
                    ]);

                setCustomers(
                    Array.isArray(customerData)
                        ? customerData.filter(
                            (customer) =>
                                customer.status?.toLowerCase() === "active"
                        )
                        : []
                );

                setServices(
                    Array.isArray(serviceData)
                        ? serviceData.filter(
                            (service) =>
                                service.status?.toLowerCase() === "active"
                        )
                        : []
                );

                setTechnicians(
                    Array.isArray(staffData)
                        ? staffData.filter(
                            (staff) =>
                                staff.position?.toLowerCase() === "technician"
                                && staff.status?.toLowerCase() === "active"
                        )
                        : []
                );
            } catch (err) {
                setError(
                    err.message
                    || "Không thể tải dữ liệu. Vui lòng thử lại."
                );
            } finally {
                setIsLoadingData(false);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        const hasData =
            Object.values(formData).some((value) => value !== "")
            || customerSearch !== ""
            || newCustomer.fullName !== ""
            || newCustomer.phone !== ""
            || newCustomer.gender !== "Female";

        if (hasData) {
            sessionStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify({
                    formData,
                    customerSearch,
                    customerMode,
                    newCustomer
                })
            );
        } else {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    }, [formData, customerSearch, customerMode, newCustomer]);

    const filteredCustomers = useMemo(() => {
        const keyword = customerSearch.trim().toLowerCase();

        if (!keyword) {
            return customers;
        }

        return customers.filter((customer) =>
            customer.fullName?.toLowerCase().includes(keyword)
            || customer.phone?.toLowerCase().includes(keyword)
        );
    }, [customers, customerSearch]);

    const selectedCustomer = useMemo(
        () => customers.find(
            (customer) => String(customer.customerId) === formData.customerId
        ),
        [customers, formData.customerId]
    );

    const selectedService = useMemo(
        () => services.find(
            (service) => String(service.serviceId) === formData.serviceId
        ),
        [services, formData.serviceId]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
        setSuccess(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess(null);

        if (
            (customerMode === "existing" && !formData.customerId)
            || !formData.serviceId
            || !formData.appointmentDate
            || !formData.startTime
        ) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }

        if (customerMode === "new") {
            if (!newCustomer.fullName.trim()) {
                setError("Vui lòng nhập họ tên khách hàng.");
                return;
            }
            if (!/^0[1-9]\d{8}$/.test(newCustomer.phone.trim())) {
                setError("Số điện thoại phải gồm 10 số và bắt đầu bằng 0.");
                return;
            }
        }

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(formData.startTime)) {
            setError("Vui lòng nhập giờ bắt đầu theo định dạng 24 giờ (HH:mm).");
            return;
        }

        if (formData.appointmentDate < getLocalDate()) {
            setError("Ngày hẹn không được nằm trong quá khứ.");
            return;
        }

        setIsSubmitting(true);

        let createdCustomer = null;
        try {
            let customerId = Number(formData.customerId);
            if (customerMode === "new") {
                const customerResponse = await fetch("/api/customers", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "walkInProfile",
                        fullName: newCustomer.fullName.trim(),
                        phone: newCustomer.phone.trim(),
                        gender: newCustomer.gender
                    })
                });
                const customerResult = await customerResponse.json().catch(() => null);
                if (!customerResponse.ok) {
                    if (customerResponse.status === 409) {
                        setCustomerMode("existing");
                        setCustomerSearch(newCustomer.phone.trim());
                    }
                    throw new Error(
                        customerResult?.message || "Không thể tạo hồ sơ khách hàng."
                    );
                }
                createdCustomer = customerResult;
                customerId = Number(customerResult.customerId);
                setCustomers((previous) => [
                    ...previous,
                    { ...customerResult, status: "Active" }
                ]);
                setFormData((previous) => ({
                    ...previous,
                    customerId: String(customerId)
                }));
            }

            const payload = {
                customerId,
                serviceId: Number(formData.serviceId),
                appointmentDate: formData.appointmentDate,
                startTime: formData.startTime,
                technicianId: formData.technicianId
                    ? Number(formData.technicianId)
                    : null,
                customerPackageId: null,
                notes: formData.notes.trim() || null
            };

            const response = await fetch("/api/appointments", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.message
                    || "Không thể tạo lịch hẹn. Vui lòng thử lại."
                );
            }

            setSuccess({
                appointmentId: result.appointmentId,
                appointmentDate: result.appointmentDate,
                startTime: result.startTime,
                endTime: result.endTime,
                status: result.status
            });

            setFormData(initialForm);
            setCustomerSearch("");
            setCustomerMode("existing");
            setNewCustomer(initialNewCustomer);
        } catch (err) {
            if (createdCustomer) {
                setCustomerMode("existing");
                setCustomerSearch(createdCustomer.fullName);
                setError(
                    `Đã tạo hồ sơ khách hàng #${createdCustomer.customerId}, nhưng chưa tạo được lịch: ${err.message}`
                );
            } else {
                setError(err.message || "Có lỗi xảy ra khi tạo lịch hẹn.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" />
                <p className="mt-3">Đang tải dữ liệu đặt lịch...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4 appointment-create-page">
            <div className="appointment-create-heading">
                <div>
                    <span className="appointment-create-eyebrow">LỊCH HẸN · TẠI QUẦY</span>
                    <h1>Tạo lịch hẹn trực tiếp</h1>
                    <p className="text-muted mb-0">
                        Đặt lịch tại spa và chọn dịch vụ, thời gian phù hợp cho khách hàng.
                    </p>
                </div>

                <Button
                    variant="light"
                    className="appointment-create-back"
                    onClick={() => {
                        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                        setFormData(initialForm);
                        setCustomerSearch("");
                        setCustomerMode("existing");
                        setNewCustomer(initialNewCustomer);
                        navigate("/appointments");
                    }}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Danh sách lịch hẹn
                </Button>
            </div>

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success">
                    <Alert.Heading className="h6">
                        Tạo lịch hẹn thành công!
                    </Alert.Heading>

                    <p className="mb-2">
                        Mã lịch hẹn: <strong>#{success.appointmentId}</strong>
                    </p>

                    <p className="mb-3">
                        Ngày: {success.appointmentDate}
                        {" | "}
                        Thời gian: {success.startTime} - {success.endTime}
                        {" | "}
                        Trạng thái: {success.status}
                    </p>

                    <Button
                        variant="success"
                        onClick={() => navigate("/appointments")}
                    >
                        Xem danh sách lịch hẹn
                    </Button>
                </Alert>
            )}

            <Card className="appointment-create-card">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <section className="appointment-create-section">
                            <h2><span>01</span>Thông tin khách hàng</h2>
                            <div className="appointment-customer-mode" role="group" aria-label="Loại hồ sơ khách hàng">
                                <Button
                                    type="button"
                                    variant="link"
                                    className={customerMode === "existing" ? "active" : ""}
                                    onClick={() => {
                                        setCustomerMode("existing");
                                        setError("");
                                        setSuccess(null);
                                    }}
                                >
                                    <i className="bi bi-person-check"></i>
                                    Khách đã có hồ sơ
                                </Button>
                                <Button
                                    type="button"
                                    variant="link"
                                    className={customerMode === "new" ? "active" : ""}
                                    onClick={() => {
                                        setCustomerMode("new");
                                        setFormData((previous) => ({ ...previous, customerId: "" }));
                                        setError("");
                                        setSuccess(null);
                                    }}
                                >
                                    <i className="bi bi-person-plus"></i>
                                    Khách mới tại quầy
                                </Button>
                            </div>

                            {customerMode === "existing" ? (
                                <Form.Group controlId="customerSearch">
                                    <Form.Label>Khách hàng <span className="text-danger">*</span></Form.Label>
                                    {selectedCustomer ? (
                                        <div className="appointment-customer-selected">
                                            <div>
                                                <strong>{selectedCustomer.fullName}</strong>
                                                <span>{selectedCustomer.phone || "Chưa có số điện thoại"}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="light"
                                                aria-label="Đổi khách hàng đã chọn"
                                                onClick={() => {
                                                    setFormData((previous) => ({ ...previous, customerId: "" }));
                                                    setShowCustomerList(true);
                                                }}
                                            >
                                                Đổi khách
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`appointment-customer-picker${showCustomerList || customerSearch.trim() ? " is-open" : ""}`}>
                                                <Form.Control
                                                    type="search"
                                                    placeholder="Nhập tên hoặc số điện thoại để tìm"
                                                    value={customerSearch}
                                                    aria-controls="appointment-customer-results"
                                                    aria-expanded={showCustomerList}
                                                    onChange={(event) => {
                                                        setCustomerSearch(event.target.value);
                                                        setError("");
                                                        setSuccess(null);
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="light"
                                                    className="appointment-customer-list-toggle"
                                                    aria-label={showCustomerList ? "Ẩn danh sách khách hàng" : "Mở danh sách khách hàng"}
                                                    aria-expanded={showCustomerList}
                                                    aria-controls="appointment-customer-results"
                                                    onClick={() => setShowCustomerList((visible) => !visible)}
                                                >
                                                    <i className={`bi bi-chevron-${showCustomerList ? "up" : "down"}`} aria-hidden="true"></i>
                                                </Button>
                                                {(customerSearch.trim() || showCustomerList) && (
                                                    <div id="appointment-customer-results" className="appointment-customer-results">
                                                        {filteredCustomers.length ? filteredCustomers.map((customer) => (
                                                            <button
                                                                type="button"
                                                                key={customer.customerId}
                                                                onClick={() => {
                                                                    setFormData((previous) => ({
                                                                        ...previous,
                                                                        customerId: String(customer.customerId)
                                                                    }));
                                                                    setCustomerSearch("");
                                                                    setShowCustomerList(false);
                                                                    setError("");
                                                                    setSuccess(null);
                                                                }}
                                                            >
                                                                <strong>{customer.fullName}</strong>
                                                                <span>{customer.phone || "Chưa có số điện thoại"}</span>
                                                            </button>
                                                        )) : (
                                                            <p className="mb-0">
                                                                Không tìm thấy hồ sơ phù hợp. Hãy chọn <strong>Khách mới tại quầy</strong> để tạo hồ sơ không cần tài khoản.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!customerSearch.trim() && !showCustomerList && (
                                                <Form.Text className="text-muted d-block">
                                                    Tìm theo tên hoặc số điện thoại, hoặc mở danh sách để chọn khách hàng.
                                                </Form.Text>
                                            )}
                                        </>
                                    )}
                                </Form.Group>
                            ) : (
                                <>
                                    <Alert variant="light" className="appointment-customer-account-note">
                                        Chỉ tạo hồ sơ để đặt lịch, không tạo tài khoản đăng nhập. Khách có thể đăng ký riêng sau nếu cần.
                                    </Alert>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group controlId="newCustomerName">
                                                <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    value={newCustomer.fullName}
                                                    onChange={(event) => {
                                                        setNewCustomer((previous) => ({ ...previous, fullName: event.target.value }));
                                                        setError("");
                                                        setSuccess(null);
                                                    }}
                                                    placeholder="Nhập họ và tên khách hàng"
                                                    maxLength={100}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group controlId="newCustomerPhone">
                                                <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    inputMode="numeric"
                                                    value={newCustomer.phone}
                                                    onChange={(event) => {
                                                        setNewCustomer((previous) => ({ ...previous, phone: event.target.value }));
                                                        setError("");
                                                        setSuccess(null);
                                                    }}
                                                    placeholder="09xxxxxxxx"
                                                    maxLength={10}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group controlId="newCustomerGender">
                                                <Form.Label>Giới tính</Form.Label>
                                                <Form.Select
                                                    value={newCustomer.gender}
                                                    onChange={(event) => {
                                                        setNewCustomer((previous) => ({ ...previous, gender: event.target.value }));
                                                        setError("");
                                                        setSuccess(null);
                                                    }}
                                                >
                                                    <option value="Female">Nữ</option>
                                                    <option value="Male">Nam</option>
                                                    <option value="Other">Khác</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </section>

                        <section className="appointment-create-section">
                            <h2><span>02</span>Chọn dịch vụ</h2>
                            <Row className="g-3">
                            <Col md={6}>
                                <Form.Group controlId="serviceId">
                                    <Form.Label>
                                        Dịch vụ <span className="text-danger">*</span>
                                    </Form.Label>

                                    <Form.Select
                                        name="serviceId"
                                        value={formData.serviceId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            -- Chọn dịch vụ --
                                        </option>

                                        {services.map((service) => (
                                            <option
                                                key={service.serviceId}
                                                value={service.serviceId}
                                            >
                                                {service.serviceName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group controlId="serviceDuration">
                                    <Form.Label>Thời lượng</Form.Label>

                                    <Form.Control
                                        readOnly
                                        value={
                                            selectedService
                                                ? `${selectedService.duration} phút`
                                                : ""
                                        }
                                        placeholder="Tự động"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group controlId="servicePrice">
                                    <Form.Label>Giá dịch vụ</Form.Label>

                                    <Form.Control
                                        readOnly
                                        value={
                                            selectedService
                                                ? Number(selectedService.price)
                                                    .toLocaleString("vi-VN")
                                                + " ₫"
                                                : ""
                                        }
                                        placeholder="Tự động"
                                    />
                                </Form.Group>
                            </Col>
                            </Row>
                        </section>

                        <section className="appointment-create-section">
                            <h2><span>03</span>Thời gian & nhân viên</h2>
                            <Row className="g-3">
                            <Col md={4}>
                                <Form.Group controlId="appointmentDate">
                                    <Form.Label>
                                        Ngày hẹn <span className="text-danger">*</span>
                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        name="appointmentDate"
                                        value={formData.appointmentDate}
                                        min={getLocalDate()}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group controlId="startTime">
                                    <Form.Label>
                                        Giờ bắt đầu <span className="text-danger">*</span>
                                    </Form.Label>

                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        name="startTime"
                                        value={formData.startTime}
                                        placeholder="HH:mm"
                                        maxLength={5}
                                        pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                                        title="Nhập theo định dạng 24 giờ, ví dụ 09:30"
                                        aria-describedby="startTimeHelp"
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Text id="startTimeHelp" className="text-muted">
                                        Nhập theo giờ 24h, ví dụ 09:30.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group controlId="technicianId">
                                    <Form.Label>Kỹ thuật viên</Form.Label>

                                    <Form.Select
                                        name="technicianId"
                                        value={formData.technicianId}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Tự động phân công
                                        </option>

                                        {technicians.map((technician) => (
                                            <option
                                                key={technician.staffId}
                                                value={technician.staffId}
                                            >
                                                {technician.fullName}
                                            </option>
                                        ))}
                                    </Form.Select>

                                    <Form.Text className="text-muted">
                                        Hệ thống kiểm tra chuyên môn, ca làm
                                        và lịch trùng trước khi tạo lịch.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            </Row>
                        </section>

                        <section className="appointment-create-section appointment-create-notes">
                            <h2><span>04</span>Ghi chú thêm <small>Không bắt buộc</small></h2>
                            <Form.Group controlId="notes">
                            <Form.Label>Ghi chú</Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                maxLength={500}
                                placeholder="Yêu cầu của khách hàng hoặc lưu ý cho kỹ thuật viên..."
                            />

                            <Form.Text className="text-muted">
                                Tối đa 500 ký tự.
                            </Form.Text>
                            </Form.Group>
                        </section>

                        <div className="appointment-create-actions">
                            <Button
                                type="button"
                                variant="light"
                                className="appointment-create-cancel"
                                onClick={() => navigate("/appointments")}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            animation="border"
                                            className="me-2"
                                        />
                                        Đang tạo lịch...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-calendar-plus me-2"></i>
                                        Tạo lịch hẹn
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CreateWalkInAppointment;