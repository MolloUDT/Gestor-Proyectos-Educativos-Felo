import React, { useState, useMemo, useEffect } from 'react';
import { User, Group, Role, Project, Task, KanbanStatus } from '../types';
import Modal from './Modal';
import { EditIcon, TrashIcon, XIcon, PlusCircleIcon, ChevronDownIcon } from './Icons';

interface GroupsProps {
    user: User;
    groups: Group[];
    projects: Project[];
    allUsers: User[];
    tasks: Task[];
    courseDates: { startDate: string; endDate: string; };
    onCreate: (groupData: any) => void;
    onUpdate: (groupId: string, groupData: any) => void;
    onDelete: (groupId: string) => void;
    onNavigateToKanban: (projectId: string) => void;
}

const CountdownDisplay: React.FC<{ endDate: string }> = ({ endDate }) => {
    if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return (
            <div className="text-center">
                <p className="text-sm font-bold text-gray-600">N/A</p>
                <p className="text-xs font-medium text-gray-500">Estado</p>
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
                <p className="text-sm font-bold text-red-600">Finalizado</p>
                <p className="text-xs font-medium text-gray-500">Estado</p>
            </div>
        );
    }
    
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInMs = endUTC - todayUTC;
    const totalDays = Math.floor(diffInMs / oneDay) + 1;

    const daysText = totalDays === 1 ? 'día' : 'días';

    return (
        <div className="text-center">
             <p className="text-sm font-bold text-yellow-600">{`${totalDays} ${daysText}`}</p>
             <p className="text-xs font-medium text-gray-500">Restantes</p>
        </div>
    );
};

const ProgressCircle: React.FC<{ progress: number; size?: number }> = ({ progress, size = 64 }) => {
    const strokeWidth = 8;

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
                <span className="absolute text-base font-bold text-white">{progress}%</span>
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
                <span className="absolute text-base font-bold text-white">{progress}%</span>
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
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size/2}
                    cy={size/2}
                />
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
            <span className="text-base font-bold text-gray-700">{progress}%</span>
        </div>
    );
};


