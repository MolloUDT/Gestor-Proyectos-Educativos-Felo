import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Tutorial, Role, Group, Project, Course } from '../types';

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const TutorialForm: React.FC<{
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
    readOnly?: boolean;
}> = ({ user, tutors, groups, allUsers, projects, courses, onSave, onCancel, tutorialToEdit, initialData, readOnly = false }) => {
    const [date, setDate] = useState(tutorialToEdit?.date || initialData?.date || formatDate(new Date()));
    const [time, setTime] = useState(tutorialToEdit?.time || initialData?.time || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Pre-fill tutor and group for students
    const defaultTutorId = useMemo(() => {
        if (tutorialToEdit?.tutorId) return tutorialToEdit.tutorId;
        if (initialData?.tutorId) return initialData.tutorId;
        if (user.role === Role.Tutor) return user.id;
        if (user.role === Role.Student && (user.groupIds || []).length > 0) {
            const firstGroup = groups.find(g => g.id === (user.groupIds || [])[0]);
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
        if (user.role === Role.Student && (user.groupIds || []).length > 0) {
            return (user.groupIds || [])[0];
        }
        return '';
    }, [user, groups, tutorialToEdit, initialData]);

    const filteredTutors = useMemo(() => {
        if (!tutorialToEdit && user.role === Role.Student) {
            const groupIds = user.groupIds || [];
            const studentGroups = groups.filter(g => groupIds.includes(g.id));
            const tutorIds = new Set(studentGroups.map(g => g.tutorId));
            return tutors.filter(t => tutorIds.has(t.id));
        }
        return tutors;
    }, [user, tutors, groups, tutorialToEdit]);

    const [tutorId, setTutorId] = useState(defaultTutorId);
    const [groupId, setGroupId] = useState(defaultGroupId);
    const [summary, setSummary] = useState(tutorialToEdit?.summary || '');
    const [location, setLocation] = useState(tutorialToEdit?.location || initialData?.location || '');
    const [status, setStatus] = useState<'scheduled' | 'held'>(tutorialToEdit?.status || 'scheduled');
    const statusRef = useRef<'scheduled' | 'held'>(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
    const [type, setType] = useState<'tutorial' | 'group_meeting'>(tutorialToEdit?.type || 'tutorial');
    const [attendeeIds, setAttendeeIds] = useState<string[]>(tutorialToEdit?.attendeeIds || []);
    const [nextDate, setNextDate] = useState('');
    const [nextLocation, setNextLocation] = useState(tutorialToEdit?.location || initialData?.location || '');
    const [nextTime, setNextTime] = useState(tutorialToEdit?.time || initialData?.time || '');

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!tutorialToEdit && tutorId) {
             // Only clear if the current groupId doesn't belong to the new tutor
             const currentGroup = groups.find(g => g.id === groupId);
             if (!currentGroup || currentGroup.tutorId !== tutorId) {
                setGroupId('');
             }
        }
    }, [tutorId, tutorialToEdit, groups, groupId]);

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
            filteredGroups = filteredGroups.filter(group => (user.groupIds || []).includes(group.id));
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
        
        const finalStatus = statusRef.current;

        if (finalStatus === 'held' && !summary.trim()) {
            setError("El contenido de la reunión es obligatorio para registrarla como realizada.");
            setStatus('held'); // Ensure UI shows it's required now
            return;
        }

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
                    status: finalStatus,
                    type,
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
                        status: 'scheduled',
                        type
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

    // Determine if fields should be disabled for students (if they only have one option)
    const disableTutorSelect = user.role === Role.Student && filteredTutors.length <= 1 && !tutorialToEdit;
    const disableGroupSelect = user.role === Role.Student && Object.values(availableGroupsByCourse).flat().length <= 1 && !tutorialToEdit;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {user.role === Role.Student && !tutorialToEdit && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="block mb-4 text-sm font-bold text-gray-700 uppercase tracking-wide">Tipo de Reunión</label>
                    <div className="flex flex-col space-y-6">
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="radio" 
                                    value="tutorial" 
                                    checked={type === 'tutorial'} 
                                    onChange={() => setType('tutorial')}
                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                            </div>
                            <span className="ml-3 text-base font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Reunión de Tutoría (con tutor)</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="radio" 
                                    value="group_meeting" 
                                    checked={type === 'group_meeting'} 
                                    onChange={() => setType('group_meeting')}
                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                            </div>
                            <span className="ml-3 text-base font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Reunión de Grupo (solo alumnos)</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {type === 'group_meeting' ? 'Fecha de la reunión' : 'Fecha de la tutoría'}
                    </label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                        required 
                        disabled={readOnly || (isRegistration && status === 'held')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {type === 'group_meeting' ? 'Hora de la reunión' : 'Hora de la tutoría'}
                    </label>
                    <input 
                        type="time" 
                        value={time} 
                        onChange={e => setTime(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                        required 
                        disabled={readOnly || (isRegistration && status === 'held')}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tutor</label>
                    <select 
                        value={tutorId} 
                        onChange={e => setTutorId(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                        required
                        disabled={readOnly || isRegistration || disableTutorSelect}
                    >
                        <option value="">Seleccionar tutor</option>
                        {filteredTutors.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Grupo</label>
                    <select 
                        value={groupId} 
                        onChange={e => setGroupId(e.target.value)} 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                        required 
                        disabled={readOnly || !tutorId || isRegistration || disableGroupSelect}
                    >
                        <option value="">{tutorId ? 'Seleccionar grupo' : 'Seleccione un tutor primero'}</option>
                        {Object.keys(availableGroupsByCourse).sort().map(courseName => (
                            <optgroup label={courseName} key={courseName}>
                                {availableGroupsByCourse[courseName].map(group => {
                                    return (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    );
                                })}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                    <select 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md bg-gray-100" 
                        disabled={true}
                        value={projects.find(p => p.groupId === groupId)?.id || ''}
                    >
                        <option value="">{groupId ? (projects.find(p => p.groupId === groupId)?.name || 'Sin proyecto') : 'Seleccione un grupo primero'}</option>
                        {projects.filter(p => p.groupId === groupId).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Lugar de reunión</label>
                    <input 
                        type="text" 
                        value={location} 
                        onChange={e => setLocation(e.target.value)} 
                        placeholder="Ej: Sala de reuniones, Aula 102, Online..." 
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                        disabled={readOnly || (isRegistration && status === 'held')}
                    />
                </div>
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
                                        disabled={readOnly}
                                        className="rounded text-green-600 focus:ring-green-500 disabled:opacity-50"
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
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100" 
                            required={status === 'held'}
                            placeholder="Registra lo tratado en la reunión..."
                            disabled={readOnly}
                        />
                    </div>
                </>
            )}

            {/* Próxima reunión (opcional) */}
            {status === 'held' && !readOnly && (
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
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" disabled={isSubmitting}>
                    {readOnly ? 'Cerrar' : 'Cancelar'}
                </button>
                {!readOnly && (
                    <>
                        <button 
                            type="submit" 
                            onClick={() => { statusRef.current = status; }}
                            disabled={isSubmitting}
                            className={`px-4 py-2 text-white rounded-md transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} ${status === 'held' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isSubmitting ? 'Guardando...' : (tutorialToEdit ? 'Guardar cambios' : (status === 'held' ? 'Registrar reunión' : (type === 'group_meeting' ? 'Agendar Reunión' : (user.role === Role.Student ? 'Solicitar Tutoría' : 'Agendar Tutoría'))))}
                        </button>
                        {tutorialToEdit && status === 'scheduled' && (
                            <button 
                                type="submit" 
                                onClick={() => { statusRef.current = 'held'; }}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-white rounded-md transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} bg-green-600 hover:bg-green-700`}
                            >
                                {type === 'group_meeting' ? 'Reunión realizada' : 'Tutoría realizada'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </form>
    );
};
