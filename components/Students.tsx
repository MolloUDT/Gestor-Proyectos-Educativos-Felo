
import React, { useState, useMemo } from 'react';
import { User, Role, Course } from '../types';
import Modal from './Modal';
import { EditIcon, TrashIcon, PlusCircleIcon, ChevronDownIcon, EyeIcon, EyeOffIcon, UsersIcon, UserIcon } from './Icons';

interface StudentsProps {
    users: User[];
    courses: Course[];
    onUpdateCourse: (courseId: string, name: string) => void;
    onDeleteCourse: (courseId: string) => void;
    onCreateCourse: (name: string) => void;
    onCreate: (data: { name: string; username?: string; password?: string; courseId: string }) => void;
    onCreateBulk: (students: { name: string; password: string; courseId: string }[]) => void;
    onUpdate: (id: string, data: { name: string; username?: string; password?: string; courseId: string }) => void;
    onDelete: (id: string) => void;
}

const StudentForm: React.FC<{
    student: Partial<User> | null;
    onSave: (data: { name: string; username?: string; password?: string, courseId: string }) => void;
    onCancel: () => void;
    courses: Course[];
}> = ({ student, onSave, onCancel, courses }) => {
    const [name, setName] = useState(student?.name || '');
    const [username, setUsername] = useState(student?.username || '');
    const [password, setPassword] = useState('');
    const [courseId, setCourseId] = useState(student?.courseId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, ...(username && { username }), ...(password && { password }), courseId });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Nombre y Apellidos</label>
                <input
                    type="text"
                    id="studentName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    required
                />
            </div>
            <div>
                <label htmlFor="studentUsername" className="block text-sm font-medium text-gray-700">Nombre de Usuario (opcional)</label>
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
    onSave: (students: { name: string; password: string; courseId: string }[]) => void;
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
                if (columns.length !== 2) {
                    throw new Error(`Error en la fila ${index + 1}: Se esperan 2 columnas (Nombre y Contraseña), pero se encontraron ${columns.length}. Asegúrate de copiar solo esas dos columnas.`);
                }
                
                const name = columns[0].trim();
                const password = columns[1].trim();
                if (!name || !password) {
                    throw new Error(`Error en la fila ${index + 1}: El nombre y la contraseña no pueden estar vacíos.`);
                }
                
                return { name, password, courseId };
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
                    <li>Asegúrate de tener <strong>dos columnas</strong>: Nombre y Contraseña.</li>
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
                    placeholder={`Nombre Alumno 1\tContraseña1\nNombre Alumno 2\tContraseña2`}
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

const Students: React.FC<StudentsProps> = ({ users, courses, onUpdateCourse, onDeleteCourse, onCreateCourse, onCreate, onCreateBulk, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
    const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
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

    const handleSave = (studentData: { name: string; username?: string; password?: string, courseId: string }) => {
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

    const handleBulkSave = (studentsToCreate: { name: string; password: string; courseId: string }[]) => {
        onCreateBulk(studentsToCreate);
        setIsBulkModalOpen(false);
    };

    const handleEditCourse = () => {
        if (editingCourse && editingCourse.name) {
            // This needs to be implemented in App.tsx and passed down
            setEditingCourse(null);
            setIsEditCourseModalOpen(false);
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
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Nombre</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Nombre de Usuario</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Contraseña</th>
                                                        <th className="px-4 py-2 font-semibold text-gray-600">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {students.map(student => (
                                                        <tr key={student.id}>
                                                            <td className="px-4 py-2 font-medium text-gray-800">{student.name}</td>
                                                            <td className="px-4 py-2 text-gray-600">{student.username}</td>
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
                        <p className="my-2 text-xl font-bold text-red-600">"{studentToDelete.name}"</p>
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
        </div>
    );
};

export default Students;
