
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

window.addEventListener('error', (event) => {
  console.error('💥 Global error caught in index.tsx:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled rejection caught in index.tsx:', event.reason);
});

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
