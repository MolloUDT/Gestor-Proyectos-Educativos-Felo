
import React, { useState } from 'react';
import { User, Role } from '../types';
import { LogOutIcon, MenuIcon, UserIcon } from './Icons';
import { Page } from '../App';
import { useLanguage } from '../lib/LanguageContext';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    toggleSidebar: () => void;
    pageTitle: string;
    onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, toggleSidebar, pageTitle, onOpenProfile }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { t } = useLanguage();

    const translatedRole = user.role === Role.Admin ? t('adminRole') : 
                          user.role === Role.Tutor ? t('tutorRole') : t('studentRole');

    return (
        <header className="flex items-center justify-between p-4 bg-white border-b">
            <button onClick={toggleSidebar} className="text-gray-600 md:hidden">
                <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-800">
                    {pageTitle}
                </h1>
            </div>
            <div className="relative">
                <div 
                    className="p-2 cursor-pointer rounded-md hover:bg-gray-100" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                    <div className="text-right">
                        <span className="block text-sm font-medium text-gray-800">{user.firstName} {user.lastName}</span>
                        <span className="block text-xs text-gray-500">{translatedRole}</span>
                    </div>
                </div>
                {dropdownOpen && (
                    <div className="absolute right-0 z-10 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all">
                        <div className="py-1">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setDropdownOpen(false);
                                    onOpenProfile();
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            >
                                <UserIcon className="w-4 h-4 mr-2" />
                                {t('myProfile')}
                            </a>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLogout();
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            >
                                <LogOutIcon className="w-4 h-4 mr-2" />
                                {t('logout')}
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;