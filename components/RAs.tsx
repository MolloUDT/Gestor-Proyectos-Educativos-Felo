
import React, { useState, useMemo, useEffect } from 'react';
import { RA, Module, Course } from '../types';
import Modal from './Modal';
import { EditIcon, TrashIcon, PlusCircleIcon, ChevronDownIcon } from './Icons';

const ModuleForm: React.FC<{
    moduleName?: string;
    courseIds?: string[];
    allCourses: Course[];
    onSave: (data: { name: string; courseIds: string[] }) => void;
    onCancel: () => void;
}> = ({ moduleName, courseIds, allCourses, onSave, onCancel }) => {
    const [name, setName] = useState(moduleName || '');
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(courseIds || (allCourses.length > 0 ? [allCourses[0].id] : []));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && (moduleName || selectedCourseIds.length > 0)) {
            onSave({ name: name.trim(), courseIds: selectedCourseIds });
        }
    };

    const toggleCourse = (courseId: string) => {
        setSelectedCourseIds(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="moduleName" className="block text-sm font-medium text-gray-700">Nombre del Módulo</label>
                <input
                    type="text"
                    id="moduleName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                />
            </div>
            {!moduleName && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cursos</label>
                    <div className="mt-1 space-y-2">
                        {allCourses.map(c => (
                            <label key={c.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedCourseIds.includes(c.id)}
                                    onChange={() => toggleCourse(c.id)}
                                    className="mr-2"
                                />
                                {c.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={!name.trim() || selectedCourseIds.length === 0}
                    className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Guardar Módulo
                </button>
            </div>
        </form>
    );
};

const RAForm: React.FC<{
    ra: Partial<RA> | null;
    allRAs: RA[];
    onSave: (data: { moduleIds: string[]; code: string; description: string; }) => void;
    onCancel: () => void;
    currentModuleId: string;
    allModules: Module[];
    allCourses: Course[];
}> = ({ ra, allRAs, onSave, onCancel, currentModuleId, allModules, allCourses }) => {
    const currentModule = allModules.find(m => m.id === currentModuleId);
    const [moduleIds, setModuleIds] = useState<string[]>(ra?.moduleId ? [ra.moduleId] : [currentModuleId]);
    const [codeNumber, setCodeNumber] = useState(ra?.code?.replace(/\D/g, '') || '');
    const [description, setDescription] = useState(ra?.description || '');
    const [error, setError] = useState('');

    const otherMatchingModules = useMemo(() => {
        if (!currentModule) return [];
        return allModules.filter(m => 
            m.name === currentModule.name && 
            m.id !== currentModuleId && 
            m.courseId !== currentModule.courseId
        );
    }, [currentModule, currentModuleId, allModules]);

    useEffect(() => {
        if (codeNumber && moduleIds.length > 0) {
            const fullCode = `RA${codeNumber}`;
            // Check for duplicates in any of the selected modules
            const isDuplicate = moduleIds.some(mId => 
                allRAs.some(r => r.id !== ra?.id && r.moduleId === mId && r.code.trim().toLowerCase() === fullCode.trim().toLowerCase())
            );
            setError(isDuplicate ? 'Ya existe un RA con este número en uno de los módulos seleccionados.' : '');
        } else {
            setError('');
        }
    }, [codeNumber, moduleIds, ra, allRAs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!error && codeNumber && moduleIds.length > 0) {
            const fullCode = `RA${codeNumber}`;
            onSave({ moduleIds, code: fullCode, description });
        }
    };

    const toggleModule = (mId: string) => {
        setModuleIds(prev =>
            prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Número del RA</label>
                <div className="flex items-center mt-1">
                    <span className="px-3 py-2 font-semibold text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">RA</span>
                    <input
                        type="number"
                        value={codeNumber}
                        onChange={(e) => setCodeNumber(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-r-md"
                        min="1"
                        required
                    />
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Descripción Completa</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                />
            </div>
            
            {otherMatchingModules.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">También asociar a estos módulos:</label>
                    <div className="mt-1 space-y-2">
                        {otherMatchingModules.map(m => {
                            const course = allCourses.find(c => c.id === m.courseId);
                            return (
                                <label key={m.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={moduleIds.includes(m.id)}
                                        onChange={() => toggleModule(m.id)}
                                        className="mr-2"
                                    />
                                    {m.name} {course ? `(${course.name})` : ''}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={!!error || !codeNumber || moduleIds.length === 0}
                    className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Guardar RA
                </button>
            </div>
        </form>
    );
};

interface RAsProps {
    ras: RA[];
    modules: Module[];
    courses: Course[];
    onCreateRA: (data: { moduleIds: string[]; code: string; description: string; }) => void;
    onUpdateRA: (id: string, data: { moduleId: string; code: string; description: string; }) => void;
    onDeleteRA: (id: string) => void;
    onCreateModule: (data: { name: string; courseIds: string[] }) => void;
    onUpdateModule: (id: string, name: string) => void;
    onDeleteModule: (id: string) => void;
}

const RAs: React.FC<RAsProps> = ({ ras, modules, courses, onCreateRA, onUpdateRA, onDeleteRA, onCreateModule, onUpdateModule, onDeleteModule }) => {
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isRAModalOpen, setIsRAModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [editingRA, setEditingRA] = useState<RA | null>(null);
    const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
    const [raToDelete, setRaToDelete] = useState<RA | null>(null);

    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const modulesByCourse = useMemo(() => {
        const map: Record<string, Module[]> = {};
        courses.forEach(c => map[c.id] = []);
        modules.forEach(m => {
            if (map[m.courseId]) map[m.courseId].push(m);
        });
        return map;
    }, [courses, modules]);

    const rasByModule = useMemo(() => {
        const map: Record<string, RA[]> = {};
        modules.forEach(m => map[m.id] = []);
        ras.forEach(r => {
            if (map[r.moduleId]) map[r.moduleId].push(r);
        });
        return map;
    }, [modules, ras]);

    return (
        <div className="space-y-4">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Selecciona un curso</h2>
            
            {/* Courses List */}
            <div className="space-y-2">
                {courses.map(c => {
                    const courseModules = modulesByCourse[c.id] || [];
                    const isExpanded = !!expandedCourses[c.id];
                    return (
                        <div key={c.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                            <button onClick={() => toggleCourse(c.id)} className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none rounded-lg">
                                <div className="flex items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
                                    <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                                        {courseModules.length} {courseModules.length === 1 ? 'módulo' : 'módulos'}
                                    </span>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-700">Módulos</h4>
                                        <button onClick={() => { setEditingModule(null); setIsModuleModalOpen(true); }} className="flex items-center justify-center w-36 h-8 px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">
                                            <PlusCircleIcon className="w-4 h-4 mr-1" /> Nuevo Módulo
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {courseModules.map(m => (
                                            <div key={m.id} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <button onClick={() => setSelectedModuleId(selectedModuleId === m.id ? null : m.id)} className="flex items-center font-medium text-blue-700 hover:text-blue-900">
                                                        {m.name}
                                                        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full">
                                                            {rasByModule[m.id]?.length || 0}
                                                        </span>
                                                        <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${selectedModuleId === m.id ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => { setEditingModule(m); setIsModuleModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                                        <button onClick={() => setModuleToDelete(m)} className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                                                    </div>
                                                </div>
                                                {selectedModuleId === m.id && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-sm font-semibold text-gray-600">Resultados de Aprendizaje (RAs)</h5>
                                                            <button onClick={() => { setEditingRA(null); setIsRAModalOpen(true); }} className="flex items-center justify-center w-36 h-8 px-3 py-1 text-sm text-white bg-black rounded-md hover:bg-gray-800">
                                                                <PlusCircleIcon className="w-4 h-4 mr-1" /> Nuevo RA
                                                            </button>
                                                        </div>
                                                        {rasByModule[m.id]?.map(ra => (
                                                            <div key={ra.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm">
                                                                <div>
                                                                    <span className="font-semibold">{ra.code}</span> - {ra.description}
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button onClick={() => { setEditingRA(ra); setIsRAModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                                                    <button onClick={() => setRaToDelete(ra)} className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {isModuleModalOpen && (
                <Modal onClose={() => setIsModuleModalOpen(false)} title={editingModule ? "Editar Módulo" : "Nuevo Módulo"}>
                    <ModuleForm
                        moduleName={editingModule?.name}
                        courseIds={editingModule ? [editingModule.courseId] : undefined}
                        allCourses={courses}
                        onSave={(data) => {
                            if (editingModule) onUpdateModule(editingModule.id, data.name);
                            else onCreateModule(data);
                            setIsModuleModalOpen(false);
                        }}
                        onCancel={() => setIsModuleModalOpen(false)}
                    />
                </Modal>
            )}
            {isRAModalOpen && (
                <Modal onClose={() => setIsRAModalOpen(false)} title={editingRA ? "Editar RA" : "Nuevo RA"}>
                    <RAForm
                        ra={editingRA}
                        allRAs={ras}
                        currentModuleId={selectedModuleId || ''}
                        allModules={modules}
                        allCourses={courses}
                        onSave={(data) => {
                            if (editingRA) onUpdateRA(editingRA.id, { ...data, moduleId: data.moduleIds[0] });
                            else onCreateRA(data);
                            setIsRAModalOpen(false);
                        }}
                        onCancel={() => setIsRAModalOpen(false)}
                    />
                </Modal>
            )}
            
            {moduleToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setModuleToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el módulo?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{moduleToDelete.name}"</p>
                        <p className="text-sm text-gray-500 mb-6">Esta acción también eliminará todos los RAs asociados a este módulo.</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setModuleToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={() => { onDeleteModule(moduleToDelete.id); setModuleToDelete(null); }} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {raToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setRaToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el RA?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{raToDelete.code}"</p>
                        <p className="text-sm text-gray-500 mb-6">{raToDelete.description}</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setRaToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={() => { onDeleteRA(raToDelete.id); setRaToDelete(null); }} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default RAs;
