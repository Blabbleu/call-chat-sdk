import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatCenter, CallCenter } from 'call-chat-sdk';

import "./index.css";
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatCenter userId="demo-user" />} />
        <Route path="/call" element={<CallCenter />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
