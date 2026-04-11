import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('[main] React app initializing...');
console.log('[main] VITE_API_URL:', import.meta.env.VITE_API_URL || '(not set — using relative URLs)');
console.log('[main] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '(set)' : '(not set)');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[main] FATAL: #root element not found in DOM. Cannot mount React app.');
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('[main] React app mounted successfully.');
  } catch (err) {
    console.error('[main] FATAL: Failed to render React app:', err);
    // Show a minimal fallback so the page is not completely blank
    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;background:#fafafa;padding:2rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem">🐻</div>
        <h1 style="color:#8B7355;margin-bottom:0.5rem">Er is iets misgegaan</h1>
        <p style="color:#666;max-width:480px;margin-bottom:1.5rem">
          De pagina kon niet worden geladen. Probeer de pagina te vernieuwen.
        </p>
        <button onclick="window.location.reload()" style="background:#8B7355;color:#fff;border:none;border-radius:8px;padding:0.75rem 1.5rem;font-size:1rem;cursor:pointer;">
          Pagina vernieuwen
        </button>
      </div>
    `;
  }
}

