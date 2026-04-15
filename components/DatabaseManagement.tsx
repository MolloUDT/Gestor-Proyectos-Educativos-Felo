import React, { useState } from 'react';
import { Course, Group, Role, User } from '../types';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import { TrashIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

interface DatabaseManagementProps {
    courses: Course[];
    groups: Group[];
    allUsers: User[];
    onRefreshData: () => Promise<void>;
}

const DatabaseManagement: React.FC<DatabaseManagementProps> = ({ courses, groups, allUsers, onRefreshData }) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        action: () => Promise<void>;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');

    const filteredGroups = selectedCourseId === 'all' 
        ? groups 
        : groups.filter(g => g.courseId === selectedCourseId);

    const handleAction = (title: string, message: string, action: () => Promise<void>) => {
        setConfirmAction({ title, message, action });
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        if (!confirmAction) return;
        setIsLoading(true);
        setStatusMessage(null);
        try {
            await confirmAction.action();
            setStatusMessage({ type: 'success', text: 'Acción completada con éxito.' });
            await onRefreshData();
        } catch (error: any) {
            console.error("Error executing database action:", error);
            setStatusMessage({ type: 'error', text: `Error: ${error.message || 'Ocurrió un error inesperado.'}` });
        } finally {
            setIsLoading(false);
            setIsConfirmModalOpen(false);
            setConfirmAction(null);
        }
    };

    // --- Acciones de Borrado ---

    const clearMessages = async () => {
        let query = supabase.from('messages').delete();
        if (selectedCourseId !== 'all' || selectedGroupId !== 'all') {
            // This is tricky because messages store targetGroupIds as an array
            // For simplicity and safety, if filtering is needed, we might need a more complex query
            // or just support global clear for now if the user agrees.
            // But the user asked for "cursos y grupos que desee o de todos a la vez".
            
            // If we have a specific group:
            if (selectedGroupId !== 'all') {
                // Delete messages where targetGroupIds contains the selectedGroupId
                // Note: Supabase delete with filters on arrays can be limited depending on the setup
                // We'll use a RPC or a filter if possible.
                query = query.contains('target_group_ids', [selectedGroupId]);
            } else if (selectedCourseId !== 'all') {
                const groupIds = groups.filter(g => g.courseId === selectedCourseId).map(g => g.id);
                query = query.overlaps('target_group_ids', groupIds);
            }
        } else {
            query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        }
        const { error } = await query;
        if (error) throw error;
    };

    const clearFiles = async () => {
        let query = supabase.from('stored_files').delete();
        if (selectedGroupId !== 'all') {
            query = query.eq('group_id', selectedGroupId);
        } else if (selectedCourseId !== 'all') {
            const groupIds = groups.filter(g => g.courseId === selectedCourseId).map(g => g.id);
            query = query.in('group_id', groupIds);
        } else {
            query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        const { error } = await query;
        if (error) throw error;
    };

    const clearTutorials = async (type?: 'tutorial' | 'group_meeting') => {
        let query = supabase.from('tutorials').delete();
        if (type) query = query.eq('type', type);
        
        if (selectedGroupId !== 'all') {
            query = query.eq('group_id', selectedGroupId);
        } else if (selectedCourseId !== 'all') {
            const groupIds = groups.filter(g => g.courseId === selectedCourseId).map(g => g.id);
            query = query.in('group_id', groupIds);
        } else {
            query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        const { error } = await query;
        if (error) throw error;
    };

    const clearCoursesAndStudents = async () => {
        if (selectedCourseId === 'all') {
            // Delete all students first
            const { error: userError } = await supabase.from('users').delete().eq('role', Role.Student);
            if (userError) throw userError;
            // Delete all courses
            const { error: courseError } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (courseError) throw courseError;
        } else {
            // Delete students of this course
            const { error: userError } = await supabase.from('users').delete().eq('role', Role.Student).eq('course_id', selectedCourseId);
            if (userError) throw userError;
            // Delete the course
            const { error: courseError } = await supabase.from('courses').delete().eq('id', selectedCourseId);
            if (courseError) throw courseError;
        }
    };

    const clearLogbooks = async () => {
        if (selectedGroupId !== 'all') {
            const { error } = await supabase.from('groups').update({ logbook: '' }).eq('id', selectedGroupId);
            if (error) throw error;
        } else if (selectedCourseId !== 'all') {
            const { error } = await supabase.from('groups').update({ logbook: '' }).eq('course_id', selectedCourseId);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('groups').update({ logbook: '' }).neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
        }
    };

    const clearGroupsAndTasks = async () => {
        // Deleting groups should cascade to projects and tasks if DB is set up correctly.
        // If not, we do it manually.
        if (selectedGroupId !== 'all') {
            // Delete projects (tasks should cascade from projects)
            const { error: projError } = await supabase.from('projects').delete().eq('group_id', selectedGroupId);
            if (projError) throw projError;
            // Delete group
            const { error: groupError } = await supabase.from('groups').delete().eq('id', selectedGroupId);
            if (groupError) throw groupError;
        } else if (selectedCourseId !== 'all') {
            const groupIds = groups.filter(g => g.courseId === selectedCourseId).map(g => g.id);
            const { error: projError } = await supabase.from('projects').delete().in('group_id', groupIds);
            if (projError) throw projError;
            const { error: groupError } = await supabase.from('groups').delete().in('id', groupIds);
            if (groupError) throw groupError;
        } else {
            const { error: projError } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (projError) throw projError;
            const { error: groupError } = await supabase.from('groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (groupError) throw groupError;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestión Base Datos</h2>
                <p className="text-gray-600">Utiliza estas herramientas para limpiar o resetear los datos de la aplicación. <span className="font-bold text-red-600">Atención: Estas acciones son irreversibles.</span></p>
            </div>

            {statusMessage && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusMessage.type === 'success' ? <CheckCircleIcon className="w-5 h-5 mr-3" /> : <AlertTriangleIcon className="w-5 h-5 mr-3" />}
                    {statusMessage.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Aplicación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        <select 
                            value={selectedCourseId} 
                            onChange={(e) => {
                                setSelectedCourseId(e.target.value);
                                setSelectedGroupId('all');
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todos los cursos</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                        <select 
                            value={selectedGroupId} 
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todos los grupos</option>
                            {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 italic">
                    * Los filtros se aplicarán a las acciones de borrado que lo permitan.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Mensajes */}
                <CleanupCard 
                    title="Mensajes" 
                    description="Borra todos los mensajes enviados entre usuarios."
                    onDelete={() => handleAction(
                        "Borrar Mensajes", 
                        "¿Estás seguro de que deseas borrar todos los mensajes seleccionados?", 
                        clearMessages
                    )}
                />

                {/* Archivos */}
                <CleanupCard 
                    title="Archivos" 
                    description="Borra todos los archivos subidos por los grupos."
                    onDelete={() => handleAction(
                        "Borrar Archivos", 
                        "¿Estás seguro de que deseas borrar todos los archivos seleccionados?", 
                        clearFiles
                    )}
                />

                {/* Tutorías */}
                <CleanupCard 
                    title="Tutorías" 
                    description="Borra todas las tutorías individuales agendadas."
                    onDelete={() => handleAction(
                        "Borrar Tutorías", 
                        "¿Estás seguro de que deseas borrar todas las tutorías seleccionadas?", 
                        () => clearTutorials('tutorial')
                    )}
                />

                {/* Reuniones de Grupo */}
                <CleanupCard 
                    title="Reuniones de Grupo" 
                    description="Borra todas las reuniones de grupo agendadas."
                    onDelete={() => handleAction(
                        "Borrar Reuniones", 
                        "¿Estás seguro de que deseas borrar todas las reuniones de grupo seleccionadas?", 
                        () => clearTutorials('group_meeting')
                    )}
                />

                {/* Cuaderno de Bitácora */}
                <CleanupCard 
                    title="Cuaderno de Bitácora" 
                    description="Limpia el contenido de los cuadernos de bitácora de los grupos."
                    onDelete={() => handleAction(
                        "Limpiar Bitácoras", 
                        "¿Estás seguro de que deseas limpiar el contenido de las bitácoras seleccionadas?", 
                        clearLogbooks
                    )}
                />

                {/* Grupos y Tareas */}
                <CleanupCard 
                    title="Grupos, Proyectos y Tareas" 
                    description="Borra los grupos, sus proyectos y todas las tareas asociadas."
                    onDelete={() => handleAction(
                        "Borrar Grupos y Tareas", 
                        "¿Estás seguro de que deseas borrar los grupos y todas sus tareas? Esto también borrará los proyectos.", 
                        clearGroupsAndTasks
                    )}
                />

                {/* Cursos y Alumnos */}
                <CleanupCard 
                    title="Cursos y Alumnos" 
                    description="Borra los cursos y todos los alumnos asociados a ellos."
                    onDelete={() => handleAction(
                        "Borrar Cursos y Alumnos", 
                        "¿Estás seguro de que deseas borrar los cursos y todos sus alumnos? Esta es la acción de reseteo más profunda.", 
                        clearCoursesAndStudents
                    )}
                    isDanger
                />
            </div>

            {isConfirmModalOpen && (
                <Modal title={confirmAction?.title || "Confirmar Acción"} onClose={() => setIsConfirmModalOpen(false)}>
                    <div className="p-4">
                        <div className="flex items-center text-amber-600 mb-4">
                            <AlertTriangleIcon className="w-8 h-8 mr-3" />
                            <p className="font-bold">Esta acción no se puede deshacer.</p>
                        </div>
                        <p className="text-gray-700 mb-6">{confirmAction?.message}</p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={executeAction}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors flex items-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </>
                                ) : "Confirmar Borrado"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const CleanupCard: React.FC<{ 
    title: string; 
    description: string; 
    onDelete: () => void;
    isDanger?: boolean;
}> = ({ title, description, onDelete, isDanger }) => (
    <div className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border ${isDanger ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
        <div>
            <h4 className={`font-bold ${isDanger ? 'text-red-800' : 'text-gray-800'}`}>{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
        <button 
            onClick={onDelete}
            className={`p-2 rounded-full transition-colors ${isDanger ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'}`}
            title="Borrar"
        >
            <TrashIcon className="w-5 h-5" />
        </button>
    </div>
);

export default DatabaseManagement;
