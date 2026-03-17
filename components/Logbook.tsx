import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { User, Group, Project, Course, Task, Role } from '../types';
import { ChevronDownIcon, SaveIcon, ArrowLeftIcon } from './Icons';
import { GroupCard } from './GroupCard';

interface LogbookProps {
    user: User;
    groups: Group[];
    projects: Project[];
    allUsers: User[];
    courses: Course[];
    tasks: Task[];
    onUpdateLogbook: (groupId: string, logbook: string) => void;
}

const QuillComponent = ReactQuill as any;

const Logbook: React.FC<LogbookProps> = ({ user, groups, projects, allUsers, courses, tasks, onUpdateLogbook }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [logContent, setLogContent] = useState('');
    const [expandedCourseGroups, setExpandedCourseGroups] = useState<Record<string, boolean>>({});
    const quillRef = useRef<any>(null);

    const projectsByCourse = useMemo(() => {
        const result: Record<string, { project: Project, group: Group }[]> = {};
        
        projects.forEach(project => {
            const group = groups.find(g => g.id === project.groupId);
            if (group && group.courseId) {
                const course = courses.find(c => c.id === group.courseId);
                const courseName = course ? course.name : 'Curso sin nombre';

                if (!result[courseName]) {
                    result[courseName] = [];
                }
                result[courseName].push({ project, group });
            }
        });
        return result;
    }, [projects, groups, courses]);

    const toggleCourseGroup = (courseGroupName: string) => {
        setExpandedCourseGroups(prev => ({ ...prev, [courseGroupName]: !prev[courseGroupName] }));
    };

    const handleSelectGroup = (group: Group) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES');
        const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        // Header with blank line after
        const header = `<p class="logbook-header"><strong>[${user.name} - ${dateStr} ${timeStr}]</strong></p><p><br></p>`;
        const existingContent = group.logbook || '';
        const newContent = header + existingContent;
        
        setSelectedGroupId(group.id);
        setLogContent(newContent);
    };

    const handleSave = () => {
        if (selectedGroupId) {
            onUpdateLogbook(selectedGroupId, logContent);
            setSelectedGroupId(null);
            setLogContent('');
        }
    };

    useEffect(() => {
        if (selectedGroupId && quillRef.current) {
            const timer = setTimeout(() => {
                const editor = quillRef.current?.getEditor();
                if (editor) {
                    editor.focus();
                    // Place cursor after the header (which is roughly 2 paragraphs)
                    // We'll just place it at the end of the header
                    const firstParagraph = editor.getContents().ops[0]?.insert;
                    if (typeof firstParagraph === 'string') {
                        // The header is roughly the first line + the blank line
                        // Let's just place it after the header part.
                        // A safer way is to find the first newline or just place it at the end of the header.
                        // Since we prepend, the header is at the start.
                        // Let's try to find the length of the header string.
                        const headerText = `[${user.name} - ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n\n`;
                        editor.setSelection(headerText.length, 0);
                    }
                }
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [selectedGroupId, user.name]);

    const modules = {
        toolbar: [
            ['bold'],
            [{ 'color': [] }],
            ['clean']
        ],
    };

    if (selectedGroupId) {
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        const selectedProject = projects.find(p => p.groupId === selectedGroupId);

        return (
            <div>
                <style>{`
                    .ql-editor p {
                        text-align: justify;
                        margin-bottom: 0.5rem;
                    }
                    .ql-editor p.logbook-header {
                        text-align: left;
                        margin-bottom: 0;
                    }
                    .ql-container {
                        font-size: 1rem;
                        min-height: 400px;
                    }
                `}</style>
                <div className="flex items-center justify-start mb-6">
                    <button 
                        onClick={() => setSelectedGroupId(null)}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Volver al listado
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-green-50 border-b border-green-100">
                        <h3 className="text-lg font-bold text-green-800">{selectedProject?.name}</h3>
                        <p className="text-sm text-green-600">Grupo: {selectedGroup?.name}</p>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <QuillComponent
                                ref={quillRef}
                                theme="snow"
                                value={logContent}
                                onChange={setLogContent}
                                modules={modules}
                                className="bg-white rounded-lg"
                                placeholder="Empieza a escribir aquí..."
                            />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="flex items-center px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                            >
                                <SaveIcon className="w-5 h-5 mr-2" />
                                Guardar Bitácora
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Title removed as per user request */}
            <p className="text-gray-600 mb-8">Selecciona un grupo para ver o añadir entradas a su cuaderno de bitácora.</p>
            
            <div className="space-y-4">
                {Object.keys(projectsByCourse).sort().map(courseName => {
                    const projectsData = projectsByCourse[courseName];
                    const isExpanded = !!expandedCourseGroups[courseName];
                    return (
                        <div key={courseName} className="bg-white rounded-lg shadow-md">
                            <button 
                                onClick={() => toggleCourseGroup(courseName)} 
                                className="flex items-center justify-between w-full p-4 text-left focus:outline-none"
                            >
                                <div className="flex items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{courseName}</h3>
                                    <span className="ml-4 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                                        {projectsData.length} {projectsData.length === 1 ? 'proyecto' : 'proyectos'}
                                    </span>
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 gap-6">
                                        {projectsData.map(({ project, group }) => (
                                            <GroupCard 
                                                key={project.id}
                                                group={group}
                                                projects={projects}
                                                allUsers={allUsers}
                                                tasks={tasks}
                                                user={user}
                                                courses={courses}
                                                onCardClick={() => handleSelectGroup(group)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Logbook;
