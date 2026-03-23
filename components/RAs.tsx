
import React, { useState, useMemo, useEffect } from 'react';
import { RA } from '../types';
import Modal from './Modal';
import { EditIcon, TrashIcon, PlusCircleIcon, ChevronDownIcon } from './Icons';

const ModuleForm: React.FC<{
    moduleName?: string;
    allModules: string[];
    onSave: (newName: string) => void;
    onCancel: () => void;
}> = ({ moduleName, allModules, onSave, onCancel }) => {
    const [name, setName] = useState(moduleName || '');
    const [error, setError] = useState('');

    useEffect(() => {
        const trimmedName = name.trim().toLowerCase();
        if (trimmedName) {
            const isDuplicate = allModules.some(
                m => m.trim().toLowerCase() === trimmedName && m.trim().toLowerCase() !== moduleName?.trim().toLowerCase()
            );
            if (isDuplicate) {
                setError('Ya existe un módulo con este nombre.');
            } else {
                setError('');
            }
        } else {
            setError('');
        }
    }, [name, moduleName, allModules]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!error && name.trim()) {
            onSave(name.trim());
        }
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
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={!!error || !name.trim()}
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
    onSave: (data: { module: string; code: string; description: string; }) => void;
    onCancel: () => void;
    currentModule: string;
}> = ({ ra, allRAs, onSave, onCancel, currentModule }) => {
    const [module] = useState(ra?.module || currentModule);
    const [codeNumber, setCodeNumber] = useState(ra?.code?.replace(/\D/g, '') || '');
    const [description, setDescription] = useState(ra?.description || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (codeNumber && module) {
            const fullCode = `RA${codeNumber}`;
            const isDuplicate = allRAs.some(
                r => r.id !== ra?.id && 
                     r.module.trim().toLowerCase() === module.trim().toLowerCase() && 
                     r.code.trim().toLowerCase() === fullCode.trim().toLowerCase()
            );
            if (isDuplicate) {
                setError('Ya existe un RA con este número en este módulo.');
            } else {
                setError('');
            }
        } else {
            setError('');
        }
    }, [codeNumber, module, ra, allRAs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!error && codeNumber) {
            const fullCode = `RA${codeNumber}`;
            onSave({ module, code: fullCode, description });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="raModule" className="block text-sm font-medium text-gray-700">Nombre del Módulo</label>
                <input
                    type="text"
                    id="raModule"
                    value={module}
                    className="w-full p-2 mt-1 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md"
                    readOnly
                />
            </div>
            <div>
                <label htmlFor="raCodeNumber" className="block text-sm font-medium text-gray-700">Número del RA</label>
                <div className="flex items-center mt-1">
                    <span className="px-3 py-2 font-semibold text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">RA</span>
                    <input
                        type="number"
                        id="raCodeNumber"
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
                <label htmlFor="raDescription" className="block text-sm font-medium text-gray-700">Descripción Completa</label>
                <textarea
                    id="raDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={!!error || !codeNumber}
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
    modules: string[];
    onCreateRA: (data: { module: string; code: string; description: string; }) => void;
    onUpdateRA: (id: string, data: { module: string; code: string; description: string; }) => void;
    onDeleteRA: (id: string) => void;
    onCreateModule: (name: string) => void;
    onUpdateModule: (oldName: string, newName: string) => void;
    onDeleteModule: (name: string) => void;
}

const RAs: React.FC<RAsProps> = ({ ras, modules, onCreateRA, onUpdateRA, onDeleteRA, onCreateModule, onUpdateModule, onDeleteModule }) => {
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isRAModalOpen, setIsRAModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<string | null>(null);
    const [moduleForNewRA, setModuleForNewRA] = useState<string | null>(null);
    const [editingRA, setEditingRA] = useState<RA | null>(null);
    const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
    const [raToDelete, setRaToDelete] = useState<RA | null>(null);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const sortedModules = useMemo(() => [...modules].sort(), [modules]);

    const toggleModule = (moduleName: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
    };

    const handleCreateModule = () => {
        setEditingModule(null);
        setIsModuleModalOpen(true);
    };

    const handleEditModule = (moduleName: string) => {
        setEditingModule(moduleName);
        setIsModuleModalOpen(true);
    };

    const handleSaveModule = (newName: string) => {
        if (editingModule) {
            onUpdateModule(editingModule, newName);
        } else {
            onCreateModule(newName);
        }
        setIsModuleModalOpen(false);
        setEditingModule(null);
    };

    const handleDeleteModuleClick = (moduleName: string) => {
        setModuleToDelete(moduleName);
    };

    const handleConfirmDeleteModule = () => {
        if (moduleToDelete) {
            onDeleteModule(moduleToDelete);
            setModuleToDelete(null);
        }
    };

    const handleCreateRA = (moduleName: string) => {
        setEditingRA(null);
        setModuleForNewRA(moduleName);
        setIsRAModalOpen(true);
    };

    const handleEditRA = (ra: RA) => {
        setEditingRA(ra);
        setModuleForNewRA(null);
        setIsRAModalOpen(true);
    };

    const handleSaveRA = (raData: { module: string; code: string; description: string; }) => {
        if (editingRA) {
            onUpdateRA(editingRA.id, raData);
        } else {
            onCreateRA(raData);
        }
        setIsRAModalOpen(false);
        setEditingRA(null);
        setModuleForNewRA(null);
    };

    const handleDeleteRAClick = (ra: RA) => {
        setRaToDelete(ra);
    };

    const handleConfirmDeleteRA = () => {
        if (raToDelete) {
            onDeleteRA(raToDelete.id);
            setRaToDelete(null);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                 <div></div>
                 <button onClick={handleCreateModule} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                    <PlusCircleIcon className="w-5 h-5" />
                    Añadir Módulo
                </button>
            </div>
            
            <div className="space-y-2">
                {sortedModules.length === 0 ? (
                    <div className="py-4 text-center text-gray-500 border rounded-lg">
                        No hay Módulos definidos.
                    </div>
                ) : (
                    sortedModules.map(moduleName => {
                        const moduleRAs = ras.filter(r => r.module === moduleName).sort((a, b) => {
                           const numA = parseInt(a.code.replace(/\D/g, ''), 10) || 0;
                           const numB = parseInt(b.code.replace(/\D/g, ''), 10) || 0;
                           return numA - numB;
                        });
                        const isExpanded = !!expandedModules[moduleName];

                        return (
                            <div key={moduleName} className="border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100">
                                    <div 
                                        onClick={() => toggleModule(moduleName)} 
                                        className="flex items-center flex-grow cursor-pointer"
                                    >
                                        <h3 className="font-semibold text-gray-800">{moduleName}</h3>
                                        <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{moduleRAs.length} RAs</span>
                                        <ChevronDownIcon className={`w-5 h-5 ml-auto text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                    <div className="flex items-center pl-4 space-x-2">
                                        <button onClick={() => handleEditModule(moduleName)} className="text-blue-500 hover:text-blue-700">
                                            <EditIcon className="w-5 h-5 text-blue-500" />
                                        </button>
                                        <button onClick={() => handleDeleteModuleClick(moduleName)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex justify-end mb-4">
                                            <button onClick={() => handleCreateRA(moduleName)} className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                                                <PlusCircleIcon className="w-4 h-4" />
                                                Añadir RA
                                            </button>
                                        </div>
                                        {moduleRAs.length > 0 ? (
                                            <table className="w-full text-left table-auto">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Código</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Descripción</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {moduleRAs.map(ra => (
                                                        <tr key={ra.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 font-mono font-medium text-gray-800">{ra.code}</td>
                                                            <td className="px-4 py-2 text-gray-600">{ra.description}</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex space-x-4">
                                                                    <button onClick={() => handleEditRA(ra)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5 text-blue-500"/></button>
                                                                    <button onClick={() => handleDeleteRAClick(ra)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="py-4 text-center text-gray-500">No hay RAs definidos para este módulo.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            
            {isModuleModalOpen && (
                <Modal title={editingModule ? "Editar Módulo" : "Añadir Nuevo Módulo"} onClose={() => setIsModuleModalOpen(false)}>
                    <ModuleForm 
                        moduleName={editingModule || undefined}
                        allModules={modules}
                        onSave={handleSaveModule}
                        onCancel={() => setIsModuleModalOpen(false)}
                    />
                </Modal>
            )}

            {isRAModalOpen && (
                <Modal title={editingRA ? "Editar RA" : "Añadir Nuevo RA"} onClose={() => setIsRAModalOpen(false)}>
                    <RAForm
                        ra={editingRA}
                        allRAs={ras}
                        onSave={handleSaveRA}
                        onCancel={() => setIsRAModalOpen(false)}
                        currentModule={editingRA?.module || moduleForNewRA || ''}
                    />
                </Modal>
            )}

            {moduleToDelete && (
                <Modal title="Confirmar Eliminación de Módulo" onClose={() => setModuleToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el módulo?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{moduleToDelete}"</p>
                        <p className="p-2 mt-2 text-sm text-yellow-700 rounded-md bg-yellow-100">
                           Esto eliminará todos los RAs asociados a este módulo de forma permanente.
                        </p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setModuleToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDeleteModule} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar Módulo
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {raToDelete && (
                 <Modal title="Confirmar Eliminación de RA" onClose={() => setRaToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el RA?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{raToDelete.code}: {raToDelete.description}"</p>
                        <p className="p-2 mt-2 text-sm text-yellow-700 rounded-md bg-yellow-100">
                           Las tareas que lo tuvieran asociado quedarán sin RA.
                        </p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setRaToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDeleteRA} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar RA
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default RAs;
