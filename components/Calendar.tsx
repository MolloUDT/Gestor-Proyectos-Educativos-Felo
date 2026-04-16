import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Tutorial, Role, Group, Project, Course, Task } from '../types';
import Modal from './Modal';
import { ChevronDownIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import ProjectCard from './ProjectCard';
import { useLanguage } from '../lib/LanguageContext';

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

import { TutorialForm } from './TutorialForm';

const COURSE_COLOR_LEGEND: Record<string, { bg: string; border: string; text: string; }> = {
  '1º TSAF': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  '2º TSAF': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  '1º TSEAS': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
  '2º TSEAS': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
};

const getCourseColor = (courseName: string) => {
    const name = courseName.toUpperCase();
    if (name.includes('1') && name.includes('TSAF')) return COURSE_COLOR_LEGEND['1º TSAF'];
    if (name.includes('2') && name.includes('TSAF')) return COURSE_COLOR_LEGEND['2º TSAF'];
    if (name.includes('1') && name.includes('TSEAS')) return COURSE_COLOR_LEGEND['1º TSEAS'];
    if (name.includes('2') && name.includes('TSEAS')) return COURSE_COLOR_LEGEND['2º TSEAS'];
    return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' };
};

type EnrichedTutorial = Tutorial & {
    groupName: string;
    projectName: string;
    courseGroup: string;
};

type RegisteredEvent = EnrichedTutorial & { eventType: 'registered' };
type ScheduledEvent = {
    eventType: 'scheduled';
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
    courseName: string;
    summary: string;
    tutorName?: string;
    location?: string;
    time?: string;
    meetingType?: 'tutorial' | 'group_meeting';
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
    const { t, language } = useLanguage();
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
                groupName: group?.name || t('unknownGroup'),
                projectName: project?.name || t('noProjectAssigned'),
                courseGroup: groupToCourseMap[tut.groupId] || 'default',
            };

            if (tut.status === 'held') {
                const registeredEvent: RegisteredEvent = { ...tut, ...enrichedBase, eventType: 'registered' };
                if (!eventMap[tut.date]) eventMap[tut.date] = [];
                eventMap[tut.date].push(registeredEvent);
            } else {
                // status is 'scheduled' or undefined (default to scheduled)
                const scheduledEvent: ScheduledEvent = {
                    eventType: 'scheduled',
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
            if (event.eventType === 'registered') {
                onEdit(event as RegisteredEvent);
            } else {
                onEdit((event as ScheduledEvent).originalTutorial);
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
                    style={{ top: tooltip.y - 15, left: tooltip.x + 15, transform: 'translateY(-100%)' }}
                >
                    <p className="font-bold text-blue-300 mb-1">
                        {tooltip.data.meetingType === 'group_meeting' ? t('meetingTitle') : t('tutorialTitle')}
                    </p>
                    <p className="text-sm mb-1"><span className="font-semibold text-gray-400">{t('tutor')}:</span> {tooltip.data.tutorName}</p>
                    <p className="text-sm mb-1"><span className="font-semibold text-gray-400">{t('course')}:</span> {tooltip.data.courseName === 'default' ? t('noCourse') : tooltip.data.courseName}</p>
                    <p className="text-sm mb-1"><span className="font-semibold text-gray-400">{t('group')}:</span> {tooltip.data.groupName}</p>
                    <p className="text-sm mb-2"><span className="font-semibold text-gray-400">{t('project')}:</span> {tooltip.data.projectName}</p>

                    {(tooltip.data.location || tooltip.data.time) && <hr className="my-2 border-gray-600" />}
                    
                    {tooltip.data.location && (
                        <p className="text-xs"><span className="font-semibold">{t('location')}:</span> {tooltip.data.location}</p>
                    )}
                    <p className="text-sm mb-1"><span className="font-semibold text-gray-400">{t('time')}:</span> {tooltip.data.time}</p>

                    {tooltip.data.summary && (
                        <>
                            <hr className="my-2 border-gray-600" />
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
                <h3 className="text-xl font-semibold text-gray-800 capitalize">{currentDate.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}</h3>
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
                        <span key={courseName} className={`text-xs font-medium ${colors.text}`}>{courseName}</span>
                    ))}
                <div className="flex items-center gap-4 ml-4 pl-4 border-l">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border rounded-full bg-gray-200 border-gray-400"></div>
                        <span className="text-xs text-gray-600">{t('scheduledTutorial_label')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border rounded-full bg-gray-200 border-gray-400 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </div>
                        <span className="text-xs text-gray-600">{t('heldTutorial_label')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border rounded-sm bg-gray-200 border-gray-400"></div>
                        <span className="text-xs text-gray-600">{t('scheduledGroupMeeting')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border rounded-sm bg-gray-200 border-gray-400 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </div>
                        <span className="text-xs text-gray-600">{t('heldGroupMeeting')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500">
                {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map(d => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 border-t border-l">
                {days.map(d => {
                    const dateStr = formatDate(d);
                    const eventsOnDay = (eventsByDate[dateStr] || []).sort((a, b) => {
                        if (a.eventType === 'registered' && b.eventType === 'scheduled') return -1;
                        if (a.eventType === 'scheduled' && b.eventType === 'registered') return 1;
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
                                    const isRegistered = event.eventType === 'registered';
                                    const tut = isRegistered ? event : event.originalTutorial;
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
                                                const tutor = allUsers.find(u => u.id === tut.tutorId);
                                                const data: TooltipData = {
                                                    groupName: event.groupName,
                                                    projectName: event.projectName,
                                                    courseName: event.courseGroup,
                                                    summary: isRegistered ? tut.summary : t('nextMeetingScheduled'),
                                                    tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : t('noTutorAssigned'),
                                                    location: tut.location || t('locationToBeDefined'),
                                                    time: tut.time || t('timeToBeDefined'),
                                                    meetingType: tut.type
                                                };
                                                setTooltip({ data, x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                            className={`w-3 h-3 border cursor-pointer ${colors.bg} ${colors.border} ${tut.type === 'group_meeting' ? 'rounded-sm' : 'rounded-full'} ${isRegistered ? 'flex items-center justify-center' : ''}`}
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
                    title={t('meetingsForDay', { date: dailyTutorialsPopover.day.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) })}
                    onClose={() => setDailyTutorialsPopover(null)}
                >
                    <div className="space-y-2">
                        {dailyTutorialsPopover.events.map(event => {
                            const isRegistered = event.eventType === 'registered';
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
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-green-800">
                                                {isRegistered ? '' : t('nextMeetingAgenda')}
                                                {event.groupName}
                                            </p>
                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                                                {t('tutor')}: {(() => {
                                                    const tutId = isRegistered ? (event as RegisteredEvent).tutorId : (event as ScheduledEvent).originalTutorial.tutorId;
                                                    const tutor = allUsers.find(u => u.id === tutId);
                                                    return tutor ? `${tutor.firstName} ${tutor.lastName}` : t('noTutorAssigned');
                                                })()}
                                            </span>
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                                {(isRegistered ? (event as RegisteredEvent).type : (event as ScheduledEvent).originalTutorial.type) === 'group_meeting' ? t('groupLabel') : t('tutorialLabel')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm italic text-gray-600 truncate">{event.projectName}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs text-gray-500">🕒 {isRegistered ? event.time : event.originalTutorial.time || t('timeToBeDefined')}</span>
                                            <span className="text-xs text-gray-500">📍 {isRegistered ? event.location : event.originalTutorial.location || t('locationToBeDefined')}</span>
                                        </div>
                                        {isRegistered && <p className="mt-1 text-xs text-gray-500 truncate">{event.summary}</p>}
                                    </div>
                                    <div className="flex-shrink-0 ml-4">
                                        <button className="p-2 text-gray-400 rounded-full hover:bg-blue-100 hover:text-blue-600">
                                            <EditIcon className="w-4 h-4 text-blue-500" />
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
    const { t, language } = useLanguage();
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
                    reunionStatus: isOverdue ? t('reunionNotHeld') : t('reunionToHold'),
                    location: tut.location || t('notSpecified'),
                    time: tut.time || t('notSpecified'),
                    courseGroup,
                    groupName: group?.name || t('unknownGroup'),
                    projectName: project?.name || t('noProject'),
                    isOverdue,
                    originalTutorial: tut
                };
            });
    }, [selectedTutorId, tutorials, groups, projects, courses, t]);
    
    const pendingTutorialsForStudent = useMemo(() => {
        if (user.role !== Role.Student) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return tutorials
            .filter(tut => (user.groupIds || []).includes(tut.groupId) && tut.status === 'scheduled')
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
                    reunionStatus: isOverdue ? t('reunionNotHeld') : t('reunionToHold'),
                    location: tut.location || t('notSpecified'),
                    time: tut.time || t('notSpecified'),
                    courseGroup,
                    groupName: group?.name || t('unknownGroup'),
                    projectName: project?.name || t('noProject'),
                    isOverdue,
                    originalTutorial: tut
                };
            });
    }, [user, tutorials, groups, projects, courses, t]);

    const tutorialsToShow = user.role === Role.Student ? pendingTutorialsForStudent : pendingTutorialsByTutor;

    let noDataContent: React.ReactNode;
    if (user.role === Role.Admin && !selectedTutorId) {
        noDataContent = <p className="py-6 text-center text-gray-500">{t('selectTutorToSeeMeetings')}</p>;
    } else if (tutorialsToShow.length === 0) {
        const message = user.role === Role.Admin
            ? t('noMeetingsForTutor')
            : t('noPendingMeetingsStudent');
        noDataContent = <p className="py-6 text-center text-gray-500">{message}</p>;
    }

    return (
        <div className="space-y-4">
            {user.role === Role.Admin && (
                <div>
                    <label htmlFor="tutor-select" className="block text-sm font-medium text-gray-700">{t('selectTutorLabel')}</label>
                    <select
                        id="tutor-select"
                        value={selectedTutorId}
                        onChange={(e) => setSelectedTutorId(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    >
                        <option value="">{t('chooseTutorPlaceholder')}</option>
                        {tutors.map(tutor => (
                            <option key={tutor.id} value={tutor.id}>{tutor.firstName} {tutor.lastName}</option>
                        ))}
                    </select>
                </div>
            )}
             {user.role === Role.Tutor && (
                 <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-800">{t('showingPendingMeetingsForTutor')} <span className="font-semibold">{user.firstName} {user.lastName}</span></p>
                </div>
            )}
            {user.role === Role.Student && (
                 <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-800">{t('showingUpcomingMeetingsForGroups')}</p>
                </div>
            )}

            <div className="mt-4 border-t">
                 {tutorialsToShow.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full mt-2 text-left table-auto">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('dateLabel')}</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('meetingLabel')}</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('locationLabel')}</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('timeLabel')}</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('courseLabel')}</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('groupLabelTable')}</th>
                                    <th className="px-3 py-2 text-sm font-semibold text-gray-600">{t('projectLabelTable')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tutorialsToShow.map(tut => (
                                    <tr 
                                        key={tut.id} 
                                        className={`hover:bg-gray-50 cursor-pointer ${tut.isOverdue ? 'bg-red-50 text-red-800' : 'text-green-800'}`}
                                        onClick={() => onEdit(tut.originalTutorial)}
                                    >
                                        <td className="px-3 py-2 text-sm">{new Date(tut.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</td>
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
    const { t, language } = useLanguage();
    const [view, setView] = useState('list');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [tutorialToDelete, setTutorialToDelete] = useState<Tutorial | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [prefilledData, setPrefilledData] = useState<Partial<Omit<Tutorial, 'id'>> | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

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
                    newExpandedKeys[`course_${t('courseNotAssigned')}`] = true;
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
        let filtered = tutorials;
        if (user.role !== Role.Admin) {
            const userGroupIds = user.role === Role.Tutor
                ? groups.filter(g => g.tutorId === user.id).map(g => g.id)
                : (user.groupIds || []);
            
            filtered = tutorials.filter(t => 
                userGroupIds.includes(t.groupId) || 
                (user.role === Role.Tutor && t.tutorId === user.id)
            );
        }

        if (selectedCourseId) {
            const groupsInCourse = groups.filter(g => g.courseId === selectedCourseId).map(g => g.id);
            filtered = filtered.filter(t => groupsInCourse.includes(t.groupId));
        }

        if (selectedGroupId) {
            filtered = filtered.filter(t => t.groupId === selectedGroupId);
        }

        return filtered;
    }, [user, tutorials, groups, selectedCourseId, selectedGroupId]);

    const availableGroupsForFilter = useMemo(() => {
        let availableGroups = groups;
        if (user.role !== Role.Admin) {
            const userGroupIds = user.role === Role.Tutor
                ? groups.filter(g => g.tutorId === user.id).map(g => g.id)
                : (user.groupIds || []);
            availableGroups = availableGroups.filter(g => userGroupIds.includes(g.id));
        }
        if (selectedCourseId) {
            availableGroups = availableGroups.filter(g => g.courseId === selectedCourseId);
        }
        return availableGroups;
    }, [groups, user, selectedCourseId]);

    // Reset group filter if selected course changes and group is not in course
    useEffect(() => {
        if (selectedGroupId && selectedCourseId) {
            const group = groups.find(g => g.id === selectedGroupId);
            if (group && group.courseId !== selectedCourseId) {
                setSelectedGroupId('');
            }
        }
    }, [selectedCourseId, selectedGroupId, groups]);


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
            const courseName = groupToCourseMap[groupId] || t('courseNotAssigned');
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
            <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => setIsPendingModalOpen(true)} className="w-40 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap">
                            {t('pendingMeetings')}
                        </button>
                        <button onClick={() => setView(v => v === 'list' ? 'calendar' : 'list')} className="w-40 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap">
                            {view === 'list' ? t('viewCalendar') : t('viewList')}
                        </button>
                    </div>
                    <button onClick={handleCreate} className="px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap">
                        {user.role === Role.Student ? t('requestGroupMeeting') : t('scheduleTutorial')}
                    </button>
                </div>

                {user.role !== Role.Student && (
                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex-1">
                            <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-1">{t('filterByCourse')}</label>
                            <select
                                id="course-filter"
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">{t('allCourses')}</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="group-filter" className="block text-sm font-medium text-gray-700 mb-1">{t('filterByGroup')}</label>
                            <select
                                id="group-filter"
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                disabled={availableGroupsForFilter.length === 0}
                            >
                                <option value="">{t('allGroups')}</option>
                                {availableGroupsForFilter.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            {view === 'list' ? (
                <div className="space-y-2">
                    {user.role === Role.Student ? (
                        // Student View: Flat list of groups
                        Object.values(tutorialsByCourseAndGroup).flatMap(courseGroups => courseGroups).map(({ group, tutorials: groupTutorials }) => {
                            const isGroupExpanded = expandedKeys[`group_${group.id}`];
                            return (
                                <div key={group.id} className="mb-4">
                                    <ProjectCard 
                                        group={group}
                                        project={projects.find(p => p.groupId === group.id)}
                                        tutor={allUsers.find(u => u.id === group.tutorId)}
                                        tasks={tasks}
                                        onClick={() => toggleExpand(`group_${group.id}`)}
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
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tutorial.type === 'group_meeting' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                {tutorial.type === 'group_meeting' ? t('meetingTitle') : t('tutorialTitle')}
                                                            </span>
                                                            {tutorial.status === 'held' ? (
                                                                <span className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">{t('held')}</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">{t('pending')}</span>
                                                            )}
                                                            <p className="font-semibold text-gray-700">{new Date(tutorial.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                        </div>
                                                        <p className="text-sm text-gray-600 truncate">{tutorial.summary}</p>
                                                    </div>
                                                    {(user.role === Role.Admin || user.id === tutorial.tutorId || (user.role === Role.Student && tutorial.type === 'group_meeting' && (user.groupIds || []).includes(tutorial.groupId))) && (
                                                        <div className="flex flex-shrink-0 ml-4 space-x-1">
                                                            <div onClick={(e) => { e.stopPropagation(); setEditingTutorial(tutorial); }} className="p-2 text-gray-400 rounded-full hover:bg-blue-100 hover:text-blue-600" aria-label="Editar tutoría"><EditIcon className="w-4 h-4 text-blue-500" /></div>
                                                            <div onClick={(e) => { e.stopPropagation(); setTutorialToDelete(tutorial); }} className="p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600" aria-label="Eliminar tutoría"><TrashIcon className="w-4 h-4 text-red-500" /></div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        // Admin/Tutor View: Grouped by course
                        Object.keys(tutorialsByCourseAndGroup).sort().map(courseName => (
                            <div key={courseName} className="bg-white rounded-lg shadow-md">
                                <button onClick={() => toggleExpand(`course_${courseName}`)} className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
                                    <div className="flex items-center">
                                        <h3 className="text-lg font-semibold text-gray-800">{courseName}</h3>
                                        <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">{tutorialsByCourseAndGroup[courseName].length} {tutorialsByCourseAndGroup[courseName].length === 1 ? t('groupSingular') : t('groupPlural')}</span>
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
                                                        <ProjectCard 
                                                            group={group}
                                                            project={projects.find(p => p.groupId === group.id)}
                                                            tutor={allUsers.find(u => u.id === group.tutorId)}
                                                            tasks={tasks}
                                                            onClick={() => toggleExpand(`group_${group.id}`)}
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
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tutorial.type === 'group_meeting' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                                    {tutorial.type === 'group_meeting' ? 'Reunión de Grupo' : 'Tutoría'}
                                                                                </span>
                                                                                {tutorial.status === 'held' ? (
                                                                                    <span className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">Realizada</span>
                                                                                ) : (
                                                                                    <span className="px-2 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">Pendiente</span>
                                                                                )}
                                                                                <p className="font-semibold text-gray-700">{new Date(tutorial.date + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                                            </div>
                                                                            <p className="text-sm text-gray-600 truncate">{tutorial.summary}</p>
                                                                        </div>
                                                                        {(user.role === Role.Admin || user.id === tutorial.tutorId || (user.role === Role.Student && tutorial.type === 'group_meeting' && (user.groupIds || []).includes(tutorial.groupId))) && (
                                                                            <div className="flex flex-shrink-0 ml-4 space-x-1">
                                                                                <div onClick={(e) => { e.stopPropagation(); setEditingTutorial(tutorial); }} className="p-2 text-gray-400 rounded-full hover:bg-blue-100 hover:text-blue-600" aria-label="Editar tutoría"><EditIcon className="w-4 h-4 text-blue-500" /></div>
                                                                                <div onClick={(e) => { e.stopPropagation(); setTutorialToDelete(tutorial); }} className="p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600" aria-label="Eliminar tutoría"><TrashIcon className="w-4 h-4 text-red-500" /></div>
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
                        ))
                    )}
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
                <Modal title={t('pendingMeetings')} onClose={closeModal} size="5xl">
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
            {isCreateModalOpen && <Modal title={t('requestTutorial')} onClose={closeModal}><TutorialForm user={user} tutors={tutors} groups={groups} allUsers={allUsers} projects={projects} courses={courses} onSave={handleSave} onCancel={closeModal} initialData={prefilledData} /></Modal>}
            {editingTutorial && <Modal title={editingTutorial.type === 'tutorial' ? (user.role === Role.Student ? t('tutorialDetails') : t('editTutorial')) : t('editGroupMeeting')} onClose={closeModal}><TutorialForm user={user} tutors={tutors} groups={groups} allUsers={allUsers} projects={projects} courses={courses} onSave={handleSave} onCancel={closeModal} tutorialToEdit={editingTutorial} readOnly={user.role === Role.Student && editingTutorial.type === 'tutorial'} /></Modal>}
            {tutorialToDelete && (
                <Modal title={t('confirmDelete')} onClose={closeModal}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">{t('deleteTutorialConfirm')} <span className="font-bold">{new Date(tutorialToDelete.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</span>?</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={closeModal} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">{t('cancel')}</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">{t('confirmDeleteAction') || 'Sí, Eliminar'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Calendar;
