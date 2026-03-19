import React, { useState, useMemo } from 'react';
import { User, Group, Role, Project, Task, Course } from '../types';
import Modal from './Modal';
import { PlusCircleIcon, ChevronDownIcon } from './Icons';
import { sortBySurname } from '../lib/utils';
import { GroupCard } from './GroupCard';

interface GroupsProps {
    user: User;
    groups: Group[];
    projects: Project[];
    allUsers: User[];
    tasks: Task[];
    courses: Course[];
    courseDates: { startDate: string; endDate: string; };
    onCreate: (groupData: any) => void;
    onUpdate: (groupId: string, groupData: any) => void;
    onDelete: (groupId: string) => void;
    onNavigateToKanban: (projectId: string) => void;
}

const GroupForm: React.FC<{
    group: Partial<Group> | null;
    projects: Project[];
    allUsers: User[];
    user: User;
    courses: Course[];
    courseDates: { startDate: string; endDate: string; };
    onSave: (groupData: any) => void;
    onCancel: () => void;
}> = ({ group, projects, allUsers, user, courses, courseDates, onSave, onCancel }) => {
    const isEditing = !!group?.id;
    const projectForGroup = useMemo(() => projects.find(p => p.groupId === group?.id), [projects, group]);
    
    const initialCourseId = useMemo(() => {
        return group?.courseId || '';
    }, [group]);
    
    const [name, setName] = useState(group?.name || '');
    const [projectName, setProjectName] = useState(projectForGroup?.name || '');
    const [projectDescription, setProjectDescription] = useState(projectForGroup?.description || '');
    const [startDate, setStartDate] = useState(projectForGroup?.startDate || '');
    const [endDate, setEndDate] = useState(projectForGroup?.endDate || '');
    const [tutorId, setTutorId] = useState(group?.tutorId || (user.role === Role.Tutor ? user.id : ''));
    const [memberIds, setMemberIds] = useState<string[]>(group?.members?.map(m => m.id) || []);
    const [formError, setFormError] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
    
    const allTutors = useMemo(() => allUsers.filter(u => u.role === Role.Tutor), [allUsers]);
    const allStudents = useMemo(() => allUsers.filter(u => u.role === Role.Student), [allUsers]);
    
    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCourseId = e.target.value;
        setSelectedCourseId(newCourseId);
        // Reset members only when creating a new group and changing course
        if (!isEditing) {
            setMemberIds([]);
        }
    };

    const handleToggleMember = (studentId: string) => {
        if (memberIds.includes(studentId)) {
            setMemberIds(memberIds.filter(id => id !== studentId));
        } else {
            setMemberIds([...memberIds, studentId]);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (memberIds.length === 0) {
            setFormError('Debe seleccionar al menos un alumno para crear el grupo.');
            return;
        }
        setFormError('');
        onSave({ name, tutorId, memberIds, projectName, projectDescription, startDate, endDate, courseId: selectedCourseId });
    };

    const courseStudents = allStudents.filter(s => s.courseId === selectedCourseId).sort(sortBySurname);

    const isCourseSelectDisabled = isEditing && !!initialCourseId;

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Nombre del Grupo</label>
                    <input
                        type="text"
                        id="groupName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
                    <input
                        type="text"
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Breve descripción del proyecto</label>
                    <textarea
                        id="projectDescription"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={3}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                        <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={courseDates.startDate} max={courseDates.endDate} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                        <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || courseDates.startDate} max={courseDates.endDate} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
                    </div>
                     <p className="mt-1 text-xs text-gray-500 sm:col-span-2">
                        Las fechas deben estar dentro del curso escolar: {new Date(courseDates.startDate).toLocaleDateString()} al {new Date(courseDates.endDate).toLocaleDateString()}.
                    </p>
                </div>

                {user.role === Role.Admin ? (
                    <div>
                        <label htmlFor="tutor" className="block text-sm font-medium text-gray-700">Tutor Asignado</label>
                        <select
                            id="tutor"
                            value={tutorId}
                            onChange={(e) => setTutorId(e.target.value)}
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">Selecciona un tutor</option>
                            {allTutors.map(t => <option key={t.id} value={t.id}>{t.lastName}, {t.firstName}</option>)}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="tutorName" className="block text-sm font-medium text-gray-700">Tutor Asignado</label>
                        <input
                            type="text"
                            id="tutorName"
                            value={`${user.firstName} ${user.lastName}`}
                            readOnly
                            className="w-full p-2 mt-1 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                        />
                    </div>
                )}
                 <div>
                    <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">Curso</label>
                    <select
                        id="courseId"
                        value={selectedCourseId}
                        onChange={handleCourseChange}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={isCourseSelectDisabled}
                    >
                        <option value="">Selecciona un curso</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Alumnado integrante</label>
                    <div className="p-2 mt-2 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                        {selectedCourseId ? (
                            courseStudents.length > 0 ? (
                                courseStudents.map(s => (
                                    <label key={s.id} className="flex items-center p-1 hover:bg-gray-50 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={memberIds.includes(s.id)}
                                            onChange={() => handleToggleMember(s.id)}
                                            className="mr-2"
                                        />
                                        {s.lastName}, {s.firstName}
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 p-1">No hay alumnos en este curso.</p>
                            )
                        ) : (
                            <p className="text-sm text-gray-500 p-1">Selecciona un curso primero.</p>
                        )}
                    </div>
                </div>

                {formError && <p className="mt-2 text-sm text-center text-red-600">{formError}</p>}
                
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Guardar</button>
                </div>
            </form>
        </>
    );
};

