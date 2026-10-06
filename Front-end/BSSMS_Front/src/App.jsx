import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
    const [user, setUser] = useState(() => {
        const loggedInUser = localStorage.getItem("user");
        return loggedInUser ? JSON.parse(loggedInUser) : null;
    });

    return (
        <BrowserRouter>
            {/* Truyền user và setUser sang AppRoutes để nó tự điều phối giao diện */}
            <AppRoutes user={user} setUser={setUser} />
        </BrowserRouter>
    );
}

export default App;