const GroupCard: React.FC<{ 
    group: Group; 
    projects: Project[]; 
    allUsers: User[];
    tasks: Task[];
    user: User;
    onEdit: () => void; 
    onDelete: () => void;
    onCardClick: () => void;
}> = ({ group, projects, allUsers, tasks, user, onEdit, onDelete, onCardClick }) => {
    const tutor = allUsers.find(u => u.id === group.tutorId);
    const project = projects.find(p => p.groupId === group.id);

    const courseGroup = useMemo(() => {
        if (group.members.length > 0) {
            for (const member of group.members) {
                const freshMemberInfo = allUsers.find(u => u.id === member.id);
                if (freshMemberInfo && freshMemberInfo.courseGroup) {
                    return freshMemberInfo.courseGroup;
                }
            }
        }
        return 'Curso no definido';
    }, [group.members, allUsers]);

    const { progress, totalTasks, inProgressTasks, completedTasks } = useMemo(() => {
        if (!project) return { progress: 0, totalTasks: 0, inProgressTasks: 0, completedTasks: 0 };
        const groupTasks = tasks.filter(t => t.projectId === project.id);
        const total = groupTasks.length;
        const completed = groupTasks.filter(t => t.status === KanbanStatus.Done).length;
        const inProgress = groupTasks.filter(t => t.status === KanbanStatus.Doing).length;
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { progress: progressPercentage, totalTasks: total, inProgressTasks: inProgress, completedTasks: completed };
    }, [project, tasks]);

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const canManage = user.role === Role.Admin || user.id === group.tutorId;

    return (
        <div onClick={onCardClick} className="flex flex-col p-6 bg-white rounded-lg shadow-md transition-shadow duration-200 hover:shadow-lg cursor-pointer min-h-[480px]">
            {canManage && (
                <div className="flex justify-end space-x-2">
                    <button onClick={handleEditClick} className="text-gray-400 hover:text-blue-500">
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleDeleteClick} className="text-gray-400 hover:text-red-500">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            )}
            
            <div className="flex items-start gap-4 mt-2">
                <div className="flex-shrink-0">
                    <ProgressCircle progress={progress} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-green-700 break-words">{project ? project.name : group.name}</h3>
                    <p className="text-sm text-gray-500">{project ? group.name : 'Grupo sin proyecto'}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-600">{courseGroup}</p>
                    {tutor && <p className="mt-1 text-sm font-bold italic text-green-800">Tutor/a: {tutor.name}</p>}
                </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
                <h4 className="mb-2 text-sm font-semibold text-center text-gray-600">Total de tareas registradas</h4>
                <div className="flex justify-around">
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-800">{totalTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Totales</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{inProgressTasks}</p>
                        <p className="text-xs font-medium text-gray-500">En progreso</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{completedTasks}</p>
                        <p className="text-xs font-medium text-gray-500">Completadas</p>
                    </div>
                </div>
            </div>

            {project?.startDate && project?.endDate && (
                <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-gray-200">
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-800">{new Date(project.startDate + 'T00:00:00').toLocaleDateString()}</p>
                        <p className="text-xs font-medium text-gray-500">Inicio</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-800">{new Date(project.endDate + 'T00:00:00').toLocaleDateString()}</p>
                        <p className="text-xs font-medium text-gray-500">Fin</p>
                    </div>
                    <CountdownDisplay endDate={project.endDate} />
                </div>
            )}

            <div className="flex-grow pt-4 mt-4 border-t border-gray-200">
                <h4 className="mb-2 font-semibold text-gray-600">Alumnado integrante:</h4>
                <div className="space-y-2">
                    {group.members
                        .filter(member => member.role === Role.Student)
                        .map(member => (
                        <div key={member.id} className="flex items-center">
                            <div className="w-2 h-2 mr-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-800">{member.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GroupForm: React.FC<{
    group: Partial<Group> | null;
    projects: Project[];
    allUsers: User[];
    user: User;
    courseDates: { startDate: string; endDate: string; };
    onSave: (groupData: any) => void;
    onCancel: () => void;
}> = ({ group, projects, allUsers, user, courseDates, onSave, onCancel }) => {
    const isEditing = !!group?.id;
    const projectForGroup = useMemo(() => projects.find(p => p.groupId === group?.id), [projects, group]);
    
    const initialCourse = useMemo(() => {
        if (isEditing && group?.members?.length) {
            const firstMember = allUsers.find(u => u.id === group.members![0].id);
            return firstMember?.courseGroup || '';
        }
        return '';
    }, [group, allUsers, isEditing]);
    
    const [name, setName] = useState(group?.name || '');
    const [projectName, setProjectName] = useState(projectForGroup?.name || '');
    const [projectDescription, setProjectDescription] = useState(projectForGroup?.description || '');
    const [startDate, setStartDate] = useState(projectForGroup?.startDate || '');
    const [endDate, setEndDate] = useState(projectForGroup?.endDate || '');
    const [tutorId, setTutorId] = useState(group?.tutorId || (user.role === Role.Tutor ? user.id : ''));
    const [memberIds, setMemberIds] = useState<string[]>(group?.members?.map(m => m.id) || []);
    const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
    const [formError, setFormError] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(initialCourse);
    
    const allTutors = useMemo(() => allUsers.filter(u => u.role === Role.Tutor), [allUsers]);
    const allStudents = useMemo(() => allUsers.filter(u => u.role === Role.Student), [allUsers]);
    
    const courseGroups = useMemo(() => {
        const courses = new Set(allStudents.filter(s => s.courseGroup).map(s => s.courseGroup!));
        return Array.from(courses).sort();
    }, [allStudents]);

    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCourse = e.target.value;
        setSelectedCourse(newCourse);
        // Reset members only when creating a new group and changing course
        if (!isEditing) {
            setMemberIds([]);
        }
    };

    const handleAddMember = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        if (selectedId && !memberIds.includes(selectedId)) {
            setMemberIds([...memberIds, selectedId]);
        }
    };
    
    const handleRemoveMemberClick = (idToRemove: string) => {
        const member = allStudents.find(s => s.id === idToRemove);
        if (member) {
            setMemberToRemove(member);
        }
    };

    const handleConfirmRemoveMember = () => {
        if (memberToRemove) {
            setMemberIds(memberIds.filter(id => id !== memberToRemove.id));
            setMemberToRemove(null);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (memberIds.length === 0) {
            setFormError('Debe seleccionar al menos un alumno para crear el grupo.');
            return;
        }
        setFormError('');
        onSave({ name, tutorId, memberIds, projectName, projectDescription, startDate, endDate });
    };

    const availableStudents = allStudents.filter(s => 
        s.courseGroup === selectedCourse && !memberIds.includes(s.id)
    );

    const isCourseSelectDisabled = isEditing && !!initialCourse;

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
                            {allTutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="tutorName" className="block text-sm font-medium text-gray-700">Tutor Asignado</label>
                        <input
                            type="text"
                            id="tutorName"
                            value={user.name}
                            readOnly
                            className="w-full p-2 mt-1 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                        />
                    </div>
                )}
                 <div>
                    <label htmlFor="courseGroup" className="block text-sm font-medium text-gray-700">Curso</label>
                    <select
                        id="courseGroup"
                        value={selectedCourse}
                        onChange={handleCourseChange}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={isCourseSelectDisabled}
                    >
                        <option value="">Selecciona un curso</option>
                        {courseGroups.map(cg => <option key={cg} value={cg}>{cg}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Alumnado integrante</label>
                    {memberIds.length > 0 && (
                        <div className="p-2 mt-1 space-y-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                            {memberIds.map(id => {
                                const member = allStudents.find(s => s.id === id);
                                return member ? (
                                    <div key={id} className="flex items-center justify-between p-1 bg-gray-100 rounded">
                                        <span className="text-gray-800">{member.name}</span>
                                        <button type="button" onClick={() => handleRemoveMemberClick(id)} className="text-red-500 hover:text-red-700">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    )}
                    <select 
                        onChange={handleAddMember} 
                        value="" 
                        className="w-full p-2 mt-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={!selectedCourse}
                    >
                         <option value="">{selectedCourse ? "Añadir alumno..." : "Selecciona un curso primero"}</option>
                         {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {formError && <p className="mt-2 text-sm text-center text-red-600">{formError}</p>}
                
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Guardar</button>
                </div>
            </form>

            {memberToRemove && (
                 <Modal title="Confirmar Acción" onClose={() => setMemberToRemove(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar a</p>
                        <p className="my-2 text-xl font-bold text-gray-800">"{memberToRemove.name}"</p>
                        <p className="text-lg text-gray-700">de este grupo?</p>

                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setMemberToRemove(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmRemoveMember} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

const Groups: React.FC<GroupsProps> = ({ user, groups, projects, allUsers, tasks, courseDates, onCreate, onUpdate, onDelete, onNavigateToKanban }) => {
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
            if (!result[courseName]) {
                result[courseName] = [];
            }
            result[courseName].push(group);
        });
        return result;
    }, [visibleGroups, allUsers]);

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
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                        {courseGroups.map(group => (
                                            <GroupCard 
                                                key={group.id} 
                                                group={group}
                                                projects={projects}
                                                allUsers={allUsers}
                                                tasks={tasks}
                                                user={user}
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