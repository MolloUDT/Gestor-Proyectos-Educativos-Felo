import React, { useState, useMemo } from 'react';
import { User, Task, Role, KanbanStatus, Group, Project, Message, Tutorial, Priority, Difficulty, RA, Course } from '../types';
import { ChevronDownIcon, TrashIcon } from './Icons';
import PendingMessagesModal from './PendingMessagesModal';
import Modal from './Modal';
import TaskForm from './TaskForm';
import { sortBySurname } from '../lib/utils';

interface DashboardProps {
    user: User;
    groups: Group[];
    projects: Project[];
    tasks: Task[];
    allUsers: User[];
    messages: Message[];
    tutorials: Tutorial[];
    ras: RA[];
    courses: Course[];
    courseDates: { startDate: string; endDate: string; };
    onNavigateToKanban: (projectId: string) => void;
    onSendMessage: (messageData: any) => void;
    onMarkMessagesAsRead: (messageIds: string[]) => void;
    onUpdateTask: (id: string, data: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
}

// --- Componentes para la vista de Administrador y Tutor ---

const ValueDisplay: React.FC<{ value: number; label: string; colorClass: string; }> = ({ value, label, colorClass }) => (
    <div className="text-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full shadow-inner ${colorClass}`}>
            <span className="text-sm font-bold text-white">{value.toFixed(2)}</span>
        </div>
        <p className="mt-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</p>
    </div>
);

const SmallValueDisplay: React.FC<{ value: number; label: string; colorClass: string; }> = ({ value, label, colorClass }) => (
    <div className="flex flex-col items-center" title={`${label}: ${value.toFixed(2)}`}>
        <div className={`flex items-center justify-center w-9 h-9 rounded-full shadow-inner ${colorClass}`}>
            <span className="text-xs font-bold text-white">{value.toFixed(2)}</span>
        </div>
        <p className="mt-1 text-[9px] font-semibold text-gray-600 uppercase tracking-tight">{label}</p>
    </div>
);


const CountdownDisplay: React.FC<{ endDate: string }> = ({ endDate }) => {
    if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return (
            <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="text-base font-bold text-gray-600">N/A</p>
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
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="text-base font-bold text-red-600">Finalizado</p>
            </div>
        );
    }
    
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInMs = endUTC - todayUTC;
    const totalDays = Math.floor(diffInMs / oneDay) + 1;
    
    const daysText = totalDays === 1 ? 'día' : 'días';

    return (
        <div className="text-center">
             <p className="text-sm font-medium text-gray-500">Tiempo restante para finalizar</p>
             <p className="text-base font-bold text-yellow-600">{`${totalDays} ${daysText}`}</p>
        </div>
    );
};

const ProgressCircle: React.FC<{ progress: number; size?: number }> = ({ progress, size = 64 }) => {
    const strokeWidth = size < 50 ? 6 : 8;

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
                <span className={`absolute font-bold text-white ${size < 50 ? 'text-xs' : 'text-base'}`}>{progress}%</span>
            </div>
        );
    }
    
    if (progress <= 0) {
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
                <span className={`absolute font-bold text-white ${size < 50 ? 'text-xs' : 'text-base'}`}>{progress}%</span>
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
            <span className={`font-bold text-gray-700 ${size < 50 ? 'text-xs' : 'text-base'}`}>{progress}%</span>
        </div>
    );
};

const difficultyWeights: { [key in Difficulty]: number } = {
    [Difficulty.Level1]: 1,
    [Difficulty.Level2]: 3,
    [Difficulty.Level3]: 5,
};

const priorityWeights: { [key in Priority]: number } = {
    [Priority.Low]: 0.25,
    [Priority.Medium]: 0.5,
    [Priority.High]: 0.75,
};

const statusWeights: { [key in KanbanStatus]: number } = {
    [KanbanStatus.Backlog]: 0,
    [KanbanStatus.Doing]: 1.5,
    [KanbanStatus.Done]: 3,
};

