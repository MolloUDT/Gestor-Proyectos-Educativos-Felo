
import { KanbanStatus, Priority } from './types';

export const KANBAN_COLUMNS_ORDER: KanbanStatus[] = [
    KanbanStatus.Backlog,
    KanbanStatus.Doing,
    KanbanStatus.Done,
];

export const PRIORITY_COLORS: { [key in Priority]: string } = {
    [Priority.High]: 'bg-red-100 text-red-800 border-red-500',
    [Priority.Medium]: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    [Priority.Low]: 'bg-green-100 text-green-800 border-green-500',
};

export const STATUS_COLORS: { [key in KanbanStatus]: string } = {
    [KanbanStatus.Backlog]: 'bg-red-200 text-red-800',
    [KanbanStatus.Doing]: 'bg-yellow-200 text-yellow-800',
    [KanbanStatus.Done]: 'bg-green-200 text-green-800',
};

export const STATUS_BADGE_COLORS: { [key in KanbanStatus]: string } = {
    [KanbanStatus.Backlog]: 'bg-red-100 text-red-800 border-red-500',
    [KanbanStatus.Doing]: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    [KanbanStatus.Done]: 'bg-green-100 text-green-800 border-green-500',
};
