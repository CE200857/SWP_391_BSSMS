const GUEST_ENDPOINTS = ["/api/login", "/api/logout", "/api/register", "/api/forgot-password"];
const FLAG = "bssms.sessionExpired";
let redirecting = false;
let installed = false;

function loginPathFor(role) {
  return role === "Customer" ? "/login" : "/dashboard/login";
}

function storedRole() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw)?.role || null : null;
  } catch {
    return null;
  }
}

function onUnauthorized(url) {
  const target = String(url || "");
  if (!target.includes("/api/") || GUEST_ENDPOINTS.some((endpoint) => target.includes(endpoint))) return;
  if (redirecting || !localStorage.getItem("user")) return;
  const destination = loginPathFor(storedRole());
  localStorage.removeItem("user");
  if (window.location.pathname === destination) return;
  redirecting = true;
  try {
    sessionStorage.setItem(FLAG, "1");
  } catch {
  }
  window.location.replace(destination);
}

function showNoticeIfNeeded() {
  let flagged;
  try {
    flagged = sessionStorage.getItem(FLAG) === "1";
    sessionStorage.removeItem(FLAG);
  } catch {
    return;
  }
  if (!flagged) return;
  const box = document.createElement("div");
  box.setAttribute("role", "alert");
  box.textContent = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  box.style.cssText =
    "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2000;background:#fff3cd;color:#664d03;" +
    "border:1px solid #ffecb5;border-radius:8px;padding:10px 18px;box-shadow:0 4px 16px rgba(0,0,0,.15);font-size:15px";
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 8000);
}

export function installSessionGuard(axios) {
  if (installed) return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    if (response.status === 401) onUnauthorized(typeof input === "string" ? input : input?.url);
    return response;
  };
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) onUnauthorized(error.config?.url);
      return Promise.reject(error);
    },
  );
  showNoticeIfNeeded();
}
