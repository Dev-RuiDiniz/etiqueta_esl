import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from './lib/router';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
