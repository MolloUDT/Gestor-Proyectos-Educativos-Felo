import React from 'react';
import { Project, Group, User, Task, KanbanStatus } from '../types';
import { ProgressCircle } from './ProgressCircle';
import { EditIcon, TrashIcon } from './Icons';
import { useLanguage } from '../lib/LanguageContext';

interface ProjectCardProps {
    project?: Project;
    group?: Group;
    tutor?: User;
    tasks: Task[];
    onClick: () => void;
    isSelected?: boolean;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, group, tutor, tasks, onClick, isSelected, onEdit, onDelete }) => {
    const { t, language } = useLanguage();
    const projectTasks = project ? tasks.filter(t => t.projectId === project.id) : [];
    const doneTasks = projectTasks.filter(t => t.status === KanbanStatus.Done).length;
    const totalTasks = projectTasks.length || 1;
    const progress = project ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const locale = language === 'es' ? 'es-ES' : 'en-US';

    return (
        <button 
            onClick={onClick} 
            className={`flex items-center w-full p-4 text-left text-gray-700 transition-colors border rounded-lg shadow-sm gap-4 relative group ${
                isSelected 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-300'
            }`}
        >
            <div>
                <ProgressCircle progress={progress} size={48} showText={true} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-green-800 truncate">{t('project')}: {project ? project.name : group?.name}</p>
                <p className="text-sm text-gray-500">{t('group')}: {group?.name}</p>
                <p className="mt-1 text-xs text-blue-600">{t('tutor')}: {tutor ? `${tutor.firstName} ${tutor.lastName}` : t('none')}</p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
                <div>
                    <p className="text-xs text-right text-gray-500">{t('startDate')}</p>
                    <p className="text-sm font-medium text-green-600">{project?.startDate ? new Date(project.startDate + 'T00:00:00').toLocaleDateString(locale) : 'N/A'}</p>
                </div>
                <div className="mt-1">
                    <p className="text-xs text-right text-gray-500">{t('endDate')}</p>
                    <p className="text-sm font-medium text-red-600">{project?.endDate ? new Date(project.endDate + 'T00:00:00').toLocaleDateString(locale) : 'N/A'}</p>
                </div>
            </div>
            {(onEdit || onDelete) && (
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <div 
                            onClick={onEdit} 
                            className="p-1.5 text-gray-400 bg-white rounded-full shadow-sm hover:text-blue-500 hover:bg-blue-50 border border-gray-200 transition-colors"
                            title={t('edit')}
                        >
                            <EditIcon className="w-4 h-4 text-blue-500"/>
                        </div>
                    )}
                    {onDelete && (
                        <div 
                            onClick={onDelete} 
                            className="p-1.5 text-gray-400 bg-white rounded-full shadow-sm hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-colors"
                            title={t('delete')}
                        >
                            <TrashIcon className="w-4 h-4 text-red-500"/>
                        </div>
                    )}
                </div>
            )}
        </button>
    );
};

export default ProjectCard;