const Groups: React.FC<GroupsProps> = ({ user, groups, projects, allUsers, tasks, courses, courseDates, onCreate, onUpdate, onDelete, onNavigateToKanban }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [expandedCourseGroups, setExpandedCourseGroups] = useState<Record<string, boolean>>({});

    const visibleGroups = user.role === Role.Admin 
        ? groups
        : groups.filter(g => g.tutorId === user.id);

    const groupsByCourse = useMemo(() => {
        const result: Record<string, Group[]> = {};
        visibleGroups.forEach(group => {
            const course = courses.find(c => c.id === group.courseId);
            const courseName = course ? course.name : 'Grupos sin curso asignado';
            
            if (!result[courseName]) {
                result[courseName] = [];
            }
            result[courseName].push(group);
        });
        return result;
    }, [visibleGroups, courses]);

    const toggleCourseGroup = (courseName: string) => {
        setExpandedCourseGroups(prev => ({ ...prev, [courseName]: !prev[courseName] }));
    };

    const handleCreate = () => {
        setEditingGroup(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (group: Group) => {
        setEditingGroup(group);
        setIsFormModalOpen(true);
    };
    
    const handleDeleteClick = (group: Group) => {
        setGroupToDelete(group);
    };

    const handleConfirmDelete = () => {
        if (groupToDelete) {
            onDelete(groupToDelete.id);
            setGroupToDelete(null);
        }
    };

    const handleSave = (groupData: any) => {
        if (editingGroup) {
            onUpdate(editingGroup.id, groupData);
        } else {
            onCreate(groupData);
        }
        setIsFormModalOpen(false);
        setEditingGroup(null);
    };

    const handleCardClick = (group: Group) => {
        const project = projects.find(p => p.groupId === group.id);
        if (project) {
            onNavigateToKanban(project.id);
        }
    };

    return (
        <div>
            {(user.role === Role.Admin || user.role === Role.Tutor) && (
                <div className="flex items-center justify-between mb-6">
                    <div></div>
                    <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                        <PlusCircleIcon className="w-5 h-5" />
                        Crear Grupo
                    </button>
                </div>
            )}
           
            <div className="space-y-4">
                {Object.keys(groupsByCourse).sort().map(courseName => {
                    const courseGroups = groupsByCourse[courseName];
                    const isExpanded = !!expandedCourseGroups[courseName];
                    return (
                        <div key={courseName} className="bg-white rounded-lg shadow-md">
                            <button onClick={() => toggleCourseGroup(courseName)} className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
                                <div className="flex items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                                        {courseGroups.length} {courseGroups.length === 1 ? 'grupo' : 'grupos'}
                                    </span>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                                        {courseGroups.map(group => (
                                            <GroupCard 
                                                key={group.id} 
                                                group={group}
                                                projects={projects}
                                                allUsers={allUsers}
                                                tasks={tasks}
                                                user={user}
                                                courses={courses}
                                                onEdit={() => handleEdit(group)} 
                                                onDelete={() => handleDeleteClick(group)}
                                                onCardClick={() => handleCardClick(group)} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isFormModalOpen && (
                <Modal title={editingGroup ? "Editar Grupo" : "Crear Nuevo Grupo"} onClose={() => setIsFormModalOpen(false)}>
                    <GroupForm
                        group={editingGroup}
                        projects={projects}
                        allUsers={allUsers}
                        user={user}
                        courses={courses}
                        courseDates={courseDates}
                        onSave={handleSave}
                        onCancel={() => setIsFormModalOpen(false)}
                    />
                </Modal>
            )}

            {groupToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setGroupToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el grupo?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{groupToDelete.name}"</p>
                        <p className="text-sm text-gray-500">
                            Esta acción es irreversible y eliminará todos los proyectos y tareas asociados.
                        </p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setGroupToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar Grupo
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Groups;