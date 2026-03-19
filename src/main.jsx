import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StateProvider } from './context/StateContext';
// Import all existing CSS
import './css/base.css';
import './css/auth.css';
import './css/dashboard.css';
import './css/events.css';
import './css/gallery.css';
import './css/feedback.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StateProvider>
      <App />
    </StateProvider>
  </React.StrictMode>,
);
