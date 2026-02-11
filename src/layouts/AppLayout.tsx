import { ReactNode, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { stores } from '../mocks';

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0].id);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar d-none d-lg-block">
        <Sidebar />
      </aside>

      <div className="app-main">
        <Topbar
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
          onOpenMenu={() => setIsSidebarOpen(true)}
        />

        <main className="app-content-area p-3 p-md-4">{children}</main>
      </div>

      <div className={`sidebar-mobile-backdrop ${isSidebarOpen ? 'show' : ''}`} onClick={closeSidebar} />
      <aside className={`app-sidebar-mobile ${isSidebarOpen ? 'show' : ''}`}>
        <Sidebar onNavigate={closeSidebar} />
      </aside>
    </div>
  );
}

export default AppLayout;
