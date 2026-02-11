import { ReactNode } from 'react';

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell min-vh-100 py-4">
      <div className="container">
        <header className="app-header mb-4 rounded-3 px-4 py-3">
          <h1 className="h4 mb-0">ESL Dashboard</h1>
        </header>
        <main className="app-content rounded-3 p-4">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
