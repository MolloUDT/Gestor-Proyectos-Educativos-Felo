import React, { useState } from 'react';
import { User, Role } from '../types';
import Modal from './Modal';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, data: { username?: string; password?: string }) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
    const [username, setUsername] = useState(user.username || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('El nombre de usuario no puede estar vacío.');
            return;
        }
        onSave(user.id, { username, ...(password && { password }) });
    };

    return (
        <Modal title="Mi Perfil" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre y Apellidos</label>
                    <input
                        type="text"
                        value={`${user.firstName} ${user.lastName}`}
                        className="w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                        disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">No puedes modificar tu nombre real.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <input
                        type="text"
                        value={user.role === Role.Admin ? 'Administrador' : user.role === Role.Tutor ? 'Tutor' : 'Alumno'}
                        className="w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                        disabled
                    />
                </div>

                <div>
                    <label htmlFor="profileUsername" className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
                    <input
                        type="text"
                        id="profileUsername"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="profilePassword" className="block text-sm font-medium text-gray-700">Nueva Contraseña (opcional)</label>
                    <input
                        type="password"
                        id="profilePassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        placeholder="Dejar en blanco para no cambiar"
                    />
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Guardar Cambios</button>
                </div>
            </form>
        </Modal>
    );
};

export default ProfileModal;
