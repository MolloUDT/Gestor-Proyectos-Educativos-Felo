import React, { useState, useMemo, useEffect } from 'react';
import { User, Task, Role, KanbanStatus, Group, Project, Message, Tutorial, Priority, Difficulty, RA, Course } from '../types';
import { ChevronDownIcon, TrashIcon, GraduationCapIcon, UsersIcon } from './Icons';
import { ProgressCircle } from './ProgressCircle';
import PendingMessagesModal from './PendingMessagesModal';
import PendingTutorialsMeetingsModal from './PendingTutorialsMeetingsModal';
import Modal from './Modal';
import TaskForm from './TaskForm';
import { TutorialForm } from './TutorialForm';
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
    selectedGroupId?: string;
    onNavigateToKanban: (projectId: string) => void;
    onNavigateToCalendar: (groupId?: string) => void;
    onSendMessage: (messageData: any) => void;
    onMarkMessagesAsRead: (messageIds: string[]) => void;
    onUpdateTask: (id: string, data: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    onUpdateTutorial: (id: string, data: Partial<Tutorial>) => Promise<any>;
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

const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
};

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

const calculateProjectProgress = (projectTasks: Task[]) => {
    if (projectTasks.length === 0) return 0;
    
    const calculatedProjectValue = projectTasks.reduce((acc, task) => {
        const d = difficultyWeights[task.difficulty] || 1;
        const p = priorityWeights[task.priority] || 1;
        return acc + (d * p * 3); // Max potential value (status weight 3)
    }, 0);

    const calculatedAchievedValue = projectTasks.reduce((acc, task) => {
        const d = difficultyWeights[task.difficulty] || 1;
        const p = priorityWeights[task.priority] || 1;
        const s = statusWeights[task.status] || 0;
        return acc + (d * p * s);
    }, 0);

    return calculatedProjectValue > 0 ? Math.round((calculatedAchievedValue / calculatedProjectValue) * 100) : 0;
};

