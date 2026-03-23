
import React, { useState, useMemo } from 'react';
import { User, Role, StoredFile, Group, Project, Course, Task } from '../types';
import { ChevronDownIcon, TrashIcon } from './Icons';
import ProjectCard from './ProjectCard';
import Modal from './Modal';

interface FilesProps {
    user: User;
    files: StoredFile[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    courses: Course[];
    tasks: Task[];
    onUploadFile: (file: File, groupId: string) => void;
    onDeleteFile: (fileId: string) => void;
}

const Files: React.FC<FilesProps> = ({ user, files, groups, allUsers, projects, courses, tasks, onUploadFile, onDeleteFile }) => {
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);

    const toggleExpand = (key: string) => setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));

    const studentGroups = useMemo(() => {
        if (user.role !== Role.Student) return [];
        return groups.filter(g => user.groupIds.includes(g.id));
    }, [user, groups]);

    const groupsByCourse = useMemo(() => {
        const result: Record<string, Group[]> = {};
        
        const visibleGroups = user.role === Role.Admin
            ? groups
            : user.role === Role.Tutor
                ? groups.filter(g => g.tutorId === user.id)
                : []; // Students handled separately

        visibleGroups.forEach(group => {
            const course = courses.find(c => c.id === group.courseId);
            const courseName = course ? course.name : 'Curso no asignado';
            
            if (!result[courseName]) result[courseName] = [];
            result[courseName].push(group);
        });

        Object.values(result).forEach(groupList => groupList.sort((a, b) => a.name.localeCompare(b.name)));
        return result;
    }, [user, groups, courses]);

    const handleConfirmDelete = () => {
        if (fileToDelete) {
            onDeleteFile(fileToDelete.id);
            setFileToDelete(null);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Archivos de Proyectos</h2>
            </div>
            
            {user.role === Role.Student ? (
                <div className="space-y-4">
                    {studentGroups.length > 0 ? studentGroups.map(group => {
                        const project = projects.find(p => p.groupId === group.id);
                        const groupFiles = files.filter(f => f.groupId === group.id);
                        const tutor = allUsers.find(u => u.id === group.tutorId);
                        
                        const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
                            if (event.target.files && event.target.files[0]) {
                                onUploadFile(event.target.files[0], group.id);
                            }
                        };

                        return (
                            <div key={group.id} className="mb-2 border-l-2 border-green-200">
                                {project ? (
                                    <ProjectCard 
                                        project={project}
                                        group={group}
                                        tutor={tutor}
                                        tasks={tasks}
                                        onClick={() => toggleExpand(`group_${group.id}`)}
                                    />
                                ) : (
                                    <button 
                                        onClick={() => toggleExpand(`group_${group.id}`)}
                                        className="flex items-center w-full p-4 text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm gap-4 hover:bg-green-50 hover:border-green-300"
                                    >
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold text-green-800 truncate">Grupo: {group.name}</p>
                                            <p className="mt-1 text-xs text-blue-600">Tutor: {tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Sin tutor'}</p>
                                        </div>
                                    </button>
                                )}
                                {expandedKeys[`group_${group.id}`] && (
                                    <div className="pl-6 pr-2 pb-2 mt-1 space-y-2">
                                        <div className="flex justify-end mb-2">
                                            <input 
                                                type="file" 
                                                id={`file-upload-${group.id}`} 
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                            <label 
                                                htmlFor={`file-upload-${group.id}`}
                                                className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md cursor-pointer hover:bg-green-700 transition-colors"
                                            >
                                                Subir Archivo
                                            </label>
                                        </div>
                                        {groupFiles.length > 0 ? (
                                            <div className="overflow-x-auto border rounded-md">
                                                <table className="w-full text-left table-auto">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 text-sm font-semibold text-gray-600">Nombre</th>
                                                            <th className="px-4 py-2 text-sm font-semibold text-gray-600">Fecha</th>
                                                            <th className="px-4 py-2 text-sm font-semibold text-gray-600">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupFiles.map(file => (
                                                            <tr key={file.id} className="border-b hover:bg-gray-50 last:border-b-0">
                                                                <td className="px-4 py-2 text-sm text-gray-900">{file.name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                                                                <td className="px-4 py-2 text-sm space-x-4">
                                                                    <a href={file.url} className="text-green-600 hover:underline">Descargar</a>
                                                                    <button onClick={() => setFileToDelete(file)} className="text-red-500 hover:underline">Eliminar</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 border border-dashed rounded-md">
                                                No hay archivos en este grupo.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }) : <p className="text-center text-gray-500">No estás asignado a ningún grupo.</p>}
                </div>
            ) : (
                <div className="space-y-2">
                    {Object.keys(groupsByCourse).sort().map(courseName => (
                        <div key={courseName} className="border border-gray-200 rounded-lg">
                            <button onClick={() => toggleExpand(`course_${courseName}`)} className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none">
                                <div className="flex items-center">
                                    <h3 className="font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{groupsByCourse[courseName].length} grupos</span>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedKeys[`course_${courseName}`] ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedKeys[`course_${courseName}`] && (
                                <div className="p-4 border-t border-gray-200">
                                    {groupsByCourse[courseName].map(group => {
                                        const project = projects.find(p => p.groupId === group.id);
                                        const groupFiles = files.filter(f => f.groupId === group.id);
                                        const tutor = allUsers.find(u => u.id === group.tutorId);
                                        
                                        const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
                                            if (event.target.files && event.target.files[0]) {
                                                onUploadFile(event.target.files[0], group.id);
                                            }
                                        };

                                        return (
                                        <div key={group.id} className="mb-2 border-l-2 border-green-200">
                                            {project ? (
                                                <ProjectCard 
                                                    project={project}
                                                    group={group}
                                                    tutor={tutor}
                                                    tasks={tasks}
                                                    onClick={() => toggleExpand(`group_${group.id}`)}
                                                />
                                            ) : (
                                                <button 
                                                    onClick={() => toggleExpand(`group_${group.id}`)}
                                                    className="flex items-center w-full p-4 text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm gap-4 hover:bg-green-50 hover:border-green-300"
                                                >
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-semibold text-green-800 truncate">Grupo: {group.name}</p>
                                                        <p className="mt-1 text-xs text-blue-600">Tutor: {tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Sin tutor'}</p>
                                                    </div>
                                                </button>
                                            )}
                                            {expandedKeys[`group_${group.id}`] && (
                                                <div className="pl-6 pr-2 pb-2 mt-1 space-y-2">
                                                    <div className="flex justify-end mb-2">
                                                        <input 
                                                            type="file" 
                                                            id={`file-upload-${group.id}`} 
                                                            className="hidden"
                                                            onChange={handleFileSelect}
                                                        />
                                                        <label 
                                                            htmlFor={`file-upload-${group.id}`}
                                                            className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md cursor-pointer hover:bg-green-700"
                                                        >
                                                            Subir Archivo
                                                        </label>
                                                    </div>
                                                    {groupFiles.length > 0 ? (
                                                        <div className="overflow-x-auto border rounded-md">
                                                            <table className="w-full text-left table-auto">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">Nombre</th>
                                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">Fecha</th>
                                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">Acciones</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {groupFiles.map(file => (
                                                                        <tr key={file.id} className="border-b hover:bg-gray-50 last:border-b-0">
                                                                            <td className="px-4 py-2 text-sm text-gray-900">{file.name}</td>
                                                                            <td className="px-4 py-2 text-sm text-gray-600">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                                                                            <td className="px-4 py-2 text-sm space-x-4">
                                                                                <a href={file.url} className="text-green-600 hover:underline">Descargar</a>
                                                                                <button onClick={() => setFileToDelete(file)} className="text-red-500 hover:underline">Eliminar</button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center text-gray-500 border border-dashed rounded-md">
                                                            No hay archivos en este grupo.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        )})}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {fileToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setFileToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el archivo?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{fileToDelete.name}"</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setFileToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
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

export default Files;
