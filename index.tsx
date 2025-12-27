import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Wait for DOM to be ready
const mount = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  // Cleanup existing children if any (hot reload fix)
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}