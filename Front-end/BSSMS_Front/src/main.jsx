import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';
import './ui-refinement.css';
import './crud-ui.css';
import App from './App.jsx';
import axios from 'axios';
import { installSessionGuard } from './auth/sessionGuard';

   axios.defaults.baseURL = '';
installSessionGuard(axios);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
