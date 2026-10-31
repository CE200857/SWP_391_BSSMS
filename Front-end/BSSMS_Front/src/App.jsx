import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";

function App() {
  
  const [user, setUser] = useState(() => {
    const loggedInUser = localStorage.getItem("user");
    try { return loggedInUser ? JSON.parse(loggedInUser) : null; } catch { localStorage.removeItem("user"); return null; }
  });

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />
    </BrowserRouter>
  );
}

export default App;