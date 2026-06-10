import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { logError } from './lib/audit'

const queryClient = new QueryClient()

// Captura Global de Erros para a Central de Diagnóstico
window.onerror = (message, source, lineno, colno, error) => {
  logError(error || { message }, 'SYSTEM', `Global Error: ${message}`);
};

window.onunhandledrejection = (event) => {
  logError(event.reason, 'SYSTEM', 'Unhandled Promise Rejection');
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
