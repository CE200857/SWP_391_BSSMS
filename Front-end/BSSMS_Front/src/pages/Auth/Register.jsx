import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Form, Button, InputGroup } from "react-bootstrap";
import FloatingAlert from "../../components/FloatingAlert";
import axios from "axios";
import { PROVINCES, joinAddress } from "../../utils/provinces";
import { today, birthDateError, MIN_BIRTH_DATE } from "../../services/api";

const FIELD = { fontSize: "1rem", padding: "10px" };
const PRIMARY = { backgroundColor: "#a61e4d", border: "none", borderRadius: "6px", padding: "10px" };
const SIDE_BUTTON = { backgroundColor: "#a61e4d", border: "none", fontWeight: "bold", minWidth: "112px" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_IDS = {
  username: "reg-username", email: "reg-email", code: "reg-code", password: "reg-password", confirmPassword: "reg-confirm",
  fullName: "reg-fullname", phone: "reg-phone", dob: "reg-dob", province: "reg-province",
};

// Inline error shown right under its field and linked with aria-describedby
const FieldError = ({ id, message }) =>
  message ? (
    <div id={id} className="invalid-feedback d-block" role="alert">
      <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />{message}
    </div>
  ) : null;

const fieldProps = (errors, name) => ({
  isInvalid: !!errors[name],
  "aria-invalid": errors[name] ? true : undefined,
  "aria-describedby": errors[name] ? `${name}-error` : undefined,
});

const PasswordInput = ({ id, value, onChange, placeholder, autoComplete, errors, name }) => {
  const [shown, setShown] = useState(false);
  return (
    <InputGroup hasValidation>
      <Form.Control id={id} type={shown ? "text" : "password"} placeholder={placeholder} value={value}
        onChange={onChange} autoComplete={autoComplete} style={FIELD} {...fieldProps(errors, name)} />
      <Button variant="outline-secondary" type="button" onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"} title={shown ? "Hide password" : "Show password"}
        aria-pressed={shown} style={{ minWidth: 52, borderColor: "#dee2e6" }}>
        <i className={`bi ${shown ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
      </Button>
    </InputGroup>
  );
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("Female");
  const [province, setProvince] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const clearMessages = () => { setError(""); setSuccessMsg(""); };

  // Remove a field's error as soon as the user edits it
  const clearField = (name) => setFieldErrors((prev) => {
    if (!prev[name]) return prev;
    const next = { ...prev };
    delete next[name];
    return next;
  });

  // Show every problem under its field and move focus to the first one
  const showFieldErrors = (errors, order) => {
    setFieldErrors(errors);
    const first = order.find((name) => errors[name]);
    if (first) {
      const target = document.getElementById(FIELD_IDS[first]);
      if (target) target.focus();
    }
    return !first;
  };

  const changeEmail = (value) => {
    setEmail(value);
    clearField("email");
    clearField("code");
    setIsCodeSent(false);
    setIsVerified(false);
    setVerificationCode("");
  };

  const handleSendCode = async () => {
    clearMessages();
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) { showFieldErrors({ ...fieldErrors, email: "Enter a valid email, for example name@gmail.com, then send the code." }, ["email"]); return; }
    setIsSendingCode(true);
    try {
      await axios.post("/api/register",
        { action: "send-code", username: username.trim(), email: trimmedEmail },
        { withCredentials: true });
      setIsCodeSent(true);
      setIsVerified(false);
      setVerificationCode("");
      setCountdown(60);
      setSuccessMsg("A verification code has been sent to your email!");
    } catch (err) {
      if (err.response?.status === 429) setCountdown(60);
      showFieldErrors({ ...fieldErrors, email: err.response?.data?.message || "Could not send the verification code. Please try again!" }, ["email"]);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    clearMessages();
    if (!/^\d{6}$/.test(verificationCode.trim())) { showFieldErrors({ ...fieldErrors, code: "Enter the 6-digit code from your email." }, ["code"]); return; }
    setIsVerifying(true);
    try {
      await axios.post("/api/register",
        { action: "verify-code", email: email.trim(), verificationCode: verificationCode.trim() },
        { withCredentials: true });
      setIsVerified(true);
      clearField("code");
      setSuccessMsg("Email verified!");
    } catch (err) {
      showFieldErrors({ ...fieldErrors, code: err.response?.data?.message || "Could not verify the code. Please try again!" }, ["code"]);
    } finally {
      setIsVerifying(false);
    }
  };

  const goNext = (e) => {
    e.preventDefault();
    clearMessages();
    const name = username.trim();
    const errors = {};
    if (name.length < 3) errors.username = "The username needs at least 3 characters.";
    else if (/\s/.test(name)) errors.username = "The username cannot contain spaces.";
    if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email, for example name@gmail.com.";
    else if (!isVerified) errors.code = isCodeSent ? "Enter the code from your email and press Verify." : "Press Send code, then enter the code from your email.";
    if (password.length < 6) errors.password = "The password needs at least 6 characters.";
    if (!confirmPassword) errors.confirmPassword = "Re-enter your password.";
    else if (password !== confirmPassword) errors.confirmPassword = "The two passwords do not match.";
    if (showFieldErrors(errors, ["username", "email", "code", "password", "confirmPassword"])) setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    const errors = {};
    if (fullName.trim().split(/\s+/).length < 2) errors.fullName = "Enter your full name (first and last name).";
    if (!/^0\d{9,10}$/.test(phone.trim())) errors.phone = "The phone number starts with 0 and has 10–11 digits.";
    const dobProblem = birthDateError(dateOfBirth);
    if (dobProblem) errors.dob = dobProblem;
    if (!province) errors.province = "Select your province/city.";
    if (!showFieldErrors(errors, ["fullName", "phone", "dob", "province"])) return;

    setLoading(true);
    try {
      const response = await axios.post("/api/register", {
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || null,
        gender,
        address: joinAddress(addressDetail, province),
      }, { withCredentials: true });
      if (response.status === 201) {
        navigate("/login", { replace: true, state: { registered: email.trim() } });
      }
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Please check the server connection.";
      if (/phone/i.test(message)) showFieldErrors({ phone: message }, ["phone"]);
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  const backToStep1 = () => { clearMessages(); setStep(1); };

  return (
    <div className="app-registration-page">
      <Card className="app-registration-card p-4" style={{ maxWidth: 480 }}>
        <h1 className="text-center mb-4 fw-bold" style={{ color: "#3a2a2f", fontSize: "2.2rem" }}>
          SIGN UP
        </h1>

        <FloatingAlert message={error} onClose={() => setError("")} />
        <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} timeout={4000} />

        <div className="d-flex align-items-center justify-content-center gap-2 mb-4" aria-label="Registration steps">
          {["Account", "Personal information"].map((label, i) => (
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
            <Form.Group className="mb-3" controlId="reg-username">
              <Form.Label className="fw-bold">Username*</Form.Label>
              <Form.Control type="text" placeholder="At least 3 characters, no spaces" value={username}
                onChange={(e) => { setUsername(e.target.value); clearField("username"); }} autoComplete="username" style={FIELD} autoFocus
                {...fieldProps(fieldErrors, "username")} />
              <FieldError id="username-error" message={fieldErrors.username} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="reg-email">
              <Form.Label className="fw-bold">Email*</Form.Label>
              <InputGroup hasValidation>
                <Form.Control type="email" placeholder="Please enter your email" value={email}
                  onChange={(e) => changeEmail(e.target.value)} autoComplete="email" style={FIELD} disabled={isVerified}
                  {...fieldProps(fieldErrors, "email")} />
                {isVerified ? (
                  <Button variant="outline-secondary" type="button" onClick={() => changeEmail(email)} style={{ minWidth: 112 }}>
                    Change
                  </Button>
                ) : (
                  <Button variant="danger" type="button" onClick={handleSendCode}
                    disabled={isSendingCode || countdown > 0 || !email.trim()}
                    style={{ ...SIDE_BUTTON, backgroundColor: countdown > 0 ? "#b9a1ab" : SIDE_BUTTON.backgroundColor }}>
                    {isSendingCode ? "Sending" : countdown > 0 ? `${countdown}s` : isCodeSent ? "Resend" : "Send code"}
                  </Button>
                )}
              </InputGroup>
              <FieldError id="email-error" message={fieldErrors.email} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="reg-code">
              <Form.Label className="fw-bold">Verification code*</Form.Label>
              {isVerified ? (
                <div className="d-flex align-items-center gap-2 rounded px-3" style={{ minHeight: 46, background: "#eaf4ed", color: "#276444", fontWeight: 600 }}>
                  <i className="bi bi-patch-check-fill" aria-hidden="true" /> Email verified
                </div>
              ) : (
                <InputGroup hasValidation>
                  <Form.Control type="text" inputMode="numeric" maxLength={6}
                    placeholder={isCodeSent ? "Enter the 6-digit code" : "Send a code to your email first"}
                    value={verificationCode} onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, "")); clearField("code"); }}
                    disabled={!isCodeSent} autoComplete="one-time-code" {...fieldProps(fieldErrors, "code")}
                    style={{ ...FIELD, backgroundColor: !isCodeSent ? "#e9ecef" : "white" }} />
                  <Button variant="danger" type="button" onClick={handleVerifyCode}
                    disabled={!isCodeSent || isVerifying || verificationCode.trim().length !== 6} style={SIDE_BUTTON}>
                    {isVerifying ? "Checking" : "Verify"}
                  </Button>
                </InputGroup>
              )}
              <FieldError id="code-error" message={fieldErrors.code} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold" htmlFor="reg-password">Password*</Form.Label>
              <PasswordInput id="reg-password" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }}
                placeholder="At least 6 characters" autoComplete="new-password" errors={fieldErrors} name="password" />
              <FieldError id="password-error" message={fieldErrors.password} />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold" htmlFor="reg-confirm">Confirm password*</Form.Label>
              <PasswordInput id="reg-confirm" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }}
                placeholder="Re-enter password" autoComplete="new-password" errors={fieldErrors} name="confirmPassword" />
              <FieldError id="confirmPassword-error" message={fieldErrors.confirmPassword} />
            </Form.Group>

            <Button type="submit" className="w-100 fw-bold" style={PRIMARY}>
              Continue <i className="bi bi-arrow-right ms-1" />
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleRegister} noValidate>
            <div className="small text-muted mb-3 p-2 rounded" style={{ background: "#fbf3f6" }}>
              <i className="bi bi-person-check me-1" /> {username.trim()} · {email.trim()}
              <Button variant="link" size="sm" className="p-0 ms-2 align-baseline" onClick={backToStep1}>Edit</Button>
            </div>

            <Form.Group className="mb-3" controlId="reg-fullname">
              <Form.Label className="fw-bold">Full name*</Form.Label>
              <Form.Control type="text" placeholder="Please enter your full name" value={fullName} maxLength={100}
                onChange={(e) => { setFullName(e.target.value); clearField("fullName"); }} style={FIELD} autoFocus autoComplete="name"
                {...fieldProps(fieldErrors, "fullName")} />
              <FieldError id="fullName-error" message={fieldErrors.fullName} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="reg-phone">
              <Form.Label className="fw-bold">Phone number*</Form.Label>
              <Form.Control type="tel" placeholder="0xxxxxxxxx" value={phone} maxLength={11}
                onChange={(e) => { setPhone(e.target.value); clearField("phone"); }} style={FIELD} autoComplete="tel"
                {...fieldProps(fieldErrors, "phone")} />
              <FieldError id="phone-error" message={fieldErrors.phone} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="reg-dob">
              <Form.Label className="fw-bold">Date of birth</Form.Label>
              <Form.Control type="date" value={dateOfBirth} min={MIN_BIRTH_DATE} max={today()}
                onChange={(e) => { setDateOfBirth(e.target.value); clearField("dob"); }} style={FIELD} autoComplete="bday"
                {...fieldProps(fieldErrors, "dob")} />
              <FieldError id="dob-error" message={fieldErrors.dob} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-block">Gender</Form.Label>
              <div className="d-flex gap-4">
                {["Female", "Male", "Other"].map((value) => (
                  <Form.Check key={value} inline type="radio" id={`gender-${value}`} name="gender" label={value}
                    checked={gender === value} onChange={() => setGender(value)} />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="reg-province">
              <Form.Label className="fw-bold">Province/City*</Form.Label>
              <Form.Select value={province} onChange={(e) => { setProvince(e.target.value); clearField("province"); }} style={FIELD}
                {...fieldProps(fieldErrors, "province")}>
                <option value="">Select province/city</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Form.Select>
              <FieldError id="province-error" message={fieldErrors.province} />
            </Form.Group>

            <Form.Group className="mb-4" controlId="reg-address">
              <Form.Label className="fw-bold">Detailed address</Form.Label>
              <Form.Control type="text" placeholder="House number, street, ward/commune" value={addressDetail} maxLength={200}
                onChange={(e) => setAddressDetail(e.target.value)} style={FIELD} />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="outline-secondary" className="fw-bold" style={{ padding: "10px 16px" }} onClick={backToStep1}>
                <i className="bi bi-arrow-left" /> Back
              </Button>
              <Button type="submit" className="flex-fill fw-bold" style={PRIMARY} disabled={loading}>
                {loading ? "Processing..." : "Sign up"}
              </Button>
            </div>
          </Form>
        )}

        <div className="text-center mt-4">
          <span style={{ fontSize: "1rem", color: "#6c757d" }}>Already have an account? </span>
          <Link to="/login" className="fw-semibold">Log in</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
