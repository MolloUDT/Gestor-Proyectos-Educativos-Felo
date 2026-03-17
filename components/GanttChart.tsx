import React, { useMemo, useState, useRef } from 'react';
import { User, Task, Role, Group, Project, KanbanStatus, Priority, RA, Difficulty, Course } from '../types';
import { ChevronDownIcon, TrashIcon, EditIcon } from './Icons';
import PriorityIcon, { KanbanLegend } from './PriorityIcon';
import DifficultyIcon from './DifficultyIcon';
import StatusIcon from './StatusIcon';
import { KANBAN_COLUMNS_ORDER } from '../constants';
import Modal from './Modal';
import { ProgressCircle } from './ProgressCircle';

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Formulario de Tareas (copiado de KanbanBoard y adaptado para Gantt)
const GanttTaskForm: React.FC<{
    task: Partial<Task> | null;
    assignees: User[];
    projectId: string;
    ras: RA[];
    courseDates: { startDate: string; endDate: string; };
    onSave: (data: any) => void;
    onCancel: () => void;
    onDelete?: (task: Task) => void;
    userRole: Role;
}> = ({ task, assignees, projectId, ras, courseDates, onSave, onCancel, onDelete, userRole }) => {
    const isNewTask = !task?.id;
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        assigneeId: task?.assigneeId || '',
        status: task?.status || KanbanStatus.Backlog,
        priority: task?.priority || Priority.Medium,
        difficulty: task?.difficulty || Difficulty.Level2,
        startDate: task?.startDate || formatDate(new Date()),
        endDate: task?.endDate || '',
        raId: task?.raId || '',
        isVerified: task?.isVerified ?? (isNewTask ? false : true),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, projectId });
    };

    const handleVerify = () => {
        setFormData(prev => ({ ...prev, isVerified: true }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!formData.isVerified && !isNewTask && (userRole === Role.Admin || userRole === Role.Tutor) && (
                <div className="p-3 mb-4 border border-red-200 rounded-md bg-red-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700">
                            <span className="text-lg">⚠️</span>
                            <span className="text-sm font-medium">Esta tarea está pendiente de revisión.</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleVerify}
                            className="px-3 py-1 text-xs font-bold text-white uppercase bg-red-600 rounded hover:bg-red-700 transition-colors"
                        >
                            ✓ Validar y dar OK
                        </button>
                    </div>
                </div>
            )}
            {formData.isVerified && !isNewTask && (userRole === Role.Admin || userRole === Role.Tutor) && (
                <div className="p-3 mb-4 border border-green-200 rounded-md bg-green-50">
                    <div className="flex items-center gap-2 text-green-700">
                        <span className="text-lg">✓</span>
                        <span className="text-sm font-medium">Tarea revisada y validada.</span>
                    </div>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                    <select name="assigneeId" value={formData.assigneeId} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required>
                        <option value="">Seleccionar miembro</option>
                        {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required>
                        {KANBAN_COLUMNS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required>
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nivel de Dificultad</label>
                    <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required>
                        {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                {(userRole === Role.Admin || userRole === Role.Tutor) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">RA Asociado</label>
                        <select name="raId" value={formData.raId} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md">
                            <option value="">Seleccionar RA</option>
                            {ras.map(ra => <option key={ra.id} value={ra.id}>{ra.module} / {ra.code}: {ra.description}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} min={courseDates.startDate} max={courseDates.endDate} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} min={formData.startDate || courseDates.startDate} max={courseDates.endDate} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div className="flex items-center justify-between pt-4">
                <div>
                    {!isNewTask && (userRole === Role.Admin || userRole === Role.Tutor || userRole === Role.Student) && (
                        <button type="button" onClick={() => onDelete?.(task as Task)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                           <TrashIcon className="w-4 h-4" /> Eliminar
                        </button>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Guardar Tarea</button>
                </div>
            </div>
        </form>
    );
};


const STATUS_BACKGROUND_COLORS: { [key in KanbanStatus]: string } = {
    [KanbanStatus.Backlog]: 'bg-red-100 text-red-800',
    [KanbanStatus.Doing]: 'bg-yellow-100 text-yellow-800',
    [KanbanStatus.Done]: 'bg-green-100 text-green-800',
};

const PRIORITY_BACKGROUND_COLORS: { [key in Priority]: string } = {
    [Priority.High]: 'bg-red-100 text-red-800',
    [Priority.Medium]: 'bg-yellow-100 text-yellow-800',
    [Priority.Low]: 'bg-green-100 text-green-800',
};

const GANTT_BAR_COLORS: { [key in KanbanStatus]: string } = {
    [KanbanStatus.Backlog]: 'bg-red-300 text-red-800',
    [KanbanStatus.Doing]: 'bg-yellow-300 text-yellow-800',
    [KanbanStatus.Done]: 'bg-green-300 text-green-800',
};

const GanttLegend: React.FC = () => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            {/* Prioridad */}
            <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Prioridad:</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <PriorityIcon priority={Priority.High} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Alta</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <PriorityIcon priority={Priority.Medium} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Media</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <PriorityIcon priority={Priority.Low} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Baja</span>
                    </div>
                </div>
            </div>

            {/* Dificultad */}
            <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Dificultad:</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <DifficultyIcon difficulty={Difficulty.Level1} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Baja</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DifficultyIcon difficulty={Difficulty.Level2} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Media</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DifficultyIcon difficulty={Difficulty.Level3} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Alta</span>
                    </div>
                </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Estado:</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <StatusIcon status={KanbanStatus.Backlog} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <StatusIcon status={KanbanStatus.Doing} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">En progreso</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <StatusIcon status={KanbanStatus.Done} className="w-4 h-4" />
                        <span className="text-xs text-gray-600">Realizada</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LocalProgressCircle: React.FC<{ progress: number; size?: number }> = ({ progress, size = 48 }) => {
    const strokeWidth = 6;

    if (progress === 100) {
        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        className="text-green-500"
                        fill="currentColor"
                        r={size / 2}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <span className="absolute text-sm font-bold text-white">{progress}%</span>
            </div>
        );
    }
    
    if (progress === 0) {
         return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        className="text-red-500"
                        fill="currentColor"
                        r={size / 2}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <span className="absolute text-sm font-bold text-white">{progress}%</span>
            </div>
        );
    }

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const progressColorClass = useMemo(() => {
        if (progress <= 40) return 'text-red-500';
        if (progress <= 79) return 'text-yellow-500';
        return 'text-green-500';
    }, [progress]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-gray-200" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
                <circle
                    className={progressColorClass}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size/2}
                    cy={size/2}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    transform={`rotate(-90 ${size/2} ${size/2})`}
                />
            </svg>
            <span className="text-sm font-bold text-gray-700">{progress}%</span>
        </div>
    );
};


interface GanttChartDisplayProps {
    tasks: Task[];
    courseDates: { startDate: string; endDate: string; };
    ras: RA[];
    onUpdateTask: (id: string, data: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    user: User;
    availableAssignees: User[];
    projectId: string;
}

const GanttChartDisplay: React.FC<GanttChartDisplayProps> = ({ tasks, courseDates, ras, onUpdateTask, onDeleteTask, user, availableAssignees, projectId }) => {
    const [dayWidth, setDayWidth] = useState(27);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [sortOption, setSortOption] = useState<'priority' | 'status' | 'date'>('date');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dayInitials = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    const sortedTasks = useMemo(() => {
        const tasksCopy = [...tasks];
        if (sortOption === 'priority') {
            const priorityOrder = { [Priority.High]: 1, [Priority.Medium]: 2, [Priority.Low]: 3 };
            tasksCopy.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        } else if (sortOption === 'status') {
            const statusOrder = { [KanbanStatus.Backlog]: 1, [KanbanStatus.Doing]: 2, [KanbanStatus.Done]: 3 };
            tasksCopy.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        } else if (sortOption === 'date') {
            tasksCopy.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        }
        return tasksCopy;
    }, [tasks, sortOption]);

    const { chartStartDate, chartEndDate, totalDays } = useMemo(() => {
        const startDate = new Date(courseDates.startDate);
        const endDate = new Date(courseDates.endDate);
        const dayInMillis = 1000 * 60 * 60 * 24;
        const diff = (endDate.getTime() - startDate.getTime()) / dayInMillis;
        return { chartStartDate: startDate, chartEndDate: endDate, totalDays: Math.max(0, Math.ceil(diff) + 1) };
    }, [courseDates]);

    const getDaysOffset = (dateStr: string) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        const dayInMillis = 1000 * 60 * 60 * 24;
        return Math.floor((date.getTime() - chartStartDate.getTime()) / dayInMillis);
    };

    const monthHeaders = useMemo(() => {
        if (totalDays === 0) return [];
        const months = []; let currentDate = new Date(chartStartDate); currentDate.setDate(1);
        while (currentDate <= chartEndDate) { months.push(new Date(currentDate)); currentDate.setMonth(currentDate.getMonth() + 1); }
        return months;
    }, [chartStartDate, chartEndDate, totalDays]);
    
    const handleEditTask = (task: Task) => {
        if (user.role === Role.Admin || user.role === Role.Tutor || user.role === Role.Student) {
             setEditingTask(task);
             setIsModalOpen(true);
        }
    };

    const handleScrollToTask = (task: Task) => {
        const minDayWidth = 15;
        setDayWidth(minDayWidth);
        if (scrollContainerRef.current) {
            const startOffset = getDaysOffset(task.startDate);
            const scrollPosition = startOffset * minDayWidth;
            scrollContainerRef.current.scrollTo({
                left: scrollPosition,
                behavior: 'smooth',
            });
        }
    };

    const handleSaveTask = (taskData: any) => {
        if (editingTask) { onUpdateTask(editingTask.id, taskData); }
        setIsModalOpen(false); setEditingTask(null);
    };

    const handleDeleteRequest = (task: Task) => {
        setTaskToDelete(task); setIsModalOpen(false);
    };
    
    const handleConfirmDelete = () => {
        if (taskToDelete) { onDeleteTask(taskToDelete.id); setTaskToDelete(null); }
    };
    
    const getRowBgColor = (task: Task) => {
        if (sortOption === 'priority') {
            return PRIORITY_BACKGROUND_COLORS[task.priority];
        }
        return STATUS_BACKGROUND_COLORS[task.status];
    };


    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 shrink-0">
                <div className="flex items-center gap-4 ml-auto">
                    <div>
                        <label htmlFor="gantt-sort" className="mr-2 text-sm font-semibold text-gray-600">Ordenar por:</label>
                        <select
                            id="gantt-sort"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as 'priority' | 'status' | 'date')}
                            className="p-1 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                            <option value="status">Por Estado</option>
                            <option value="priority">Por Prioridad</option>
                            <option value="date">Por Fecha</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-600">Zoom:</span>
                        <button onClick={() => setDayWidth(w => Math.max(15, w - 5))} className="px-3 py-1 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">-</button>
                        <button onClick={() => setDayWidth(w => Math.min(100, w + 5))} className="px-3 py-1 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">+</button>
                    </div>
                </div>
            </div>
            <div className="px-2 mb-4">
                {sortedTasks.length > 0 && <GanttLegend />}
            </div>
            <div ref={scrollContainerRef} className="flex-grow mt-0 overflow-auto">
                <div className="grid min-w-max" style={{
                    gridTemplateColumns: `25px 25px minmax(250px, 1.5fr) repeat(${totalDays}, ${dayWidth}px)`,
                    gridTemplateRows: `40px 25px 25px repeat(${sortedTasks.length > 0 ? sortedTasks.length : 1}, 40px)`
                }}>
                    <div className="sticky top-0 left-0 z-30 bg-gray-200 border-b border-r border-l" style={{ gridRow: 1, gridColumn: '1 / span 3' }}></div>
                    
                    {monthHeaders.map((month) => {
                        const monthStart = new Date(month); const nextMonthStart = new Date(month); nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
                        const startOffset = getDaysOffset(formatDate(monthStart)); const endOffset = getDaysOffset(formatDate(nextMonthStart));
                        const colStart = Math.max(0, startOffset); const colEnd = Math.min(totalDays, endOffset); const colSpan = colEnd - colStart;
                        if (colSpan <= 0) return null;
                        return (
                            <div key={month.getTime()} className="sticky top-0 z-20 flex items-center justify-center text-sm font-semibold text-gray-700 bg-gray-200 border-b border-r" style={{ gridColumn: `${colStart + 2} / span ${colSpan}`, gridRow: 1 }}>
                                {month.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                            </div>
                        );
                    })}
                    
                    <div className="sticky top-[40px] left-0 z-20 flex items-center justify-center font-semibold text-center text-gray-700 bg-gray-100 border-b border-r border-l" style={{gridRow: '2 / span 2', gridColumn: '1 / span 3'}}>Tarea</div>
                    
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const date = new Date(chartStartDate); date.setDate(date.getDate() + i); const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (<div key={i} style={{gridRow: 2}} className={`sticky top-[40px] z-10 text-xs text-center text-gray-700 border-b border-r h-full flex items-center justify-center ${isWeekend ? 'bg-red-100' : 'bg-gray-50'}`}>{date.getDate()}</div>);
                    })}

                    {Array.from({ length: totalDays }).map((_, i) => {
                        const date = new Date(chartStartDate); date.setDate(date.getDate() + i); const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                            <div key={`initial-${i}`} style={{gridRow: 3}} className={`sticky top-[65px] z-10 text-xs font-semibold h-full flex items-center justify-center border-b border-r ${isWeekend ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100'}`}>
                                {dayInitials[date.getDay()]}
                            </div>
                        );
                    })}

                    {sortedTasks.map((task, index) => {
                        const startOffset = getDaysOffset(task.startDate); const duration = getDaysOffset(task.endDate) - startOffset + 1;
                        const taskBarColor = GANTT_BAR_COLORS[task.status];
                        if (startOffset < 0 || startOffset >= totalDays || duration <= 0) return null;
                        const canEdit = user.role === Role.Admin || user.role === Role.Tutor || user.role === Role.Student;
                        const rowNumber = index + 4;
                        return (
                            <React.Fragment key={task.id}>
                                <div className="sticky left-0 z-10 flex items-center justify-center border-b border-r border-l bg-white" style={{ gridRow: rowNumber, gridColumn: 1 }}>
                                    <PriorityIcon priority={task.priority} className="w-4 h-4 shrink-0" />
                                </div>
                                <div className="sticky left-[25px] z-10 flex items-center justify-center border-b border-r bg-white" style={{ gridRow: rowNumber, gridColumn: 2 }}>
                                    <DifficultyIcon difficulty={task.difficulty} className="w-4 h-4 shrink-0" />
                                </div>
                                <div className={`sticky left-[50px] z-10 flex items-center justify-between w-full h-full p-2 text-sm text-left border-b border-r ${getRowBgColor(task)}`} style={{ gridRow: rowNumber, gridColumn: 3 }}>
                                    <span onClick={() => handleScrollToTask(task)} className="flex items-center flex-grow gap-2 truncate cursor-pointer" title={task.title}>
                                        <span className="truncate">{task.title}</span>
                                    </span>
                                    {canEdit && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                            className="flex-shrink-0 p-1 ml-2 rounded-full hover:bg-black/10"
                                            aria-label={`Editar tarea ${task.title}`}
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="relative border-b" style={{ gridColumn: `4 / span ${totalDays}`, gridRow: rowNumber }} >
                                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)`}}>
                                        {Array.from({ length: totalDays }).map((_, i) => {
                                            const date = new Date(chartStartDate); date.setDate(date.getDate() + i);
                                            const isEvenMonth = date.getMonth() % 2 === 0;
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            let bgColorClass = isWeekend ? 'bg-red-50' : isEvenMonth ? 'bg-gray-50' : 'bg-white';
                                            return <div key={i} className={`${bgColorClass} border-r border-gray-200`}></div>
                                        })}
                                    </div>
                                    <div style={{ position: 'absolute', left: `calc(${dayWidth}px * ${startOffset})`, width: `calc(${dayWidth}px * ${duration})`, top: '0.25rem', bottom: '0.25rem', zIndex: 1 }} className={`flex items-center justify-start h-auto p-1 text-xs font-semibold rounded-md ${taskBarColor}`} title={`${task.title} (${task.startDate} - ${task.endDate})`}>
                                        <span className="pl-2 truncate">{task.title}</span>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {tasks.length === 0 && <div className="py-10 text-center text-gray-500" style={{ gridColumn: '1 / -1', gridRow: 4 }}>No hay tareas para mostrar en el diagrama de Gantt.</div>}
                </div>
            </div>

            {isModalOpen && editingTask && (
                <Modal title="Editar Tarea" onClose={() => setIsModalOpen(false)}>
                    <GanttTaskForm task={editingTask} assignees={availableAssignees} projectId={projectId} ras={ras} courseDates={courseDates} onSave={handleSaveTask} onCancel={() => setIsModalOpen(false)} onDelete={handleDeleteRequest} userRole={user.role} />
                </Modal>
            )}
            {taskToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setTaskToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar la tarea?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{taskToDelete.title}"</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setTaskToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">Sí, Eliminar</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

interface GanttChartProps {
    user: User;
    groups: Group[];
    projects: Project[];
    tasks: Task[];
    allUsers: User[];
    courseDates: { startDate: string; endDate: string; };
    ras: RA[];
    courses: Course[];
    onUpdateTask: (id: string, data: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ user, groups, projects, tasks, courseDates, allUsers, ras, courses, onUpdateTask, onDeleteTask }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [expandedCourseGroups, setExpandedCourseGroups] = useState<Record<string, boolean>>({});

    const studentProjects = useMemo(() => {
        if (user.role !== Role.Student) return [];
        return projects
            .filter(p => user.groupIds.includes(p.groupId))
            .map(project => ({
                project,
                group: groups.find(g => g.id === project.groupId)
            }))
            .filter((item): item is { project: Project; group: Group } => !!item.group);
    }, [user, projects, groups]);

    const projectsByCourseGroup = useMemo(() => {
        if (user.role === Role.Student) return {};
        const result: Record<string, Project[]> = {};
        const visibleProjects = user.role === Role.Admin ? projects : projects.filter(p => {
            const group = groups.find(g => g.id === p.groupId);
            if (!group) return false;
            return user.role === Role.Tutor ? group.tutorId === user.id : user.groupIds.includes(group.id);
        });
        visibleProjects.forEach(project => {
            const group = groups.find(g => g.id === project.groupId);
            if (group) {
                const course = courses.find(c => c.id === group.courseId);
                const projectCourseGroup = course ? course.name : 'Curso no definido';
                
                if (!result[projectCourseGroup]) result[projectCourseGroup] = [];
                result[projectCourseGroup].push(project);
            }
        });
        return result;
    }, [projects, groups, courses, user]);

    const toggleCourseGroup = (courseGroupName: string) => setExpandedCourseGroups(prev => ({ ...prev, [courseGroupName]: !prev[courseGroupName] }));

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const visibleTasks = tasks.filter(t => t.projectId === selectedProjectId);

    if (selectedProject) {
        const projectGroup = groups.find(g => g.id === selectedProject.groupId);
        const assignees = projectGroup?.members || [];
        return (
            <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-between pb-4 border-b shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Gantt: <span className="text-green-700">{selectedProject.name}</span></h2>
                    <button onClick={() => setSelectedProjectId(null)} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">← Volver a la selección</button>
                </div>
                <GanttChartDisplay tasks={visibleTasks} courseDates={courseDates} ras={ras} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} user={user} availableAssignees={assignees} projectId={selectedProject.id} />
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Selecciona un Proyecto</h2>
            
            {user.role === Role.Student ? (
                <div className="space-y-2">
                    {studentProjects.length > 0 ? studentProjects.map(({ project, group }) => {
                        const projectTasks = tasks.filter(t => t.projectId === project.id);
                        const completedTasks = projectTasks.filter(t => t.status === KanbanStatus.Done).length;
                        const totalTasks = projectTasks.length;
                        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                        const tutor = allUsers.find(u => u.id === group.tutorId);

                        return (
                            <button 
                                key={project.id} 
                                onClick={() => setSelectedProjectId(project.id)} 
                                className="flex items-center w-full p-3 text-left text-gray-700 transition-colors bg-white border rounded-md shadow-sm gap-4 hover:bg-green-50 hover:border-green-300"
                            >
                                <div>
                                    <ProgressCircle progress={progress} size={48} showText={true} />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-green-800 truncate">{project.name}</p>
                                    <p className="text-sm text-gray-500">{group.name}</p>
                                    <p className="mt-1 text-xs text-gray-500">Tutor: {tutor ? tutor.name : 'Sin tutor'}</p>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{new Date(project.startDate).toLocaleDateString('es-ES')}</p>
                                        <p className="text-xs text-right text-gray-500">Inicio</p>
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-sm font-medium text-gray-800">{new Date(project.endDate).toLocaleDateString('es-ES')}</p>
                                        <p className="text-xs text-right text-gray-500">Fin</p>
                                    </div>
                                </div>
                            </button>
                        );
                    }) : <p className="text-center text-gray-500">No estás asignado a ningún proyecto.</p>}
                </div>
            ) : (
                <div className="space-y-2">
                    {Object.keys(projectsByCourseGroup).sort().map(courseGroup => {
                        const courseProjects = projectsByCourseGroup[courseGroup]; const isExpanded = !!expandedCourseGroups[courseGroup];
                        return (
                            <div key={courseGroup} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                                <button onClick={() => toggleCourseGroup(courseGroup)} className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none rounded-lg">
                                    <div className="flex items-center">
                                        <h3 className="text-lg font-semibold text-gray-800">{courseGroup}</h3>
                                        <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">{courseProjects.length} {courseProjects.length === 1 ? 'proyecto' : 'proyectos'}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="p-2 border-t border-gray-200 md:p-4">
                                        <div className="space-y-2">
                                            {courseProjects.map(project => {
                                                const group = groups.find(g => g.id === project.groupId);
                                                const tutor = allUsers.find(u => u.id === group?.tutorId);
                                                const projectTasks = tasks.filter(t => t.projectId === project.id);
                                                const completedTasks = projectTasks.filter(t => t.status === KanbanStatus.Done).length;
                                                const totalTasks = projectTasks.length;
                                                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                                return (
                                                <button 
                                                        key={project.id} 
                                                        onClick={() => setSelectedProjectId(project.id)} 
                                                        className="flex items-center w-full p-3 text-left text-gray-700 transition-colors bg-white border rounded-md shadow-sm gap-4 hover:bg-green-50 hover:border-green-300"
                                                    >
                                                        <div>
                                                            <ProgressCircle progress={progress} size={48} showText={true} />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <p className="font-semibold text-green-800 truncate">{project.name}</p>
                                                            <p className="text-sm text-gray-500">{group?.name}</p>
                                                            <p className="mt-1 text-xs text-gray-500">Tutor: {tutor ? tutor.name : 'Sin tutor'}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end flex-shrink-0">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{new Date(project.startDate).toLocaleDateString('es-ES')}</p>
                                                                <p className="text-xs text-right text-gray-500">Inicio</p>
                                                            </div>
                                                            <div className="mt-1">
                                                                <p className="text-sm font-medium text-gray-800">{new Date(project.endDate).toLocaleDateString('es-ES')}</p>
                                                                <p className="text-xs text-right text-gray-500">Fin</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GanttChart;