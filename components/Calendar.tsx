import React, { useState, useMemo, useEffect } from 'react';
import { User, Tutorial, Role, Group, Project, Course, Task } from '../types';
import Modal from './Modal';
import { ChevronDownIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { GroupCard, GroupSummaryCard } from './GroupCard';

interface CalendarProps {
    user: User;
    tutorials: Tutorial[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    courses: Course[];
    onCreateTutorial: (data: Omit<Tutorial, 'id'>) => Promise<any>;
    onUpdateTutorial: (id: string, data: Partial<Omit<Tutorial, 'id'>>) => Promise<any>;
    onDeleteTutorial: (id: string) => Promise<void>;
    courseDates: { startDate: string; endDate: string; };
    tasks: Task[];
    initialGroupId?: string | null;
    onGroupSelected?: (groupId: string | null) => void;
}

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TutorialForm: React.FC<{
    user: User;
    tutors: User[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    courses: Course[];
    onSave: (data: { id?: string, payload: Omit<Tutorial, 'id'>}) => Promise<any>;
    onCancel: () => void;
    tutorialToEdit?: Tutorial | null;
    initialData?: Partial<Omit<Tutorial, 'id'>> | null;
}> = ({ user, tutors, groups, allUsers, projects, courses, onSave, onCancel, tutorialToEdit, initialData }) => {
    const [date, setDate] = useState(tutorialToEdit?.date || initialData?.date || formatDate(new Date()));
    const [time, setTime] = useState(tutorialToEdit?.time || initialData?.time || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Pre-fill tutor and group for students
    const defaultTutorId = useMemo(() => {
        if (tutorialToEdit?.tutorId) return tutorialToEdit.tutorId;
        if (initialData?.tutorId) return initialData.tutorId;
        if (user.role === Role.Tutor) return user.id;
        if (user.role === Role.Student && user.groupIds.length > 0) {
            const firstGroup = groups.find(g => g.id === user.groupIds[0]);
            return firstGroup?.tutorId || '';
        }
        return '';
    }, [user, groups, tutorialToEdit, initialData]);

    const defaultGroupId = useMemo(() => {
        if (tutorialToEdit?.groupId) return tutorialToEdit.groupId;
        if (initialData?.groupId) return initialData.groupId;
        if (user.role === Role.Tutor && groups.filter(g => g.tutorId === user.id).length === 1) {
            return groups.find(g => g.tutorId === user.id)?.id || '';
        }
        if (user.role === Role.Student && user.groupIds.length > 0) {
            return user.groupIds[0];
        }
        return '';
    }, [user, groups, tutorialToEdit, initialData]);

    const [tutorId, setTutorId] = useState(defaultTutorId);
    const [groupId, setGroupId] = useState(defaultGroupId);
    const [summary, setSummary] = useState(tutorialToEdit?.summary || '');
    const [location, setLocation] = useState(tutorialToEdit?.location || initialData?.location || '');
    const [status, setStatus] = useState<'scheduled' | 'held'>(tutorialToEdit?.status || 'scheduled');
    const [attendeeIds, setAttendeeIds] = useState<string[]>(tutorialToEdit?.attendeeIds || []);
    const [nextDate, setNextDate] = useState('');
    const [nextLocation, setNextLocation] = useState(tutorialToEdit?.location || initialData?.location || '');
    const [nextTime, setNextTime] = useState(tutorialToEdit?.time || initialData?.time || '');
    const todayStr = useMemo(() => formatDate(new Date()), []);

    useEffect(() => {
        if (!tutorialToEdit && tutorId) {
             setGroupId('');
        }
    }, [tutorId, tutorialToEdit]);

    const groupMembers = useMemo(() => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.members : [];
    }, [groupId, groups]);

    const availableGroupsByCourse = useMemo(() => {
        if (!tutorId) {
            return {};
        }
        
        let filteredGroups = groups.filter(group => group.tutorId === tutorId);
        
        // If user is a student, further filter to only show groups they belong to
        if (user.role === Role.Student) {
            filteredGroups = filteredGroups.filter(group => user.groupIds.includes(group.id));
        }

        const result: Record<string, Group[]> = {};
        filteredGroups.forEach(group => {
            let courseName = 'Grupos sin curso asignado';
            const course = courses.find(c => c.id === group.courseId);
            if (course) {
                courseName = course.name;
            }
            if (!result[courseName]) result[courseName] = [];
            result[courseName].push(group);
        });
        return result;
    }, [tutorId, groups, courses, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const err = await onSave({ 
                id: tutorialToEdit?.id, 
                payload: { 
                    date, 
                    time, 
                    tutorId, 
                    groupId, 
                    summary, 
                    location, 
                    status,
                    attendeeIds 
                } 
            });

            if (err) {
                setError(err.message || "Error al guardar la tutoría. Por favor, revisa los permisos o contacta con soporte.");
                setIsSubmitting(false);
                return;
            }

            if (nextDate) {
                const nextErr = await onSave({
                    payload: {
                        date: nextDate,
                        time: nextTime,
                        location: nextLocation,
                        tutorId,
                        groupId,
                        summary: '',
                        attendeeIds: [],
                        status: 'scheduled'
                    }
                });
                if (nextErr) {
                    console.error("Error creating next tutorial:", nextErr);
                }
            }
        } catch (err: any) {
            setError(err.message || "Error inesperado al guardar la tutoría.");
            setIsSubmitting(false);
        }
    };

    const isRegistration = !!tutorialToEdit || (user.role !== Role.Student && status === 'held');

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!tutorialToEdit && user.role !== Role.Student && (
                <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setStatus('scheduled')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${status === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Agendar futura
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus('held')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${status === 'held' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Registrar celebrada
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de la tutoría</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md" 
                        required 
                        disabled={isRegistration && status === 'held'}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Hora de la tutoría</label>
                    <input 
                        type="time" 
                        value={time} 
                        onChange={e => setTime(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md" 
                        required 
                        disabled={isRegistration && status === 'held'}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Lugar de reunión</label>
                    <input 
                        type="text" 
                        value={location} 
                        onChange={e => setLocation(e.target.value)} 
                        placeholder="Ej: Sala de reuniones, Aula 102, Online..." 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md" 
                        disabled={isRegistration && status === 'held'}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tutor</label>
                    <select 
                        value={tutorId} 
                        onChange={e => setTutorId(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md" 
                        required
                        disabled={isRegistration}
                    >
                        <option value="">Seleccionar tutor</option>
                        {tutors.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Grupo</label>
                <select 
                    value={groupId} 
                    onChange={e => setGroupId(e.target.value)} 
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                    required 
                    disabled={!tutorId || isRegistration}
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

            {isRegistration && (
                <>
                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Asistencia de integrantes</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50">
                            {groupMembers.map(member => (
                                <label key={member.id} className="flex items-center space-x-2 text-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={attendeeIds.includes(member.id)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setAttendeeIds([...attendeeIds, member.id]);
                                            } else {
                                                setAttendeeIds(attendeeIds.filter(id => id !== member.id));
                                            }
                                        }}
                                        className="rounded text-green-600 focus:ring-green-500"
                                    />
                                    <span>{member.firstName} {member.lastName}</span>
                                </label>
                            ))}
                            {groupMembers.length === 0 && <p className="text-xs text-gray-500 italic">No hay integrantes en este grupo</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contenido de la reunión</label>
                        <textarea 
                            value={summary} 
                            onChange={e => setSummary(e.target.value)} 
                            rows={5} 
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md" 
                            required={status === 'held'}
                            placeholder="Registra lo tratado en la reunión..."
                        />
                    </div>
                </>
            )}

            {/* Próxima reunión (opcional) */}
            {status === 'held' && (
                <div className="p-4 mt-6 border rounded-lg bg-blue-50 border-blue-100">
                    <h4 className="mb-3 text-sm font-semibold text-blue-800">Agendar próxima reunión (opcional)</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha</label>
                            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora</label>
                            <input type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lugar</label>
                            <input type="text" value={nextLocation} onChange={e => setNextLocation(e.target.value)} placeholder="Ej: Aula 102" className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" disabled={isSubmitting}>Cancelar</button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`px-4 py-2 text-white rounded-md transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} ${status === 'held' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isSubmitting ? 'Guardando...' : (tutorialToEdit ? 'Guardar cambios' : (status === 'held' ? 'Registrar reunión' : (user.role === Role.Student ? 'Solicitar Tutoría' : 'Agendar Tutoría')))}
                </button>
            </div>
        </form>
    );
};

const COURSE_COLOR_LEGEND: Record<string, { bg: string; border: string; }> = {
  '1º TSAF': { bg: 'bg-blue-100', border: 'border-blue-400' },
  '2º TSAF': { bg: 'bg-green-100', border: 'border-green-400' },
  '1º TSEAS': { bg: 'bg-yellow-100', border: 'border-yellow-400' },
  '2º TSEAS': { bg: 'bg-orange-100', border: 'border-orange-400' },
};

const getCourseColor = (courseName: string) => {
    const name = courseName.toUpperCase();
    if (name.includes('1') && name.includes('TSAF')) return COURSE_COLOR_LEGEND['1º TSAF'];
    if (name.includes('2') && name.includes('TSAF')) return COURSE_COLOR_LEGEND['2º TSAF'];
    if (name.includes('1') && name.includes('TSEAS')) return COURSE_COLOR_LEGEND['1º TSEAS'];
    if (name.includes('2') && name.includes('TSEAS')) return COURSE_COLOR_LEGEND['2º TSEAS'];
    return { bg: 'bg-gray-100', border: 'border-gray-400' };
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
    courses: Course[];
    onEdit: (tutorial: Tutorial) => void;
    onDelete: (tutorial: Tutorial) => void;
    courseDates: { startDate: string; endDate: string; };
    onScheduleNew: (data: Partial<Omit<Tutorial, 'id'>>) => void;
}> = ({ user, visibleTutorials, groups, allUsers, projects, courses, onEdit, onDelete, courseDates, onScheduleNew }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dailyTutorialsPopover, setDailyTutorialsPopover] = useState<{ day: Date; events: CalendarEvent[] } | null>(null);
    const [tooltip, setTooltip] = useState<{ data: TooltipData; x: number; y: number } | null>(null);

    const eventsByDate = useMemo(() => {
        const groupMap = new Map<string, Group>(groups.map((g) => [g.id, g]));
        const projectMap = new Map<string, Project>(projects.map((p) => [p.groupId, p]));
        const groupToCourseMap: Record<string, string> = {};

        groups.forEach(group => {
            const course = courses.find(c => c.id === group.courseId);
            if (course) {
                groupToCourseMap[group.id] = course.name;
            }
        });
        
        const eventMap: Record<string, CalendarEvent[]> = {};

        visibleTutorials.forEach(tut => {
            const group = groupMap.get(tut.groupId);
            const project = projectMap.get(tut.groupId);
            const enrichedBase = {
                groupName: group?.name || 'Grupo desconocido',
                projectName: project?.name || 'Sin proyecto asignado',
                courseGroup: groupToCourseMap[tut.groupId] || 'default',
            };

            if (tut.status === 'held') {
                const registeredEvent: RegisteredEvent = { ...tut, ...enrichedBase, type: 'registered' };
                if (!eventMap[tut.date]) eventMap[tut.date] = [];
                eventMap[tut.date].push(registeredEvent);
            } else {
                // status is 'scheduled' or undefined (default to scheduled)
                const scheduledEvent: ScheduledEvent = {
                    type: 'scheduled',
                    id: tut.id,
                    date: tut.date,
                    ...enrichedBase,
                    originalTutorial: tut,
                };
                if (!eventMap[tut.date]) eventMap[tut.date] = [];
                eventMap[tut.date].push(scheduledEvent);
            }
        });
        return eventMap;
    }, [visibleTutorials, groups, courses, projects]);

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
                onEdit(event.originalTutorial);
            }
        } else if (eventsOnDay.length === 0) {
            onScheduleNew({ date: formatDate(day) });
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
                {Object.entries(COURSE_COLOR_LEGEND)
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
                                    const colors = getCourseColor(event.courseGroup);
                                    const isRegistered = event.type === 'registered';
                                    return (
                                        <div 
                                            key={event.id} 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (isRegistered) {
                                                    onEdit(event);
                                                } else {
                                                    onEdit(event.originalTutorial);
                                                }
                                            }}
                                            onMouseMove={(e) => {
                                                const tut = isRegistered ? event : event.originalTutorial;
                                                const data: TooltipData = {
                                                    groupName: event.groupName,
                                                    projectName: event.projectName,
                                                    summary: isRegistered ? tut.summary : "Próxima reunión agendada.",
                                                    location: tut.location || 'Lugar por definir',
                                                    time: tut.time || 'Hora por definir'
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
                                            onEdit(event.originalTutorial);
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
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs text-gray-500">🕒 {isRegistered ? event.time : event.originalTutorial.time || 'Por definir'}</span>
                                            <span className="text-xs text-gray-500">📍 {isRegistered ? event.location : event.originalTutorial.location || 'Por definir'}</span>
                                        </div>
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
    courses: Course[];
    onClose: () => void;
    onEdit: (tutorial: Tutorial) => void;
}> = ({ user, tutors, tutorials, groups, allUsers, projects, courses, onClose, onEdit }) => {
    const [selectedTutorId, setSelectedTutorId] = useState(user.role === Role.Tutor ? user.id : '');

    const pendingTutorialsByTutor = useMemo(() => {
        if (!selectedTutorId) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return tutorials
            .filter(tut => tut.tutorId === selectedTutorId && tut.status === 'scheduled')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(tut => {
                const group = groups.find(g => g.id === tut.groupId);
                const project = projects.find(p => p.groupId === tut.groupId);
                const isOverdue = new Date(tut.date + 'T00:00:00') < today;
                let courseGroup = 'N/A';
                if (group) {
                    const course = courses.find(c => c.id === group.courseId);
                    if (course) {
                        courseGroup = course.name;
                    }
                }
                return {
                    id: tut.id,
                    date: tut.date,
                    reunionStatus: isOverdue ? 'Reunión no celebrada' : 'Reunión por celebrar',
                    location: tut.location || 'No especificado',
                    time: tut.time || 'No especificada',
                    courseGroup,
                    groupName: group?.name || 'Grupo Desconocido',
                    projectName: project?.name || 'Sin Proyecto',
                    isOverdue,
                    originalTutorial: tut
                };
            });
    }, [selectedTutorId, tutorials, groups, projects, courses]);
    
    const pendingTutorialsForStudent = useMemo(() => {
        if (user.role !== Role.Student) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return tutorials
            .filter(tut => user.groupIds.includes(tut.groupId) && tut.status === 'scheduled')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(tut => {
                const group = groups.find(g => g.id === tut.groupId);
                const project = projects.find(p => p.groupId === tut.groupId);
                const isOverdue = new Date(tut.date + 'T00:00:00') < today;
                let courseGroup = 'N/A';
                if (group) {
                    const course = courses.find(c => c.id === group.courseId);
                    if (course) {
                        courseGroup = course.name;
                    }
                }
                return {
                    id: tut.id,
                    date: tut.date,
                    reunionStatus: isOverdue ? 'Reunión no celebrada' : 'Reunión por celebrar',
                    location: tut.location || 'No especificado',
                    time: tut.time || 'No especificada',
                    courseGroup,
                    groupName: group?.name || 'Grupo Desconocido',
                    projectName: project?.name || 'Sin Proyecto',
                    isOverdue,
                    originalTutorial: tut
                };
            });
    }, [user, tutorials, groups, projects, courses]);

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
                            <option key={tutor.id} value={tutor.id}>{tutor.firstName} {tutor.lastName}</option>
                        ))}
                    </select>
                </div>
            )}
             {user.role === Role.Tutor && (
                 <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-800">Mostrando reuniones pendientes para: <span className="font-semibold">{user.firstName} {user.lastName}</span></p>
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
                                    <tr 
                                        key={tut.id} 
                                        className={`hover:bg-gray-50 cursor-pointer ${tut.isOverdue ? 'bg-red-50 text-red-800' : 'text-green-800'}`}
                                        onClick={() => onEdit(tut.originalTutorial)}
                                    >
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

const Calendar: React.FC<CalendarProps> = ({ user, tutorials, groups, allUsers, projects, courses, onCreateTutorial, onUpdateTutorial, onDeleteTutorial, courseDates, tasks, initialGroupId, onGroupSelected }) => {
    const [view, setView] = useState('list');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [tutorialToDelete, setTutorialToDelete] = useState<Tutorial | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [prefilledData, setPrefilledData] = useState<Partial<Omit<Tutorial, 'id'>> | null>(null);

    useEffect(() => {
        if (initialGroupId) {
            const group = groups.find(g => g.id === initialGroupId);
            if (group) {
                const course = courses.find(c => c.id === group.courseId);
                const newExpandedKeys: Record<string, boolean> = {
                    [`group_${initialGroupId}`]: true
                };
                if (course) {
                    newExpandedKeys[`course_${course.name}`] = true;
                } else {
                    newExpandedKeys['course_Curso no asignado'] = true;
                }
                setExpandedKeys(prev => ({ ...prev, ...newExpandedKeys }));
                
                // Clear the initial group ID after processing to avoid re-expanding on every render
                if (onGroupSelected) {
                    onGroupSelected(null);
                }
            }
        }
    }, [initialGroupId, groups, courses, onGroupSelected]);
    
    const tutors = useMemo(() => allUsers.filter(u => u.role === Role.Tutor), [allUsers]);

    const visibleTutorials = useMemo(() => {
        if (user.role === Role.Admin) return tutorials;
        
        const userGroupIds = user.role === Role.Tutor
            ? groups.filter(g => g.tutorId === user.id).map(g => g.id)
            : user.groupIds;
        
        return tutorials.filter(t => 
            userGroupIds.includes(t.groupId) || 
            (user.role === Role.Tutor && t.tutorId === user.id)
        );
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

    const handleSave = async ({ id, payload }: { id?: string; payload: Omit<Tutorial, 'id'>}) => {
        let err;
        if (id) {
            err = await onUpdateTutorial(id, payload);
        } else {
            err = await onCreateTutorial(payload);
        }
        
        if (!err) {
            closeModal();
        }
        return err;
    };

    const handleConfirmDelete = async () => {
        if (tutorialToDelete) {
            await onDeleteTutorial(tutorialToDelete.id);
        }
        closeModal();
    };

    return (
        <div>
            <div className="mb-6">
                <div className="flex gap-2">
                     <button onClick={() => setIsPendingModalOpen(true)} className="flex-1 px-2 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors truncate">
                        Pendientes
                    </button>
                    <button onClick={() => setView(v => v === 'list' ? 'calendar' : 'list')} className="flex-1 px-2 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors truncate">
                        {view === 'list' ? 'Calendario' : 'Lista'}
                    </button>
                    <button onClick={handleCreate} className="flex-1 px-2 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors truncate">
                        Solicitar Tutoría
                    </button>
                </div>
            </div>
            
            {view === 'list' ? (
                <div className="space-y-2">
                    {Object.keys(tutorialsByCourseAndGroup).sort().map(courseName => (
                        <div key={courseName} className="bg-white rounded-lg shadow-md">
                            <button onClick={() => toggleExpand(`course_${courseName}`)} className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
                                <div className="flex items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">{tutorialsByCourseAndGroup[courseName].length} {tutorialsByCourseAndGroup[courseName].length === 1 ? 'grupo' : 'grupos'}</span>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${expandedKeys[`course_${courseName}`] ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedKeys[`course_${courseName}`] && (
                                <div className="p-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 gap-6">
                                        {tutorialsByCourseAndGroup[courseName].map(({ group, tutorials: groupTutorials }) => {
                                            const isGroupExpanded = expandedKeys[`group_${group.id}`];
                                            return (
                                                <div key={group.id} className="mb-4">
                                                    <GroupSummaryCard 
                                                        group={group}
                                                        projects={projects}
                                                        allUsers={allUsers}
                                                        tasks={tasks}
                                                        onCardClick={() => toggleExpand(`group_${group.id}`)}
                                                    />
                                                    {isGroupExpanded && (
                                                        <div className="pl-6 pr-2 pb-2 mt-1 space-y-2 border-l-2 border-green-200 ml-4">
                                                            {groupTutorials.map(tutorial => (
                                                                <button 
                                                                    key={tutorial.id} 
                                                                    onClick={() => setEditingTutorial(tutorial)}
                                                                    className="flex items-center justify-between w-full p-3 text-left text-gray-700 transition-colors bg-white border rounded-md shadow-sm gap-4 hover:bg-green-50 hover:border-green-300"
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-semibold text-gray-700">{new Date(tutorial.date + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                                        <p className="mt-1 text-sm text-gray-600 truncate">{tutorial.summary}</p>
                                                                    </div>
                                                                    {(user.role === Role.Admin || user.id === tutorial.tutorId) && (
                                                                        <div className="flex flex-shrink-0 ml-4 space-x-1">
                                                                            <div onClick={(e) => { e.stopPropagation(); setEditingTutorial(tutorial); }} className="p-2 text-gray-400 rounded-full hover:bg-blue-100 hover:text-blue-600" aria-label="Editar tutoría"><EditIcon className="w-4 h-4" /></div>
                                                                            <div onClick={(e) => { e.stopPropagation(); setTutorialToDelete(tutorial); }} className="p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600" aria-label="Eliminar tutoría"><TrashIcon className="w-4 h-4" /></div>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
                    courses={courses}
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
                        courses={courses}
                        onClose={closeModal}
                        onEdit={(tut) => {
                            setEditingTutorial(tut);
                            setIsPendingModalOpen(false);
                        }}
                    />
                </Modal>
            )}
            {isCreateModalOpen && <Modal title="Solicitar Tutoría" onClose={closeModal}><TutorialForm user={user} tutors={tutors} groups={groups} allUsers={allUsers} projects={projects} courses={courses} onSave={handleSave} onCancel={closeModal} initialData={prefilledData} /></Modal>}
            {editingTutorial && <Modal title="Editar Tutoría" onClose={closeModal}><TutorialForm user={user} tutors={tutors} groups={groups} allUsers={allUsers} projects={projects} courses={courses} onSave={handleSave} onCancel={closeModal} tutorialToEdit={editingTutorial} /></Modal>}
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
