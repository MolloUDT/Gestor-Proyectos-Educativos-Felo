
import React, { useState, useMemo } from 'react';
import { User, Role, Course, Group, Project } from '../types';
import Modal from './Modal';
import { EditIcon, TrashIcon, PlusCircleIcon, ChevronDownIcon, EyeIcon, EyeOffIcon, UsersIcon, UserIcon, InfoIcon } from './Icons';

interface StudentsProps {
    users: User[];
    courses: Course[];
    groups: Group[];
    projects: Project[];
    onCreateCourse: (name: string) => void;
    onUpdateCourse: (courseId: string, name: string) => void;
    onDeleteCourse: (courseId: string) => void;
    onCreate: (data: { firstName: string; lastName: string; username?: string; password?: string; courseId: string }) => void;
    onCreateBulk: (students: { firstName: string; lastName: string; password: string; courseId: string }[]) => void;
    onUpdate: (id: string, data: { firstName: string; lastName: string; username?: string; password?: string; courseId: string }) => void;
    onDelete: (id: string) => void;
    onNavigateToGroup?: (groupId: string) => void;
}

const StudentForm: React.FC<{
    student: Partial<User> | null;
    onSave: (data: { firstName: string; lastName: string; username?: string; password?: string, courseId: string }) => void;
    onCancel: () => void;
    courses: Course[];
}> = ({ student, onSave, onCancel, courses }) => {
    const [firstName, setFirstName] = useState(student?.firstName || '');
    const [lastName, setLastName] = useState(student?.lastName || '');
    const [username, setUsername] = useState(student?.username || '');
    const [password, setPassword] = useState('');
    const [courseId, setCourseId] = useState(student?.courseId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ firstName, lastName, ...(username && { username }), ...(password && { password }), courseId });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="studentFirstName" className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                        type="text"
                        id="studentFirstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="studentLastName" className="block text-sm font-medium text-gray-700">Apellidos</label>
                    <input
                        type="text"
                        id="studentLastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        required
                    />
                </div>
            </div>
            <div>
                <label htmlFor="studentUsername" className="block text-sm font-medium text-gray-700">Nombre de usuario (opcional)</label>
                <input
                    type="text"
                    id="studentUsername"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    placeholder="Se generará automáticamente si se deja en blanco"
                />
            </div>
            <div>
                <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">Curso</label>
                <select
                    id="courseId"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                >
                    <option value="">Selecciona un curso</option>
                    {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {student ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    placeholder={student ? 'Dejar en blanco para no cambiar' : ''}
                    required={!student}
                />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Guardar</button>
            </div>
        </form>
    );
};

const BulkStudentForm: React.FC<{
    onSave: (students: { firstName: string; lastName: string; password: string; courseId: string }[]) => void;
    onCancel: () => void;
    courses: Course[];
}> = ({ onSave, onCancel, courses }) => {
    const [courseId, setCourseId] = useState('');
    const [pastedText, setPastedText] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pastedText || !courseId) {
            setError('Debes seleccionar un curso y pegar los datos de los alumnos.');
            return;
        }
        setIsProcessing(true);
        setError('');

        try {
            const rows = pastedText.trim().split('\n').filter(row => row.trim() !== '');
            if (rows.length === 0) {
                throw new Error('No se han pegado datos válidos.');
            }

            const studentsToCreate = rows.map((row, index) => {
                const columns = row.split('\t'); // Tab is the standard delimiter for spreadsheet pasting
                if (columns.length !== 3) {
                    throw new Error(`Error en la fila ${index + 1}: Se esperan 3 columnas (Nombre, Apellidos y Contraseña), pero se encontraron ${columns.length}. Asegúrate de copiar solo esas tres columnas.`);
                }
                
                const firstName = columns[0].trim();
                const lastName = columns[1].trim();
                const password = columns[2].trim();
                if (!firstName || !lastName || !password) {
                    throw new Error(`Error en la fila ${index + 1}: El nombre, apellidos y la contraseña no pueden estar vacíos.`);
                }
                
                return { firstName, lastName, password, courseId };
            });
            onSave(studentsToCreate);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 text-sm text-blue-700 bg-blue-100 border border-blue-200 rounded-md">
                <p className="font-semibold">Instrucciones:</p>
                <ul className="mt-1 list-disc list-inside">
                    <li>Abre tu hoja de cálculo (Excel, Google Sheets, etc.).</li>
                    <li>Asegúrate de tener <strong>tres columnas</strong>: Nombre, Apellidos y Contraseña.</li>
                    <li>Selecciona y copia (Ctrl+C) las filas de los alumnos.</li>
                    <li>Pega (Ctrl+V) el contenido en el cuadro de texto de abajo.</li>
                </ul>
            </div>
            <div>
                <label htmlFor="bulkCourseId" className="block text-sm font-medium text-gray-700">Curso para los nuevos alumnos</label>
                <select
                    id="bulkCourseId"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                >
                    <option value="">Selecciona un curso</option>
                    {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="pasteData" className="block text-sm font-medium text-gray-700">Pegar datos de alumnos</label>
                <textarea
                    id="pasteData"
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full p-2 mt-1 font-mono text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder={`Nombre\tApellidos\tContraseña1\nNombre\tApellidos\tContraseña2`}
                    required
                />
            </div>

            {error && <p className="mt-2 text-sm text-center text-red-600">{error}</p>}
            
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={!pastedText || !courseId || isProcessing}
                    className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Procesando...' : 'Añadir Alumnos'}
                </button>
            </div>
        </form>
    );
};

