
import React, { useState, useMemo } from 'react';
import { User, Role, StoredFile, Group, Project, Course, Task } from '../types';
import { ChevronDownIcon, TrashIcon } from './Icons';
import { useLanguage } from '../lib/LanguageContext';
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
    const { t } = useLanguage();
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
    const [isUploading, setIsUploading] = useState<string | null>(null); // Guardar el groupId del grupo que está subiendo
    const [uploadError, setUploadError] = useState<string | null>(null);

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
            const courseName = course ? course.name : t('projectsWithoutCourse');
            
            if (!result[courseName]) result[courseName] = [];
            result[courseName].push(group);
        });

        Object.values(result).forEach(groupList => groupList.sort((a, b) => a.name.localeCompare(b.name)));
        return result;
    }, [user, groups, courses]);

    const handleConfirmDelete = async () => {
        if (fileToDelete) {
            setUploadError(null);
            try {
                await onDeleteFile(fileToDelete.id);
            } catch (error: any) {
                console.error("Delete error:", error);
                setUploadError(error.message || "Error al eliminar el archivo");
            } finally {
                setFileToDelete(null);
            }
        }
    };

    const onFileSelected = async (file: File, groupId: string) => {
        setIsUploading(groupId);
        setUploadError(null);
        try {
            await onUploadFile(file, groupId);
        } catch (error: any) {
            console.error("Upload error details:", error);
            setUploadError(error.message || "Error desconocido al subir el archivo");
        } finally {
            setIsUploading(null);
        }
    };

    const handleDownload = async (file: StoredFile) => {
        try {
            // Forzamos la descarga intentando convertir a Blob para evitar que el navegador simplemente abra el PDF
            const response = await fetch(file.url);
            if (!response.ok) throw new Error("Failed to fetch file");
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error forced downloading:", error);
            // Fallback: Abrir en pestaña nueva si falla el fetch (ej: por CORS si no está configurado)
            const link = document.createElement('a');
            link.href = file.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div>
            <p className="text-gray-600 mb-8">{t('selectGroupFiles')}</p>
            
            {uploadError && (
                <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg">
                    <p className="font-bold">Error:</p>
                    <p>{uploadError}</p>
                    <button 
                        onClick={() => setUploadError(null)} 
                        className="mt-2 text-xs font-semibold underline hover:no-underline"
                    >
                        Cerrar aviso
                    </button>
                </div>
            )}
            {user.role === Role.Student ? (
                <div className="space-y-4">
                    {studentGroups.length > 0 ? studentGroups.map(group => {
                        const project = projects.find(p => p.groupId === group.id);
                        const groupFiles = files.filter(f => f.groupId === group.id);
                        const tutor = allUsers.find(u => u.id === group.tutorId);
                        
                        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                            if (event.target.files && event.target.files[0]) {
                                onFileSelected(event.target.files[0], group.id);
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
                                            <p className="font-semibold text-green-800 truncate">{t('group')}: {group.name}</p>
                                            <p className="mt-1 text-xs text-blue-600">{t('tutor')}: {tutor ? `${tutor.firstName} ${tutor.lastName}` : t('noTutor')}</p>
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
                                                onChange={handleFileChange}
                                                disabled={isUploading === group.id}
                                            />
                                            <label 
                                                htmlFor={`file-upload-${group.id}`}
                                                className={`px-3 py-1 text-sm font-semibold text-white rounded-md cursor-pointer transition-colors ${isUploading === group.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                            >
                                                {isUploading === group.id ? t('uploading') : t('uploadFile')}
                                            </label>
                                        </div>
                                        {groupFiles.length > 0 ? (
                                            <div className="overflow-x-auto border rounded-md">
                                                <table className="w-full text-left table-auto">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 text-sm font-semibold text-gray-600">{t('name')}</th>
                                                            <th className="px-4 py-2 text-sm font-semibold text-gray-600">{t('date')}</th>
                                                            <th className="px-4 py-2 text-sm font-semibold text-gray-600">{t('actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupFiles.map(file => (
                                                            <tr key={file.id} className="border-b hover:bg-gray-50 last:border-b-0">
                                                                <td className="px-4 py-2 text-sm text-gray-900">{file.name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                                                                <td className="px-4 py-2 text-sm space-x-4">
                                                                    <button 
                                                                        onClick={() => handleDownload(file)} 
                                                                        className="text-green-600 hover:underline"
                                                                    >
                                                                        {t('download')}
                                                                    </button>
                                                                    <button onClick={() => setFileToDelete(file)} className="text-red-500 hover:underline">{t('delete')}</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 border border-dashed rounded-md">
                                                {t('noFilesInGroup')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }) : <p className="text-center text-gray-500">{t('notAssignedToGroup')}</p>}
                </div>
            ) : (
                <div className="space-y-2">
                    {Object.keys(groupsByCourse).sort().map(courseName => (
                        <div key={courseName} className="border border-gray-200 rounded-lg">
                            <button onClick={() => toggleExpand(`course_${courseName}`)} className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none">
                                <div className="flex items-center">
                                    <h3 className="font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                        {t('groupCountLabel', { 
                                            count: groupsByCourse[courseName].length.toString(), 
                                            label: groupsByCourse[courseName].length === 1 ? t('groupSingular') : t('groupPlural') 
                                        })}
                                    </span>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedKeys[`course_${courseName}`] ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedKeys[`course_${courseName}`] && (
                                <div className="p-4 border-t border-gray-200">
                                    {groupsByCourse[courseName].map(group => {
                                        const project = projects.find(p => p.groupId === group.id);
                                        const groupFiles = files.filter(f => f.groupId === group.id);
                                        const tutor = allUsers.find(u => u.id === group.tutorId);
                                        
                                        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                                            if (event.target.files && event.target.files[0]) {
                                                onFileSelected(event.target.files[0], group.id);
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
                                                        <p className="font-semibold text-green-800 truncate">{t('group')}: {group.name}</p>
                                                        <p className="mt-1 text-xs text-blue-600">{t('tutor')}: {tutor ? `${tutor.firstName} ${tutor.lastName}` : t('noTutor')}</p>
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
                                                            onChange={handleFileChange}
                                                            disabled={isUploading === group.id}
                                                        />
                                                        <label 
                                                            htmlFor={`file-upload-${group.id}`}
                                                            className={`px-3 py-1 text-sm font-semibold text-white rounded-md cursor-pointer transition-colors ${isUploading === group.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                                        >
                                                            {isUploading === group.id ? t('uploading') : t('uploadFile')}
                                                        </label>
                                                    </div>
                                                    {groupFiles.length > 0 ? (
                                                        <div className="overflow-x-auto border rounded-md">
                                                            <table className="w-full text-left table-auto">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">{t('name')}</th>
                                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">{t('date')}</th>
                                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">{t('actions')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {groupFiles.map(file => (
                                                                        <tr key={file.id} className="border-b hover:bg-gray-50 last:border-b-0">
                                                                            <td className="px-4 py-2 text-sm text-gray-900">{file.name}</td>
                                                                            <td className="px-4 py-2 text-sm text-gray-600">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                                                                            <td className="px-4 py-2 text-sm space-x-4">
                                                                                <button 
                                                                                    onClick={() => handleDownload(file)} 
                                                                                    className="text-green-600 hover:underline"
                                                                                >
                                                                                    {t('download')}
                                                                                </button>
                                                                                <button onClick={() => setFileToDelete(file)} className="text-red-500 hover:underline">{t('delete')}</button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center text-gray-500 border border-dashed rounded-md">
                                                            {t('noFilesInGroup')}
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
                <Modal title={t('confirmDelete')} onClose={() => setFileToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">{t('confirmDeleteFile')}</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{fileToDelete.name}"</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setFileToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
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

export default Files;
