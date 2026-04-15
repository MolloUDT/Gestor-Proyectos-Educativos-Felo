import React from 'react';
import { User, Role } from '../types';
import { Page } from '../App';
import { HomeIcon, LayoutGridIcon, GanttChartIcon, UsersIcon, FolderIcon, CalendarIcon, GraduationCapIcon, ClipboardListIcon, RocketIcon, SimpleGroupIcon, EditIcon, MessageSquareIcon, InfoIcon, BookIcon, DatabaseIcon } from './Icons';

interface SidebarProps {
    user: User;
    currentPage: Page;
    setPage: (page: Page) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
    id: Page;
    label: string;
    icon: React.ElementType;
    roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Panel de Control', icon: HomeIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    { id: 'project-dates', label: 'Fechas de Proyectos', icon: CalendarIcon, roles: [Role.Admin] },
    { id: 'students', label: 'Gestión de Alumnos', icon: UsersIcon, roles: [Role.Admin, Role.Tutor] },
    { id: 'ras', label: 'Gestión de RAs', icon: ClipboardListIcon, roles: [Role.Admin] },
    { id: 'tutors', label: 'Gestión de Tutores', icon: GraduationCapIcon, roles: [Role.Admin] },
    { id: 'groups', label: 'Gestión de Grupos', icon: SimpleGroupIcon, roles: [Role.Admin, Role.Tutor] },
    { id: 'board', label: 'Tablero Kanban', icon: LayoutGridIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    { id: 'gantt', label: 'Diagrama de Gantt', icon: GanttChartIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    { id: 'calendar', label: 'Agenda de Tutorías', icon: EditIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    { id: 'logbook', label: 'Cuaderno de Bitácora', icon: BookIcon, roles: [Role.Admin, Role.Tutor] },
    { id: 'messaging', label: 'Mensajería', icon: MessageSquareIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    { id: 'files', label: 'Archivos de grupos', icon: FolderIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
    { id: 'db-management', label: 'Gestión Base Datos', icon: DatabaseIcon, roles: [Role.Admin] },
    { id: 'information', label: 'Información', icon: InfoIcon, roles: [Role.Admin, Role.Tutor, Role.Student] },
];

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setPage, isOpen, setIsOpen }) => {

    const handleNavigation = (page: Page) => {
        setPage(page);
        if (window.innerWidth < 768) { // md breakpoint
           setIsOpen(false);
        }
    };

    const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));
    
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
                        {visibleNavItems.map(({ id, label, icon: Icon }) => (
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
                                    <span>{label}</span>
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