const AdminTutorGroupCard: React.FC<{ 
    group: Group; 
    project: Project; 
    tasks: Task[]; 
    allUsers: User[]; 
    tutorials: Tutorial[];
    courses: Course[];
    highlight?: boolean;
    onNavigateToKanban: (id: string) => void;
    onNavigateToCalendar: (groupId?: string) => void;
    onShowPendingTasks: (projectId: string) => void;
}> = ({ group, project, tasks, allUsers, tutorials, courses, highlight, onNavigateToKanban, onNavigateToCalendar, onShowPendingTasks }) => {
    const { progress, totalTasks, pendingTasks, inProgressTasks, completedTasks, projectValue, achievedValue, pendingValidationCount } = useMemo(() => {
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        const pendingValidation = groupTasks.filter(t => t.isVerified === false).length;

        if (total === 0) {
            return { progress: 0, totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, projectValue: 0, achievedValue: 0, pendingValidationCount: 0 };
        }
        
        const calculatedProjectValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty] || 1;
            const p = priorityWeights[task.priority] || 1;
            return acc + (d * p * 3);
        }, 0);

        const calculatedAchievedValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty] || 1;
            const p = priorityWeights[task.priority] || 1;
            const s = statusWeights[task.status] || 0;
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

    const { pastTutorialsCount, nextTutorialDate, groupMeetingsCount, nextGroupMeetingDate } = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const groupTutorials = tutorials.filter(t => t.groupId === group.id);
        
        const tutorialsOnly = groupTutorials.filter(t => t.type !== 'group_meeting');
        const groupMeetingsOnly = groupTutorials.filter(t => t.type === 'group_meeting');

        const pastTutorials = tutorialsOnly.filter(t => t.status === 'held' && t.date >= project.startDate && t.date <= project.endDate);
        const futureTutorials = tutorialsOnly
            .filter(t => t.status === 'scheduled' && t.date >= todayStr)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const nextDateInfo = futureTutorials.length > 0
            ? `${new Date(futureTutorials[0].date + 'T00:00:00').toLocaleDateString('es-ES')}`
            : 'No agendada';

        const pastGroupMeetings = groupMeetingsOnly.filter(t => t.status === 'held' && t.date >= project.startDate && t.date <= project.endDate);
        const futureGroupMeetings = groupMeetingsOnly
            .filter(t => t.status === 'scheduled' && t.date >= todayStr)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const nextGroupMeetingDateInfo = futureGroupMeetings.length > 0
            ? `${new Date(futureGroupMeetings[0].date + 'T00:00:00').toLocaleDateString('es-ES')}`
            : 'No agendada';

        return { 
            pastTutorialsCount: pastTutorials.length, 
            nextTutorialDate: nextDateInfo,
            groupMeetingsCount: pastGroupMeetings.length,
            nextGroupMeetingDate: nextGroupMeetingDateInfo
        };
    }, [tutorials, group.id, project.startDate, project.endDate]);

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

        const statsMap = new Map<string, { firstName: string; lastName: string; tasks: Task[] }>();
        freshGroupMembers.forEach(member => {
            if (member.role === Role.Student) {
                statsMap.set(member.id, { firstName: member.firstName, lastName: member.lastName, tasks: [] });
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

            const groupTutorials = tutorials.filter(t => t.groupId === group.id && t.status === 'held');
            const tutorialsOnly = groupTutorials.filter(t => t.type === 'tutorial');
            const meetingsOnly = groupTutorials.filter(t => t.type === 'group_meeting');

            const tutorialAttendanceCount = tutorialsOnly.filter(t => t.attendeeIds?.includes(id)).length;
            const meetingAttendanceCount = meetingsOnly.filter(t => t.attendeeIds?.includes(id)).length;

            const tutorialAttendancePct = tutorialsOnly.length > 0 ? Math.round((tutorialAttendanceCount / tutorialsOnly.length) * 100) : 0;
            const meetingAttendancePct = meetingsOnly.length > 0 ? Math.round((meetingAttendanceCount / meetingsOnly.length) * 100) : 0;

            return {
                id,
                firstName: statData.firstName,
                lastName: statData.lastName,
                completed: calculateTaskStats(completedTasks),
                inProgress: calculateTaskStats(inProgressTasks),
                pending: calculateTaskStats(pendingTasks),
                totalAssigned: calculateTaskStats(statData.tasks),
                productivity: Math.round(productivity),
                assignedPoints: pa,
                achievedPoints: pl,
                tutorialAttendance: tutorialAttendancePct,
                meetingAttendance: meetingAttendancePct,
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
        <div className={`w-full p-4 bg-white rounded-lg shadow-md transition-all duration-500 ${highlight ? 'ring-4 ring-orange-500 ring-offset-2 scale-[1.02]' : ''}`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center justify-center gap-4 rounded-xl p-1">
                        <ProgressCircle progress={progress} size={96} showText={true} />
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
                        {tutor && <p className="mt-1 text-sm italic font-bold text-green-800">Tutor/a: {tutor.firstName} {tutor.lastName}</p>}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                            <h4 className="mb-1 text-sm font-semibold text-blue-600">Componentes del grupo:</h4>
                            <div className="flex flex-wrap gap-x-1 gap-y-1">
                                {freshGroupMembers
                                    .filter(member => member.role === Role.Student)
                                    .sort(sortBySurname)
                                    .map((member, index, array) => (
                                    <span key={member.id} className="text-sm text-gray-800">
                                        <span className="font-bold">{index + 1}.</span> {member.lastName}, {member.firstName}{index < array.length - 1 ? ' |' : ''}
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
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                            <p className="text-xs font-medium text-gray-500">Reuniones de Grupo</p>
                            <p className="text-lg font-bold text-blue-600">{groupMeetingsCount}</p>
                        </div>
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                            <p className="text-xs font-medium text-gray-500">Próxima Reunión Grupo</p>
                            <p className="text-sm font-bold text-blue-600 break-words">{nextGroupMeetingDate}</p>
                        </div>
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                            <p className="text-xs font-medium text-gray-500">Tutorías Realizadas</p>
                            <p className="text-lg font-bold text-blue-600">{pastTutorialsCount}</p>
                        </div>
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
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
                        return (
                            <div key={stat.id} className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center w-5/12">
                                    <div className="flex items-center flex-shrink-0 gap-2">
                                        <div className="flex flex-col items-center" title={`Productividad: ${stat.productivity}%`}>
                                            <ProgressCircle progress={stat.productivity} size={36} showText={true} />
                                            <p className="mt-1 text-[9px] font-semibold text-gray-600 uppercase tracking-tight">TOTAL</p>
                                        </div>
                                        <SmallValueDisplay value={stat.assignedPoints} label="Asumidos" colorClass="bg-gray-500" />
                                        <SmallValueDisplay value={stat.achievedPoints} label="Logrados" colorClass="bg-green-500" />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0" title={`${stat.firstName} ${stat.lastName}`}>
                                        <p className="font-medium text-gray-800 truncate">{stat.firstName}</p>
                                        {stat.lastName && <p className="text-sm text-gray-600 truncate">{stat.lastName}</p>}
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] ${getAttendanceColor(stat.tutorialAttendance)} flex items-center gap-0.5 font-bold`} title="Asistencia a Tutorías">
                                                <GraduationCapIcon className="w-3 h-3" /> {stat.tutorialAttendance}%
                                            </span>
                                            <span className={`text-[10px] ${getAttendanceColor(stat.meetingAttendance)} flex items-center gap-0.5 font-bold`} title="Asistencia a Reuniones">
                                                <UsersIcon className="w-3 h-3" /> {stat.meetingAttendance}%
                                            </span>
                                        </div>
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
            <span className={`flex items-center justify-center w-10 h-10 text-base font-bold ${mainCircleClass} rounded-full`}>
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
                                    <p className="text-xs text-red-600 mt-1">Asignado a: {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Sin asignar'}</p>
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
    onNavigateToCalendar: (groupId?: string) => void;
}> = ({ group, project, tasks, tutorials, allUsers, user, courses, onNavigateToKanban, onNavigateToCalendar }) => {
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
            const d = difficultyWeights[task.difficulty] || 1;
            const p = priorityWeights[task.priority] || 1;
            return acc + (d * p * 3);
        }, 0);

        const calculatedAchievedValue = groupTasks.reduce((acc, task) => {
            const d = difficultyWeights[task.difficulty] || 1;
            const p = priorityWeights[task.priority] || 1;
            const s = statusWeights[task.status] || 0;
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

    const { pastTutorialsCount, nextTutorialDate, groupMeetingsCount, nextGroupMeetingDate } = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const groupTutorials = tutorials.filter(t => t.groupId === group.id);
        
        const tutorialsOnly = groupTutorials.filter(t => t.type !== 'group_meeting');
        const groupMeetingsOnly = groupTutorials.filter(t => t.type === 'group_meeting');

        const pastTutorials = tutorialsOnly.filter(t => t.status === 'held' && t.date >= project.startDate && t.date <= project.endDate);
        const futureTutorials = tutorialsOnly
            .filter(t => t.status === 'scheduled' && t.date >= todayStr)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const nextDateInfo = futureTutorials.length > 0
            ? `${new Date(futureTutorials[0].date + 'T00:00:00').toLocaleDateString('es-ES')}`
            : 'No agendada';

        const pastGroupMeetings = groupMeetingsOnly.filter(t => t.status === 'held' && t.date >= project.startDate && t.date <= project.endDate);
        const futureGroupMeetings = groupMeetingsOnly
            .filter(t => t.status === 'scheduled' && t.date >= todayStr)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const nextGroupMeetingDateInfo = futureGroupMeetings.length > 0
            ? `${new Date(futureGroupMeetings[0].date + 'T00:00:00').toLocaleDateString('es-ES')}`
            : 'No agendada';

        return { 
            pastTutorialsCount: pastTutorials.length, 
            nextTutorialDate: nextDateInfo,
            groupMeetingsCount: pastGroupMeetings.length,
            nextGroupMeetingDate: nextGroupMeetingDateInfo
        };
    }, [tutorials, group.id, project.startDate, project.endDate]);

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

        const statsMap = new Map<string, { firstName: string; lastName: string; tasks: Task[] }>();
        freshGroupMembers.forEach(member => {
            if (member.role === Role.Student) {
                statsMap.set(member.id, { firstName: member.firstName, lastName: member.lastName, tasks: [] });
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

            const groupTutorials = tutorials.filter(t => t.groupId === group.id && t.status === 'held');
            const tutorialsOnly = groupTutorials.filter(t => t.type === 'tutorial');
            const meetingsOnly = groupTutorials.filter(t => t.type === 'group_meeting');

            const tutorialAttendanceCount = tutorialsOnly.filter(t => t.attendeeIds?.includes(id)).length;
            const meetingAttendanceCount = meetingsOnly.filter(t => t.attendeeIds?.includes(id)).length;

            const tutorialAttendancePct = tutorialsOnly.length > 0 ? Math.round((tutorialAttendanceCount / tutorialsOnly.length) * 100) : 0;
            const meetingAttendancePct = meetingsOnly.length > 0 ? Math.round((meetingAttendanceCount / meetingsOnly.length) * 100) : 0;

            return {
                id,
                firstName: statData.firstName,
                lastName: statData.lastName,
                completed: calculateTaskStats(completedTasks),
                inProgress: calculateTaskStats(inProgressTasks),
                pending: calculateTaskStats(pendingTasks),
                totalAssigned: calculateTaskStats(statData.tasks),
                productivity: Math.round(productivity),
                assignedPoints: pa,
                achievedPoints: pl,
                tutorialAttendance: tutorialAttendancePct,
                meetingAttendance: meetingAttendancePct,
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
                    <div className="flex items-center justify-center gap-4 rounded-xl p-1">
                        <ProgressCircle progress={progress} size={96} showText={true} />
                        <div className="flex flex-col gap-2">
                            <ValueDisplay value={projectValue} label="Total" colorClass="bg-gray-600" />
                            <ValueDisplay value={achievedValue} label="Actual" colorClass="bg-green-600" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-normal text-green-700"><span className="font-bold">Proyecto:</span> {project.name}</h3>
                        <p className="text-base text-gray-500"><span className="text-black font-bold">Curso:</span> {courseName} - <span className="text-black font-bold">Grupo:</span> {group.name}</p>
                        {tutor && <p className="mt-1 text-sm italic font-bold text-green-800">Tutor/a: {tutor.firstName} {tutor.lastName}</p>}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                            <h4 className="mb-1 text-sm font-semibold text-blue-600">Componentes del grupo:</h4>
                            <div className="flex flex-wrap gap-x-1 gap-y-1">
                                {freshGroupMembers
                                    .filter(member => member.role === Role.Student)
                                    .sort(sortBySurname)
                                    .map((member, index, array) => (
                                    <span key={member.id} className="text-sm text-gray-800">
                                        <span className="font-bold">{index + 1}.</span> {member.lastName}, {member.firstName}{index < array.length - 1 ? ' |' : ''}
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
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                            <p className="text-xs font-medium text-gray-500">Reuniones de Grupo</p>
                            <p className="text-lg font-bold text-blue-600">{groupMeetingsCount}</p>
                        </div>
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                            <p className="text-xs font-medium text-gray-500">Próxima Reunión Grupo</p>
                            <p className="text-sm font-bold text-blue-600 break-words">{nextGroupMeetingDate}</p>
                        </div>
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                            <p className="text-xs font-medium text-gray-500">Tutorías Realizadas</p>
                            <p className="text-lg font-bold text-blue-600">{pastTutorialsCount}</p>
                        </div>
                        <div 
                            onClick={() => onNavigateToCalendar()}
                            className="p-1 text-center bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
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
                        return (
                            <div key={stat.id} className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center w-5/12">
                                     <div className="flex items-center flex-shrink-0 gap-2">
                                        <div className="flex flex-col items-center" title={`Productividad: ${stat.productivity}%`}>
                                            <ProgressCircle progress={stat.productivity} size={36} showText={true} />
                                            <p className="mt-1 text-[9px] font-semibold text-gray-600 uppercase tracking-tight">TOTAL</p>
                                        </div>
                                        <SmallValueDisplay value={stat.assignedPoints} label="Asumidos" colorClass="bg-gray-500" />
                                        <SmallValueDisplay value={stat.achievedPoints} label="Logrados" colorClass="bg-green-500" />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0" title={`${stat.firstName} ${stat.lastName}`}>
                                        <p className="font-medium text-gray-800 truncate">{stat.firstName}</p>
                                        {stat.lastName && <p className="text-sm text-gray-600 truncate">{stat.lastName}</p>}
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] ${getAttendanceColor(stat.tutorialAttendance)} flex items-center gap-0.5 font-bold`} title="Asistencia a Tutorías">
                                                <GraduationCapIcon className="w-3 h-3" /> {stat.tutorialAttendance}%
                                            </span>
                                            <span className={`text-[10px] ${getAttendanceColor(stat.meetingAttendance)} flex items-center gap-0.5 font-bold`} title="Asistencia a Reuniones">
                                                <UsersIcon className="w-3 h-3" /> {stat.meetingAttendance}%
                                            </span>
                                        </div>
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
    onNavigateToCalendar: (groupId?: string) => void;
}> = ({ user, groups, projects, tasks, tutorials, allUsers, courses, onNavigateToKanban, onNavigateToCalendar }) => {
    
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
                    onNavigateToCalendar={onNavigateToCalendar}
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
    selectedGroupId?: string;
    onNavigateToKanban: (projectId: string) => void; 
    onNavigateToCalendar: (groupId?: string) => void;
    onShowPendingTasks: (projectId: string) => void;
}> = ({ groups, projects, tasks, allUsers, tutorials, courses, selectedGroupId, onNavigateToKanban, onNavigateToCalendar, onShowPendingTasks }) => {
    const [expandedCourseGroups, setExpandedCourseGroups] = useState<Record<string, boolean>>({});
    const [selectedProjectForCourse, setSelectedProjectForCourse] = useState<Record<string, string | null>>({});

    useEffect(() => {
        if (selectedGroupId) {
            const project = projects.find(p => p.groupId === selectedGroupId);
            if (project) {
                const group = groups.find(g => g.id === project.groupId);
                if (group) {
                    const course = courses.find(c => c.id === group.courseId);
                    const courseGroupName = course ? course.name : 'Sin curso asignado';
                    setExpandedCourseGroups(prev => ({ ...prev, [courseGroupName]: true }));
                }
            }
        }
    }, [selectedGroupId, projects, groups, courses]);

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
        setExpandedCourseGroups(prev => {
            const isCurrentlyExpanded = !!prev[courseGroupName];
            return { [courseGroupName]: !isCurrentlyExpanded };
        });
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
                                {!selectedProjectForCourse[courseGroup] ? (
                                    <div className="space-y-2 mb-4">
                                        {projectsData.map(({ project, group }) => {
                                            const tutor = allUsers.find(u => u.id === group.tutorId);
                                            const projectTasks = tasks.filter(t => t.projectId === project.id);
                                            const progress = calculateProjectProgress(projectTasks);
                                            
                                            return (
                                                <button
                                                    key={project.id}
                                                    onClick={() => setSelectedProjectForCourse(prev => ({ ...prev, [courseGroup]: project.id }))}
                                                    className={`flex items-center w-full p-3 text-left transition-colors border rounded-md shadow-sm gap-4 ${
                                                        selectedProjectForCourse[courseGroup] === project.id
                                                            ? 'bg-blue-50 border-blue-300'
                                                            : 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <ProgressCircle progress={progress} size={48} showText={true} />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-semibold text-green-800 truncate">Proyecto: {project.name}</p>
                                                        <p className="text-sm text-gray-500">Grupo: {group.name}</p>
                                                        <p className="mt-1 text-xs text-blue-600">Tutor: {tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Sin tutor'}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        <div>
                                                            <p className="text-xs text-right text-gray-500">Inicio</p>
                                                            <p className="text-sm font-medium text-green-600">{new Date(project.startDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                                                        </div>
                                                        <div className="mt-1">
                                                            <p className="text-xs text-right text-gray-500">Fin</p>
                                                            <p className="text-sm font-medium text-red-600">{new Date(project.endDate + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setSelectedProjectForCourse(prev => ({ ...prev, [courseGroup]: null }))} 
                                            className="mb-4 text-sm text-blue-600 hover:underline flex items-center"
                                        >
                                            <ChevronDownIcon className="w-4 h-4 mr-1 rotate-90" /> Volver al listado de grupos
                                        </button>
                                        <div className="grid grid-cols-1 gap-6">
                                            {projectsData
                                                .filter(p => p.project.id === selectedProjectForCourse[courseGroup])
                                                .map(({ project, group }) => (
                                                    <AdminTutorGroupCard
                                                        key={project.id}
                                                        group={group}
                                                        project={project}
                                                        tasks={tasks}
                                                        allUsers={allUsers}
                                                        tutorials={tutorials}
                                                        courses={courses}
                                                        highlight={group.id === selectedGroupId}
                                                        onNavigateToKanban={onNavigateToKanban}
                                                        onNavigateToCalendar={onNavigateToCalendar}
                                                        onShowPendingTasks={onShowPendingTasks}
                                                    />
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, groups, projects, tasks, allUsers, messages, tutorials, ras, courses, courseDates, selectedGroupId, onNavigateToKanban, onNavigateToCalendar, onSendMessage, onMarkMessagesAsRead, onUpdateTask, onDeleteTask, onUpdateTutorial }) => {
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [isPendingTutorialsModalOpen, setIsPendingTutorialsModalOpen] = useState(false);
    const [isPendingMeetingsModalOpen, setIsPendingMeetingsModalOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [selectedProjectForPendingTasks, setSelectedProjectForPendingTasks] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const unreadMessages = useMemo(() => messages.filter(msg => 
        msg.recipientIds.includes(user.id) && !msg.readBy.includes(user.id)
    ), [messages, user.id]);

    const pendingTutorials = useMemo(() => {
        const allPending = tutorials.filter(t => t.status === 'scheduled' && t.type === 'tutorial');
        if (user.role === Role.Admin) return allPending;
        if (user.role === Role.Tutor) return allPending.filter(t => t.tutorId === user.id);
        return allPending.filter(t => user.groupIds.includes(t.groupId));
    }, [tutorials, user]);

    const pendingMeetings = useMemo(() => {
        const allPending = tutorials.filter(t => t.status === 'scheduled' && t.type === 'group_meeting');
        if (user.role === Role.Admin) return allPending;
        if (user.role === Role.Tutor) return allPending.filter(t => t.tutorId === user.id);
        return allPending.filter(t => user.groupIds.includes(t.groupId));
    }, [tutorials, user]);

    const handleClosePendingModal = () => {
        setIsPendingModalOpen(false);
    };

    const handleClosePendingTutorialsModal = () => {
        setIsPendingTutorialsModalOpen(false);
    };

    const handleClosePendingMeetingsModal = () => {
        setIsPendingMeetingsModalOpen(false);
    };

    const handleEditTutorial = (tut: Tutorial) => {
        setEditingTutorial(tut);
        setIsPendingTutorialsModalOpen(false);
        setIsPendingMeetingsModalOpen(false);
    };

    const handleSaveTutorial = async (data: { id?: string, payload: Omit<Tutorial, 'id'>}) => {
        if (data.id) {
            const err = await onUpdateTutorial(data.id, data.payload);
            if (!err) {
                setEditingTutorial(null);
            }
            return err;
        }
        return null;
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
            <div className="flex flex-col gap-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                    {user.role === Role.Student ? 'Mis Proyectos' : 'Proyectos por curso'}
                </h2>
                <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => unreadMessages.length > 0 && setIsPendingModalOpen(true)}
                        className={`px-1 sm:px-2 py-1.5 text-[9px] sm:text-[10px] md:text-xs font-bold rounded-md transition-all whitespace-nowrap flex-1 max-w-[300px] ${
                            unreadMessages.length > 0
                                ? 'bg-red-500 text-white blinking-button shadow-lg hover:bg-red-600'
                                : 'bg-green-500 text-white cursor-default'
                        }`}
                    >
                        {unreadMessages.length > 0 ? `Mensajes pendientes (${unreadMessages.length})` : 'Sin mensajes pendientes'}
                    </button>
                    <button
                        onClick={() => pendingTutorials.length > 0 && setIsPendingTutorialsModalOpen(true)}
                        className={`px-1 sm:px-2 py-1.5 text-[9px] sm:text-[10px] md:text-xs font-bold rounded-md transition-all whitespace-nowrap flex-1 max-w-[300px] ${
                            pendingTutorials.length > 0
                                ? 'bg-red-500 text-white shadow-lg hover:bg-red-600'
                                : 'bg-green-500 text-white cursor-default'
                        }`}
                    >
                        {pendingTutorials.length > 0 ? `Tutorías pendientes (${pendingTutorials.length})` : 'Sin tutorías pendientes'}
                    </button>
                    <button
                        onClick={() => pendingMeetings.length > 0 && setIsPendingMeetingsModalOpen(true)}
                        className={`px-1 sm:px-2 py-1.5 text-[9px] sm:text-[10px] md:text-xs font-bold rounded-md transition-all whitespace-nowrap flex-1 max-w-[300px] ${
                            pendingMeetings.length > 0
                                ? 'bg-red-500 text-white shadow-lg hover:bg-red-600'
                                : 'bg-green-500 text-white cursor-default'
                        }`}
                    >
                        {pendingMeetings.length > 0 ? `Reuniones de grupo pendientes (${pendingMeetings.length})` : 'Sin reuniones de grupo pendientes'}
                    </button>
                </div>
            </div>
            
            {(user.role === Role.Admin || user.role === Role.Tutor)
                ? <AdminTutorDashboard 
                    groups={visibleGroups} 
                    projects={visibleProjects} 
                    tasks={tasks} 
                    allUsers={allUsers} 
                    tutorials={tutorials}
                    courses={courses}
                    selectedGroupId={selectedGroupId}
                    onNavigateToKanban={onNavigateToKanban} 
                    onNavigateToCalendar={onNavigateToCalendar}
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
                    onNavigateToCalendar={onNavigateToCalendar}
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

            {isPendingTutorialsModalOpen && (
                <PendingTutorialsMeetingsModal
                    title={`Tienes ${pendingTutorials.length} tutoría(s) pendiente(s)`}
                    tutorials={pendingTutorials}
                    groups={groups}
                    allUsers={allUsers}
                    projects={projects}
                    courses={courses}
                    onClose={handleClosePendingTutorialsModal}
                    onEdit={handleEditTutorial}
                />
            )}

            {isPendingMeetingsModalOpen && (
                <PendingTutorialsMeetingsModal
                    title={`Tienes ${pendingMeetings.length} reunión(es) pendiente(s)`}
                    tutorials={pendingMeetings}
                    groups={groups}
                    allUsers={allUsers}
                    projects={projects}
                    courses={courses}
                    onClose={handleClosePendingMeetingsModal}
                    onEdit={handleEditTutorial}
                />
            )}

            {editingTutorial && (
                <Modal
                    title="Editar Tutoría/Reunión"
                    onClose={() => setEditingTutorial(null)}
                    size="2xl"
                >
                    <TutorialForm
                        user={user}
                        tutors={allUsers.filter(u => u.role === Role.Tutor)}
                        groups={groups}
                        allUsers={allUsers}
                        projects={projects}
                        courses={courses}
                        onSave={handleSaveTutorial}
                        onCancel={() => setEditingTutorial(null)}
                        tutorialToEdit={editingTutorial}
                    />
                </Modal>
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