import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Row,
    Spinner,
} from "react-bootstrap";
import "./MembershipBenefits.css";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));

const formatPercent = (value) =>
    `${Number(value ?? 0).toLocaleString("vi-VN", {
        maximumFractionDigits: 2,
    })}%`;

const MembershipBenefits = () => {
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadTiers = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/membership-tiers", {
                method: "GET",
                credentials: "include",
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    `Không thể tải quyền lợi thành viên. HTTP ${response.status}`
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("Dữ liệu hạng thành viên không hợp lệ.");
            }

            setTiers(data);
        } catch (err) {
            setError(
                err.message || "Không thể kết nối đến máy chủ."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTiers();
    }, [loadTiers]);

    return (
        <Container fluid className="py-4 membership-benefits-page">
            <div className="mb-4">
                <h2 className="fw-bold mb-2">
                    Quyền lợi thành viên
                </h2>
                <p className="text-muted mb-0">
                    Khám phá các hạng thành viên, mức giảm giá
                    và điều kiện chi tiêu tương ứng.
                </p>
            </div>

            {isLoading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="danger" />
                    <p className="text-muted mt-3 mb-0">
                        Đang tải danh sách hạng thành viên...
                    </p>
                </div>
            )}

            {!isLoading && error && (
                <Alert variant="danger">
                    <div className="mb-3">{error}</div>
                    <Button
                        variant="outline-danger"
                        onClick={loadTiers}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Thử lại
                    </Button>
                </Alert>
            )}

            {!isLoading && !error && tiers.length === 0 && (
                <Alert variant="info">
                    Chưa có hạng thành viên nào trong hệ thống.
                </Alert>
            )}

            {!isLoading && !error && tiers.length > 0 && (
                <Row className="g-4">
                    {tiers.map((tier) => (
                        <Col
                            key={tier.membershipTierId}
                            xs={12}
                            sm={6}
                            xl={4}
                        >
                            <Card className="membership-tier-card h-100 border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                                        <div>
                                            <div className="text-muted small mb-2">
                                                <i className="bi bi-award me-1"></i>
                                                Hạng thành viên
                                            </div>

                                            <h4 className="membership-tier-name fw-bold mb-0">
                                                {tier.tierName}
                                            </h4>
                                        </div>

                                        <Badge
                                            bg="light"
                                            text="dark"
                                            className="membership-tier-id"
                                        >
                                            Tier {tier.membershipTierId}
                                        </Badge>
                                    </div>

                                    <div className="membership-tier-discount mb-3">
                                        {formatPercent(
                                            tier.discountPercent
                                        )}
                                        <span className="membership-discount-label">
                                            {" "}giảm giá
                                        </span>
                                    </div>

                                    <div className="membership-tier-spending mb-3">
                                        <div className="text-muted small mb-1">
                                            Mức chi tiêu yêu cầu
                                        </div>
                                        <div className="fw-bold">
                                            {formatCurrency(
                                                tier.minSpending
                                            )}
                                        </div>
                                    </div>

                                    <div className="membership-tier-description">
                                        <div className="text-muted small mb-2">
                                            Mô tả / quyền lợi
                                        </div>
                                        <p className="mb-0">
                                            {tier.description ||
                                                "Chưa có mô tả quyền lợi."}
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default MembershipBenefits;