const Students: React.FC<StudentsProps> = ({ users, courses, groups, projects, onUpdateCourse, onDeleteCourse, onCreateCourse, onCreate, onCreateBulk, onUpdate, onDelete, onNavigateToGroup }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
    const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSearchErrorModalOpen, setIsSearchErrorModalOpen] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [searchResultStudent, setSearchResultStudent] = useState<User | null>(null);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [visibleUsernames, setVisibleUsernames] = useState<Record<string, boolean>>({});
    const [newCourseName, setNewCourseName] = useState('');
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const studentsByCourse = useMemo(() => {
        const studentList = users.filter(u => u.role === Role.Student);
        return courses.reduce((acc, course) => {
            acc[course.id] = studentList.filter(s => s.courseId === course.id);
            return acc;
        }, {} as Record<string, User[]>);
    }, [users, courses]);
    
    const toggleGroup = (courseId: string) => {
        setExpandedGroups(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleUsernameVisibility = (id: string) => {
        setVisibleUsernames(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const assignedGroupsCount = (student: User) => {
        return student.groupIds?.length || 0;
    };

    const handleCreate = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student: User) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (student: User) => {
        setStudentToDelete(student);
    };

    const handleConfirmDelete = () => {
        if (studentToDelete) {
            onDelete(studentToDelete.id);
            setStudentToDelete(null);
        }
    };

    const handleSave = (studentData: { firstName: string; lastName: string; username?: string; password?: string, courseId: string }) => {
        if (editingStudent) {
            onUpdate(editingStudent.id, studentData);
        } else {
            onCreate(studentData);
        }
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleCreateCourse = () => {
        if (newCourseName.trim()) {
            onCreateCourse(newCourseName.trim());
            setNewCourseName('');
            setIsAddCourseModalOpen(false);
        }
    };

    const handleBulkSave = (studentsToCreate: { firstName: string; lastName: string; password: string; courseId: string }[]) => {
        onCreateBulk(studentsToCreate);
        setIsBulkModalOpen(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchName.trim()) return;

        const student = users.find(u => 
            u.role === Role.Student && 
            u.lastName.toLowerCase().includes(searchName.toLowerCase())
        );

        if (student) {
            setSearchResultStudent(student);
            setIsInfoModalOpen(true);
        } else {
            setIsSearchErrorModalOpen(true);
        }
    };

    const handleEditCourse = () => {
        if (editingCourse && editingCourse.name) {
            // This needs to be implemented in App.tsx and passed down
            setEditingCourse(null);
            setIsEditCourseModalOpen(false);
        }
    };

    const handleGroupClick = (groupId: string) => {
        if (onNavigateToGroup) {
            onNavigateToGroup(groupId);
            setIsInfoModalOpen(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button onClick={() => setIsAddCourseModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-md hover:bg-gray-800 w-full">
                    <PlusCircleIcon className="w-5 h-5" />
                    Añadir Curso
                </button>
                <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full">
                    <UsersIcon className="w-5 h-5" />
                    Añadir grupo a curso
                </button>
                <button onClick={handleCreate} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 w-full">
                    <UserIcon className="w-5 h-5" />
                    Añadir alumno a curso
                </button>
            </div>

            <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label htmlFor="searchStudent" className="block text-sm font-medium text-gray-700 mb-1">Información sobre el alumno: escribe únicamente los apellidos del alumno</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <InfoIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="searchStudent"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="Escribe únicamente los apellidos del alumno"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-colors"
                    >
                        Buscar
                    </button>
                </form>
            </div>

            <div className="space-y-2">
                {courses.map(course => {
                    const students = studentsByCourse[course.id] || [];
                    const isExpanded = !!expandedGroups[course.id];
                    return (
                        <div key={course.id} className="border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between w-full p-4 bg-gray-50">
                                <button
                                    onClick={() => toggleGroup(course.id)}
                                    className="flex items-center flex-1 text-left focus:outline-none"
                                >
                                    <div className="flex items-center">
                                        <h3 className="font-semibold text-gray-800">{course.name}</h3>
                                        <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                            {students.length} {students.length === 1 ? 'alumno' : 'alumnos'}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                                </button>
                                <button onClick={() => { setEditingCourse(course); setIsEditCourseModalOpen(true); }} className="ml-2 text-gray-500 hover:text-gray-700">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => { setCourseToDelete(course.id); setIsDeleteCourseModalOpen(true); }} className="ml-2 text-red-500 hover:text-red-700">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200">
                                    {students.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left table-auto">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Apellidos</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Nombre</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Nombre de usuario</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Contraseña</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Grupos asignados</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {students.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(student => (
                                                        <tr key={student.id}>
                                                            <td className="px-4 py-2 font-medium text-gray-800">{student.lastName}</td>
                                                            <td className="px-4 py-2 font-medium text-gray-800">{student.firstName}</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-gray-600 font-mono">
                                                                        {visibleUsernames[student.id] ? student.username : '••••••••'}
                                                                    </span>
                                                                    <button onClick={() => toggleUsernameVisibility(student.id)} className="text-gray-500 hover:text-gray-700">
                                                                        {visibleUsernames[student.id] ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-gray-600 font-mono">
                                                                        {visiblePasswords[student.id] ? student.password : '••••••••'}
                                                                    </span>
                                                                    <button onClick={() => togglePasswordVisibility(student.id)} className="text-gray-500 hover:text-gray-700">
                                                                        {visiblePasswords[student.id] ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className={`px-4 py-2 font-medium ${assignedGroupsCount(student) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {assignedGroupsCount(student)}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex space-x-4">
                                                                    <button onClick={() => handleEdit(student)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5"/></button>
                                                                    <button onClick={() => handleDeleteClick(student)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">No hay alumnos en este curso.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isAddCourseModalOpen && (
                <Modal title="Añadir Nuevo Curso" onClose={() => setIsAddCourseModalOpen(false)}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Nombre del curso"
                        />
                        <div className="flex justify-end pt-4 space-x-2">
                            <button onClick={() => setIsAddCourseModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                            <button onClick={handleCreateCourse} className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">Guardar</button>
                        </div>
                    </div>
                </Modal>
            )}

            {isEditCourseModalOpen && editingCourse && (
                <Modal title="Editar Nombre del Curso" onClose={() => setIsEditCourseModalOpen(false)}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={editingCourse.name}
                            onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Nuevo nombre del curso"
                        />
                        <div className="flex justify-end pt-4 space-x-2">
                            <button onClick={() => setIsEditCourseModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                            <button onClick={handleEditCourse} className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">Guardar</button>
                        </div>
                    </div>
                </Modal>
            )}

            {isDeleteCourseModalOpen && courseToDelete && (
                <Modal title="Confirmar Eliminación de Curso" onClose={() => setIsDeleteCourseModalOpen(false)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar el curso?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{courses.find(c => c.id === courseToDelete)?.name}"</p>
                        <p className="text-sm text-gray-500">
                            Esta acción es irreversible y eliminará el curso y todos los alumnos asociados a él.
                        </p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setIsDeleteCourseModalOpen(false)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={() => { onDeleteCourse(courseToDelete); setIsDeleteCourseModalOpen(false); }} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar Curso
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isModalOpen && (
                <Modal title={editingStudent ? "Editar Alumno" : "Añadir Nuevo Alumno"} onClose={() => setIsModalOpen(false)}>
                    <StudentForm
                        student={editingStudent}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        courses={courses}
                    />
                </Modal>
            )}
            
            {isBulkModalOpen && (
                <Modal title="Añadir Alumnos Masivamente" onClose={() => setIsBulkModalOpen(false)}>
                    <BulkStudentForm
                        onSave={handleBulkSave}
                        onCancel={() => setIsBulkModalOpen(false)}
                        courses={courses}
                    />
                </Modal>
            )}

            {studentToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setStudentToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar al alumno?</p>
                        <p className="my-2 text-xl font-bold text-red-600">"{studentToDelete.firstName} {studentToDelete.lastName}"</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setStudentToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isSearchErrorModalOpen && (
                <Modal title="Búsqueda sin resultados" onClose={() => setIsSearchErrorModalOpen(false)}>
                    <p className="text-gray-700">Con este criterio de búsqueda no encuentro ningún alumno. Asegúrate de haber tecleado los dos apellidos del alumno y de escribirlos correctamente.</p>
                    <div className="mt-4 flex justify-end">
                        <button onClick={() => setIsSearchErrorModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Cerrar</button>
                    </div>
                </Modal>
            )}
            {isInfoModalOpen && searchResultStudent && (
                <Modal onClose={() => setIsInfoModalOpen(false)} title="Información Detallada del Alumno">
                    <div className="space-y-4">
                        <div className="pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{searchResultStudent.firstName} {searchResultStudent.lastName}</h3>
                            <div className="mt-2 space-y-2">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Nombre de usuario</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-700 font-mono">
                                            {visibleUsernames[searchResultStudent.id] ? searchResultStudent.username : '••••••••'}
                                        </span>
                                        <button onClick={() => toggleUsernameVisibility(searchResultStudent.id)} className="text-gray-400 hover:text-gray-600">
                                            {visibleUsernames[searchResultStudent.id] ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Contraseña</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-700 font-mono">
                                            {visiblePasswords[searchResultStudent.id] ? searchResultStudent.password : '••••••••'}
                                        </span>
                                        <button onClick={() => togglePasswordVisibility(searchResultStudent.id)} className="text-gray-400 hover:text-gray-600">
                                            {visiblePasswords[searchResultStudent.id] ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Curso</h4>
                            <p className="mt-1 text-gray-900 font-medium">
                                {courses.find(c => c.id === searchResultStudent.courseId)?.name || 'No asignado'}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Grupos y Proyectos</h4>
                            <div className="mt-2 space-y-3">
                                {groups.filter(g => searchResultStudent.groupIds?.includes(g.id)).length > 0 ? (
                                    groups.filter(g => searchResultStudent.groupIds?.includes(g.id)).map(group => {
                                        const associatedProject = projects.find(p => p.groupId === group.id);
                                        return (
                                            <div 
                                                key={group.id} 
                                                onClick={() => handleGroupClick(group.id)}
                                                className="p-3 bg-blue-50 rounded-md border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-blue-900">
                                                            <span className="font-semibold text-blue-700">Nombre del grupo:</span> {group.name}
                                                        </p>
                                                        <p className="font-bold text-blue-900 mt-1">
                                                            <span className="font-semibold text-blue-700">Nombre del proyecto:</span> {associatedProject?.name || 'Sin proyecto asociado'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-red-600 italic font-medium">Este alumno no pertenece a ningún grupo.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setIsInfoModalOpen(false)} className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Students;
