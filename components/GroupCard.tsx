import React, { useMemo } from 'react';
import { Group, Project, User, Task, Course, KanbanStatus, Role } from '../types';
import { EditIcon, TrashIcon } from './Icons';
import { sortBySurname } from '../lib/utils';
import { ProgressCircle } from './ProgressCircle';

export const CountdownDisplay: React.FC<{ endDate: string }> = ({ endDate }) => {
    if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return (
            <div className="text-center">
                <p className="text-sm font-bold text-gray-600">N/A</p>
                <p className="text-xs font-medium text-gray-500">Estado</p>
            </div>
        );
    }
    
    const [year, month, day] = endDate.split('-').map(Number);
    const endUTC = Date.UTC(year, month - 1, day);

    const today = new Date();
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    if (endUTC < todayUTC) {
        return (
            <div className="text-center">
                <p className="text-sm font-bold text-red-600">Finalizado</p>
                <p className="text-xs font-medium text-gray-500">Estado</p>
            </div>
        );
    }
    
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInMs = endUTC - todayUTC;
    const totalDays = Math.floor(diffInMs / oneDay) + 1;

    const daysText = totalDays === 1 ? 'día' : 'días';

    return (
        <div className="text-center">
             <p className="text-xs font-bold text-yellow-600">{`${totalDays} ${daysText}`}</p>
             <p className="text-[11px] font-medium text-gray-500">Restantes</p>
        </div>
    );
};

