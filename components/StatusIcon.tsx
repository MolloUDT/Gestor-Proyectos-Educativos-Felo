import React from 'react';
import { KanbanStatus } from '../types';

interface StatusIconProps {
    status: KanbanStatus;
    className?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, className = "w-4 h-4" }) => {
    switch (status) {
        case KanbanStatus.Backlog:
            return (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" className="text-red-300" />
                </svg>
            );
        case KanbanStatus.Doing:
            return (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" className="text-yellow-300" />
                </svg>
            );
        case KanbanStatus.Done:
            return (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" className="text-green-300" />
                </svg>
            );
        default:
            return null;
    }
};

export default StatusIcon;
