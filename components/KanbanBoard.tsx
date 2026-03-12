import React, { useState, useMemo, useEffect } from 'react';
import { User, Task, KanbanStatus, Role, Group, Project, Priority, RA, Difficulty } from '../types';
import { KANBAN_COLUMNS_ORDER, STATUS_COLORS } from '../constants';
import KanbanCard from './KanbanCard';
import PriorityIcon, { KanbanLegend } from './PriorityIcon';
import DifficultyIcon from './DifficultyIcon';
import StatusIcon from './StatusIcon';
import Modal from './Modal';
import { PlusCircleIcon } from './Icons';
import TaskForm from './TaskForm';

interface KanbanBoardProps {
    user: User;
    groups: Group[];
    projects: Project[];
    tasks: Task[];
    users: User[];
    ras: RA[];
    courseDates: { startDate: string; endDate: string; };
    onCreateTask: (data: Omit<Task, 'id'>) => void;
    onUpdateTask: (id: string, data: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    initialProjectId?: string | null;
    onProjectSelected?: () => void;
}

type ViewMode = 'status' | 'priority' | 'difficulty';

const PRIORITY_COLUMN_COLORS: { [key in Priority]: string } = {
    [Priority.High]: 'bg-red-200 text-red-800',
    [Priority.Medium]: 'bg-yellow-200 text-yellow-800',
    [Priority.Low]: 'bg-green-200 text-green-800',
};

const DIFFICULTY_COLUMN_COLORS: { [key in Difficulty]: string } = {
    [Difficulty.Level1]: 'bg-green-200 text-green-800',
    [Difficulty.Level2]: 'bg-yellow-200 text-yellow-800',
    [Difficulty.Level3]: 'bg-red-200 text-red-800',
};

const KanbanColumn: React.FC<{ 
    title: string; 
    headerColor: string;
    tasks: Task[]; 
    ras: RA[];
    users: User[];
    onCardClick: (task: Task) => void; 
    userRole: Role;
    viewMode: ViewMode;
}> = ({ title, headerColor, tasks, ras, users, onCardClick, userRole, viewMode }) => {
    
    const renderIcon = () => {
        if (viewMode === 'status') {
            return <StatusIcon status={title as KanbanStatus} className="w-4 h-4" />;
        } else if (viewMode === 'priority') {
            return <PriorityIcon priority={title as Priority} className="w-4 h-4" />;
        } else if (viewMode === 'difficulty') {
            return <DifficultyIcon difficulty={title as Difficulty} className="w-4 h-4" />;
        }
        return null;
    };

    const getDisplayTitle = () => {
        if (viewMode === 'status') {
            switch (title) {
                case KanbanStatus.Backlog: return 'Tareas pendientes';
                case KanbanStatus.Doing: return 'Tareas en progreso';
                case KanbanStatus.Done: return 'Tareas realizadas';
                default: return title;
            }
        } else if (viewMode === 'priority') {
            switch (title) {
                case Priority.High: return 'Prioridad alta';
                case Priority.Medium: return 'Prioridad media';
                case Priority.Low: return 'Prioridad baja';
                default: return title;
            }
        } else if (viewMode === 'difficulty') {
            switch (title) {
                case Difficulty.Level3: return 'Dificultad alta';
                case Difficulty.Level2: return 'Dificultad media';
                case Difficulty.Level1: return 'Dificultad baja';
                default: return title;
            }
        }
        return title;
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between p-2 mb-2">
                <h3 className={`text-sm font-semibold uppercase ${headerColor} px-3 py-1 rounded-full`}>{getDisplayTitle()}</h3>
                <div className="flex items-center gap-2">
                    {renderIcon()}
                    <span className="text-sm font-bold text-gray-500">{tasks.length}</span>
                </div>
            </div>
            <div className="flex-1 p-2 space-y-4 overflow-y-auto bg-gray-100 rounded-lg min-h-[200px]">
                {tasks.map(task => (
                    <KanbanCard key={task.id} task={task} ras={ras} users={users} onClick={() => onCardClick(task)} viewMode={viewMode} />
                ))}
            </div>
        </div>
    );
};


const KanbanBoard: React.FC<KanbanBoardProps> = ({ user, groups, projects, tasks, users, ras, courseDates, onCreateTask, onUpdateTask, onDeleteTask, initialProjectId, onProjectSelected }) => {
    const relevantProjectIds = useMemo(() => {
        if (user.role === Role.Admin) return projects.map(p => p.id);
        if (user.role === Role.Tutor) {
             const tutorGroups = groups.filter(g => g.tutorId === user.id).map(g => g.id);
             return projects.filter(p => tutorGroups.includes(p.groupId)).map(p => p.id);
        }
        return projects.filter(p => user.groupIds.includes(p.groupId)).map(p => p.id);
    }, [user, groups, projects]);

    const [selectedProjectId, setSelectedProjectId] = useState<string>(
        (initialProjectId && relevantProjectIds.includes(initialProjectId))
            ? initialProjectId
            : (relevantProjectIds[0] || '')
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('status');

    useEffect(() => {
        if (initialProjectId && relevantProjectIds.includes(initialProjectId)) {
            setSelectedProjectId(initialProjectId);
        }
    }, [initialProjectId, relevantProjectIds]);

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProjectId(e.target.value);
        if (onProjectSelected) {
            onProjectSelected();
        }
    };

    const filteredTasks = tasks.filter(task => task.projectId === selectedProjectId);
    
    const sortedTasks = useMemo(() => {
        return [...filteredTasks].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [filteredTasks]);

    const columns = useMemo(() => {
        if (viewMode === 'status') {
            const groupedTasks = KANBAN_COLUMNS_ORDER.reduce((acc, status) => ({...acc, [status]: []}), {} as Record<KanbanStatus, Task[]>);
            sortedTasks.forEach(task => { if (groupedTasks[task.status]) groupedTasks[task.status].push(task); });
            return groupedTasks;
        } else if (viewMode === 'priority') {
            const priorityOrder = [Priority.High, Priority.Medium, Priority.Low];
            const groupedTasks = priorityOrder.reduce((acc, priority) => ({...acc, [priority]: []}), {} as Record<Priority, Task[]>);
            sortedTasks.forEach(task => { if (groupedTasks[task.priority]) groupedTasks[task.priority].push(task); });
            return groupedTasks;
        } else { // difficulty view
            const difficultyOrder = [Difficulty.Level3, Difficulty.Level2, Difficulty.Level1];
            const groupedTasks = difficultyOrder.reduce((acc, difficulty) => ({...acc, [difficulty]: []}), {} as Record<Difficulty, Task[]>);
            sortedTasks.forEach(task => { if (groupedTasks[task.difficulty]) groupedTasks[task.difficulty].push(task); });
            return groupedTasks;
        }
    }, [sortedTasks, viewMode]);

    const columnOrder = useMemo(() => {
        if (viewMode === 'status') return KANBAN_COLUMNS_ORDER;
        if (viewMode === 'priority') return [Priority.High, Priority.Medium, Priority.Low];
        return [Difficulty.Level3, Difficulty.Level2, Difficulty.Level1];
    }, [viewMode]);

    const availableAssignees = useMemo(() => {
        const project = projects.find(p => p.id === selectedProjectId);
        const group = groups.find(g => g.id === project?.groupId);
        return group ? group.members : [];
    }, [selectedProjectId, projects, groups]);

    const handleCreateClick = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleCardClick = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskData: any) => {
        if (editingTask) {
            onUpdateTask(editingTask.id, taskData);
        } else {
            onCreateTask(taskData);
        }
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleDeleteRequest = (task: Task) => {
        setTaskToDelete(task);
        setIsModalOpen(false);
    };

    const handleConfirmDelete = () => {
        if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-4 bg-white rounded-lg shadow-md">
                <div className="flex flex-wrap items-center gap-4">
                    <select value={selectedProjectId} onChange={handleProjectChange} className="p-2 border border-gray-300 rounded-md md:w-80 focus:ring-green-500 focus:border-green-500">
                        {projects.filter(p => relevantProjectIds.includes(p.id)).map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center p-1 space-x-1 bg-gray-200 rounded-lg">
                        <button onClick={() => setViewMode('status')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'status' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-white'}`}>Por Estado</button>
                        <button onClick={() => setViewMode('priority')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'priority' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-white'}`}>Por Prioridad</button>
                        <button onClick={() => setViewMode('difficulty')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'difficulty' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-white'}`}>Por Dificultad</button>
                    </div>
                </div>
                {(user.role === Role.Admin || user.role === Role.Tutor || user.role === Role.Student) && (
                    <button onClick={handleCreateClick} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                        <PlusCircleIcon className="w-5 h-5"/>
                        Añadir Tarea
                    </button>
                )}
            </div>

            <div className="px-4 mb-4">
                <KanbanLegend />
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3 min-w-[800px]">
                    {columnOrder.map(columnKey => (
                         <KanbanColumn
                            key={columnKey}
                            title={columnKey}
                            headerColor={
                                viewMode === 'status' ? STATUS_COLORS[columnKey as KanbanStatus] : 
                                viewMode === 'priority' ? PRIORITY_COLUMN_COLORS[columnKey as Priority] :
                                DIFFICULTY_COLUMN_COLORS[columnKey as Difficulty]
                            }
                            tasks={columns[columnKey as keyof typeof columns]}
                            ras={ras}
                            users={users}
                            onCardClick={handleCardClick}
                            userRole={user.role}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            </div>
            
            {isModalOpen && (
                <Modal title={editingTask ? "Editar Tarea" : "Crear Nueva Tarea"} onClose={() => setIsModalOpen(false)}>
                    <TaskForm
                        task={editingTask}
                        assignees={availableAssignees}
                        projectId={selectedProjectId}
                        ras={ras}
                        courseDates={courseDates}
                        onSave={handleSaveTask}
                        onCancel={() => setIsModalOpen(false)}
                        onDelete={handleDeleteRequest}
                        userRole={user.role}
                    />
                </Modal>
            )}

            {taskToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setTaskToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar la tarea?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{taskToDelete.title}"</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setTaskToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default KanbanBoard;