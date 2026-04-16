import React, { useState, useMemo } from 'react';
import { User, Group, Role, Project, Task, Course } from '../types';
import Modal from './Modal';
import { PlusCircleIcon, ChevronDownIcon, TrashIcon } from './Icons';
import { sortBySurname } from '../lib/utils';
import ProjectCard from './ProjectCard';
import { useLanguage } from '../lib/LanguageContext';

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
    onDelete?: () => void;
    onCancel: () => void;
}> = ({ group, projects, allUsers, user, courses, courseDates, onSave, onDelete, onCancel }) => {
    const { t } = useLanguage();
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
            setFormError(t('selectAtLeastOneStudentError'));
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
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">{t('groupNameLabel')}</label>
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
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">{t('projectNameLabel')}</label>
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
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">{t('projectDescriptionLabel')}</label>
                    <textarea
                        id="projectDescription"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={3}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div className="flex flex-wrap justify-between gap-4">
                    <div className="flex flex-col items-center w-full sm:w-auto">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 text-center">{t('startDate')}</label>
                        <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={courseDates.startDate} max={courseDates.endDate} className="w-full sm:w-48 p-2 mt-1 border border-gray-300 rounded-md text-red-600 font-medium text-center" required />
                    </div>
                    <div className="flex flex-col items-center w-full sm:w-auto">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 text-center">{t('endDate')}</label>
                        <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || courseDates.startDate} max={courseDates.endDate} className="w-full sm:w-48 p-2 mt-1 border border-gray-300 rounded-md text-green-600 font-medium text-center" required />
                    </div>
                     <p className="mt-1 text-xs text-gray-500 w-full">
                        {t('dateWithinCourseWarning', { 
                            start: new Date(courseDates.startDate).toLocaleDateString(), 
                            end: new Date(courseDates.endDate).toLocaleDateString() 
                        })}
                    </p>
                </div>

                {user.role === Role.Admin ? (
                    <div>
                        <label htmlFor="tutor" className="block text-sm font-medium text-gray-700">{t('assignedTutor')}</label>
                        <select
                            id="tutor"
                            value={tutorId}
                            onChange={(e) => setTutorId(e.target.value)}
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">{t('selectTutor')}</option>
                            {allTutors.map(tutor => <option key={tutor.id} value={tutor.id}>{tutor.lastName}, {tutor.firstName}</option>)}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="tutorName" className="block text-sm font-medium text-gray-700">{t('assignedTutor')}</label>
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
                    <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">{t('course')}</label>
                    <select
                        id="courseId"
                        value={selectedCourseId}
                        onChange={handleCourseChange}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={isCourseSelectDisabled}
                    >
                        <option value="">{t('selectCourse')}</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('groupMembers')}</label>
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
                                <p className="text-sm text-gray-500 p-1">{t('noStudentsInCourse')}</p>
                            )
                        ) : (
                            <p className="text-sm text-gray-500 p-1">{t('selectCourseFirst')}</p>
                        )}
                    </div>
                </div>

                {formError && <p className="mt-2 text-sm text-center text-red-600">{formError}</p>}
                
                <div className="flex items-center justify-between pt-4">
                    <div>
                        {isEditing && onDelete && (
                            <button type="button" onClick={onDelete} className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                                <TrashIcon className="w-4 h-4 text-red-500" /> {t('delete')}
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{t('save')}</button>
                    </div>
                </div>
            </form>
        </>
    );
};

const Groups: React.FC<GroupsProps> = ({ user, groups, projects, allUsers, tasks, courses, courseDates, onCreate, onUpdate, onDelete, onNavigateToKanban }) => {
    const { t } = useLanguage();
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
            const courseName = course ? course.name : t('noGroupAssigned');
            
            if (!result[courseName]) {
                result[courseName] = [];
            }
            result[courseName].push(group);
        });
        return result;
    }, [visibleGroups, courses, t]);

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
        handleEdit(group);
    };

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-800">{t('groups')}</h2>
            {(user.role === Role.Admin || user.role === Role.Tutor) && (
                <div className="flex items-center justify-between mb-6">
                    <div></div>
                    <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                        <PlusCircleIcon className="w-5 h-5" />
                        {t('createGroup')}
                    </button>
                </div>
            )}
           
            <div className="space-y-4">
                {Object.keys(groupsByCourse).sort().map(courseName => {
                    const courseGroups = groupsByCourse[courseName];
                    const isExpanded = !!expandedCourseGroups[courseName];
                    return (
                        <div key={courseName} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                            <button onClick={() => toggleCourseGroup(courseName)} className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none rounded-lg">
                                <div className="flex items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                                        {t('groupCountLabel', { 
                                            count: courseGroups.length, 
                                            label: courseGroups.length === 1 ? t('groupSingular') : t('groupPlural') 
                                        })}
                                    </span>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200">
                                    <div className="space-y-2">
                                        {courseGroups.map(group => {
                                            const project = projects.find(p => p.groupId === group.id);
                                            const tutor = allUsers.find(u => u.id === group.tutorId);
                                            return (
                                                <ProjectCard 
                                                    key={group.id} 
                                                    group={group}
                                                    project={project}
                                                    tutor={tutor}
                                                    tasks={tasks}
                                                    onClick={() => handleCardClick(group)} 
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isFormModalOpen && (
                <Modal title={editingGroup ? t('editGroup') : t('createGroup')} onClose={() => setIsFormModalOpen(false)}>
                    <GroupForm
                        group={editingGroup}
                        projects={projects}
                        allUsers={allUsers}
                        user={user}
                        courses={courses}
                        courseDates={courseDates}
                        onSave={handleSave}
                        onDelete={editingGroup ? () => { setIsFormModalOpen(false); handleDeleteClick(editingGroup); } : undefined}
                        onCancel={() => setIsFormModalOpen(false)}
                    />
                </Modal>
            )}

            {groupToDelete && (
                <Modal title={t('confirmDelete')} onClose={() => setGroupToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">{t('deleteStudentConfirm')}</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{groupToDelete.name}"</p>
                        <p className="text-sm text-gray-500">
                            {t('deleteCourseWarning')}
                        </p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setGroupToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                {t('cancel')}
                            </button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                {t('yesDelete')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Groups;
