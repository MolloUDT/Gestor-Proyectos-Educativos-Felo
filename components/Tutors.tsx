
import React, { useState, useMemo } from 'react';
import { User, Group, Role } from '../types';
import Modal from './Modal';
import { EditIcon, TrashIcon, PlusCircleIcon, EyeIcon, EyeOffIcon } from './Icons';

interface TutorsProps {
    users: User[];
    groups: Group[];
    onCreate: (data: { name: string; username?: string; password?: string }) => void;
    onUpdate: (id: string, data: { name: string; username?: string; password?: string }) => void;
    onDelete: (id: string) => void;
}

const TutorForm: React.FC<{
    tutor: Partial<User> | null;
    onSave: (data: { name: string; username?: string; password?: string }) => void;
    onCancel: () => void;
}> = ({ tutor, onSave, onCancel }) => {
    const [name, setName] = useState(tutor?.name || '');
    const [username, setUsername] = useState(tutor?.username || '');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, ...(username && { username }), ...(password && { password }) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="tutorName" className="block text-sm font-medium text-gray-700">Nombre y Apellidos</label>
                <input
                    type="text"
                    id="tutorName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                />
            </div>
            <div>
                <label htmlFor="tutorUsername" className="block text-sm font-medium text-gray-700">Nombre de usuario (opcional)</label>
                <input
                    type="text"
                    id="tutorUsername"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    placeholder="Se generará automáticamente si se deja en blanco"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {tutor ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    placeholder={tutor ? 'Dejar en blanco para no cambiar' : ''}
                    required={!tutor}
                />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Guardar</button>
            </div>
        </form>
    );
};

const Tutors: React.FC<TutorsProps> = ({ users, groups, onCreate, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTutor, setEditingTutor] = useState<User | null>(null);
    const [tutorToDelete, setTutorToDelete] = useState<User | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [visibleUsernames, setVisibleUsernames] = useState<Record<string, boolean>>({});

    const tutors = useMemo(() => {
        return users
            .filter(u => u.role === Role.Tutor)
            .sort((a, b) => {
                const getSurname = (name: string) => {
                    const parts = name.trim().split(/\s+/);
                    return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
                };
                return getSurname(a.name).localeCompare(getSurname(b.name), 'es');
            });
    }, [users]);

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleUsernameVisibility = (id: string) => {
        setVisibleUsernames(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreate = () => {
        setEditingTutor(null);
        setIsModalOpen(true);
    };

    const handleEdit = (tutor: User) => {
        setEditingTutor(tutor);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (tutor: User) => {
        setTutorToDelete(tutor);
    };

    const handleConfirmDelete = () => {
        if (tutorToDelete) {
            onDelete(tutorToDelete.id);
            setTutorToDelete(null);
        }
    };

    const handleSave = (tutorData: { name: string; username?: string; password?: string }) => {
        if (editingTutor) {
            onUpdate(editingTutor.id, tutorData);
        } else {
            onCreate(tutorData);
        }
        setIsModalOpen(false);
        setEditingTutor(null);
    };
    
    const assignedGroupsCount = (tutorId: string) => {
        return groups.filter(g => g.tutorId === tutorId).length;
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                 <div></div>
                 <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                    <PlusCircleIcon className="w-5 h-5" />
                    Añadir Tutor
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Nombre de usuario</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Contraseña</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Grupos asignados</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tutors.map(tutor => (
                            <tr key={tutor.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-green-800">{tutor.name}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-mono">
                                            {visibleUsernames[tutor.id] ? tutor.username : '••••••••'}
                                        </span>
                                        <button onClick={() => toggleUsernameVisibility(tutor.id)} className="text-gray-500 hover:text-gray-700">
                                            {visibleUsernames[tutor.id] ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-mono">
                                            {visiblePasswords[tutor.id] ? tutor.password : '••••••••'}
                                        </span>
                                        <button onClick={() => togglePasswordVisibility(tutor.id)} className="text-gray-500 hover:text-gray-700">
                                            {visiblePasswords[tutor.id] ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                </td>
                                <td className={`px-4 py-3 font-medium ${assignedGroupsCount(tutor.id) === 0 ? 'text-red-600' : 'text-green-800'}`}>
                                    {assignedGroupsCount(tutor.id)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex space-x-4">
                                        <button onClick={() => handleEdit(tutor)} className="text-blue-500 hover:text-blue-700">
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => handleDeleteClick(tutor)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={editingTutor ? "Editar Tutor" : "Añadir Nuevo Tutor"} onClose={() => setIsModalOpen(false)}>
                    <TutorForm
                        tutor={editingTutor}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}

            {tutorToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setTutorToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar al tutor?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{tutorToDelete.name}"</p>
                        {assignedGroupsCount(tutorToDelete.id) > 0 &&
                            <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md">
                                Este tutor está asignado a {assignedGroupsCount(tutorToDelete.id)} grupo(s). Al eliminarlo, estos grupos quedarán sin tutor.
                            </p>
                        }
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setTutorToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Tutors;