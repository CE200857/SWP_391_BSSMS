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
    Spinner,
    Table
} from "react-bootstrap";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(value || 0));

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
        credentials: "include",
        ...options
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message || `Request failed: ${response.status}`
        );
    }

    return data;
};

const CreateInvoice = () => {
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [products, setProducts] = useState([]);

    const [appointmentId, setAppointmentId] = useState("");
    const [quantities, setQuantities] = useState({});
    const [manualDiscount, setManualDiscount] = useState("0");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [receivedAmount, setReceivedAmount] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError("");

            try {
                const [appointmentData, productData] = await Promise.all([
                    fetchJson("/api/invoices/eligible-appointments"),
                    fetchJson("/api/invoices/products")
                ]);

                setAppointments(
                    Array.isArray(appointmentData) ? appointmentData : []
                );

                setProducts(
                    Array.isArray(productData) ? productData : []
                );
            } catch (err) {
                setError(
                    err.message || "Unable to load invoice data."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const selectedAppointment = useMemo(
        () => appointments.find(
            (item) => Number(item.appointmentId) === Number(appointmentId)
        ),
        [appointments, appointmentId]
    );

    const selectedProducts = useMemo(
        () => products
            .filter((product) => Number(quantities[product.productId] || 0) > 0)
            .map((product) => ({
                ...product,
                quantity: Number(quantities[product.productId])
            })),
        [products, quantities]
    );

    const subtotal = useMemo(() => {
        const servicePrice = Number(
            selectedAppointment?.servicePrice || 0
        );

        const productTotal = selectedProducts.reduce(
            (sum, product) =>
                sum + Number(product.unitPrice) * product.quantity,
            0
        );

        return servicePrice + productTotal;
    }, [selectedAppointment, selectedProducts]);

    const discount = Number(manualDiscount || 0);
    const invalidDiscount =
        !Number.isFinite(discount)
        || discount < 0
        || (subtotal > 0 && discount >= subtotal);

    const totalAmount = Math.max(0, subtotal - discount);

    const changeDue = paymentMethod === "Cash"
        ? Math.max(0, Number(receivedAmount || 0) - totalAmount)
        : 0;

    const handleQuantityChange = (productId, value, stockQuantity) => {
        const parsedValue = value === "" ? "" : Number(value);

        if (
            parsedValue !== ""
            && (!Number.isInteger(parsedValue) || parsedValue < 0)
        ) {
            return;
        }

        if (parsedValue !== "" && parsedValue > stockQuantity) {
            setError(`Maximum available stock is ${stockQuantity}.`);
            return;
        }

        setError("");

        setQuantities((previous) => ({
            ...previous,
            [productId]: parsedValue
        }));
    };

    const resetForm = () => {
        setAppointmentId("");
        setQuantities({});
        setManualDiscount("0");
        setPaymentMethod("Cash");
        setReceivedAmount("");
        setSuccess(null);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess(null);

        if (!selectedAppointment) {
            setError("Please select a completed appointment.");
            return;
        }

        if (invalidDiscount) {
            setError("The discount amount is invalid.");
            return;
        }

        if (totalAmount <= 0) {
            setError("The invoice total must be greater than zero.");
            return;
        }

        if (paymentMethod === "Cash") {
            const cashReceived = Number(receivedAmount);

            if (
                receivedAmount === ""
                || !Number.isFinite(cashReceived)
                || cashReceived < totalAmount
            ) {
                setError("The received amount must cover the invoice total.");
                return;
            }
        }

        const payload = {
            appointmentId: Number(appointmentId),
            voucherId: null,
            manualDiscount: discount,
            paymentMethod,
            receivedAmount: paymentMethod === "Cash"
                ? Number(receivedAmount)
                : totalAmount,
            productItems: selectedProducts.map((product) => ({
                productId: product.productId,
                quantity: product.quantity
            }))
        };

        setIsSubmitting(true);

        try {
            const result = await fetchJson("/api/invoices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            setSuccess(result);

            setAppointments((previous) =>
                previous.filter(
                    (item) =>
                        Number(item.appointmentId) !== Number(appointmentId)
                )
            );

            setProducts((previous) =>
                previous.map((product) => {
                    const purchasedQuantity = Number(
                        quantities[product.productId] || 0
                    );

                    return {
                        ...product,
                        stockQuantity:
                            product.stockQuantity - purchasedQuantity
                    };
                })
            );

            setAppointmentId("");
            setQuantities({});
            setManualDiscount("0");
            setReceivedAmount("");
            setPaymentMethod("Cash");
        } catch (err) {
            setError(
                err.message || "Unable to create invoice and payment."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Loading invoice data...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Row className="justify-content-center">
                <Col xl={10}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="mb-1">Create Invoice & Payment</h2>
                            <p className="text-muted mb-0">
                                Create an invoice for a completed appointment.
                            </p>
                        </div>

                        <Button
                            variant="outline-secondary"
                            onClick={() => navigate("/appointments")}
                        >
                            Back to Appointments
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
                            <Alert.Heading>
                                Invoice created successfully
                            </Alert.Heading>

                            <p>
                                Invoice ID: #{success.invoiceId}
                                <br />
                                Payment ID: #{success.paymentId}
                                <br />
                                Total: {formatCurrency(success.totalAmount)}
                                <br />
                                Invoice status: {success.invoiceStatus}
                                <br />
                                Payment status: {success.paymentStatus}
                                <br />
                                Transaction code: {success.transactionCode}
                            </p>

                            {paymentMethod === "Cash"
                                && Number(success.changeDue) > 0 && (
                                    <p className="mb-0">
                                        Change due: {formatCurrency(success.changeDue)}
                                    </p>
                                )}

                            <Button
                                variant="success"
                                size="sm"
                                className="mt-2"
                                onClick={resetForm}
                            >
                                Create Another Invoice
                            </Button>
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Card className="shadow-sm mb-4">
                            <Card.Header>
                                <strong>1. Appointment Information</strong>
                            </Card.Header>

                            <Card.Body>
                                <Form.Group>
                                    <Form.Label>
                                        Completed Appointment
                                    </Form.Label>

                                    <Form.Select
                                        value={appointmentId}
                                        onChange={(event) => {
                                            setAppointmentId(event.target.value);
                                            setQuantities({});
                                            setReceivedAmount("");
                                            setSuccess(null);
                                            setError("");
                                        }}
                                        required
                                    >
                                        <option value="">
                                            Select an appointment
                                        </option>

                                        {appointments.map((appointment) => (
                                            <option
                                                key={appointment.appointmentId}
                                                value={appointment.appointmentId}
                                            >
                                                #{appointment.appointmentId}
                                                {" - "}
                                                {appointment.customerName}
                                                {" - "}
                                                {appointment.serviceName}
                                                {" - "}
                                                {appointment.appointmentDate}
                                            </option>
                                        ))}
                                    </Form.Select>

                                    {appointments.length === 0 && (
                                        <Form.Text className="text-muted">
                                            No completed appointments are
                                            currently available for invoicing.
                                        </Form.Text>
                                    )}
                                </Form.Group>

                                {selectedAppointment && (
                                    <Row className="mt-3">
                                        <Col md={6}>
                                            <p className="mb-1">
                                                <strong>Customer:</strong>{" "}
                                                {selectedAppointment.customerName}
                                            </p>

                                            <p className="mb-1">
                                                <strong>Phone:</strong>{" "}
                                                {selectedAppointment.customerPhone || "-"}
                                            </p>
                                        </Col>

                                        <Col md={6}>
                                            <p className="mb-1">
                                                <strong>Service:</strong>{" "}
                                                {selectedAppointment.serviceName}
                                            </p>

                                            <p className="mb-1">
                                                <strong>Service price:</strong>{" "}
                                                {formatCurrency(
                                                    selectedAppointment.servicePrice
                                                )}
                                            </p>
                                        </Col>
                                    </Row>
                                )}

                                {selectedAppointment && (
                                    <Card className="border-0 bg-light mt-3">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                                <h6 className="fw-bold mb-0">
                                                    Membership Information
                                                </h6>

                                                <span className={`badge px-3 py-2 ${selectedAppointment.membership
                                                    ? "bg-success"
                                                    : "bg-secondary"
                                                    }`}>
                                                    {selectedAppointment.membership?.tierName
                                                        || "Chưa có thông tin hạng"}
                                                </span>
                                            </div>

                                            {selectedAppointment.membership ? (
                                                <>
                                                    <Row>
                                                        <Col md={6} className="mb-3">
                                                            <div className="text-muted small">
                                                                Discount
                                                            </div>
                                                            <div className="fw-bold fs-5">
                                                                {Number(
                                                                    selectedAppointment.membership.discountPercent
                                                                ).toLocaleString("vi-VN")}%
                                                            </div>
                                                        </Col>

                                                        <Col md={6} className="mb-3">
                                                            <div className="text-muted small">
                                                                Minimum Spending
                                                            </div>
                                                            <div className="fw-bold">
                                                                {formatCurrency(
                                                                    selectedAppointment.membership.minSpending
                                                                )}
                                                            </div>
                                                        </Col>
                                                    </Row>

                                                    <div className="text-muted small mb-1">
                                                        Benefits / Description
                                                    </div>
                                                    <p className="mb-0">
                                                        {selectedAppointment.membership.description
                                                            || "Chưa có mô tả quyền lợi."}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-muted mb-0">
                                                    Chưa tìm thấy thông tin hạng thành viên của khách.
                                                </p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                )}

                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm mb-4">
                            <Card.Header>
                                <strong>2. Additional Products</strong>
                            </Card.Header>

                            <Card.Body>
                                {products.length === 0 ? (
                                    <p className="text-muted mb-0">
                                        No active products are available.
                                    </p>
                                ) : (
                                    <Table responsive hover>
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Unit Price</th>
                                                <th>Stock</th>
                                                <th style={{ width: "140px" }}>
                                                    Quantity
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product.productId}>
                                                    <td>{product.productName}</td>
                                                    <td>
                                                        {formatCurrency(product.unitPrice)}
                                                    </td>
                                                    <td>{product.stockQuantity}</td>
                                                    <td>
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max={product.stockQuantity}
                                                            step="1"
                                                            value={
                                                                quantities[product.productId]
                                                                ?? 0
                                                            }
                                                            onChange={(event) =>
                                                                handleQuantityChange(
                                                                    product.productId,
                                                                    event.target.value,
                                                                    product.stockQuantity
                                                                )
                                                            }
                                                            disabled={
                                                                product.stockQuantity <= 0
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm mb-4">
                            <Card.Header>
                                <strong>3. Discount & Payment</strong>
                            </Card.Header>

                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Manual Discount (VND)
                                            </Form.Label>

                                            <Form.Control
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={manualDiscount}
                                                onChange={(event) =>
                                                    setManualDiscount(
                                                        event.target.value
                                                    )
                                                }
                                                isInvalid={invalidDiscount}
                                            />

                                            <Form.Control.Feedback type="invalid">
                                                Discount must be less than the subtotal.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Payment Method
                                            </Form.Label>

                                            <Form.Select
                                                value={paymentMethod}
                                                onChange={(event) => {
                                                    setPaymentMethod(event.target.value);
                                                    setReceivedAmount("");
                                                }}
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Card">Card</option>
                                                <option value="Transfer">
                                                    Transfer
                                                </option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    {paymentMethod === "Cash" ? (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Amount Received (VND)
                                                </Form.Label>

                                                <Form.Control
                                                    type="number"
                                                    min={totalAmount}
                                                    step="1000"
                                                    value={receivedAmount}
                                                    onChange={(event) =>
                                                        setReceivedAmount(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    ) : (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Amount to Record
                                                </Form.Label>

                                                <Form.Control
                                                    value={formatCurrency(totalAmount)}
                                                    readOnly
                                                />
                                            </Form.Group>
                                        </Col>
                                    )}
                                </Row>

                                <hr />

                                <div className="ms-auto" style={{ maxWidth: "360px" }}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Subtotal</span>
                                        <strong>{formatCurrency(subtotal)}</strong>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Discount</span>
                                        <strong>{formatCurrency(discount)}</strong>
                                    </div>

                                    <div className="d-flex justify-content-between fs-5">
                                        <span>Total</span>
                                        <strong className="text-primary">
                                            {formatCurrency(totalAmount)}
                                        </strong>
                                    </div>

                                    {paymentMethod === "Cash" && (
                                        <div className="d-flex justify-content-between mt-2">
                                            <span>Change</span>
                                            <strong>
                                                {formatCurrency(changeDue)}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={resetForm}
                                disabled={isSubmitting}
                            >
                                Reset
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={
                                    isSubmitting
                                    || !appointmentId
                                    || appointments.length === 0
                                    || invalidDiscount
                                    || totalAmount <= 0
                                    || (
                                        paymentMethod === "Cash"
                                        && (
                                            receivedAmount === ""
                                            || Number(receivedAmount) < totalAmount
                                        )
                                    )
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            animation="border"
                                            className="me-2"
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    "Create Invoice & Payment"
                                )}
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateInvoice;