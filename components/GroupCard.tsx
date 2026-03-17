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
             <p className="text-sm font-bold text-yellow-600">{`${totalDays} ${daysText}`}</p>
             <p className="text-xs font-medium text-gray-500">Restantes</p>
        </div>
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

    const courseName = useMemo(() => {
        const course = courses.find(c => c.id === group.courseId);
        return course ? course.name : 'Curso no definido';
    }, [group.courseId, courses]);

    const { progress, totalTasks, inProgressTasks, completedTasks } = useMemo(() => {
        if (!project) return { progress: 0, totalTasks: 0, inProgressTasks: 0, completedTasks: 0 };
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        const completed = groupTasks.filter(t => t.status === KanbanStatus.Done).length;
        const inProgress = groupTasks.filter(t => t.status === KanbanStatus.Doing).length;
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { progress: progressPercentage, totalTasks: total, inProgressTasks: inProgress, completedTasks: completed };
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

    return (
        <div 
            onClick={onCardClick} 
            className="flex items-center w-full p-3 text-left text-gray-700 transition-colors bg-white border rounded-md shadow-sm gap-4 hover:bg-green-50 hover:border-green-300 cursor-pointer relative group"
        >
            <div>
                <ProgressCircle progress={progress} size={48} showText={true} />
            </div>
            
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-green-800 truncate">{project ? project.name : group.name}</p>
                <p className="text-sm text-gray-500">{project ? group.name : 'Grupo sin proyecto'}</p>
                <p className="mt-1 text-xs text-gray-500">Tutor: {tutor ? tutor.name : 'Sin tutor'}</p>
            </div>

            <div className="flex flex-col items-end flex-shrink-0">
                {project?.startDate && (
                    <div>
                        <p className="text-sm font-medium text-gray-800">{new Date(project.startDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                        <p className="text-xs text-right text-gray-500">Inicio</p>
                    </div>
                )}
                {project?.endDate && (
                    <div className="mt-1">
                        <p className="text-sm font-medium text-gray-800">{new Date(project.endDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                        <p className="text-xs text-right text-gray-500">Fin</p>
                    </div>
                )}
            </div>

            {canManage && (
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleEditClick} 
                        className="p-1 text-gray-400 bg-white rounded-full shadow-sm hover:text-blue-500 hover:bg-blue-50 border border-gray-200"
                        title="Editar"
                    >
                        <EditIcon className="w-3.5 h-3.5"/>
                    </button>
                    <button 
                        onClick={handleDeleteClick} 
                        className="p-1 text-gray-400 bg-white rounded-full shadow-sm hover:text-red-500 hover:bg-red-50 border border-gray-200"
                        title="Eliminar"
                    >
                        <TrashIcon className="w-3.5 h-3.5"/>
                    </button>
                </div>
            )}
        </div>
    );
};
