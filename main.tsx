import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Evita quebra da aplicação por rejeições não tratadas vindas de scripts externos
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const message = typeof reason === 'string' ? reason : reason?.message;

  if (message && message.includes('The user is not authenticated')) {
    console.warn('Aviso de autenticação externa ignorado para não afetar a interface.');
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
