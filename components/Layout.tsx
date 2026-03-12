
import React, { useState } from 'react';
import { User } from '../types';
import Sidebar, { NAV_ITEMS } from './Sidebar';
import Header from './Header';
import { Page } from '../App';

interface LayoutProps {
    user: User;
    onLogout: () => void;
    children: React.ReactNode;
    currentPage: Page;
    setPage: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, currentPage, setPage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const pageTitle = NAV_ITEMS.find(item => item.id === currentPage)?.label || '';

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar 
                user={user} 
                currentPage={currentPage} 
                setPage={setPage}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <Header 
                    user={user} 
                    onLogout={onLogout} 
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    pageTitle={pageTitle}
                />
                <main className="flex-1 p-4 overflow-y-auto md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
