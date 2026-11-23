import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Fonts bundled locally (no internet needed during the demo)
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import './styles.css';
import './ui-refinement.css';
import './crud-ui.css';
import './manager-unify.css';
import './guest-theme.css';
import './public-pages.css';
import './motion.css';
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
