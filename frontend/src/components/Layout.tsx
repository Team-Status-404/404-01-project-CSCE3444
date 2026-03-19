import type { PropsWithChildren } from 'react';
import Sidebar from './Sidebar';

type LayoutProps = PropsWithChildren;

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area">{children}</main>
    </div>
  );
}
