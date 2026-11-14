import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Alert, InputGroup, Row, Col } from "react-bootstrap";
import axios from "axios";
import { PROVINCES, joinAddress } from "../../utils/provinces";
import { today } from "../../services/api";

const FIELD = { fontSize: "1rem", padding: "10px" };
const PRIMARY = { backgroundColor: "#a61e4d", border: "none", borderRadius: "6px", padding: "10px" };

const Register = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("Female");
  const [province, setProvince] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const changePersonal = (setter, value) => {
    setter(value);
    if (isCodeSent) setIsCodeSent(false);
  };

  const goNext = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const name = fullName.trim();
    if (name.split(/\s+/).length < 2) { setError("Họ và tên phải có ít nhất 2 từ!"); return; }
    if (!/^0\d{9,10}$/.test(phone.trim())) { setError("Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số!"); return; }
    if (dateOfBirth && dateOfBirth > today()) { setError("Ngày sinh không hợp lệ!"); return; }
    if (!province) { setError("Vui lòng chọn tỉnh/thành phố!"); return; }
    setStep(2);
  };

  const handleSendCode = async () => {
    setError("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Vui lòng nhập đúng định dạng Email trước khi gửi mã!");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Vui lòng nhập họ tên trước khi gửi mã!");
      return;
    }
    if (!/^0\d{9,10}$/.test(phone.trim())) {
      setError("Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số!");
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await axios.post(
        "/api/register",
        {
          action: "send-code",
          username: username.trim(),
          email: trimmedEmail,
          fullName: fullName.trim(),
          phone: phone.trim(),
          dateOfBirth: dateOfBirth || null,
          gender,
          address: joinAddress(addressDetail, province),
        },
        { withCredentials: true },
      );

      if (response.status === 200) {
        setIsCodeSent(true);
        setCountdown(60);
        setSuccessMsg("Mã xác thực đã được gửi tới Email của bạn!");
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setCountdown(60);
      }
      setError(
        err.response?.data?.message ||
          "Không thể gửi mã xác thực. Vui lòng thử lại!",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự!");
      return;
    }
    if (/\s/.test(trimmedUsername)) {
      setError("Tên đăng nhập không được chứa khoảng trắng!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email không đúng định dạng!");
      return;
    }

    if (!isCodeSent || !verificationCode.trim()) {
      setError("Vui lòng gửi và nhập mã xác thực Email!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "/api/register",
        {
          username: trimmedUsername,
          email: email.trim(),
          password: password,
          verificationCode: verificationCode.trim(),
        },
        { withCredentials: true },
      );

      if (response.status === 201) {
        navigate("/login", { replace: true, state: { registered: email.trim() } });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng kiểm tra lại kết nối server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="app-registration-page"
    >
      <Card
        className="app-registration-card p-4"
        style={{ maxWidth: 520 }}
      >
        <h3 className="text-center mb-4 fw-bold" style={{ color: "#3a2a2f" }}>
          ĐĂNG KÝ
        </h3>

        {error && (
          <Alert variant="danger" className="py-2 text-center fs-6">
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert variant="success" className="py-2 text-center fs-6">
            {successMsg}
          </Alert>
        )}

        <div className="d-flex align-items-center justify-content-center gap-2 mb-4" aria-label="Các bước đăng ký">
          {["Thông tin cá nhân", "Tài khoản & xác thực"].map((label, i) => (
            <div key={label} className="d-flex align-items-center gap-2">
              {i > 0 && <span style={{ width: 28, height: 2, background: step > i ? "#a61e4d" : "#e3d4d9" }} />}
              <span
                className="d-inline-flex align-items-center justify-content-center fw-bold"
                style={{ width: 28, height: 28, borderRadius: "50%", fontSize: ".9rem",
                  background: step >= i + 1 ? "#a61e4d" : "#f3e8ec", color: step >= i + 1 ? "#fff" : "#8a6b76" }}
              >
                {step > i + 1 ? <i className="bi bi-check-lg" /> : i + 1}
              </span>
              <span className="small fw-semibold" style={{ color: step === i + 1 ? "#3a2a2f" : "#8a6b76" }}>{label}</span>
            </div>
          ))}
        </div>

        {step === 1 ? (
          <Form onSubmit={goNext} noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Họ và tên*</Form.Label>
              <Form.Control type="text" placeholder="Vui lòng nhập họ và tên" value={fullName} maxLength={100}
                onChange={(e) => changePersonal(setFullName, e.target.value)} style={FIELD} autoFocus />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Label className="fw-bold">Số điện thoại*</Form.Label>
                <Form.Control type="tel" placeholder="0xxxxxxxxx" value={phone} maxLength={11}
                  onChange={(e) => changePersonal(setPhone, e.target.value)} style={FIELD} />
              </Col>
              <Col sm={6}>
                <Form.Label className="fw-bold">Ngày sinh</Form.Label>
                <Form.Control type="date" value={dateOfBirth} max={today()}
                  onChange={(e) => changePersonal(setDateOfBirth, e.target.value)} style={FIELD} />
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-block">Giới tính</Form.Label>
              <div className="d-flex gap-4">
                {[["Female", "Nữ"], ["Male", "Nam"], ["Other", "Khác"]].map(([value, text]) => (
                  <Form.Check key={value} inline type="radio" id={`gender-${value}`} name="gender" label={text}
                    checked={gender === value} onChange={() => changePersonal(setGender, value)} />
                ))}
              </div>
            </Form.Group>
            <Row className="g-3 mb-4">
              <Col sm={5}>
                <Form.Label className="fw-bold">Tỉnh/Thành phố*</Form.Label>
                <Form.Select value={province} onChange={(e) => changePersonal(setProvince, e.target.value)} style={FIELD}>
                  <option value="">Chọn tỉnh/thành</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Form.Select>
              </Col>
              <Col sm={7}>
                <Form.Label className="fw-bold">Địa chỉ chi tiết</Form.Label>
                <Form.Control type="text" placeholder="Số nhà, đường, phường/xã" value={addressDetail} maxLength={200}
                  onChange={(e) => changePersonal(setAddressDetail, e.target.value)} style={FIELD} />
              </Col>
            </Row>
            <Button type="submit" className="w-100 fw-bold" style={PRIMARY}>
              Tiếp tục <i className="bi bi-arrow-right ms-1" />
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleRegister}>
            <div className="small text-muted mb-3 p-2 rounded" style={{ background: "#fbf3f6" }}>
              <i className="bi bi-person-check me-1" /> {fullName.trim()} · {phone.trim()} · {province}
              <Button variant="link" size="sm" className="p-0 ms-2 align-baseline" onClick={() => { setError(""); setSuccessMsg(""); setStep(1); }}>Sửa</Button>
            </div>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tên đăng nhập*</Form.Label>
              <Form.Control type="text" placeholder="Ít nhất 3 ký tự, không khoảng trắng" value={username}
                onChange={(e) => setUsername(e.target.value)} required style={FIELD} autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email*</Form.Label>
              <InputGroup>
                <Form.Control type="email" placeholder="Vui lòng nhập email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setIsCodeSent(false); }} required style={FIELD} />
                <Button
                  variant={countdown > 0 ? "secondary" : "danger"}
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0 || !email.trim()}
                  style={{ backgroundColor: countdown > 0 ? undefined : "#a61e4d", border: "none", fontWeight: "bold", width: "105px" }}
                >
                  {isSendingCode ? "Đang gửi" : countdown > 0 ? `${countdown}s` : isCodeSent ? "Gửi lại" : "Gửi mã"}
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Mã xác thực Email*</Form.Label>
              <Form.Control type="text" inputMode="numeric" placeholder="Nhập mã 6 chữ số" value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)} maxLength={6} required disabled={!isCodeSent}
                style={{ ...FIELD, backgroundColor: !isCodeSent ? "#e9ecef" : "white" }} />
            </Form.Group>
            <Row className="g-3 mb-4">
              <Col sm={6}>
                <Form.Label className="fw-bold">Mật khẩu*</Form.Label>
                <Form.Control type="password" placeholder="Ít nhất 6 ký tự" value={password}
                  onChange={(e) => setPassword(e.target.value)} required style={FIELD} />
              </Col>
              <Col sm={6}>
                <Form.Label className="fw-bold">Xác nhận mật khẩu*</Form.Label>
                <Form.Control type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required style={FIELD} />
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" className="fw-bold" style={{ padding: "10px 16px" }}
                onClick={() => { setError(""); setSuccessMsg(""); setStep(1); }}>
                <i className="bi bi-arrow-left" /> Quay lại
              </Button>
              <Button type="submit" className="flex-fill fw-bold" style={PRIMARY} disabled={loading || !isCodeSent}>
                {loading ? "Đang xử lý..." : "Đăng ký"}
              </Button>
            </div>
          </Form>
        )}

        <div className="text-center mt-4">
          <span style={{ fontSize: "1rem", color: "#6c757d" }}>
            Đã có tài khoản?{" "}
          </span>
          <span
            style={{
              textDecoration: "none",
              color: "#0d6efd",
              cursor: "pointer",
            }}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </div>
      </Card>
    </div>
  );
};

export default Register;
