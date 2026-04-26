import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');

  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (e) {
  // Show fatal errors on screen (useful when devtools is unavailable, e.g. Tauri)
  const msg = e instanceof Error ? `${e.message}\n\n${e.stack}` : String(e);
  document.body.innerHTML = `<pre style="padding:40px;color:#dc2626;font-size:14px;white-space:pre-wrap">${msg}</pre>`;
}