const AdminTutorGroupCard: React.FC<{ 
    group: Group; 
    project: Project; 
    tasks: Task[]; 
    allUsers: User[]; 
    tutorials: Tutorial[];
    courses: Course[];
    onNavigateToKanban: (id: string) => void;
    onShowPendingTasks: (projectId: string) => void;
}> = ({ group, project, tasks, allUsers, tutorials, courses, onNavigateToKanban, onShowPendingTasks }) => {
    const { progress, totalTasks, pendingTasks, inProgressTasks, completedTasks, projectValue, achievedValue, pendingValidationCount } = useMemo(() => {
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        const pendingValidation = groupTasks.filter(t => t.isVerified === false).length;

        if (total === 0) {
            return { progress: 0, totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, projectValue: 0, achievedValue: 0, pendingValidationCount: 0 };
        }
        
        const calculatedProjectValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty];
            const p = priorityWeights[task.priority];
            return acc + (d * p * 3); // Max potential value
        }, 0);

        const calculatedAchievedValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty];
            const p = priorityWeights[task.priority];
            const s = statusWeights[task.status];
            return acc + (d * p * s);
        }, 0);
        
        const completedCount = groupTasks.filter(t => t.status === KanbanStatus.Done).length;
        const inProgressCount = groupTasks.filter(t => t.status === KanbanStatus.Doing).length;
        const pendingCount = groupTasks.filter(t => t.status === KanbanStatus.Backlog).length;

        return {
            progress: calculatedProjectValue > 0 ? Math.round((calculatedAchievedValue / calculatedProjectValue) * 100) : 0,
            totalTasks: total,
            pendingTasks: pendingCount,
            inProgressTasks: inProgressCount,
            completedTasks: completedCount,
            projectValue: calculatedProjectValue,
            achievedValue: calculatedAchievedValue,
            pendingValidationCount: pendingValidation,
        };
    }, [project, tasks]);

    const tutor = useMemo(() => allUsers.find(u => u.id === group.tutorId), [allUsers, group.tutorId]);
    
    const freshGroupMembers = useMemo(() => {
        return group.members
            .map(staleMember => allUsers.find(freshUser => freshUser.id === staleMember.id))
            .filter((member): member is User => !!member);
    }, [group.members, allUsers]);
    
    const courseGroup = useMemo(() => {
        const course = courses.find(c => c.id === group.courseId);
        return course ? course.name : 'Sin curso asignado';
    }, [group.courseId, courses]);

    const { pastTutorialsCount, nextTutorialDate } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const groupTutorials = tutorials.filter(t => t.groupId === group.id);
        const pastTutorials = groupTutorials.filter(t => new Date(t.date + 'T00:00:00') < today);
        const futureTutorials = groupTutorials
            .filter(t => t.nextDate && new Date(t.nextDate + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
        
        const nextDateInfo = futureTutorials.length > 0
            ? `${new Date(futureTutorials[0].nextDate + 'T00:00:00').toLocaleDateString('es-ES')} ${futureTutorials[0].nextTime ? `a las ${futureTutorials[0].nextTime}`: ''}`
            : 'No agendada';

        return { pastTutorialsCount: pastTutorials.length, nextTutorialDate: nextDateInfo };
    }, [tutorials, group.id]);

    const groupMeetingsCount = 0; // Placeholder
    const nextGroupMeetingDate = "No agendada"; // Placeholder

    const calculateTaskStats = (tasks: Task[]) => {
        const stats = {
            tasks,
            count: tasks.length,
            byDifficulty: {
                [Difficulty.Level1]: 0,
                [Difficulty.Level2]: 0,
                [Difficulty.Level3]: 0,
            }
        };
        tasks.forEach(task => {
            if (stats.byDifficulty[task.difficulty] !== undefined) {
                stats.byDifficulty[task.difficulty]++;
            }
        });
        return stats;
    };

    const memberStats = useMemo(() => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);

        const vp = projectTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty];
            const p = priorityWeights[task.priority];
            return acc + (d * p * 3); // VP uses max NPRO value (3)
        }, 0);

        const statsMap = new Map<string, { name: string; tasks: Task[] }>();
        freshGroupMembers.forEach(member => {
            if (member.role === Role.Student) {
                statsMap.set(member.id, { name: member.name, tasks: [] });
            }
        });

        projectTasks.forEach(task => {
            if (task.assigneeId && statsMap.has(task.assigneeId)) {
                statsMap.get(task.assigneeId)!.tasks.push(task);
            }
        });

        const result = Array.from(statsMap.entries()).map(([id, statData]) => {
            const pl = statData.tasks.reduce((acc, task) => {
                const d = difficultyWeights[task.difficulty];
                const p = priorityWeights[task.priority];
                const s = statusWeights[task.status];
                return acc + (d * p * s);
            }, 0);
            
            const pa = statData.tasks.reduce((acc, task) => {
                const d = difficultyWeights[task.difficulty];
                const p = priorityWeights[task.priority];
                return acc + (d * p * 3);
            }, 0);

            const productivity = vp > 0 ? (pl / vp) * 100 : 0;
            
            const completedTasks = statData.tasks.filter(t => t.status === KanbanStatus.Done);
            const inProgressTasks = statData.tasks.filter(t => t.status === KanbanStatus.Doing);
            const pendingTasks = statData.tasks.filter(t => t.status === KanbanStatus.Backlog);

            return {
                id,
                name: statData.name,
                completed: calculateTaskStats(completedTasks),
                inProgress: calculateTaskStats(inProgressTasks),
                pending: calculateTaskStats(pendingTasks),
                totalAssigned: calculateTaskStats(statData.tasks),
                productivity: Math.round(productivity),
                assignedPoints: pa,
                achievedPoints: pl,
            };
        });
        
        return result.sort((a, b) => b.totalAssigned.count - a.totalAssigned.count);
    }, [freshGroupMembers, tasks, project.id]);
    
    const difficultyConfig: { [key in Difficulty]: { bg: string, text: string, name: string } } = {
        [Difficulty.Level1]: { bg: 'bg-green-200', text: 'text-green-800', name: 'Sencilla' },
        [Difficulty.Level2]: { bg: 'bg-yellow-200', text: 'text-yellow-800', name: 'Moderada' },
        [Difficulty.Level3]: { bg: 'bg-red-200', text: 'text-red-800', name: 'Compleja' },
    };

    return (
        <div className="w-full p-4 bg-white rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="flex items-center justify-center gap-4 cursor-pointer hover:bg-green-50 transition-colors rounded-xl p-1"
                    >
                        <ProgressCircle progress={progress} size={96} />
                        <div className="flex flex-col gap-2">
                           <ValueDisplay value={projectValue} label="Total" colorClass="bg-gray-600" />
                           <ValueDisplay value={achievedValue} label="Actual" colorClass="bg-green-600" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-normal text-green-700"><span className="font-bold">Proyecto:</span> {project.name}</h3>
                                <p className="text-base text-gray-500"><span className="text-black font-bold">Curso:</span> {courseGroup} - <span className="text-black font-bold">Grupo:</span> {group.name}</p>
                            </div>
                            {pendingValidationCount > 0 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShowPendingTasks(project.id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white uppercase bg-red-600 rounded-full hover:bg-red-700 shadow-lg animate-pulse transition-all transform hover:scale-105"
                                >
                                    <span>⚠️</span>
                                    <span>{pendingValidationCount} Tareas sin validar</span>
                                </button>
                            )}
                        </div>
                        {tutor && <p className="mt-1 text-sm italic font-bold text-green-800">Tutor/a: {tutor.name}</p>}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                            <h4 className="mb-1 text-sm font-semibold text-blue-600">Componentes del grupo:</h4>
                            <div className="flex flex-wrap gap-x-1 gap-y-1">
                                {freshGroupMembers
                                    .filter(member => member.role === Role.Student)
                                    .sort(sortBySurname)
                                    .map((member, index, array) => (
                                    <span key={member.id} className="text-sm text-gray-800">
                                        {index + 1}. {member.name}{index < array.length - 1 ? ',' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-3 mt-3 border-t md:grid-cols-3 border-gray-200">
                    <div className="text-center">
                        <p className="text-sm font-medium text-green-600">Inicio de proyecto</p>
                        <p className="text-base font-bold text-gray-800">{new Date(project.startDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-red-600">Fin de proyecto</p>
                        <p className="text-base font-bold text-gray-800">{new Date(project.endDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                    </div>
                    <CountdownDisplay endDate={project.endDate} />
                </div>

                <div className="pt-1 mt-1 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Reuniones de Grupo</p>
                            <p className="text-lg font-bold text-blue-600">{groupMeetingsCount}</p>
                        </div>
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Próxima Reunión Grupo</p>
                            <p className="text-sm font-bold text-blue-600 break-words">{nextGroupMeetingDate}</p>
                        </div>
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Tutorías Realizadas</p>
                            <p className="text-lg font-bold text-blue-600">{pastTutorialsCount}</p>
                        </div>
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Próxima Tutoría</p>
                            <p className="text-sm font-bold text-blue-600 break-words">{nextTutorialDate}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 pt-1 mt-1 border-t border-gray-200">
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-gray-800">{totalTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Tareas Totales</p>
                    </div>
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-red-600">{pendingTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Pendientes</p>
                    </div>
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-blue-600">{inProgressTasks}</p>
                        <p className="text-xs font-medium text-gray-500">En progreso</p>
                    </div>
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-green-600">{completedTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Completadas</p>
                    </div>
                </div>

            <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="text-lg font-bold text-gray-700">Rendimiento del grupo por componente</h4>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs font-semibold text-gray-500">Dificultad:</span>
                        {(Object.keys(difficultyConfig) as Difficulty[]).map(level => (
                            <div key={level} className="flex items-center space-x-1.5">
                                <div className={`w-3 h-3 rounded-full ${difficultyConfig[level].bg}`}></div>
                                <span className="text-xs text-gray-600">{difficultyConfig[level].name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:flex mb-2">
                    <div className="w-full md:w-5/12" /> {/* Spacer */}
                    <div className="flex w-full md:w-7/12">
                        <div className="flex-1 text-center text-xs font-bold text-gray-500">Total</div>
                        <div className="flex-1 text-center text-xs font-bold text-red-600">Pendientes</div>
                        <div className="flex-1 text-center text-xs font-bold text-blue-600">En progreso</div>
                        <div className="flex-1 text-center text-xs font-bold text-green-600">Realizadas</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    {memberStats.map(stat => {
                        const name = stat.name;
                        const firstSpaceIndex = name.indexOf(' ');
                        const firstName = firstSpaceIndex === -1 ? name : name.substring(0, firstSpaceIndex);
                        const lastName = firstSpaceIndex === -1 ? '' : name.substring(firstSpaceIndex + 1);

                        return (
                            <div key={stat.id} className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center w-5/12">
                                    <div className="flex items-center flex-shrink-0 gap-2">
                                        <div title={`Productividad: ${stat.productivity}%`}>
                                            <ProgressCircle progress={stat.productivity} size={40} />
                                        </div>
                                        <SmallValueDisplay value={stat.assignedPoints} label="Asumidos" colorClass="bg-gray-500" />
                                        <SmallValueDisplay value={stat.achievedPoints} label="Logrados" colorClass="bg-green-500" />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0" title={stat.name}>
                                        <p className="font-medium text-gray-800 truncate">{firstName}</p>
                                        {lastName && <p className="text-sm text-gray-600 truncate">{lastName}</p>}
                                    </div>
                                </div>
                                <div className="flex justify-around w-7/12">
                                    <StatusColumn title="Total de Tareas" mainCircleClass="bg-gray-800 text-white" stats={stat.totalAssigned} difficultyConfig={difficultyConfig} />
                                    <StatusColumn title="Tareas Pendientes" mainCircleClass="bg-red-100 text-red-800 border border-red-200" stats={stat.pending} difficultyConfig={difficultyConfig} />
                                    <StatusColumn title="Tareas En progreso" mainCircleClass="bg-yellow-100 text-yellow-800 border border-yellow-200" stats={stat.inProgress} difficultyConfig={difficultyConfig} />
                                    <StatusColumn title="Tareas Realizadas" mainCircleClass="bg-green-100 text-green-800 border border-green-200" stats={stat.completed} difficultyConfig={difficultyConfig} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


// --- Componentes para la vista de Alumno ---

const StatusColumn: React.FC<{
    title: string;
    mainCircleClass: string;
    stats: {
        count: number;
        byDifficulty: { [key in Difficulty]: number };
    };
    difficultyConfig: { [key in Difficulty]: { bg: string, text: string, name: string } };
}> = ({ title, mainCircleClass, stats, difficultyConfig }) => {
    return (
        <div className="flex flex-col items-center flex-1 min-w-0" title={title}>
            <span className={`flex items-center justify-center w-8 h-8 text-sm font-bold ${mainCircleClass} rounded-full`}>
                {stats.count}
            </span>
            <div className="flex mt-2 space-x-1">
                {(Object.keys(difficultyConfig) as Difficulty[]).map(level => (
                <span
                    key={level}
                    title={`${stats.byDifficulty[level]} tareas - ${difficultyConfig[level].name}`}
                    className={`flex items-center justify-center w-6 h-6 text-xs font-bold ${difficultyConfig[level].bg} ${difficultyConfig[level].text} rounded-full`}
                >
                    {stats.byDifficulty[level]}
                </span>
                ))}
            </div>
        </div>
    );
};


const PendingTasksModal: React.FC<{
    project: Project;
    tasks: Task[];
    allUsers: User[];
    onClose: () => void;
    onEditTask: (task: Task) => void;
}> = ({ project, tasks, allUsers, onClose, onEditTask }) => {
    const pendingValidationTasks = useMemo(() => 
        tasks.filter(t => t.projectId === project.id && t.isVerified === false),
    [tasks, project.id]);

    return (
        <Modal title={`Tareas Pendientes de Validación - ${project.name}`} onClose={onClose}>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {pendingValidationTasks.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay tareas pendientes de validación en este proyecto.</p>
                ) : (
                    pendingValidationTasks.map(task => {
                        const assignee = allUsers.find(u => u.id === task.assigneeId);
                        return (
                            <div 
                                key={task.id} 
                                onClick={() => onEditTask(task)}
                                className="p-3 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer transition-colors flex justify-between items-center group"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-blue-800 truncate">{task.title}</h4>
                                    <p className="text-xs text-red-600 mt-1">Asignado a: {assignee?.name || 'Sin asignar'}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold rounded uppercase">{task.status}</span>
                                        <span className="px-2 py-0.5 bg-white border border-red-200 text-red-700 text-[10px] font-bold rounded uppercase">{task.priority}</span>
                                    </div>
                                </div>
                                <div className="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase">Revisar</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Modal>
    );
};

const StudentProjectDetailCard: React.FC<{
    group: Group;
    project: Project;
    tasks: Task[];
    tutorials: Tutorial[];
    allUsers: User[];
    user: User;
    courses: Course[];
    onNavigateToKanban: (projectId: string) => void;
}> = ({ group, project, tasks, tutorials, allUsers, user, courses, onNavigateToKanban }) => {
    const courseName = useMemo(() => {
        const course = courses.find(c => c.id === group.courseId);
        return course ? course.name : 'Sin curso asignado';
    }, [group.courseId, courses]);
    const { progress, totalTasks, pendingTasks, inProgressTasks, completedTasks, projectValue, achievedValue } = useMemo(() => {
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        if (total === 0) {
            return { progress: 0, totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, projectValue: 0, achievedValue: 0 };
        }
        
        const calculatedProjectValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty];
            const p = priorityWeights[task.priority];
            return acc + (d * p * 3); // Max potential value
        }, 0);

        const calculatedAchievedValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty];
            const p = priorityWeights[task.priority];
            const s = statusWeights[task.status];
            return acc + (d * p * s);
        }, 0);
        
        const completedCount = groupTasks.filter(t => t.status === KanbanStatus.Done).length;
        const inProgressCount = groupTasks.filter(t => t.status === KanbanStatus.Doing).length;
        const pendingCount = groupTasks.filter(t => t.status === KanbanStatus.Backlog).length;

        return {
            progress: calculatedProjectValue > 0 ? Math.round((calculatedAchievedValue / calculatedProjectValue) * 100) : 0,
            totalTasks: total,
            pendingTasks: pendingCount,
            inProgressTasks: inProgressCount,
            completedTasks: completedCount,
            projectValue: calculatedProjectValue,
            achievedValue: calculatedAchievedValue,
        };
    }, [project, tasks]);

    const tutor = useMemo(() => allUsers.find(u => u.id === group.tutorId), [allUsers, group.tutorId]);
    
    const freshGroupMembers = useMemo(() => {
        return group.members
            .map(staleMember => allUsers.find(freshUser => freshUser.id === staleMember.id))
            .filter((member): member is User => !!member);
    }, [group.members, allUsers]);

    const { pastTutorialsCount, nextTutorialDate } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const groupTutorials = tutorials.filter(t => t.groupId === group.id);
        const pastTutorials = groupTutorials.filter(t => new Date(t.date + 'T00:00:00') < today);
        const futureTutorials = groupTutorials
            .filter(t => t.nextDate && new Date(t.nextDate + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
        
        const nextDateInfo = futureTutorials.length > 0
            ? `${new Date(futureTutorials[0].nextDate + 'T00:00:00').toLocaleDateString('es-ES')} ${futureTutorials[0].nextTime ? `a las ${futureTutorials[0].nextTime}`: ''}`
            : 'No agendada';

        return { pastTutorialsCount: pastTutorials.length, nextTutorialDate: nextDateInfo };
    }, [tutorials, group.id]);

    const groupMeetingsCount = 0; // Placeholder
    const nextGroupMeetingDate = "No agendada"; // Placeholder

    const calculateTaskStats = (tasks: Task[]) => {
        const stats = {
            tasks,
            count: tasks.length,
            byDifficulty: {
                [Difficulty.Level1]: 0,
                [Difficulty.Level2]: 0,
                [Difficulty.Level3]: 0,
            }
        };
        tasks.forEach(task => {
            if (stats.byDifficulty[task.difficulty] !== undefined) {
                stats.byDifficulty[task.difficulty]++;
            }
        });
        return stats;
    };

    const memberStats = useMemo(() => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        
        const vp = projectTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty];
            const p = priorityWeights[task.priority];
            return acc + (d * p * 3);
        }, 0);

        const statsMap = new Map<string, { name: string; tasks: Task[] }>();
        freshGroupMembers.forEach(member => {
            if (member.role === Role.Student) {
                statsMap.set(member.id, { name: member.name, tasks: [] });
            }
        });

        projectTasks.forEach(task => {
            if (task.assigneeId && statsMap.has(task.assigneeId)) {
                statsMap.get(task.assigneeId)!.tasks.push(task);
            }
        });
        
        const result = Array.from(statsMap.entries()).map(([id, statData]) => {
            const pl = statData.tasks.reduce((acc, task) => {
                const d = difficultyWeights[task.difficulty];
                const p = priorityWeights[task.priority];
                const s = statusWeights[task.status];
                return acc + (d * p * s);
            }, 0);

            const pa = statData.tasks.reduce((acc, task) => {
                const d = difficultyWeights[task.difficulty];
                const p = priorityWeights[task.priority];
                return acc + (d * p * 3);
            }, 0);

            const productivity = vp > 0 ? (pl / vp) * 100 : 0;
            
            const completedTasks = statData.tasks.filter(t => t.status === KanbanStatus.Done);
            const inProgressTasks = statData.tasks.filter(t => t.status === KanbanStatus.Doing);
            const pendingTasks = statData.tasks.filter(t => t.status === KanbanStatus.Backlog);

            return {
                id,
                name: statData.name,
                completed: calculateTaskStats(completedTasks),
                inProgress: calculateTaskStats(inProgressTasks),
                pending: calculateTaskStats(pendingTasks),
                totalAssigned: calculateTaskStats(statData.tasks),
                productivity: Math.round(productivity),
                assignedPoints: pa,
                achievedPoints: pl,
            };
        });
        
        return result.sort((a, b) => b.totalAssigned.count - a.totalAssigned.count);
    }, [freshGroupMembers, tasks, project.id]);
    
    const difficultyConfig: { [key in Difficulty]: { bg: string, text: string, name: string } } = {
        [Difficulty.Level1]: { bg: 'bg-green-200', text: 'text-green-800', name: 'Sencilla' },
        [Difficulty.Level2]: { bg: 'bg-yellow-200', text: 'text-yellow-800', name: 'Moderada' },
        [Difficulty.Level3]: { bg: 'bg-red-200', text: 'text-red-800', name: 'Compleja' },
    };

    return (
        <div className="w-full p-4 bg-white rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="flex items-center justify-center gap-4 cursor-pointer hover:bg-green-50 transition-colors rounded-xl p-1"
                    >
                        <ProgressCircle progress={progress} size={96} />
                        <div className="flex flex-col gap-2">
                            <ValueDisplay value={projectValue} label="Total" colorClass="bg-gray-600" />
                            <ValueDisplay value={achievedValue} label="Actual" colorClass="bg-green-600" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-normal text-green-700"><span className="font-bold">Proyecto:</span> {project.name}</h3>
                        <p className="text-base text-gray-500"><span className="text-black font-bold">Curso:</span> {courseName} - <span className="text-black font-bold">Grupo:</span> {group.name}</p>
                        {tutor && <p className="mt-1 text-sm italic font-bold text-green-800">Tutor/a: {tutor.name}</p>}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                            <h4 className="mb-1 text-sm font-semibold text-blue-600">Componentes del grupo:</h4>
                            <div className="flex flex-wrap gap-x-1 gap-y-1">
                                {freshGroupMembers
                                    .filter(member => member.role === Role.Student)
                                    .sort(sortBySurname)
                                    .map((member, index, array) => (
                                    <span key={member.id} className="text-sm text-gray-800">
                                        {index + 1}. {member.name}{index < array.length - 1 ? ',' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-3 mt-3 border-t md:grid-cols-3 border-gray-200">
                    <div className="text-center">
                        <p className="text-sm font-medium text-green-600">Inicio de proyecto</p>
                        <p className="text-base font-bold text-gray-800">{new Date(project.startDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-red-600">Fin de proyecto</p>
                        <p className="text-base font-bold text-gray-800">{new Date(project.endDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                    </div>
                    <CountdownDisplay endDate={project.endDate} />
                </div>

                <div className="pt-1 mt-1 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Reuniones de Grupo</p>
                            <p className="text-lg font-bold text-blue-600">{groupMeetingsCount}</p>
                        </div>
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Próxima Reunión Grupo</p>
                            <p className="text-sm font-bold text-blue-600 break-words">{nextGroupMeetingDate}</p>
                        </div>
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Tutorías Realizadas</p>
                            <p className="text-lg font-bold text-blue-600">{pastTutorialsCount}</p>
                        </div>
                        <div className="p-1 text-center bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Próxima Tutoría</p>
                            <p className="text-sm font-bold text-blue-600 break-words">{nextTutorialDate}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 pt-1 mt-1 border-t border-gray-200">
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-gray-800">{totalTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Tareas Totales</p>
                    </div>
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-red-600">{pendingTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Pendientes</p>
                    </div>
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-blue-600">{inProgressTasks}</p>
                        <p className="text-xs font-medium text-gray-500">En progreso</p>
                    </div>
                    <div 
                        onClick={() => onNavigateToKanban(project.id)} 
                        className="p-1 text-center bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition-colors"
                    >
                        <p className="text-lg font-bold text-green-600">{completedTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Completadas</p>
                    </div>
                </div>

            <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="text-lg font-bold text-gray-700">Rendimiento del grupo por componente</h4>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs font-semibold text-gray-500">Dificultad:</span>
                        {(Object.keys(difficultyConfig) as Difficulty[]).map(level => (
                            <div key={level} className="flex items-center space-x-1.5">
                                <div className={`w-3 h-3 rounded-full ${difficultyConfig[level].bg}`}></div>
                                <span className="text-xs text-gray-600">{difficultyConfig[level].name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:flex mb-2">
                    <div className="w-full md:w-5/12" /> {/* Spacer */}
                    <div className="flex w-full md:w-7/12">
                        <div className="flex-1 text-center text-xs font-bold text-gray-500">Total</div>
                        <div className="flex-1 text-center text-xs font-bold text-red-600">Pendientes</div>
                        <div className="flex-1 text-center text-xs font-bold text-blue-600">En progreso</div>
                        <div className="flex-1 text-center text-xs font-bold text-green-600">Realizadas</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    {memberStats.map(stat => {
                        const name = stat.name;
                        const firstSpaceIndex = name.indexOf(' ');
                        const firstName = firstSpaceIndex === -1 ? name : name.substring(0, firstSpaceIndex);
                        const lastName = firstSpaceIndex === -1 ? '' : name.substring(firstSpaceIndex + 1);

                        return (
                            <div key={stat.id} className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center w-5/12">
                                     <div className="flex items-center flex-shrink-0 gap-2">
                                        <div title={`Productividad: ${stat.productivity}%`}>
                                            <ProgressCircle progress={stat.productivity} size={40} />
                                        </div>
                                        <SmallValueDisplay value={stat.assignedPoints} label="Asumidos" colorClass="bg-gray-500" />
                                        <SmallValueDisplay value={stat.achievedPoints} label="Logrados" colorClass="bg-green-500" />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0" title={stat.name}>
                                        <p className="font-medium text-gray-800 truncate">{firstName}</p>
                                        {lastName && <p className="text-sm text-gray-600 truncate">{lastName}</p>}
                                    </div>
                                </div>
                                <div className="flex justify-around w-7/12">
                                    <StatusColumn title="Total de Tareas" mainCircleClass="bg-gray-800 text-white" stats={stat.totalAssigned} difficultyConfig={difficultyConfig} />
                                    <StatusColumn title="Tareas Pendientes" mainCircleClass="bg-red-100 text-red-800 border border-red-200" stats={stat.pending} difficultyConfig={difficultyConfig} />
                                    <StatusColumn title="Tareas En progreso" mainCircleClass="bg-yellow-100 text-yellow-800 border border-yellow-200" stats={stat.inProgress} difficultyConfig={difficultyConfig} />
                                    <StatusColumn title="Tareas Realizadas" mainCircleClass="bg-green-100 text-green-800 border border-green-200" stats={stat.completed} difficultyConfig={difficultyConfig} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


const StudentDashboard: React.FC<{
    user: User;
    groups: Group[];
    projects: Project[];
    tasks: Task[];
    tutorials: Tutorial[];
    allUsers: User[];
    courses: Course[];
    onNavigateToKanban: (projectId: string) => void;
}> = ({ user, groups, projects, tasks, tutorials, allUsers, courses, onNavigateToKanban }) => {
    
    const userProjectsWithGroups = useMemo(() => {
        return projects
            .filter(p => user.groupIds.includes(p.groupId))
            .map(project => ({
                project,
                group: groups.find(g => g.id === project.groupId)
            }))
            .filter((item): item is { project: Project; group: Group } => !!item.group);
    }, [user, projects, groups]);

    if (userProjectsWithGroups.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-md">
                <p>Actualmente no estás asignado a ningún proyecto.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {userProjectsWithGroups.map(({ project, group }) => (
                <StudentProjectDetailCard
                    key={project.id}
                    group={group}
                    project={project}
                    tasks={tasks}
                    tutorials={tutorials}
                    allUsers={allUsers}
                    user={user}
                    courses={courses}
                    onNavigateToKanban={onNavigateToKanban}
                />
            ))}
        </div>
    );
};

const AdminTutorDashboard: React.FC<{ 
    groups: Group[]; 
    projects: Project[]; 
    tasks: Task[]; 
    allUsers: User[]; 
    tutorials: Tutorial[];
    courses: Course[];
    onNavigateToKanban: (projectId: string) => void; 
    onShowPendingTasks: (projectId: string) => void;
}> = ({ groups, projects, tasks, allUsers, tutorials, courses, onNavigateToKanban, onShowPendingTasks }) => {
    const [expandedCourseGroups, setExpandedCourseGroups] = useState<Record<string, boolean>>({});

    const projectsByCourseGroup = useMemo(() => {
        const result: Record<string, { project: Project, group: Group }[]> = {};
        
        projects.forEach(project => {
            const group = groups.find(g => g.id === project.groupId);
            if (group) {
                const course = courses.find(c => c.id === group.courseId);
                const projectCourseGroup = course ? course.name : 'Sin curso asignado';

                if (!result[projectCourseGroup]) {
                    result[projectCourseGroup] = [];
                }
                result[projectCourseGroup].push({ project, group });
            }
        });
        return result;
    }, [projects, groups, courses]);
    
    const toggleCourseGroup = (courseGroupName: string) => {
        setExpandedCourseGroups(prev => ({ ...prev, [courseGroupName]: !prev[courseGroupName] }));
    };

    return (
        <div className="space-y-4">
            {Object.keys(projectsByCourseGroup).sort().map(courseGroup => {
                const projectsData = projectsByCourseGroup[courseGroup];
                const isExpanded = !!expandedCourseGroups[courseGroup];
                return (
                    <div key={courseGroup} className="bg-white rounded-lg shadow-md">
                        <button onClick={() => toggleCourseGroup(courseGroup)} className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
                            <div className="flex items-center">
                                <h3 className="text-lg font-semibold text-gray-800">{courseGroup}</h3>
                                <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">{projectsData.length} {projectsData.length === 1 ? 'proyecto' : 'proyectos'}</span>
                            </div>
                            <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                            <div className="p-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 gap-6">
                                    {projectsData.map(({ project, group }) => (
                                        <AdminTutorGroupCard
                                            key={project.id}
                                            group={group}
                                            project={project}
                                            tasks={tasks}
                                            allUsers={allUsers}
                                            tutorials={tutorials}
                                            courses={courses}
                                            onNavigateToKanban={onNavigateToKanban}
                                            onShowPendingTasks={onShowPendingTasks}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, groups, projects, tasks, allUsers, messages, tutorials, ras, courses, courseDates, onNavigateToKanban, onSendMessage, onMarkMessagesAsRead, onUpdateTask, onDeleteTask }) => {
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [selectedProjectForPendingTasks, setSelectedProjectForPendingTasks] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const unreadMessages = useMemo(() => messages.filter(msg => 
        msg.recipientIds.includes(user.id) && !msg.readBy.includes(user.id)
    ), [messages, user.id]);

    const handleClosePendingModal = () => {
        setIsPendingModalOpen(false);
    };

    const handleShowPendingTasks = (projectId: string) => {
        setSelectedProjectForPendingTasks(projectId);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
    };

    const handleSaveTask = (taskData: any) => {
        if (editingTask) {
            onUpdateTask(editingTask.id, taskData);
        }
        setEditingTask(null);
    };

    const handleDeleteTask = (task: Task) => {
        onDeleteTask(task.id);
        setEditingTask(null);
    };

    const projectForPendingTasks = useMemo(() => 
        projects.find(p => p.id === selectedProjectForPendingTasks),
    [projects, selectedProjectForPendingTasks]);

    const availableAssignees = useMemo(() => {
        if (!projectForPendingTasks) return [];
        const group = groups.find(g => g.id === projectForPendingTasks.groupId);
        return group ? group.members : [];
    }, [projectForPendingTasks, groups]);

    const { visibleGroups, visibleProjects } = useMemo(() => {
        if (user.role === Role.Admin) {
            return { visibleGroups: groups, visibleProjects: projects };
        }
        if (user.role === Role.Tutor) {
            const tutorGroups = groups.filter(g => g.tutorId === user.id);
            const tutorGroupIds = tutorGroups.map(g => g.id);
            const tutorProjects = projects.filter(p => tutorGroupIds.includes(p.groupId));
            return { visibleGroups: tutorGroups, visibleProjects: tutorProjects };
        }
        return { visibleGroups: [], visibleProjects: [] };
    }, [user, groups, projects]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {user.role === Role.Student ? 'Mis Proyectos' : 'Proyectos por Curso'}
                </h2>
                <button
                    onClick={() => unreadMessages.length > 0 && setIsPendingModalOpen(true)}
                    className={`px-4 py-2 font-bold rounded-md transition-all ${
                        unreadMessages.length > 0
                            ? 'bg-red-500 text-white blinking-button shadow-lg hover:bg-red-600'
                            : 'bg-green-500 text-white cursor-default'
                    }`}
                >
                    {unreadMessages.length > 0 ? `Mensajes Pendientes (${unreadMessages.length})` : 'Sin Mensajes Pendientes'}
                </button>
            </div>
            
            {(user.role === Role.Admin || user.role === Role.Tutor)
                ? <AdminTutorDashboard 
                    groups={visibleGroups} 
                    projects={visibleProjects} 
                    tasks={tasks} 
                    allUsers={allUsers} 
                    tutorials={tutorials}
                    courses={courses}
                    onNavigateToKanban={onNavigateToKanban} 
                    onShowPendingTasks={handleShowPendingTasks}
                  /> 
                : <StudentDashboard 
                    user={user} 
                    groups={groups} 
                    projects={projects} 
                    tasks={tasks} 
                    tutorials={tutorials}
                    allUsers={allUsers}
                    courses={courses}
                    onNavigateToKanban={onNavigateToKanban} 
                  />}

            {isPendingModalOpen && (
                <PendingMessagesModal
                    user={user}
                    messages={unreadMessages}
                    allUsers={allUsers}
                    onClose={handleClosePendingModal}
                    onSendMessage={onSendMessage}
                    onMarkMessagesAsRead={onMarkMessagesAsRead}
                />
            )}

            {projectForPendingTasks && (
                <PendingTasksModal
                    project={projectForPendingTasks}
                    tasks={tasks}
                    allUsers={allUsers}
                    onClose={() => setSelectedProjectForPendingTasks(null)}
                    onEditTask={handleEditTask}
                />
            )}

            {editingTask && (
                <Modal title="Validar Tarea" onClose={() => setEditingTask(null)}>
                    <TaskForm
                        task={editingTask}
                        assignees={availableAssignees}
                        projectId={editingTask.projectId}
                        ras={ras}
                        courseDates={courseDates}
                        onSave={handleSaveTask}
                        onCancel={() => setEditingTask(null)}
                        onDelete={handleDeleteTask}
                        userRole={user.role}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Dashboard;