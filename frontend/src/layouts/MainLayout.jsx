import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="d-flex min-vh-100">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onCloseMobile={() => setSidebarCollapsed(true)}
      />

      <div className="flex-grow-1 d-flex flex-column min-vh-100 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-grow-1 p-3 p-md-4 overflow-y-auto main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
