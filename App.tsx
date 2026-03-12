import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Group, Task, Project, Role, RA, Tutorial, StoredFile, Message } from './types';
import { MOCK_USERS, MOCK_GROUPS, MOCK_TASKS, MOCK_PROJECTS, MOCK_RAS, MOCK_TUTORIALS, MOCK_FILES, MOCK_MESSAGES } from './data';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import GanttChart from './components/GanttChart';
import Groups from './components/Groups';
import Tutors from './components/Tutors';
import RAs from './components/RAs';
import Students from './components/Students';
import Files from './components/Files';
import Calendar from './components/Calendar';
import ProjectDates from './components/ProjectDates';
import Messaging from './components/Messaging';
import Logbook from './components/Logbook';
import NotificationModal from './components/NotificationModal';
import InformationPage from './components/InformationPage';

export type Page = 'dashboard' | 'students' | 'ras' | 'tutors' | 'board' | 'gantt' | 'groups' | 'files' | 'calendar' | 'project-dates' | 'messaging' | 'information' | 'logbook';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>('dashboard');
    const [selectedKanbanProject, setSelectedKanbanProject] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string>('');
    const [unreadMessagesToShow, setUnreadMessagesToShow] = useState<Message[]>([]);

    // Centralized state for application data
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
    const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [ras, setRas] = useState<RA[]>(MOCK_RAS);
    const [tutorials, setTutorials] = useState<Tutorial[]>(MOCK_TUTORIALS);
    const [files, setFiles] = useState<StoredFile[]>(MOCK_FILES);
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [courseDates, setCourseDates] = useState({ startDate: '2025-09-15', endDate: '2026-06-19' });
    
    const initialModules = useMemo(() => Array.from(new Set(MOCK_RAS.map(r => r.module))), []);
    const [modules, setModules] = useState<string[]>(initialModules);


    const handleLogin = useCallback((username: string, password: string): void => {
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (user) {
            setCurrentUser(user);
            setAuthError('');
            setPage('dashboard');

            const unread = messages.filter(msg => 
                msg.recipientIds.includes(user.id) && !msg.readBy.includes(user.id)
            );
            if (unread.length > 0) {
                setUnreadMessagesToShow(unread);
            }

        } else {
            setAuthError('Usuario o contraseña incorrectos.');
        }
    }, [users, messages]);

    const handleLogout = useCallback((): void => {
        setCurrentUser(null);
    }, []);

    const handleSendMessage = (messageData: { senderId: string; recipientIds: string[]; subject: string; body: string; targetType: 'tutors' | 'groups' | 'students'; targetGroupIds?: string[]; originalMessageId?: string; }) => {
        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            ...messageData,
            timestamp: new Date().toISOString(),
            readBy: [],
        };

        if (messageData.originalMessageId) {
            // This is a reply, update the original message
            setMessages(prev => {
                const originalMessage = prev.find(m => m.id === messageData.originalMessageId);
                if (originalMessage) {
                    const updatedOriginalMessage = { ...originalMessage, repliedBy: messageData.senderId };
                    return [...prev.filter(m => m.id !== messageData.originalMessageId), updatedOriginalMessage, newMessage];
                }
                return [...prev, newMessage]; // Fallback if original not found
            });
        } else {
             setMessages(prev => [...prev, newMessage]);
        }
    };

    const handleMarkMessagesAsRead = (messageIds: string[]) => {
        if (!currentUser) return;
        setMessages(prev =>
            prev.map(msg =>
                messageIds.includes(msg.id) && !msg.readBy.includes(currentUser.id)
                    ? { ...msg, readBy: [...msg.readBy, currentUser.id] }
                    : msg
            )
        );
         setUnreadMessagesToShow(prev => prev.filter(msg => !messageIds.includes(msg.id)));
    };

    const handleDeleteMessage = (messageId: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    const handleCreateGroup = (groupData: { name: string; tutorId: string; memberIds: string[]; projectName: string; projectDescription: string; startDate: string; endDate: string; }) => {
        const groupId = `group-${Date.now()}`;
        const newGroup: Group = {
            id: groupId,
            name: groupData.name,
            tutorId: groupData.tutorId,
            members: users.filter(u => groupData.memberIds.includes(u.id)),
        };
         const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: groupData.projectName,
            description: groupData.projectDescription,
            groupId: groupId,
            startDate: groupData.startDate,
            endDate: groupData.endDate,
        };
        setGroups(prevGroups => [...prevGroups, newGroup]);
        setProjects(prevProjects => [...prevProjects, newProject]);
    };

    const handleUpdateGroup = (groupId: string, groupData: { name: string; tutorId: string; memberIds: string[]; projectName: string; projectDescription: string; startDate: string; endDate: string; }) => {
        setGroups(prevGroups =>
            prevGroups.map(group =>
                group.id === groupId
                    ? {
                          ...group,
                          name: groupData.name,
                          tutorId: groupData.tutorId,
                          members: users.filter(u => groupData.memberIds.includes(u.id)),
                      }
                    : group
            )
        );
         setProjects(prevProjects => 
            prevProjects.map(project => 
                project.groupId === groupId 
                    ? {
                        ...project,
                        name: groupData.projectName,
                        description: groupData.projectDescription,
                        startDate: groupData.startDate,
                        endDate: groupData.endDate,
                      }
                    : project
            )
        );
    };
    
    const handleDeleteGroup = (groupId: string) => {
        const projectsToDelete = projects.filter(p => p.groupId === groupId);
        const projectIdsToDelete = projectsToDelete.map(p => p.id);
        setTasks(prevTasks => prevTasks.filter(t => !projectIdsToDelete.includes(t.projectId)));
        setProjects(prevProjects => prevProjects.filter(p => p.groupId !== groupId));
        setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
    };

    const handleCreateTutor = (tutorData: { name: string; password?: string }) => {
        const newTutor: User = {
            id: `user-${Date.now()}`,
            name: tutorData.name,
            username: tutorData.name.split(' ')[0].toLowerCase() + Date.now().toString().slice(-4),
            password: tutorData.password || 'password',
            role: Role.Tutor,
            groupIds: [],
        };
        setUsers(prevUsers => [...prevUsers, newTutor]);
    };

    const handleUpdateTutor = (tutorId: string, tutorData: { name: string; password?: string }) => {
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === tutorId
                    ? {
                          ...user,
                          name: tutorData.name,
                          ...(tutorData.password && { password: tutorData.password }),
                      }
                    : user
            )
        );
    };
    
    const handleDeleteTutor = (tutorId: string) => {
        setGroups(prevGroups =>
            prevGroups.map(group =>
                group.tutorId === tutorId
                    ? { ...group, tutorId: '' }
                    : group
            )
        );
        setUsers(prevUsers => prevUsers.filter(user => user.id !== tutorId));
    };

    const handleCreateStudent = (studentData: { name: string; password?: string; courseGroup: string }) => {
        const newStudent: User = {
            id: `user-${Date.now()}`,
            name: studentData.name,
            username: studentData.name.split(' ')[0].toLowerCase() + Date.now().toString().slice(-4),
            password: studentData.password || 'password',
            role: Role.Student,
            groupIds: [], // Initially not assigned to a project group
            courseGroup: studentData.courseGroup,
        };
        setUsers(prevUsers => [...prevUsers, newStudent]);
    };

    const handleCreateStudentsBulk = (studentsData: { name: string; password: string; courseGroup: string }[]) => {
        const timestamp = Date.now();
        const newStudents: User[] = studentsData.map((studentData, index) => ({
            id: `user-${timestamp}-${index}`,
            name: studentData.name.trim(),
            username: studentData.name.trim().split(' ')[0].toLowerCase() + timestamp.toString().slice(-4) + index,
            password: studentData.password.trim(),
            role: Role.Student,
            groupIds: [],
            courseGroup: studentData.courseGroup,
        }));
        setUsers(prevUsers => [...prevUsers, ...newStudents]);
    };

    const handleUpdateStudent = (studentId: string, studentData: { name: string; password?: string; courseGroup: string }) => {
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === studentId
                    ? {
                          ...user,
                          name: studentData.name,
                          courseGroup: studentData.courseGroup,
                          ...(studentData.password && { password: studentData.password }),
                      }
                    : user
            )
        );
    };

    const handleDeleteStudent = (studentId: string) => {
        setGroups(prevGroups => 
            prevGroups.map(g => ({ ...g, members: g.members.filter(m => m.id !== studentId) }))
        );
        setTasks(prevTasks =>
            prevTasks.map(t => t.assigneeId === studentId ? { ...t, assigneeId: ''} : t)
        )
        setUsers(prevUsers => prevUsers.filter(user => user.id !== studentId));
    };


    const handleCreateTask = (taskData: Omit<Task, 'id'>) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            ...taskData,
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    };

    const handleUpdateTask = (taskId: string, taskData: Partial<Omit<Task, 'id'>>) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, ...taskData } : task
            )
        );
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };
    
    const handleCreateRA = (raData: { module: string; code: string; description: string }) => {
        const newRA: RA = {
            id: `ra-${Date.now()}`,
            ...raData,
        };
        setRas(prevRas => [...prevRas, newRA]);
    };
    
    const handleUpdateRA = (raId: string, raData: { module: string; code: string; description: string }) => {
        setRas(prevRas =>
            prevRas.map(ra =>
                ra.id === raId ? { ...ra, ...raData } : ra
            )
        );
    };

    const handleDeleteRA = (raId: string) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.raId === raId ? { ...task, raId: '' } : task
            )
        );
        setRas(prevRas => prevRas.filter(ra => ra.id !== raId));
    };

    const handleCreateModule = (moduleName: string) => {
        const trimmedName = moduleName.trim();
        if (trimmedName && !modules.some(m => m.trim().toLowerCase() === trimmedName.toLowerCase())) {
            setModules(prev => [...prev, trimmedName].sort());
        }
    };

    const handleUpdateModule = (oldName: string, newName: string) => {
        setModules(prev => prev.map(m => (m === oldName ? newName : m)).sort());
        setRas(prevRas => prevRas.map(ra => (ra.module === oldName ? { ...ra, module: newName } : ra)));
    };

    const handleDeleteModule = (moduleName: string) => {
        const raIdsToDelete = ras.filter(ra => ra.module === moduleName).map(r => r.id);
        setTasks(prevTasks =>
            prevTasks.map(task =>
                raIdsToDelete.includes(task.raId) ? { ...task, raId: '' } : task
            )
        );
        setRas(prevRas => prevRas.filter(ra => ra.module !== moduleName));
        setModules(prev => prev.filter(m => m !== moduleName));
    };

    const handleCreateTutorial = (tutorialData: Omit<Tutorial, 'id'>) => {
        const newTutorial: Tutorial = {
            id: `tut-${Date.now()}`,
            ...tutorialData,
        };
        setTutorials(prevTutorials => [...prevTutorials, newTutorial]);
    };
    
    const handleUpdateTutorial = (tutorialId: string, tutorialData: Partial<Omit<Tutorial, 'id'>>) => {
        setTutorials(prev => prev.map(t => t.id === tutorialId ? { ...t, ...tutorialData } : t));
    };

    const handleDeleteTutorial = (tutorialId: string) => {
        setTutorials(prev => prev.filter(t => t.id !== tutorialId));
    };

    const handleUpdateGroupLogbook = (groupId: string, logbook: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, logbook } : g));
    };

    const handleUpdateCourseDates = (dates: { startDate: string, endDate: string }) => {
        setCourseDates(dates);
    };
    
    const handleUploadFile = (file: File, groupId: string) => {
        const newFile: StoredFile = {
            id: `file-${Date.now()}`,
            name: file.name,
            url: '#', // Placeholder URL for mock data
            uploadedAt: new Date().toISOString(),
            groupId: groupId,
        };
        setFiles(prevFiles => [...prevFiles, newFile]);
    };

    const handleDeleteFile = (fileId: string) => {
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    };

    const handleNavigateToKanban = (projectId: string) => {
        setPage('board');
        setSelectedKanbanProject(projectId);
    };

    const renderPage = useMemo(() => {
        if (!currentUser) return null;
        switch (page) {
            case 'dashboard':
                return <Dashboard 
                            user={currentUser} 
                            groups={groups} 
                            projects={projects} 
                            tasks={tasks} 
                            allUsers={users}
                            messages={messages}
                            tutorials={tutorials}
                            ras={ras}
                            courseDates={courseDates}
                            onNavigateToKanban={handleNavigateToKanban}
                            onSendMessage={handleSendMessage}
                            onMarkMessagesAsRead={handleMarkMessagesAsRead}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                        />;
            case 'project-dates':
                return <ProjectDates
                            courseDates={courseDates}
                            onUpdate={handleUpdateCourseDates}
                        />;
            case 'students':
                return <Students 
                            users={users}
                            onCreate={handleCreateStudent}
                            onCreateBulk={handleCreateStudentsBulk}
                            onUpdate={handleUpdateStudent}
                            onDelete={handleDeleteStudent}
                        />;
            case 'ras':
                return <RAs
                            ras={ras}
                            modules={modules}
                            onCreateRA={handleCreateRA}
                            onUpdateRA={handleUpdateRA}
                            onDeleteRA={handleDeleteRA}
                            onCreateModule={handleCreateModule}
                            onUpdateModule={handleUpdateModule}
                            onDeleteModule={handleDeleteModule}
                        />;
            case 'tutors':
                return <Tutors 
                            users={users}
                            groups={groups}
                            onCreate={handleCreateTutor}
                            onUpdate={handleUpdateTutor}
                            onDelete={handleDeleteTutor}
                        />;
            case 'board':
                return <KanbanBoard 
                            user={currentUser} 
                            groups={groups} 
                            projects={projects} 
                            tasks={tasks}
                            users={users}
                            ras={ras}
                            courseDates={courseDates}
                            onCreateTask={handleCreateTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            initialProjectId={selectedKanbanProject}
                            onProjectSelected={() => setSelectedKanbanProject(null)}
                        />;
            case 'gantt':
                return <GanttChart 
                            user={currentUser} 
                            groups={groups} 
                            projects={projects} 
                            tasks={tasks} 
                            courseDates={courseDates} 
                            allUsers={users} 
                            ras={ras}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                        />;
            case 'groups':
                return <Groups 
                            user={currentUser} 
                            groups={groups} 
                            projects={projects}
                            allUsers={users}
                            tasks={tasks}
                            courseDates={courseDates}
                            onCreate={handleCreateGroup}
                            onUpdate={handleUpdateGroup}
                            onDelete={handleDeleteGroup}
                            onNavigateToKanban={handleNavigateToKanban}
                        />;
            case 'messaging':
                return <Messaging 
                            user={currentUser}
                            allUsers={users}
                            groups={groups}
                            projects={projects}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onDeleteMessage={handleDeleteMessage}
                            onMarkMessagesAsRead={handleMarkMessagesAsRead}
                        />;
            case 'files':
                return <Files 
                            user={currentUser}
                            files={files}
                            groups={groups}
                            allUsers={users}
                            projects={projects}
                            onUploadFile={handleUploadFile}
                            onDeleteFile={handleDeleteFile}
                        />;
            case 'calendar':
                return <Calendar 
                            user={currentUser}
                            tutorials={tutorials}
                            groups={groups}
                            allUsers={users}
                            projects={projects}
                            onCreateTutorial={handleCreateTutorial}
                            onUpdateTutorial={handleUpdateTutorial}
                            onDeleteTutorial={handleDeleteTutorial}
                            courseDates={courseDates}
                        />;
            case 'logbook':
                return <Logbook 
                            user={currentUser}
                            groups={groups}
                            allUsers={users}
                            projects={projects}
                            onUpdateLogbook={handleUpdateGroupLogbook}
                        />;
            case 'information':
                return <InformationPage />;
            default:
                 return <Dashboard 
                            user={currentUser} 
                            groups={groups} 
                            projects={projects} 
                            tasks={tasks} 
                            allUsers={users}
                            messages={messages}
                            tutorials={tutorials}
                            ras={ras}
                            courseDates={courseDates}
                            onNavigateToKanban={handleNavigateToKanban}
                            onSendMessage={handleSendMessage}
                            onMarkMessagesAsRead={handleMarkMessagesAsRead}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                        />;
        }
    }, [page, currentUser, users, groups, projects, tasks, ras, modules, tutorials, files, courseDates, selectedKanbanProject, messages]);

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} error={authError} />;
    }

    return (
        <Layout user={currentUser} onLogout={handleLogout} currentPage={page} setPage={setPage}>
            {renderPage}
            {unreadMessagesToShow.length > 0 && currentUser && (
                <NotificationModal
                    messages={unreadMessagesToShow}
                    allUsers={users}
                    onClose={() => {
                        setUnreadMessagesToShow([]);
                    }}
                    onReply={() => {
                        setPage('messaging');
                        setUnreadMessagesToShow([]);
                    }}
                    onMarkMessagesAsRead={handleMarkMessagesAsRead}
                />
            )}
        </Layout>
    );
};

export default App;