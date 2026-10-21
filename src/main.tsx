import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useApp } from './store/useApp';
import './styles/app.css';
import './styles/refresh.css';
import './styles/theme.css';
import './styles/glass.css';

const desktop = window.desktop;
if (desktop?.isElectron) {
  document.documentElement.dataset.electron = 'true';
  document.documentElement.dataset.platform = desktop.platform;
}

// Apply the saved theme before React paints to avoid a flash of the wrong mode.
const initialTheme = useApp.getState().theme;
document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme = initialTheme;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
