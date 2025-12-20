
import React from 'react';
import { Page } from '../types';
import { CalendarIcon, UserIcon, ReportIcon } from './Icons';

interface BottomNavProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
    label: string;
    page: Page;
    activePage: Page;
    onClick: (page: Page) => void;
    icon: React.ReactNode;
}> = ({ label, page, activePage, onClick, icon }) => {
    const isActive = activePage === page;
    const activeClass = 'text-[#577E89]';
    const inactiveClass = 'text-gray-400';

    return (
        <button
            onClick={() => onClick(page)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-300 relative ${isActive ? activeClass : inactiveClass} hover:text-[#577E89]`}
        >
            <div className={`transition-all duration-300 transform ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
        </button>
    );
}

export const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-100 grid grid-cols-3 h-20 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-30 pb-4">
            <NavItem 
                label="預約" 
                page={Page.Booking}
                activePage={activePage} 
                onClick={setActivePage}
                icon={<CalendarIcon className="h-6 w-6" />}
            />
            <NavItem 
                label="顧客" 
                page={Page.Customers} 
                activePage={activePage} 
                onClick={setActivePage}
                icon={<UserIcon className="h-6 w-6" />}
            />
             <NavItem 
                label="報表" 
                page={Page.Reports} 
                activePage={activePage} 
                onClick={setActivePage}
                icon={<ReportIcon className="h-6 w-6" />}
            />
        </nav>
    );
};
