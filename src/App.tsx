import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectionPortal } from './pages/ProjectionPortal';
import { RemotePortal } from './pages/RemotePortal';
import { AdminPortal } from './pages/AdminPortal';
import { Home } from './pages/Home';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projection" element={<ProjectionPortal />} />
        <Route path="/remote" element={<RemotePortal />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
