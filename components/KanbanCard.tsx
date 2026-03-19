import React from 'react';
import { Task, RA, KanbanStatus, User } from '../types';
import PriorityIcon from './PriorityIcon';
import DifficultyIcon from './DifficultyIcon';
import StatusIcon from './StatusIcon';

interface KanbanCardProps {
    task: Task;
    ras: RA[];
    users: User[];
    onClick: () => void;
    viewMode: 'status' | 'priority' | 'difficulty';
}

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
};

const KanbanCard: React.FC<KanbanCardProps> = ({ task, ras, users, onClick, viewMode }) => {
    const assignee = users.find(user => user.id === task.assigneeId);
    const ra = ras.find(r => r.id === task.raId);
    const isVerified = task.isVerified ?? true; // Default to true for existing tasks if not specified

    const getDateColor = (): string => {
        if (task.status === KanbanStatus.Done) {
            return 'text-gray-400';
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const endDate = new Date(task.endDate);

        if (endDate < today) {
            return 'text-red-500 font-bold'; 
        }
        return 'text-green-600';
    };

    const dateColorClass = getDateColor();

    return (
        <div 
            onClick={onClick} 
            className={`p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all border ${
                isVerified ? 'bg-white border-transparent' : 'bg-red-50 border-red-200'
            }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col flex-1 mr-2">
                    <h4 className="font-semibold text-blue-800 leading-tight">{task.title}</h4>
                    {!isVerified && (
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-1">
                            ⚠️ Pendiente de revisión
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-400 rounded-md shadow-sm shrink-0">
                    <StatusIcon status={task.status} className="w-4 h-4" />
                    <PriorityIcon priority={task.priority} className="w-4 h-4" />
                    <DifficultyIcon difficulty={task.difficulty} className="w-4 h-4" />
                </div>
            </div>
            <p className="mb-3 text-sm text-gray-600 line-clamp-2">{task.description}</p>
            
            {ra && (
                <div className="p-1.5 mb-3 text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded-md">
                    <span className="font-semibold">{ra.module} / {ra.code}:</span> {ra.description}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                {assignee ? (
                    <div className="flex items-center">
                         <span className="text-xs font-medium text-gray-600">
                             <span className="font-semibold">Responsable: </span>
                             {assignee.lastName}, {assignee.firstName}
                         </span>
                    </div>
                ) : <div/>}
                <div className={`text-xs ${dateColorClass}`}>
                    {`${formatDate(task.startDate)} - ${formatDate(task.endDate)}`}
                </div>
            </div>
        </div>
    );
};

export default KanbanCard;