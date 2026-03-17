import React, { useState, useMemo, useEffect } from 'react';
import { User, Tutorial, Role, Group, Project, Course } from '../types';
import Modal from './Modal';
import { ChevronDownIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarProps {
    user: User;
    tutorials: Tutorial[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    courses: Course[];
    onCreateTutorial: (data: Omit<Tutorial, 'id'>) => void;
    onUpdateTutorial: (id: string, data: Partial<Omit<Tutorial, 'id'>>) => void;
    onDeleteTutorial: (id: string) => void;
    courseDates: { startDate: string; endDate: string; };
}

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TutorialForm: React.FC<{
    tutors: User[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    onSave: (data: { id?: string, payload: Omit<Tutorial, 'id'>}) => void;
    onCancel: () => void;
    tutorialToEdit?: Tutorial | null;
    initialData?: Partial<Omit<Tutorial, 'id'>> | null;
}> = ({ tutors, groups, allUsers, projects, onSave, onCancel, tutorialToEdit, initialData }) => {
    const [date, setDate] = useState(tutorialToEdit?.date || initialData?.date || formatDate(new Date()));
    const [tutorId, setTutorId] = useState(tutorialToEdit?.tutorId || initialData?.tutorId || '');
    const [groupId, setGroupId] = useState(tutorialToEdit?.groupId || initialData?.groupId || '');
    const [summary, setSummary] = useState(tutorialToEdit?.summary || '');
    const [location, setLocation] = useState(tutorialToEdit?.location || '');
    const [nextDate, setNextDate] = useState(tutorialToEdit?.nextDate || '');
    const [nextLocation, setNextLocation] = useState(tutorialToEdit?.nextLocation || '');
    const [nextTime, setNextTime] = useState(tutorialToEdit?.nextTime || '');
    const todayStr = useMemo(() => formatDate(new Date()), []);

    useEffect(() => {
        if (tutorialToEdit?.tutorId !== tutorId) {
             setGroupId('');
        }
    }, [tutorId, tutorialToEdit]);

    const availableGroupsByCourse = useMemo(() => {
        if (!tutorId) {
            return {};
        }
        
        const filteredGroups = groups.filter(group => group.tutorId === tutorId);

        const result: Record<string, Group[]> = {};
        filteredGroups.forEach(group => {
            let courseName = 'Grupos sin curso asignado';
            if (group.members.length > 0) {
                for (const member of group.members) {
                    const freshMemberInfo = allUsers.find(u => u.id === member.id);
                    if (freshMemberInfo && freshMemberInfo.courseGroup) {
                        courseName = freshMemberInfo.courseGroup;
                        break;
                    }
                }
            }
            if (!result[courseName]) result[courseName] = [];
            result[courseName].push(group);
        });
        return result;
    }, [tutorId, groups, allUsers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nextDate && nextDate < todayStr) {
            alert('No se pueden agendar reuniones con fecha anterior a la actual.');
            return;
        }
        onSave({ 
            id: tutorialToEdit?.id, 
            payload: { date, tutorId, groupId, summary, location, nextDate, nextLocation, nextTime } 
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de la tutoría</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Lugar de reunión</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: Sala de reuniones, Aula 102, Online..." className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tutor</label>
                <select value={tutorId} onChange={e => setTutorId(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required>
                    <option value="">Seleccionar tutor</option>
                    {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Grupo</label>
                <select 
                    value={groupId} 
                    onChange={e => setGroupId(e.target.value)} 
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                    required 
                    disabled={!tutorId}
                >
                    <option value="">{tutorId ? 'Seleccionar grupo' : 'Seleccione un tutor primero'}</option>
                    {Object.keys(availableGroupsByCourse).sort().map(courseName => (
                        <optgroup label={courseName} key={courseName}>
                            {availableGroupsByCourse[courseName].map(group => {
                                const project = projects.find(p => p.groupId === group.id);
                                const displayText = `${group.name}${project ? ` - ${project.name}` : ' (Sin proyecto)'}`;
                                return (
                                    <option key={group.id} value={group.id}>{displayText}</option>
                                );
                            })}
                        </optgroup>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Contenido de la reunión</label>
                <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={5} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Fecha para la próxima tutoría</label>
                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} min={date > todayStr ? date : todayStr} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Lugar de próxima reunión</label>
                    <input type="text" value={nextLocation} onChange={e => setNextLocation(e.target.value)} placeholder="Ej: Sala de reuniones, Aula 102, Online..." className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Hora de próxima reunión</label>
                    <input type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                    {tutorialToEdit ? 'Guardar Cambios' : 'Registrar'}
                </button>
            </div>
        </form>
    );
};

const COURSE_COLOR_CONFIG: Record<string, { bg: string; border: string; }> = {
  '1º TSAF': { bg: 'bg-blue-100', border: 'border-blue-400' },
  '2º TSAF': { bg: 'bg-teal-100', border: 'border-teal-400' },
  '1º TSEAS': { bg: 'bg-yellow-100', border: 'border-yellow-400' },
  '2º TSEAS': { bg: 'bg-orange-100', border: 'border-orange-400' },
  'default': { bg: 'bg-gray-100', border: 'border-gray-400' },
};

type EnrichedTutorial = Tutorial & {
    groupName: string;
    projectName: string;
    courseGroup: string;
};

type RegisteredEvent = EnrichedTutorial & { type: 'registered' };
type ScheduledEvent = {
    type: 'scheduled';
    id: string;
    date: string; // This will be the nextDate
    groupName: string;
    projectName: string;
    courseGroup: string;
    originalTutorial: Tutorial; // To pre-fill new form data
};
type CalendarEvent = RegisteredEvent | ScheduledEvent;


interface TooltipData {
    groupName: string;
    projectName: string;
    summary: string;
    location?: string;
    time?: string;
}

const CalendarView: React.FC<{
    user: User;
    visibleTutorials: Tutorial[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    onEdit: (tutorial: Tutorial) => void;
    onDelete: (tutorial: Tutorial) => void;
    courseDates: { startDate: string; endDate: string; };
    onScheduleNew: (data: Partial<Omit<Tutorial, 'id'>>) => void;
}> = ({ user, visibleTutorials, groups, allUsers, projects, onEdit, onDelete, courseDates, onScheduleNew }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dailyTutorialsPopover, setDailyTutorialsPopover] = useState<{ day: Date; events: CalendarEvent[] } | null>(null);
    const [tooltip, setTooltip] = useState<{ data: TooltipData; x: number; y: number } | null>(null);

    const eventsByDate = useMemo(() => {
        const groupMap = new Map<string, Group>(groups.map((g) => [g.id, g]));
        const projectMap = new Map<string, Project>(projects.map((p) => [p.groupId, p]));
        const groupToCourseMap: Record<string, string> = {};

        groups.forEach(group => {
            for (const member of group.members) {
                const freshMember = allUsers.find(u => u.id === member.id);
                if (freshMember?.courseGroup) {
                    groupToCourseMap[group.id] = freshMember.courseGroup;
                    break;
                }
            }
        });
        
        const eventMap: Record<string, CalendarEvent[]> = {};
        const registeredSet = new Set<string>(visibleTutorials.map(t => `${t.groupId}-${t.date}`));

        visibleTutorials.forEach(tut => {
            const group = groupMap.get(tut.groupId);
            const project = projectMap.get(tut.groupId);
            const enrichedBase = {
                groupName: group?.name || 'Grupo desconocido',
                projectName: project?.name || 'Sin proyecto asignado',
                courseGroup: groupToCourseMap[tut.groupId] || 'default',
            };

            const registeredEvent: RegisteredEvent = { ...tut, ...enrichedBase, type: 'registered' };
            if (!eventMap[tut.date]) eventMap[tut.date] = [];
            eventMap[tut.date].push(registeredEvent);

            if (tut.nextDate && !registeredSet.has(`${tut.groupId}-${tut.nextDate}`)) {
                const scheduledEvent: ScheduledEvent = {
                    type: 'scheduled',
                    id: `scheduled-${tut.id}`,
                    date: tut.nextDate,
                    ...enrichedBase,
                    originalTutorial: tut,
                };
                if (!eventMap[tut.nextDate]) eventMap[tut.nextDate] = [];
                eventMap[tut.nextDate].push(scheduledEvent);
            }
        });
        return eventMap;
    }, [visibleTutorials, groups, allUsers, projects]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDate = new Date(startOfMonth);
    const startDayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ...
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0 for Mon, 6 for Sun
    startDate.setDate(startDate.getDate() - offset);

    const endDate = new Date(endOfMonth);
    const endDayOfWeek = endDate.getDay(); // 0=Sun, 1=Mon, ...
    const endOffset = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek; // 0 for Sun, 1 for Sat...
    endDate.setDate(endDate.getDate() + endOffset);


    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleDayClick = (day: Date, eventsOnDay: CalendarEvent[]) => {
        if (eventsOnDay.length === 1) {
            const event = eventsOnDay[0];
            if (event.type === 'registered') {
                onEdit(event);
            } else {
                onScheduleNew({ date: event.date, groupId: event.originalTutorial.groupId, tutorId: event.originalTutorial.tutorId });
            }
        } else if (eventsOnDay.length > 1) {
            setDailyTutorialsPopover({ day, events: eventsOnDay });
        }
    };

    const courseStartDate = useMemo(() => new Date(courseDates.startDate + 'T00:00:00'), [courseDates.startDate]);
    const courseEndDate = useMemo(() => new Date(courseDates.endDate + 'T00:00:00'), [courseDates.endDate]);

    const isPrevDisabled = useMemo(() => {
        return currentDate.getFullYear() < courseStartDate.getFullYear() || 
               (currentDate.getFullYear() === courseStartDate.getFullYear() && currentDate.getMonth() <= courseStartDate.getMonth());
    }, [currentDate, courseStartDate]);
    
    const isNextDisabled = useMemo(() => {
        return currentDate.getFullYear() > courseEndDate.getFullYear() || 
               (currentDate.getFullYear() === courseEndDate.getFullYear() && currentDate.getMonth() >= courseEndDate.getMonth());
    }, [currentDate, courseEndDate]);

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            {tooltip && (
                <div
                    className="fixed z-50 p-3 text-sm text-white bg-black bg-opacity-80 rounded-lg shadow-xl max-w-xs pointer-events-none"
                    style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}
                >
                    <p className="font-bold">{tooltip.data.groupName}</p>
                    <p className="text-sm italic text-gray-300">{tooltip.data.projectName}</p>
                    
                    {(tooltip.data.location || tooltip.data.time) && <hr className="my-1 border-gray-500" />}
                    
                    {tooltip.data.location && (
                        <p className="text-xs"><span className="font-semibold">Lugar:</span> {tooltip.data.location}</p>
                    )}
                    {tooltip.data.time && (
                        <p className="text-xs"><span className="font-semibold">Hora:</span> {tooltip.data.time}</p>
                    )}

                    {tooltip.data.summary && (
                        <>
                            <hr className="my-1 border-gray-500" />
                            <p className="text-xs">{tooltip.data.summary}</p>
                        </>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} 
                    className="p-2 text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPrevDisabled}
                >
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>
                <h3 className="text-xl font-semibold text-gray-800">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <button 
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} 
                    className="p-2 text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isNextDisabled}
                >
                    <ChevronRightIcon className="w-6 h-6"/>
                </button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center py-2 mb-4 border-t border-b gap-x-4 gap-y-2">
                {Object.entries(COURSE_COLOR_CONFIG)
                    .filter(([courseName]) => courseName !== 'default')
                    .map(([courseName, colors]) => (
                        <div key={courseName} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 border ${colors.bg} ${colors.border}`}></div>
                            <span className="text-xs text-gray-600">{courseName}</span>
                        </div>
                    ))}
            </div>

            <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 border-t border-l">
                {days.map(d => {
                    const dateStr = formatDate(d);
                    const eventsOnDay = (eventsByDate[dateStr] || []).sort((a, b) => {
                        if (a.type === 'registered' && b.type === 'scheduled') return -1;
                        if (a.type === 'scheduled' && b.type === 'registered') return 1;
                        return 0;
                    });
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    const isToday = d.getTime() === today.getTime();
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                    let dayClass = 'relative h-20 p-1 border-b border-r cursor-pointer transition-colors ';
                    if (!isCurrentMonth) {
                        dayClass += 'bg-gray-50 text-gray-400';
                    } else if (isWeekend) {
                        dayClass += 'bg-red-50 text-gray-800 hover:bg-red-100';
                    } else {
                        dayClass += 'bg-white text-gray-800 hover:bg-gray-100';
                    }
                    
                    return (
                        <div key={d.toString()} onClick={() => handleDayClick(d, eventsOnDay)} className={dayClass}>
                            <span className={`flex items-center justify-center w-7 h-7 text-sm rounded-full ${isToday ? 'bg-green-600 text-white font-bold' : ''}`}>{d.getDate()}</span>
                            <div className="absolute bottom-1 right-1 flex flex-wrap-reverse justify-end gap-1">
                                {eventsOnDay.map(event => {
                                    const colors = COURSE_COLOR_CONFIG[event.courseGroup] || COURSE_COLOR_CONFIG['default'];
                                    const isRegistered = event.type === 'registered';
                                    return (
                                        <div 
                                            key={event.id} 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (isRegistered) {
                                                    onEdit(event);
                                                } else {
                                                    onScheduleNew({ date: event.date, groupId: event.originalTutorial.groupId, tutorId: event.originalTutorial.tutorId });
                                                }
                                            }}
                                            onMouseMove={(e) => {
                                                const data: TooltipData = {
                                                    groupName: event.groupName,
                                                    projectName: event.projectName,
                                                    summary: event.type === 'registered' ? event.summary : "Próxima reunión agendada.",
                                                    location: event.type === 'registered' ? event.location : event.originalTutorial.nextLocation || 'Lugar por definir',
                                                    time: event.type === 'registered' ? undefined : event.originalTutorial.nextTime || 'Hora por definir'
                                                };
                                                setTooltip({ data, x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                            className={`w-3 h-3 border cursor-pointer ${colors.bg} ${colors.border} ${isRegistered ? 'rounded-sm flex items-center justify-center' : 'rounded-full'}`}
                                        >
                                            {isRegistered && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 opacity-75">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {dailyTutorialsPopover && (
                <Modal 
                    title={`Tutorías para el ${dailyTutorialsPopover.day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                    onClose={() => setDailyTutorialsPopover(null)}
                >
                    <div className="space-y-2">
                        {dailyTutorialsPopover.events.map(event => {
                            const isRegistered = event.type === 'registered';
                            return (
                                <div 
                                    key={event.id} 
                                    className="flex items-center justify-between p-3 transition-shadow bg-gray-50 border rounded-md cursor-pointer hover:shadow-md" 
                                    onClick={() => {
                                        if (isRegistered) {
                                            onEdit(event);
                                        } else {
                                            onScheduleNew({ date: event.date, groupId: event.originalTutorial.groupId, tutorId: event.originalTutorial.tutorId });
                                        }
                                        setDailyTutorialsPopover(null); 
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-green-800">
                                            {isRegistered ? '' : 'Próxima Reunión: '}
                                            {event.groupName}
                                        </p>
                                        <p className="mt-1 text-sm italic text-gray-600 truncate">{event.projectName}</p>
                                        {isRegistered && <p className="mt-1 text-xs text-gray-500 truncate">{event.summary}</p>}
                                    </div>
                                    <div className="flex-shrink-0 ml-4">
                                        <button className="p-2 text-gray-400 rounded-full hover:bg-blue-100 hover:text-blue-600">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Modal>
            )}
        </div>
    );
};

const PendingTutorialsModal: React.FC<{
    user: User;
    tutors: User[];
    tutorials: Tutorial[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    onClose: () => void;
}> = ({ user, tutors, tutorials, groups, allUsers, projects, onClose }) => {
    const [selectedTutorId, setSelectedTutorId] = useState(user.role === Role.Tutor ? user.id : '');

    const pendingTutorialsByTutor = useMemo(() => {
        if (!selectedTutorId) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const registeredSet = new Set<string>(tutorials.map(t => `${t.groupId}-${t.date}`));

        return tutorials
            .filter(tut => tut.tutorId === selectedTutorId && tut.nextDate && !registeredSet.has(`${tut.groupId}-${tut.nextDate}`))
            .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime())
            .map(tut => {
                const group = groups.find(g => g.id === tut.groupId);
                const project = projects.find(p => p.groupId === tut.groupId);
                const isOverdue = new Date(tut.nextDate! + 'T00:00:00') < today;
                let courseGroup = 'N/A';
                if (group?.members.length) {
                    for (const member of group.members) {
                        const user = allUsers.find(u => u.id === member.id);
                        if (user?.courseGroup) {
                            courseGroup = user.courseGroup;
                            break;
                        }
                    }
                }
                return {
                    id: `pending-${tut.id}`,
                    date: tut.nextDate!,
                    reunionStatus: isOverdue ? 'Reunión no celebrada' : 'Reunión por celebrar',
                    location: tut.nextLocation || 'No especificado',
                    time: tut.nextTime || 'No especificada',
                    courseGroup,
                    groupName: group?.name || 'Grupo Desconocido',
                    projectName: project?.name || 'Sin Proyecto',
                    isOverdue,
                };
            });
    }, [selectedTutorId, tutorials, groups, projects, allUsers]);
    
    const pendingTutorialsForStudent = useMemo(() => {
        if (user.role !== Role.Student) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const registeredSet = new Set<string>(tutorials.map(t => `${t.groupId}-${t.date}`));

        return tutorials
            .filter(tut => user.groupIds.includes(tut.groupId) && tut.nextDate && !registeredSet.has(`${tut.groupId}-${tut.nextDate}`))
            .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime())
            .map(tut => {
                const group = groups.find(g => g.id === tut.groupId);
                const project = projects.find(p => p.groupId === tut.groupId);
                const isOverdue = new Date(tut.nextDate! + 'T00:00:00') < today;
                let courseGroup = 'N/A';
                 if (group?.members.length) {
                    for (const member of group.members) {
                        const studentUser = allUsers.find(u => u.id === member.id);
                        if (studentUser?.courseGroup) {
                            courseGroup = studentUser.courseGroup;
                            break;
                        }
                    }
                }
                return {
                    id: `pending-student-${tut.id}`,
                    date: tut.nextDate!,
                    reunionStatus: isOverdue ? 'Reunión no celebrada' : 'Reunión por celebrar',
                    location: tut.nextLocation || 'No especificado',
                    time: tut.nextTime || 'No especificada',
                    courseGroup,
                    groupName: group?.name || 'Grupo Desconocido',
                    projectName: project?.name || 'Sin Proyecto',
                    isOverdue,
                };
            });
    }, [user, tutorials, groups, projects, allUsers]);

    const tutorialsToShow = user.role === Role.Student ? pendingTutorialsForStudent : pendingTutorialsByTutor;

    let noDataContent: React.ReactNode;
    if (user.role === Role.Admin && !selectedTutorId) {
        noDataContent = <p className="py-6 text-center text-gray-500">Por favor, selecciona un tutor para ver sus reuniones pendientes.</p>;
    } else if (tutorialsToShow.length === 0) {
        const message = user.role === Role.Admin
            ? "Este tutor no tiene reuniones anteriores registradas, ni agendadas en el futuro."
            : "No tienes reuniones pendientes agendadas.";
        noDataContent = <p className="py-6 text-center text-gray-500">{message}</p>;
    }

    return (
        <div className="space-y-4">
            {user.role === Role.Admin && (
                <div>
                    <label htmlFor="tutor-select" className="block text-sm font-medium text-gray-700">Seleccionar Tutor</label>
                    <select
                        id="tutor-select"
                        value={selectedTutorId}
                        onChange={(e) => setSelectedTutorId(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    >
                        <option value="">-- Elige un tutor --</option>
                        {tutors.map(tutor => (
                            <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
                        ))}
                    </select>
                </div>
            )}
             {user.role === Role.Tutor && (
                 <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-800">Mostrando reuniones pendientes para: <span className="font-semibold">{user.name}</span></p>
                </div>
            )}
            {user.role === Role.Student && (
                 <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-800">Mostrando próximas reuniones para tus grupos.</p>
                </div>
            )}

            <div className="mt-4 border-t">
                 {tutorialsToShow.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full mt-2 text-left table-auto">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Fecha</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Reunión</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Lugar</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Hora</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Curso</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Grupo</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">Proyecto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tutorialsToShow.map(tut => (
                                    <tr key={tut.id} className={`hover:bg-gray-50 ${tut.isOverdue ? 'bg-red-50 text-red-800' : 'text-green-800'}`}>
                                        <td className="px-3 py-2 text-sm">{new Date(tut.date + 'T00:00:00').toLocaleDateString('es-ES')}</td>
                                        <td className={`px-3 py-2 text-sm ${tut.isOverdue ? 'font-semibold' : ''}`}>{tut.reunionStatus}</td>
                                        <td className="px-3 py-2 text-sm">{tut.location}</td>
                                        <td className="px-3 py-2 text-sm">{tut.time}</td>
                                        <td className="px-3 py-2 text-sm">{tut.courseGroup}</td>
                                        <td className="px-3 py-2 text-sm">{tut.groupName}</td>
                                        <td className="px-3 py-2 text-sm">{tut.projectName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    noDataContent
                )}
            </div>
        </div>
    );
};

const Calendar: React.FC<CalendarProps> = ({ user, tutorials, groups, allUsers, projects, courses, onCreateTutorial, onUpdateTutorial, onDeleteTutorial, courseDates }) => {
    const [view, setView] = useState('list');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [tutorialToDelete, setTutorialToDelete] = useState<Tutorial | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [prefilledData, setPrefilledData] = useState<Partial<Omit<Tutorial, 'id'>> | null>(null);
    
    const tutors = useMemo(() => allUsers.filter(u => u.role === Role.Tutor), [allUsers]);

    const visibleTutorials = useMemo(() => {
        if (user.role === Role.Admin) return tutorials;
        
        const userGroupIds = user.role === Role.Tutor
            ? groups.filter(g => g.tutorId === user.id).map(g => g.id)
            : user.groupIds;
        
        return tutorials.filter(t => userGroupIds.includes(t.groupId));
    }, [user, tutorials, groups]);


    const tutorialsByCourseAndGroup = useMemo(() => {
        const result: Record<string, { group: Group, tutorials: Tutorial[] }[]> = {};
        const groupToCourseMap: Record<string, string> = {};
        groups.forEach(group => {
            const course = courses.find(c => c.id === group.courseId);
            if (course) {
                groupToCourseMap[group.id] = course.name;
            }
        });

        const tutorialsByGroupId: Record<string, Tutorial[]> = {};
        visibleTutorials.forEach(tut => {
            if (!tutorialsByGroupId[tut.groupId]) tutorialsByGroupId[tut.groupId] = [];
            tutorialsByGroupId[tut.groupId].push(tut);
        });

        Object.keys(tutorialsByGroupId).forEach(groupId => {
            const group = groups.find(g => g.id === groupId);
            const courseName = groupToCourseMap[groupId] || 'Curso no asignado';
            if (group) {
                if (!result[courseName]) result[courseName] = [];
                result[courseName].push({
                    group,
                    tutorials: tutorialsByGroupId[groupId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                });
            }
        });

        for (const courseName of Object.keys(result)) {
            result[courseName].sort((a, b) => a.group.name.localeCompare(b.group.name));
        }
        return result;
    }, [visibleTutorials, groups, courses]);

    const toggleExpand = (key: string) => setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingTutorial(null);
        setTutorialToDelete(null);
        setIsPendingModalOpen(false);
        setPrefilledData(null);
    };

    const handleCreate = () => {
        setEditingTutorial(null);
        setPrefilledData(null);
        setIsCreateModalOpen(true);
    };

    const handleScheduleNew = (data: Partial<Omit<Tutorial, 'id'>>) => {
        setEditingTutorial(null);
        setPrefilledData(data);
        setIsCreateModalOpen(true);
    };

    const handleSave = ({ id, payload }: { id?: string; payload: Omit<Tutorial, 'id'>}) => {
        if (id) {
            onUpdateTutorial(id, payload);
        } else {
            onCreateTutorial(payload);
        }
        closeModal();
    };

    const handleConfirmDelete = () => {
        if (tutorialToDelete) {
            onDeleteTutorial(tutorialToDelete.id);
        }
        closeModal();
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Historial de Tutorías</h2>
                <div className="flex items-center gap-2">
                     <button onClick={() => setIsPendingModalOpen(true)} className="px-4 py-2 font-semibold text-gray-800 bg-yellow-400 rounded-md hover:bg-yellow-500">
                        Reuniones pendientes
                    </button>
                    <button onClick={() => setView(v => v === 'list' ? 'calendar' : 'list')} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        {view === 'list' ? 'Calendario de tutorías' : 'Ver como Lista'}
                    </button>
                    {(user.role === Role.Admin || user.role === Role.Tutor) && (
                        <button onClick={handleCreate} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                            Registrar Tutoría
                        </button>
                    )}
                </div>
            </div>
            
            {view === 'list' ? (
                <div className="space-y-2">
                    {Object.keys(tutorialsByCourseAndGroup).sort().map(courseName => (
                        <div key={courseName} className="border border-gray-200 rounded-lg">
                            <button onClick={() => toggleExpand(`course_${courseName}`)} className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none">
                                <div className="flex items-center">
                                    <h3 className="font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{tutorialsByCourseAndGroup[courseName].length} grupos</span>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedKeys[`course_${courseName}`] ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedKeys[`course_${courseName}`] && (
                                <div className="p-4 border-t border-gray-200">
                                    {tutorialsByCourseAndGroup[courseName].map(({ group, tutorials: groupTutorials }) => {
                                        const project = projects.find(p => p.groupId === group.id);
                                        return (
                                        <div key={group.id} className="mb-2 border-l-2 border-green-200">
                                            <button onClick={() => toggleExpand(`group_${group.id}`)} className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 focus:outline-none">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <h4 className="font-semibold text-green-800">{group.name}</h4>
                                                        <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">{groupTutorials.length} tutorías</span>
                                                    </div>
                                                    {project && <p className="mt-1 text-sm italic text-gray-500 truncate">{project.name}</p>}
                                                </div>
                                                <ChevronDownIcon className={`flex-shrink-0 w-5 h-5 ml-2 text-gray-500 transition-transform ${expandedKeys[`group_${group.id}`] ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expandedKeys[`group_${group.id}`] && (
                                                <div className="pl-6 pr-2 pb-2 mt-1 space-y-2">
                                                    {groupTutorials.map(tutorial => (
                                                        <div key={tutorial.id} className="flex items-center justify-between p-3 bg-white border rounded-md hover:shadow-sm">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-gray-700">{new Date(tutorial.date + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                                <p className="mt-1 text-sm text-gray-600 truncate">{tutorial.summary}</p>
                                                                {tutorial.nextDate && <p className="pt-2 mt-2 text-xs text-blue-600 border-t"><strong className="font-semibold">Próxima reunión:</strong> {new Date(tutorial.nextDate  + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
                                                            </div>
                                                            {(user.role === Role.Admin || user.id === tutorial.tutorId) && (
                                                                <div className="flex flex-shrink-0 ml-4 space-x-1">
                                                                    <button onClick={() => setEditingTutorial(tutorial)} className="p-2 text-gray-400 rounded-full hover:bg-blue-100 hover:text-blue-600" aria-label="Editar tutoría"><EditIcon className="w-4 h-4" /></button>
                                                                    <button onClick={() => setTutorialToDelete(tutorial)} className="p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600" aria-label="Eliminar tutoría"><TrashIcon className="w-4 h-4" /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <CalendarView
                    user={user}
                    visibleTutorials={visibleTutorials}
                    groups={groups}
                    allUsers={allUsers}
                    projects={projects}
                    onEdit={(tut) => setEditingTutorial(tut)}
                    onDelete={(tut) => setTutorialToDelete(tut)}
                    courseDates={courseDates}
                    onScheduleNew={handleScheduleNew}
                />
            )}

            {isPendingModalOpen && (
                <Modal title="Reuniones Pendientes" onClose={closeModal} size="5xl">
                    <PendingTutorialsModal
                        user={user}
                        tutors={tutors}
                        tutorials={tutorials}
                        groups={groups}
                        allUsers={allUsers}
                        projects={projects}
                        onClose={closeModal}
                    />
                </Modal>
            )}
            {isCreateModalOpen && <Modal title="Registrar Nueva Tutoría" onClose={closeModal}><TutorialForm tutors={tutors} groups={groups} allUsers={allUsers} projects={projects} onSave={handleSave} onCancel={closeModal} initialData={prefilledData} /></Modal>}
            {editingTutorial && <Modal title="Editar Tutoría" onClose={closeModal}><TutorialForm tutors={tutors} groups={groups} allUsers={allUsers} projects={projects} onSave={handleSave} onCancel={closeModal} tutorialToEdit={editingTutorial} /></Modal>}
            {tutorialToDelete && (
                <Modal title="Confirmar Eliminación" onClose={closeModal}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar la tutoría del día <span className="font-bold">{new Date(tutorialToDelete.date + 'T00:00:00').toLocaleDateString()}</span>?</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={closeModal} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">Sí, Eliminar</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Calendar;
