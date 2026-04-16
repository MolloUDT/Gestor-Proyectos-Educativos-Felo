import React from 'react';
import { User, Role } from '../types';
import { Page } from '../App';
import { HomeIcon, LayoutGridIcon, GanttChartIcon, UsersIcon, FolderIcon, CalendarIcon, GraduationCapIcon, ClipboardListIcon, RocketIcon, SimpleGroupIcon, EditIcon, MessageSquareIcon, InfoIcon, BookIcon, DatabaseIcon } from './Icons';
import { useLanguage } from '../lib/LanguageContext';

interface SidebarProps {
    user: User;
    currentPage: Page;
    setPage: (page: Page) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
    id: Page;
    labelKey: string;
    icon: React.ElementType;
    roles: Role[];
}

export const useNavItems = (userRole?: Role) => {
    const { t } = useLanguage();
    
    const items: NavItem[] = [
        { id: 'dashboard', labelKey: 'dashboard', icon: HomeIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
        { id: 'project-dates', labelKey: 'projectDates', icon: CalendarIcon, roles: [Role.Admin] },
        { id: 'students', labelKey: 'students', icon: UsersIcon, roles: [Role.Admin, Role.Tutor] },
        { id: 'ras', labelKey: 'ras', icon: ClipboardListIcon, roles: [Role.Admin] },
        { id: 'tutors', labelKey: 'tutors', icon: GraduationCapIcon, roles: [Role.Admin] },
        { id: 'groups', labelKey: 'groups', icon: SimpleGroupIcon, roles: [Role.Admin, Role.Tutor] },
        { id: 'board', labelKey: 'board', icon: LayoutGridIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
        { id: 'gantt', labelKey: 'gantt', icon: GanttChartIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
        { id: 'calendar', labelKey: userRole === Role.Student ? 'agendaMeetings' : 'calendar', icon: EditIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
        { id: 'logbook', labelKey: 'logbook', icon: BookIcon, roles: [Role.Admin, Role.Tutor] },
        { id: 'messaging', labelKey: 'messaging', icon: MessageSquareIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
        { id: 'files', labelKey: 'files', icon: FolderIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
        { id: 'db-management', labelKey: 'dbManagement', icon: DatabaseIcon, roles: [Role.Admin] },
        { id: 'information', labelKey: 'information', icon: InfoIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    ];

    return items;
};

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setPage, isOpen, setIsOpen }) => {
    const { t } = useLanguage();
    const navItems = useNavItems(user.role);

    const handleNavigation = (page: Page) => {
        setPage(page);
        if (window.innerWidth < 768) { // md breakpoint
           setIsOpen(false);
        }
    };

    const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));
    
    return (
        <>
            <div 
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-center p-4 border-b">
                     <RocketIcon className="w-8 h-8 text-green-700"/>
                    <h1 className="ml-2 text-xl font-bold text-green-800">FeloProject</h1>
                </div>
                <nav className="flex-1 p-4">
                    <ul>
                        {visibleNavItems.map(({ id, labelKey, icon: Icon }) => (
                            <li key={id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleNavigation(id); }}
                                    className={`flex items-center px-4 py-2 my-1 rounded-md transition-colors ${
                                        currentPage === id
                                            ? 'bg-green-100 text-green-800 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    <span>{t(labelKey)}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
