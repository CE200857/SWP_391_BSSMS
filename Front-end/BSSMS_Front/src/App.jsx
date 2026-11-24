import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import PaymentResultModal from "./components/PaymentResultModal";

function App() {
  
  const [user, setUser] = useState(() => {
    const loggedInUser = localStorage.getItem("user");
    try { return loggedInUser ? JSON.parse(loggedInUser) : null; } catch { localStorage.removeItem("user"); return null; }
  });

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />
      <PaymentResultModal />
    </BrowserRouter>
  );
}

export default App;