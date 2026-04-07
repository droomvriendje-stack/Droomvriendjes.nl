// Re-export the full application from App.js.
// App.jsx previously held a placeholder; the real app lives in App.js.
// Vite resolves bare `import App from './App'` to .jsx before .js, so
// this file must exist and forward to the real implementation.
export { default } from './App.js';
