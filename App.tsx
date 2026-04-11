import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Group, Task, Project, Role, RA, Tutorial, StoredFile, Message, Course, Module } from './types';
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

import ProfileModal from './components/ProfileModal';

export type Page = 'dashboard' | 'students' | 'ras' | 'tutors' | 'board' | 'gantt' | 'groups' | 'files' | 'calendar' | 'project-dates' | 'messaging' | 'information' | 'logbook';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>('dashboard');
    const [selectedKanbanProject, setSelectedKanbanProject] = useState<string | null>(null);
    const [selectedCalendarGroup, setSelectedCalendarGroup] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string>('');
    const [unreadMessagesToShow, setUnreadMessagesToShow] = useState<Message[]>([]);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    
    const [modules, setModules] = useState<Module[]>([]);

    const fetchAllData = useCallback(async () => {
        console.log("Fetching all data from Supabase...");
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

            // Fetch Modules
            const { data: modulesData } = await supabase.from('modules').select('*');
            setModules(modulesData ? modulesData.map(m => ({ id: m.id, name: m.name, courseId: m.course_id })) : []);

            // Fetch RAs
            const { data: rasData } = await supabase.from('ras').select('*');
            const fetchedRas = rasData ? rasData.map(mapRA) : [];
            setRas(fetchedRas);

            // Fetch Tutorials
            const { data: tutorialsData, error: tutorialsError } = await supabase.from('tutorials').select('*');
            if (tutorialsError) {
                console.error("Error fetching tutorials:", tutorialsError);
            } else {
                console.log(`Fetched ${tutorialsData?.length || 0} tutorials from DB`);
                setTutorials(tutorialsData ? tutorialsData.map(mapTutorial) : []);
            }

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
            try {
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
            } catch (error) {
                console.error("Error checking session:", error);
                fetchAllData();
            }
        };
        checkSession();
    }, [fetchAllData]);

    // Real-time subscription to keep data in sync
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel(`db-changes-${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tutorials'
                },
                (payload) => {
                    console.log('Tutorial real-time change:', payload.eventType, payload);
                    if (payload.eventType === 'DELETE' && payload.old) {
                        const deletedId = payload.old.id;
                        setTutorials(prev => prev.filter(t => t.id !== deletedId));
                    }
                    // Re-fetch to ensure full sync with related data
                    setTimeout(() => fetchAllData(), 500);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('Message real-time change:', payload.eventType, payload);
                    if (payload.eventType === 'DELETE' && payload.old) {
                        const deletedId = payload.old.id;
                        setMessages(prev => prev.filter(m => m.id !== deletedId));
                    }
                    setTimeout(() => fetchAllData(), 500);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks'
                },
                (payload) => {
                    console.log('Task real-time change:', payload.eventType, payload);
                    if (payload.eventType === 'DELETE' && payload.old) {
                        const deletedId = payload.old.id;
                        setTasks(prev => prev.filter(t => t.id !== deletedId));
                    }
                    setTimeout(() => fetchAllData(), 500);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                },
                (payload) => {
                    // Fallback for other tables
                    if (payload.table !== 'tutorials' && payload.table !== 'messages' && payload.table !== 'tasks') {
                        console.log('Other real-time change:', payload.table, payload.eventType, payload);
                        setTimeout(() => fetchAllData(), 500);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Real-time subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, fetchAllData]);

    const handleLogin = useCallback(async (username: string, password: string): Promise<void> => {
        try {
            console.log("Attempting login for:", username);
            // Buscar directamente en la tabla users
            const { data: usersData, error: userError } = await supabase
                .from('users')
                .select('*, group_members(group_id)')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (userError) {
                console.error("Login error from Supabase:", userError);
            }
            
            if (userError || !usersData) {
                setAuthError('Usuario o contraseña incorrectos.');
                return;
            }

            console.log("Login successful for:", usersData);
            const user = mapUser(usersData);
            setCurrentUser(user);
            setAuthError('');
            setPage('dashboard');
            await fetchAllData();
        } catch (error) {
            console.error("Unexpected error during login:", error);
            setAuthError('Error inesperado al iniciar sesión.');
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

    const handleCreateCourse = async (name: string) => {
        const { error } = await supabase.from('courses').insert({ name });
        if (error) console.error("Error creating course:", error);
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

    const handleCreateGroup = async (groupData: { name: string; tutorId: string; memberIds: string[]; projectName: string; projectDescription: string; startDate: string; endDate: string; courseId: string; }) => {
        const { data: newGroup, error: groupError } = await supabase.from('groups').insert({
            name: groupData.name,
            tutor_id: groupData.tutorId || null,
            course_id: groupData.courseId
        }).select().single();

        if (groupError) console.error("Error creating group:", groupError);

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

    const handleUpdateGroup = async (groupId: string, groupData: { name: string; tutorId: string; memberIds: string[]; projectName: string; projectDescription: string; startDate: string; endDate: string; courseId: string; }) => {
        const { error: groupError } = await supabase.from('groups').update({
            name: groupData.name,
            tutor_id: groupData.tutorId || null,
            course_id: groupData.courseId
        }).eq('id', groupId);

        if (groupError) console.error("Error updating group:", groupError);

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

    const handleCreateTutor = async (tutorData: { firstName: string; lastName: string; username?: string; password?: string }) => {
        await supabase.from('users').insert({
            first_name: tutorData.firstName,
            last_name: tutorData.lastName,
            username: tutorData.username || tutorData.firstName.toLowerCase() + Date.now().toString().slice(-4),
            password: tutorData.password || 'password',
            role: Role.Tutor
        });
        await fetchAllData();
    };

    const handleUpdateTutor = async (tutorId: string, tutorData: { firstName: string; lastName: string; username?: string; password?: string }) => {
        const updateData: any = { first_name: tutorData.firstName, last_name: tutorData.lastName };
        if (tutorData.username) updateData.username = tutorData.username;
        if (tutorData.password) updateData.password = tutorData.password;
        await supabase.from('users').update(updateData).eq('id', tutorId);
        await fetchAllData();
    };
    
    const handleDeleteTutor = async (tutorId: string) => {
        await supabase.from('users').delete().eq('id', tutorId);
        await fetchAllData();
    };

    const handleCreateStudent = async (studentData: { firstName: string; lastName: string; username?: string; password?: string; courseId: string }) => {
        const { error } = await supabase.from('users').insert({
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            username: studentData.username || studentData.firstName.toLowerCase() + Date.now().toString().slice(-4),
            password: studentData.password || 'password',
            role: Role.Student,
            course_id: studentData.courseId
        });
        if (error) console.error("Error creating student:", error);
        await fetchAllData();
    };

    const handleCreateStudentsBulk = async (studentsData: { firstName: string; lastName: string; password: string; courseId: string }[]) => {
        const timestamp = Date.now();
        const inserts = studentsData.map((studentData, index) => ({
            first_name: studentData.firstName.trim(),
            last_name: studentData.lastName.trim(),
            username: studentData.firstName.trim().toLowerCase() + timestamp.toString().slice(-4) + index,
            password: studentData.password.trim(),
            role: Role.Student,
            course_id: studentData.courseId
        }));
        const { error } = await supabase.from('users').insert(inserts);
        if (error) console.error("Error creating students in bulk:", error);
        await fetchAllData();
    };

    const handleUpdateStudent = async (studentId: string, studentData: { firstName: string; lastName: string; username?: string; password?: string; courseId: string }) => {
        const updateData: any = { first_name: studentData.firstName, last_name: studentData.lastName, course_id: studentData.courseId };
        if (studentData.username) updateData.username = studentData.username;
        if (studentData.password) updateData.password = studentData.password;
        const { error } = await supabase.from('users').update(updateData).eq('id', studentId);
        if (error) console.error("Error updating student:", error);
        await fetchAllData();
    };

    const handleDeleteStudent = async (studentId: string) => {
        await supabase.from('users').delete().eq('id', studentId);
        await fetchAllData();
    };

    const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
        const { error } = await supabase.from('tasks').insert({
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
        if (error) console.error("Error creating task:", error);
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
        if (taskData.projectId !== undefined) updateData.project_id = taskData.projectId;
        if (taskData.isVerified !== undefined) updateData.is_verified = taskData.isVerified;
        
        const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
        if (error) console.error("Error updating task:", error);
        await fetchAllData();
    };

    const handleDeleteTask = async (taskId: string) => {
        await supabase.from('tasks').delete().eq('id', taskId);
        await fetchAllData();
    };
    
    const handleCreateRA = async (raData: { moduleIds: string[]; code: string; description: string; }) => {
        for (const moduleId of raData.moduleIds) {
            await supabase.from('ras').insert({
                module: moduleId,
                code: raData.code,
                description: raData.description
            });
        }
        await fetchAllData();
    };
    
    const handleUpdateRA = async (raId: string, raData: { moduleId: string; code: string; description: string }) => {
        await supabase.from('ras').update({
            module: raData.moduleId,
            code: raData.code,
            description: raData.description
        }).eq('id', raId);
        await fetchAllData();
    };

    const handleDeleteRA = async (raId: string) => {
        await supabase.from('ras').delete().eq('id', raId);
        await fetchAllData();
    };

    const handleCreateModule = async (moduleData: { name: string; courseIds: string[] }) => {
        for (const courseId of moduleData.courseIds) {
            await supabase.from('modules').insert({
                name: moduleData.name,
                course_id: courseId
            });
        }
        await fetchAllData();
    };

    const handleUpdateModule = async (moduleId: string, name: string) => {
        const moduleToUpdate = modules.find(m => m.id === moduleId);
        if (moduleToUpdate) {
            await supabase.from('modules').update({ name }).eq('name', moduleToUpdate.name);
            await fetchAllData();
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        await supabase.from('modules').delete().eq('id', moduleId);
        await fetchAllData();
    };

    const handleCreateTutorial = async (tutorialData: Omit<Tutorial, 'id'>) => {
        const payload: any = {
            date: tutorialData.date,
            time: tutorialData.time,
            summary: tutorialData.summary,
            group_id: tutorialData.groupId,
            tutor_id: tutorialData.tutorId,
            location: tutorialData.location,
            status: tutorialData.status,
            attendee_ids: tutorialData.attendeeIds,
            type: tutorialData.type,
            next_date: tutorialData.date // Fallback for old schema constraint
        };

        let { error } = await supabase.from('tutorials').insert(payload);
        let retries = 0;
        
        while (error && retries < 5) {
            const msg = error.message.toLowerCase();
            if (msg.includes('status')) {
                delete payload.status;
            } else if (msg.includes('attendee_ids')) {
                delete payload.attendee_ids;
            } else if (msg.includes('location')) {
                delete payload.location;
            } else if (msg.includes('time')) {
                delete payload.time;
            } else if (msg.includes('next_date')) {
                delete payload.next_date;
            } else if (msg.includes('type')) {
                delete payload.type;
            } else {
                break;
            }
            
            const { error: retryError } = await supabase.from('tutorials').insert(payload);
            error = retryError;
            retries++;
        }

        if (error) {
            console.error("Final error creating tutorial after retries:", error);
            return error;
        }
        await fetchAllData();
        return null;
    };
    
    const handleUpdateTutorial = async (tutorialId: string, tutorialData: Partial<Omit<Tutorial, 'id'>>) => {
        const updateData: any = {};
        if (tutorialData.date !== undefined) {
            updateData.date = tutorialData.date;
            updateData.next_date = tutorialData.date; // Fallback for old schema constraint
        }
        if (tutorialData.time !== undefined) updateData.time = tutorialData.time;
        if (tutorialData.summary !== undefined) updateData.summary = tutorialData.summary;
        if (tutorialData.groupId !== undefined) updateData.group_id = tutorialData.groupId;
        if (tutorialData.tutorId !== undefined) updateData.tutor_id = tutorialData.tutorId;
        if (tutorialData.location !== undefined) updateData.location = tutorialData.location;
        if (tutorialData.status !== undefined) updateData.status = tutorialData.status;
        if (tutorialData.attendeeIds !== undefined) updateData.attendee_ids = tutorialData.attendeeIds;
        if (tutorialData.type !== undefined) updateData.type = tutorialData.type;
        
        let { error } = await supabase.from('tutorials').update(updateData).eq('id', tutorialId);
        let retries = 0;
        
        while (error && retries < 5) {
            const msg = error.message.toLowerCase();
            if (msg.includes('status')) {
                delete updateData.status;
            } else if (msg.includes('attendee_ids')) {
                delete updateData.attendee_ids;
            } else if (msg.includes('location')) {
                delete updateData.location;
            } else if (msg.includes('time')) {
                delete updateData.time;
            } else if (msg.includes('next_date')) {
                delete updateData.next_date;
            } else if (msg.includes('type')) {
                delete updateData.type;
            } else {
                break;
            }
            
            const { error: retryError } = await supabase.from('tutorials').update(updateData).eq('id', tutorialId);
            error = retryError;
            retries++;
        }

        if (error) {
            console.error("Final error updating tutorial after retries:", error);
            return error;
        }
        await fetchAllData();
        return null;
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

    const handleUpdateProfile = async (userId: string, data: { username?: string; password?: string }) => {
        const updateData: any = {};
        if (data.username) updateData.username = data.username;
        if (data.password) updateData.password = data.password;
        
        if (Object.keys(updateData).length > 0) {
            const { error } = await supabase.from('users').update(updateData).eq('id', userId);
            if (error) {
                console.error("Error updating profile:", error);
            } else {
                // Update local current user state
                setCurrentUser(prev => prev ? { ...prev, ...updateData } : null);
                await fetchAllData();
            }
        }
        setIsProfileModalOpen(false);
    };

    const handleNavigateToKanban = (projectId: string) => {
        setPage('board');
        setSelectedKanbanProject(projectId);
    };

    const handleNavigateToCalendar = (groupId?: string) => {
        setPage('calendar');
        if (groupId) {
            setSelectedCalendarGroup(groupId);
        }
    };

    const handleNavigateToGroup = (groupId: string) => {
        setPage('dashboard');
        setSelectedGroupId(groupId);
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
                            courses={courses}
                            courseDates={courseDates}
                            selectedGroupId={selectedGroupId}
                            onNavigateToKanban={handleNavigateToKanban}
                            onNavigateToCalendar={handleNavigateToCalendar}
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
                            groups={groups}
                            projects={projects}
                            onCreateCourse={handleCreateCourse}
                            onUpdateCourse={handleUpdateCourse}
                            onDeleteCourse={handleDeleteCourse}
                            onCreate={handleCreateStudent}
                            onCreateBulk={handleCreateStudentsBulk}
                            onUpdate={handleUpdateStudent}
                            onDelete={handleDeleteStudent}
                            onNavigateToGroup={handleNavigateToGroup}
                        />;
            case 'ras':
                return <RAs
                            ras={ras}
                            modules={modules}
                            courses={courses}
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
                            modules={modules}
                            courses={courses}
                            courseDates={courseDates}
                            onCreateTask={handleCreateTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            initialProjectId={selectedKanbanProject}
                            onProjectSelected={(projectId) => setSelectedKanbanProject(projectId)}
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
                            modules={modules}
                            courses={courses}
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
                            courses={courses}
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
                            courses={courses}
                            tasks={tasks}
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
                            courses={courses}
                            onCreateTutorial={handleCreateTutorial}
                            onUpdateTutorial={handleUpdateTutorial}
                            onDeleteTutorial={handleDeleteTutorial}
                            courseDates={courseDates}
                            tasks={tasks}
                            initialGroupId={selectedCalendarGroup}
                            onGroupSelected={(groupId) => setSelectedCalendarGroup(groupId)}
                        />;
            case 'logbook':
                return <Logbook 
                            user={currentUser}
                            groups={groups}
                            allUsers={users}
                            projects={projects}
                            tasks={tasks}
                            courses={courses}
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
                            onNavigateToCalendar={handleNavigateToCalendar}
                            onSendMessage={handleSendMessage}
                            onMarkMessagesAsRead={handleMarkMessagesAsRead}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onUpdateTutorial={handleUpdateTutorial}
                        />;
        }
    }, [page, currentUser, users, groups, projects, tasks, ras, modules, tutorials, files, courseDates, selectedKanbanProject, messages]);

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} error={authError} />;
    }

    const handleSetPage = (newPage: Page) => {
        setPage(newPage);
        if (newPage === 'board') {
            setSelectedKanbanProject(null);
        }
        if (newPage === 'calendar') {
            setSelectedCalendarGroup(null);
        }
    };

    return (
        <Layout user={currentUser} onLogout={handleLogout} currentPage={page} setPage={handleSetPage} onOpenProfile={() => setIsProfileModalOpen(true)}>
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
            {isProfileModalOpen && (
                <ProfileModal
                    user={currentUser}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSave={handleUpdateProfile}
                />
            )}
        </Layout>
    );
};

export default App;