export const GroupSummaryCard: React.FC<{
    group: Group;
    projects: Project[];
    allUsers: User[];
    tasks: Task[];
    onCardClick: () => void;
}> = ({ group, projects, allUsers, tasks, onCardClick }) => {
    const project = projects.find(p => p.groupId === group.id);
    const tutor = allUsers.find(u => u.id === group.tutorId);
    
    const progress = useMemo(() => {
        if (!project) return 0;
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        const completed = groupTasks.filter(t => t.status === KanbanStatus.Done).length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }, [project, tasks]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <button 
            onClick={onCardClick} 
            className="flex items-center w-full p-3 text-left text-gray-700 transition-colors bg-white border rounded-md shadow-sm gap-4 hover:bg-green-50 hover:border-green-300"
        >
            <div>
                <ProgressCircle progress={progress} size={48} showText={true} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-green-800 truncate">{project ? project.name : group.name}</p>
                <p className="text-sm text-gray-500">{group.name}</p>
                <p className="mt-1 text-xs text-gray-500">Tutor: {tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Sin tutor'}</p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
                <div>
                    <p className="text-sm font-medium text-gray-800">{formatDate(project?.startDate || '')}</p>
                    <p className="text-xs text-right text-gray-500">Inicio</p>
                </div>
                <div className="mt-1">
                    <p className="text-sm font-medium text-gray-800">{formatDate(project?.endDate || '')}</p>
                    <p className="text-xs text-right text-gray-500">Fin</p>
                </div>
            </div>
        </button>
    );
};

export const GroupCard: React.FC<{ 
    group: Group; 
    projects: Project[]; 
    allUsers: User[];
    tasks: Task[];
    user: User;
    courses: Course[];
    onEdit?: () => void; 
    onDelete?: () => void;
    onCardClick: () => void;
}> = ({ group, projects, allUsers, tasks, user, courses, onEdit, onDelete, onCardClick }) => {
    const tutor = allUsers.find(u => u.id === group.tutorId);
    const project = projects.find(p => p.groupId === group.id);
    const members = useMemo(() => [...(group.members || [])].sort(sortBySurname), [group.members]);

    const { progress, totalTasks, pendingTasks, inProgressTasks, completedTasks } = useMemo(() => {
        if (!project) return { progress: 0, totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0 };
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        const pending = groupTasks.filter(t => t.status === KanbanStatus.Backlog).length;
        const inProgress = groupTasks.filter(t => t.status === KanbanStatus.Doing).length;
        const completed = groupTasks.filter(t => t.status === KanbanStatus.Done).length;
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { progress: progressPercentage, totalTasks: total, pendingTasks: pending, inProgressTasks: inProgress, completedTasks: completed };
    }, [project, tasks]);

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete();
    };

    const canManage = (user.role === Role.Admin || user.id === group.tutorId) && onEdit && onDelete;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div 
            onClick={onCardClick} 
            className="flex flex-col w-full p-5 text-left text-gray-700 transition-all bg-white border rounded-xl shadow-sm hover:shadow-md hover:border-green-300 cursor-pointer relative group overflow-hidden h-full"
        >
            {/* Header with Progress */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-grow min-w-0 pr-2">
                    <h4 className="text-base font-bold text-green-800 leading-tight">
                        Proyecto: <span className="font-semibold text-green-600">{project ? project.name : group.name}</span>
                    </h4>
                    <p className="text-sm font-medium text-gray-500 truncate">
                        <span className="font-bold text-black">Grupo:</span> {project ? group.name : 'Sin proyecto'}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <ProgressCircle progress={progress} size={56} showText={true} />
                </div>
            </div>

            {/* Dates and Countdown */}
            <div className="grid grid-cols-3 gap-2 p-3 mb-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-center border-r border-gray-200">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Inicio</p>
                    <p className="text-xs font-bold text-gray-800">
                        {formatDate(project?.startDate || '')}
                    </p>
                </div>
                <div className="text-center border-r border-gray-200">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Fin</p>
                    <p className="text-xs font-bold text-gray-800">
                        {formatDate(project?.endDate || '')}
                    </p>
                </div>
                <div className="flex items-center justify-center">
                    {project?.endDate && <CountdownDisplay endDate={project.endDate} />}
                </div>
            </div>

            {/* Task Stats Grid */}
            <div className="mb-4">
                <p className="text-center text-[10px] font-extrabold text-gray-400 uppercase mb-1 tracking-widest">Tareas</p>
                <div className="grid grid-cols-4 gap-1">
                    <div className="flex flex-col items-center p-1.5 bg-gray-50 rounded border border-gray-100">
                        <span className="text-sm font-bold text-gray-700">{totalTasks}</span>
                        <span className="text-[8px] font-semibold text-gray-400 uppercase">Total</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 bg-red-50 rounded border border-red-100">
                        <span className="text-sm font-bold text-red-600">{pendingTasks}</span>
                        <span className="text-[8px] font-semibold text-red-400 uppercase">Pendientes</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 bg-blue-50 rounded border border-blue-100">
                        <span className="text-sm font-bold text-blue-600">{inProgressTasks}</span>
                        <span className="text-[8px] font-semibold text-blue-400 uppercase">En Progreso</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 bg-green-50 rounded border border-green-100">
                        <span className="text-sm font-bold text-green-800">{completedTasks}</span>
                        <span className="text-[8px] font-semibold text-green-800 uppercase">Realizadas</span>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="mb-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Alumnado integrante</p>
                <div className="space-y-1">
                    {members.length > 0 ? (
                        members.map(member => (
                            <div key={member.id} className="flex items-center text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                                <span className="font-bold text-gray-700">{member.lastName}, {member.firstName}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs italic text-gray-400">Sin alumnos asignados</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                    <span className="font-bold text-black">Tutor:</span> <span className="font-semibold text-green-800">{tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Sin tutor'}</span>
                </p>
            </div>

            {/* Management Buttons */}
            {canManage && (
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleEditClick} 
                        className="p-1.5 text-gray-400 bg-white rounded-full shadow-sm hover:text-blue-500 hover:bg-blue-50 border border-gray-200 transition-colors"
                        title="Editar"
                    >
                        <EditIcon className="w-4 h-4"/>
                    </button>
                    <button 
                        onClick={handleDeleteClick} 
                        className="p-1.5 text-gray-400 bg-white rounded-full shadow-sm hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-colors"
                        title="Eliminar"
                    >
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </div>
    );
};
