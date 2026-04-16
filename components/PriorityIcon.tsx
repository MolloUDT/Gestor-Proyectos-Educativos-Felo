import React from 'react';
import { Priority, Difficulty, KanbanStatus } from '../types';
import { ClockIcon } from './Icons';
import DifficultyIcon from './DifficultyIcon';
import StatusIcon from './StatusIcon';
import { useLanguage } from '../lib/LanguageContext';

interface PriorityIconProps {
    priority: Priority;
    className?: string;
}

const PriorityIcon: React.FC<PriorityIconProps> = ({ priority, className = "w-4 h-4" }) => {
    let colorClass = '';
    
    switch (priority) {
        case Priority.High:
            colorClass = 'text-red-500';
            break;
        case Priority.Medium:
            colorClass = 'text-yellow-500';
            break;
        case Priority.Low:
            colorClass = 'text-green-500';
            break;
        default:
            colorClass = 'text-gray-400';
    }

    return <ClockIcon className={`${className} ${colorClass}`} />;
};

export const KanbanLegend: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Prioridad */}
            <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('legend_priority')}:</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <PriorityIcon priority={Priority.High} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('high')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <PriorityIcon priority={Priority.Medium} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('medium')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <PriorityIcon priority={Priority.Low} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('low')}</span>
                    </div>
                </div>
            </div>

            {/* Dificultad */}
            <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('legend_difficulty')}:</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <DifficultyIcon difficulty={Difficulty.Level3} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('high')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DifficultyIcon difficulty={Difficulty.Level2} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('medium')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DifficultyIcon difficulty={Difficulty.Level1} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('low')}</span>
                    </div>
                </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('legend_status')}:</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <StatusIcon status={KanbanStatus.Backlog} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('pending')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <StatusIcon status={KanbanStatus.Doing} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('inProgress')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <StatusIcon status={KanbanStatus.Done} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">{t('completed')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriorityIcon;
