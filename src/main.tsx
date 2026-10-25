import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global polyfill for process (some libraries might expect it)
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

console.log("%c SENTIENCE AI ", "background: #10b981; color: #000; font-weight: bold; padding: 2px 4px; border-radius: 4px;", "v1.0.5 - Gemini 3.5 Ready");

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
