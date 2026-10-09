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
                        fetchJson("/api/staff")
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
            || customerSearch !== "";

        if (hasData) {
            sessionStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify({
                    formData,
                    customerSearch
                })
            );
        } else {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    }, [formData, customerSearch]);

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
            !formData.customerId
            || !formData.serviceId
            || !formData.appointmentDate
            || !formData.startTime
        ) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }

        if (formData.appointmentDate < getLocalDate()) {
            setError("Ngày hẹn không được nằm trong quá khứ.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                customerId: Number(formData.customerId),
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
        } catch (err) {
            setError(
                err.message
                || "Có lỗi xảy ra khi tạo lịch hẹn."
            );
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
        <Container className="py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">
                        Create Walk-in Appointment
                    </h2>
                    <p className="text-muted mb-0">
                        Tạo lịch hẹn trực tiếp cho khách hàng tại spa.
                    </p>
                </div>

                <Button
                    variant="outline-secondary"
                    onClick={() => {
                        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                        setFormData(initialForm);
                        setCustomerSearch("");
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

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <h5 className="fw-bold mb-3">
                            1. Customer Information
                        </h5>

                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group controlId="customerSearch">
                                    <Form.Label>
                                        Tìm khách hàng
                                    </Form.Label>

                                    <Form.Control
                                        type="text"
                                        placeholder="Nhập tên hoặc số điện thoại"
                                        value={customerSearch}
                                        onChange={(event) => {
                                            setCustomerSearch(event.target.value);
                                            setFormData((previous) => ({
                                                ...previous,
                                                customerId: ""
                                            }));
                                        }}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group controlId="customerId">
                                    <Form.Label>
                                        Khách hàng <span className="text-danger">*</span>
                                    </Form.Label>

                                    <Form.Select
                                        name="customerId"
                                        value={formData.customerId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            -- Chọn khách hàng --
                                        </option>

                                        {filteredCustomers.map((customer) => (
                                            <option
                                                key={customer.customerId}
                                                value={customer.customerId}
                                            >
                                                {customer.fullName}
                                                {customer.phone
                                                    ? ` - ${customer.phone}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </Form.Select>

                                    {filteredCustomers.length === 0 && (
                                        <Form.Text className="text-danger">
                                            Không tìm thấy khách hàng đang hoạt động.
                                            Hãy kiểm tra lại hoặc tạo hồ sơ khách hàng trước.
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="fw-bold mb-3">
                            2. Service Information
                        </h5>

                        <Row className="g-3 mb-4">
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

                        <h5 className="fw-bold mb-3">
                            3. Appointment Schedule
                        </h5>

                        <Row className="g-3 mb-4">
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
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        required
                                    />
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

                        <h5 className="fw-bold mb-3">
                            4. Additional Information
                        </h5>

                        <Form.Group controlId="notes" className="mb-4">
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

                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                type="button"
                                variant="outline-secondary"
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
                                        Create Appointment
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