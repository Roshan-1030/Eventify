import React from 'react';
import ReactDOM from 'react-dom/client';
import Contact from './components/Contact.jsx';
import { StateProvider } from './context/StateContext';
// Reuse existing CSS
import '../css/base.css';
import '../css/dashboard.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StateProvider>
      <Contact />
    </StateProvider>
  </React.StrictMode>,
);
