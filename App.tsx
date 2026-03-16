import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Group, Task, Project, Role, RA, Tutorial, StoredFile, Message, Course } from './types';
import { supabase } from './lib/supabase';
import { mapUser, mapGroup, mapProject, mapTask, mapRA, mapTutorial, mapStoredFile, mapMessage } from './lib/mappers';
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
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [ras, setRas] = useState<RA[]>([]);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseDates, setCourseDates] = useState({ startDate: '2025-09-15', endDate: '2026-06-19' });
    
    const [modules, setModules] = useState<string[]>([]);

    const fetchAllData = useCallback(async () => {
        try {
            // Fetch Users
            const { data: usersData } = await supabase.from('users').select('*, group_members(group_id)');
            const fetchedUsers = usersData ? usersData.map(mapUser) : [];
            setUsers(fetchedUsers);

            // Fetch Groups
            const { data: groupsData } = await supabase.from('groups').select('*, group_members(user_id)');
            const fetchedGroups = groupsData ? groupsData.map(g => mapGroup(g, fetchedUsers)) : [];
            setGroups(fetchedGroups);

            // Fetch Courses
            const { data: coursesData } = await supabase.from('courses').select('*');
            setCourses(coursesData || []);

            // Fetch Projects
            const { data: projectsData } = await supabase.from('projects').select('*');
            setProjects(projectsData ? projectsData.map(mapProject) : []);

            // Fetch Tasks
            const { data: tasksData } = await supabase.from('tasks').select('*');
            setTasks(tasksData ? tasksData.map(mapTask) : []);

            // Fetch RAs
            const { data: rasData } = await supabase.from('ras').select('*');
            const fetchedRas = rasData ? rasData.map(mapRA) : [];
            setRas(fetchedRas);
            
            // Update modules based on fetched RAs
            const uniqueModules = Array.from(new Set(fetchedRas.map(r => r.module)));
            setModules(prev => Array.from(new Set([...prev, ...uniqueModules])).sort());

            // Fetch Tutorials
            const { data: tutorialsData } = await supabase.from('tutorials').select('*');
            setTutorials(tutorialsData ? tutorialsData.map(mapTutorial) : []);

            // Fetch Files
            const { data: filesData } = await supabase.from('stored_files').select('*');
            setFiles(filesData ? filesData.map(mapStoredFile) : []);

            // Fetch Messages
            const { data: messagesData } = await supabase.from('messages').select('*, message_recipients(user_id, is_read), message_target_groups(group_id)');
            const fetchedMessages = messagesData ? messagesData.map(mapMessage) : [];
            setMessages(fetchedMessages);

            // Fetch Course Dates
            const { data: settingsData } = await supabase.from('settings').select('*');
            if (settingsData) {
                const dates = settingsData.find(s => s.key === 'course_dates');
                if (dates && dates.value) setCourseDates(dates.value);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            const unread = messages.filter(msg => 
                msg.recipientIds.includes(currentUser.id) && !msg.readBy.includes(currentUser.id)
            );
            if (unread.length > 0) {
                setUnreadMessagesToShow(unread);
            }
        }
    }, [messages, currentUser]);

    // Fetch data initially and set up a simple interval or just rely on manual refetches after mutations
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('*, group_members(group_id)')
                    .eq('id', session.user.id)
                    .single();
                
                if (usersData) {
                    setCurrentUser(mapUser(usersData));
                    setPage('dashboard');
                    await fetchAllData();
                }
            } else {
                fetchAllData();
            }
        };
        checkSession();
    }, [fetchAllData]);

    const handleLogin = useCallback(async (username: string, password: string): Promise<void> => {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (authError) {
            setAuthError('Usuario o contraseña incorrectos.');
            return;
        }

        if (authData.user) {
            const { data: usersData, error: userError } = await supabase
                .from('users')
                .select('*, group_members(group_id)')
                .eq('id', authData.user.id)
                .single();

            if (usersData) {
                const user = mapUser(usersData);
                setCurrentUser(user);
                setAuthError('');
                setPage('dashboard');
                await fetchAllData();
            } else {
                setAuthError('Error al cargar el perfil de usuario.');
            }
        }
    }, [fetchAllData]);

    const handleLogout = useCallback(async (): Promise<void> => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    }, []);

    const handleSendMessage = async (messageData: { senderId: string; recipientIds: string[]; subject: string; body: string; targetType: 'tutors' | 'groups' | 'students'; targetGroupIds?: string[]; originalMessageId?: string; }) => {
        const { data: newMessageData, error } = await supabase.from('messages').insert({
            sender_id: messageData.senderId,
            target_type: messageData.targetType,
            subject: messageData.subject,
            body: messageData.body,
            original_message_id: messageData.originalMessageId || null,
            replied_by: messageData.originalMessageId ? messageData.senderId : null
        }).select().single();

        if (newMessageData) {
            if (messageData.recipientIds.length > 0) {
                await supabase.from('message_recipients').insert(
                    messageData.recipientIds.map(id => ({ message_id: newMessageData.id, user_id: id }))
                );
            }
            if (messageData.targetGroupIds && messageData.targetGroupIds.length > 0) {
                await supabase.from('message_target_groups').insert(
                    messageData.targetGroupIds.map(id => ({ message_id: newMessageData.id, group_id: id }))
                );
            }
            await fetchAllData();
        }
    };

    const handleMarkMessagesAsRead = async (messageIds: string[]) => {
        if (!currentUser) return;
        for (const msgId of messageIds) {
            await supabase.from('message_recipients')
                .update({ is_read: true })
                .eq('message_id', msgId)
                .eq('user_id', currentUser.id);
        }
        await fetchAllData();
        setUnreadMessagesToShow(prev => prev.filter(msg => !messageIds.includes(msg.id)));
    };

    const handleDeleteMessage = async (messageId: string) => {
        await supabase.from('messages').delete().eq('id', messageId);
        await fetchAllData();
    };

    const handleUpdateCourse = async (courseId: string, name: string) => {
        await supabase.from('courses').update({ name }).eq('id', courseId);
        await fetchAllData();
    };

    const handleDeleteCourse = async (courseId: string) => {
        await supabase.from('courses').delete().eq('id', courseId);
        await fetchAllData();
    };

    const handleCreateGroup = async (groupData: { name: string; tutorId: string; memberIds: string[]; projectName: string; projectDescription: string; startDate: string; endDate: string; }) => {
        const { data: newGroup, error: groupError } = await supabase.from('groups').insert({
            name: groupData.name,
            tutor_id: groupData.tutorId || null
        }).select().single();

        if (newGroup) {
            if (groupData.memberIds.length > 0) {
                await supabase.from('group_members').insert(
                    groupData.memberIds.map(id => ({ group_id: newGroup.id, user_id: id }))
                );
            }
            await supabase.from('projects').insert({
                name: groupData.projectName,
                description: groupData.projectDescription,
                group_id: newGroup.id,
                start_date: groupData.startDate,
                end_date: groupData.endDate
            });
            await fetchAllData();
        }
    };

    const handleUpdateGroup = async (groupId: string, groupData: { name: string; tutorId: string; memberIds: string[]; projectName: string; projectDescription: string; startDate: string; endDate: string; }) => {
        await supabase.from('groups').update({
            name: groupData.name,
            tutor_id: groupData.tutorId || null
        }).eq('id', groupId);

        await supabase.from('group_members').delete().eq('group_id', groupId);
        if (groupData.memberIds.length > 0) {
            await supabase.from('group_members').insert(
                groupData.memberIds.map(id => ({ group_id: groupId, user_id: id }))
            );
        }

        await supabase.from('projects').update({
            name: groupData.projectName,
            description: groupData.projectDescription,
            start_date: groupData.startDate,
            end_date: groupData.endDate
        }).eq('group_id', groupId);

        await fetchAllData();
    };
    
    const handleDeleteGroup = async (groupId: string) => {
        await supabase.from('groups').delete().eq('id', groupId);
        await fetchAllData();
    };

    const handleCreateTutor = async (tutorData: { name: string; password?: string }) => {
        await supabase.from('users').insert({
            name: tutorData.name,
            username: tutorData.name.split(' ')[0].toLowerCase() + Date.now().toString().slice(-4),
            password: tutorData.password || 'password',
            role: Role.Tutor
        });
        await fetchAllData();
    };

    const handleUpdateTutor = async (tutorId: string, tutorData: { name: string; password?: string }) => {
        const updateData: any = { name: tutorData.name };
        if (tutorData.password) updateData.password = tutorData.password;
        await supabase.from('users').update(updateData).eq('id', tutorId);
        await fetchAllData();
    };
    
    const handleDeleteTutor = async (tutorId: string) => {
        await supabase.from('users').delete().eq('id', tutorId);
        await fetchAllData();
    };

    const handleCreateStudent = async (studentData: { name: string; password?: string; courseGroup: string }) => {
        await supabase.from('users').insert({
            name: studentData.name,
            username: studentData.name.split(' ')[0].toLowerCase() + Date.now().toString().slice(-4),
            password: studentData.password || 'password',
            role: Role.Student,
            course_group: studentData.courseGroup
        });
        await fetchAllData();
    };

    const handleCreateStudentsBulk = async (studentsData: { name: string; password: string; courseGroup: string }[]) => {
        const timestamp = Date.now();
        const inserts = studentsData.map((studentData, index) => ({
            name: studentData.name.trim(),
            username: studentData.name.trim().split(' ')[0].toLowerCase() + timestamp.toString().slice(-4) + index,
            password: studentData.password.trim(),
            role: Role.Student,
            course_group: studentData.courseGroup
        }));
        await supabase.from('users').insert(inserts);
        await fetchAllData();
    };

    const handleUpdateStudent = async (studentId: string, studentData: { name: string; password?: string; courseGroup: string }) => {
        const updateData: any = { name: studentData.name, course_group: studentData.courseGroup };
        if (studentData.password) updateData.password = studentData.password;
        await supabase.from('users').update(updateData).eq('id', studentId);
        await fetchAllData();
    };

    const handleDeleteStudent = async (studentId: string) => {
        await supabase.from('users').delete().eq('id', studentId);
        await fetchAllData();
    };

    const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
        await supabase.from('tasks').insert({
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority,
            difficulty: taskData.difficulty,
            assignee_id: taskData.assigneeId || null,
            start_date: taskData.startDate,
            end_date: taskData.endDate,
            ra_id: taskData.raId || null,
            project_id: taskData.projectId,
            is_verified: taskData.isVerified || false
        });
        await fetchAllData();
    };

    const handleUpdateTask = async (taskId: string, taskData: Partial<Omit<Task, 'id'>>) => {
        const updateData: any = {};
        if (taskData.title !== undefined) updateData.title = taskData.title;
        if (taskData.description !== undefined) updateData.description = taskData.description;
        if (taskData.status !== undefined) updateData.status = taskData.status;
        if (taskData.priority !== undefined) updateData.priority = taskData.priority;
        if (taskData.difficulty !== undefined) updateData.difficulty = taskData.difficulty;
        if (taskData.assigneeId !== undefined) updateData.assignee_id = taskData.assigneeId || null;
        if (taskData.startDate !== undefined) updateData.start_date = taskData.startDate;
        if (taskData.endDate !== undefined) updateData.end_date = taskData.endDate;
        if (taskData.raId !== undefined) updateData.ra_id = taskData.raId || null;
        if (taskData.isVerified !== undefined) updateData.is_verified = taskData.isVerified;
        
        await supabase.from('tasks').update(updateData).eq('id', taskId);
        await fetchAllData();
    };

    const handleDeleteTask = async (taskId: string) => {
        await supabase.from('tasks').delete().eq('id', taskId);
        await fetchAllData();
    };
    
    const handleCreateRA = async (raData: { module: string; code: string; description: string }) => {
        await supabase.from('ras').insert({
            module: raData.module,
            code: raData.code,
            description: raData.description
        });
        await fetchAllData();
    };
    
    const handleUpdateRA = async (raId: string, raData: { module: string; code: string; description: string }) => {
        await supabase.from('ras').update({
            module: raData.module,
            code: raData.code,
            description: raData.description
        }).eq('id', raId);
        await fetchAllData();
    };

    const handleDeleteRA = async (raId: string) => {
        await supabase.from('ras').delete().eq('id', raId);
        await fetchAllData();
    };

    const handleCreateModule = (moduleName: string) => {
        const trimmedName = moduleName.trim();
        if (trimmedName && !modules.some(m => m.trim().toLowerCase() === trimmedName.toLowerCase())) {
            setModules(prev => [...prev, trimmedName].sort());
        }
    };

    const handleUpdateModule = async (oldName: string, newName: string) => {
        await supabase.from('ras').update({ module: newName }).eq('module', oldName);
        setModules(prev => prev.map(m => (m === oldName ? newName : m)).sort());
        await fetchAllData();
    };

    const handleDeleteModule = async (moduleName: string) => {
        await supabase.from('ras').delete().eq('module', moduleName);
        setModules(prev => prev.filter(m => m !== moduleName));
        await fetchAllData();
    };

    const handleCreateTutorial = async (tutorialData: Omit<Tutorial, 'id'>) => {
        await supabase.from('tutorials').insert({
            date: tutorialData.date,
            summary: tutorialData.summary,
            group_id: tutorialData.groupId,
            tutor_id: tutorialData.tutorId,
            location: tutorialData.location,
            next_date: tutorialData.nextDate,
            next_location: tutorialData.nextLocation,
            next_time: tutorialData.nextTime
        });
        await fetchAllData();
    };
    
    const handleUpdateTutorial = async (tutorialId: string, tutorialData: Partial<Omit<Tutorial, 'id'>>) => {
        const updateData: any = {};
        if (tutorialData.date !== undefined) updateData.date = tutorialData.date;
        if (tutorialData.summary !== undefined) updateData.summary = tutorialData.summary;
        if (tutorialData.groupId !== undefined) updateData.group_id = tutorialData.groupId;
        if (tutorialData.tutorId !== undefined) updateData.tutor_id = tutorialData.tutorId;
        if (tutorialData.location !== undefined) updateData.location = tutorialData.location;
        if (tutorialData.nextDate !== undefined) updateData.next_date = tutorialData.nextDate;
        if (tutorialData.nextLocation !== undefined) updateData.next_location = tutorialData.nextLocation;
        if (tutorialData.nextTime !== undefined) updateData.next_time = tutorialData.nextTime;
        
        await supabase.from('tutorials').update(updateData).eq('id', tutorialId);
        await fetchAllData();
    };

    const handleDeleteTutorial = async (tutorialId: string) => {
        await supabase.from('tutorials').delete().eq('id', tutorialId);
        await fetchAllData();
    };

    const handleUpdateGroupLogbook = async (groupId: string, logbook: string) => {
        await supabase.from('groups').update({ logbook }).eq('id', groupId);
        await fetchAllData();
    };

    const handleUpdateCourseDates = async (dates: { startDate: string, endDate: string }) => {
        await supabase.from('settings').upsert({ key: 'course_dates', value: dates });
        await fetchAllData();
    };
    
    const handleUploadFile = async (file: File, groupId: string) => {
        await supabase.from('stored_files').insert({
            name: file.name,
            url: '#', // Placeholder URL
            group_id: groupId
        });
        await fetchAllData();
    };

    const handleDeleteFile = async (fileId: string) => {
        await supabase.from('stored_files').delete().eq('id', fileId);
        await fetchAllData();
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
                            courses={courses}
                            onUpdateCourse={handleUpdateCourse}
                            onDeleteCourse={handleDeleteCourse}
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
                            courses={courses}
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
