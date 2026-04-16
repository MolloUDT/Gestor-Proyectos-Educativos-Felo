import React, { useState } from 'react';
import { Task, KanbanStatus, Role, RA, Priority, Difficulty, User, Module } from '../types';
import { KANBAN_COLUMNS_ORDER } from '../constants';
import { TrashIcon } from './Icons';
import StatusIcon from './StatusIcon';
import PriorityIcon from './PriorityIcon';
import DifficultyIcon from './DifficultyIcon';

import { useLanguage } from '../lib/LanguageContext';

interface TaskFormProps {
    task: Partial<Task> | null;
    assignees: User[];
    projectId: string;
    ras: RA[];
    modules: Module[];
    courseDates: { startDate: string; endDate: string; };
    onSave: (data: any) => void;
    onCancel: () => void;
    onDelete?: (task: Task) => void;
    userRole: Role;
}

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TaskForm: React.FC<TaskFormProps> = ({ task, assignees, projectId, ras, modules, courseDates, onSave, onCancel, onDelete, userRole }) => {
    const { t } = useLanguage();
    const isNewTask = !task?.id;
    const initialModuleId = task?.raId ? ras.find(r => r.id === task.raId)?.moduleId : '';
    const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId || '');
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        assigneeId: task?.assigneeId || '',
        status: task?.status || KanbanStatus.Backlog,
        priority: task?.priority || Priority.Medium,
        difficulty: task?.difficulty || Difficulty.Level2,
        startDate: task?.startDate || formatDate(new Date()),
        endDate: task?.endDate || '',
        raId: task?.raId || '',
        isVerified: task?.isVerified ?? (isNewTask ? false : true),
    });

    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'moduleId') {
            setSelectedModuleId(value);
            setFormData(prev => ({ ...prev, raId: '' })); // Reset RA when module changes
        }
    };

    const handleSelect = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'status') setIsStatusOpen(false);
        if (name === 'priority') setIsPriorityOpen(false);
        if (name === 'difficulty') setIsDifficultyOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, projectId });
    };

    const handleVerify = () => {
        setFormData(prev => ({ ...prev, isVerified: true }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!formData.isVerified && !isNewTask && (userRole === Role.Admin || userRole === Role.Tutor) && (
                <div className="p-3 mb-4 border border-red-200 rounded-md bg-red-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700">
                            <span className="text-lg">⚠️</span>
                            <span className="text-sm font-medium">{t('taskPendingReview')}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleVerify}
                            className="px-3 py-1 text-xs font-bold text-white uppercase bg-red-600 rounded hover:bg-red-700 transition-colors"
                        >
                            ✓ {t('validateTask')}
                        </button>
                    </div>
                </div>
            )}
            {formData.isVerified && !isNewTask && (userRole === Role.Admin || userRole === Role.Tutor) && (
                <div className="p-3 mb-4 border border-green-200 rounded-md bg-green-50">
                    <div className="flex items-center gap-2 text-green-700">
                        <span className="text-lg">✓</span>
                        <span className="text-sm font-medium">{t('taskReviewedValidated')}</span>
                    </div>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">{t('taskTitle')}</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">{t('taskDescription')}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('assignee')}</label>
                    <select name="assigneeId" value={formData.assigneeId} onChange={handleChange} className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md" required>
                        <option value="">{t('selectMember')}</option>
                        {assignees.filter(a => a.role !== Role.Tutor).map(a => <option key={a.id} value={a.id}>{a.lastName}, {a.firstName}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                        {t('status')}
                        <StatusIcon status={KanbanStatus.Backlog} />
                        <StatusIcon status={KanbanStatus.Doing} />
                        <StatusIcon status={KanbanStatus.Done} />
                    </label>
                    <div className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between bg-white" onClick={() => setIsStatusOpen(!isStatusOpen)}>
                        <div className={`flex items-center gap-2 ${
                            formData.status === KanbanStatus.Backlog ? 'text-red-400' :
                            formData.status === KanbanStatus.Doing ? 'text-yellow-600' :
                            'text-green-600'
                        }`}>
                            <StatusIcon status={formData.status} />
                            {formData.status === KanbanStatus.Backlog ? t('pendingTasks') : formData.status === KanbanStatus.Doing ? t('inProgressTasks') : t('completedTasks')}
                        </div>
                        <span>▼</span>
                    </div>
                    {isStatusOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {KANBAN_COLUMNS_ORDER.map(s => (
                                <div key={s} onClick={() => handleSelect('status', s)} className={`p-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer ${
                                    s === KanbanStatus.Backlog ? 'text-red-400' :
                                    s === KanbanStatus.Doing ? 'text-yellow-600' :
                                    'text-green-600'
                                }`}>
                                    <StatusIcon status={s} />
                                    {s === KanbanStatus.Backlog ? t('pendingTasks') : s === KanbanStatus.Doing ? t('inProgressTasks') : t('completedTasks')}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                        {t('priority')}
                        <PriorityIcon priority={Priority.High} />
                        <PriorityIcon priority={Priority.Medium} />
                        <PriorityIcon priority={Priority.Low} />
                    </label>
                    <div className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between bg-white" onClick={() => setIsPriorityOpen(!isPriorityOpen)}>
                        <div className={`flex items-center gap-2 ${
                            formData.priority === Priority.High ? 'text-red-600' :
                            formData.priority === Priority.Medium ? 'text-orange-500' :
                            'text-green-600'
                        }`}>
                            <PriorityIcon priority={formData.priority} />
                            {formData.priority === Priority.High ? t('highPriority') : formData.priority === Priority.Medium ? t('mediumPriority') : t('lowPriority')}
                        </div>
                        <span>▼</span>
                    </div>
                    {isPriorityOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {Object.values(Priority).map(p => (
                                <div key={p} onClick={() => handleSelect('priority', p)} className={`p-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer ${
                                    p === Priority.High ? 'text-red-600' :
                                    p === Priority.Medium ? 'text-orange-500' :
                                    'text-green-600'
                                }`}>
                                    <PriorityIcon priority={p} />
                                    {p === Priority.High ? t('highPriority') : p === Priority.Medium ? t('mediumPriority') : t('lowPriority')}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                        {t('difficulty')}
                        <DifficultyIcon difficulty={Difficulty.Level1} />
                        <DifficultyIcon difficulty={Difficulty.Level2} />
                        <DifficultyIcon difficulty={Difficulty.Level3} />
                    </label>
                    <div className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between bg-white" onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}>
                        <div className={`flex items-center gap-2 ${
                            formData.difficulty === Difficulty.Level3 ? 'text-red-600' :
                            formData.difficulty === Difficulty.Level2 ? 'text-orange-500' :
                            'text-green-600'
                        }`}>
                            <DifficultyIcon difficulty={formData.difficulty} />
                            {formData.difficulty === Difficulty.Level1 ? t('low') : formData.difficulty === Difficulty.Level2 ? t('medium') : t('high')}
                        </div>
                        <span>▼</span>
                    </div>
                    {isDifficultyOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {[
                                { value: Difficulty.Level1, label: t('low'), colorClass: 'text-green-600' },
                                { value: Difficulty.Level2, label: t('medium'), colorClass: 'text-orange-500' },
                                { value: Difficulty.Level3, label: t('high'), colorClass: 'text-red-600' },
                            ].map(d => (
                                <div key={d.value} onClick={() => handleSelect('difficulty', d.value)} className={`p-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer ${d.colorClass}`}>
                                    <DifficultyIcon difficulty={d.value} />
                                    {d.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {(userRole === Role.Admin || userRole === Role.Tutor) && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('module')}</label>
                            <select name="moduleId" value={selectedModuleId} onChange={handleChange} className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md">
                                <option value="">{t('select')} {t('module')}</option>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('ra')}</label>
                            <select name="raId" value={formData.raId} onChange={handleChange} className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md" disabled={!selectedModuleId}>
                                <option value="">{t('select')} {t('ra')}</option>
                                {ras.filter(ra => ra.moduleId === selectedModuleId).map(ra => (
                                    <option key={ra.id} value={ra.id}>{ra.code}: {ra.description}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('startDate')}</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} min={courseDates.startDate} max={courseDates.endDate} className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md text-red-600 font-medium" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('endDate')}</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} min={formData.startDate || courseDates.startDate} max={courseDates.endDate} className="w-full h-[42px] p-2 mt-1 border border-gray-300 rounded-md text-green-600 font-medium" required />
                </div>
            </div>
            <div className="flex items-center justify-between pt-4">
                <div>
                    {!isNewTask && (userRole === Role.Admin || userRole === Role.Tutor || userRole === Role.Student) && (
                        <button type="button" onClick={() => onDelete?.(task as Task)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                           <TrashIcon className="w-4 h-4 text-red-500" /> {t('delete')}
                        </button>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{t('saveTask')}</button>
                </div>
            </div>
        </form>
    );
};

export default TaskForm;
