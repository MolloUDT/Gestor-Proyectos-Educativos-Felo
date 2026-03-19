import { User, Group, Project, Task, RA, Tutorial, StoredFile, Message, SessionLog, Role, Priority, Difficulty, KanbanStatus } from '../types';

export const mapUser = (row: any): User => ({
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    username: row.username,
    password: row.password,
    role: row.role as Role,
    groupIds: row.group_members?.map((gm: any) => gm.group_id) || [],
    courseId: row.course_id || undefined,
});

export const mapGroup = (row: any, allUsers: User[]): Group => ({
    id: row.id,
    name: row.name,
    tutorId: row.tutor_id,
    logbook: row.logbook || undefined,
    members: row.group_members?.map((gm: any) => allUsers.find(u => u.id === gm.user_id)).filter(Boolean) as User[] || [],
    courseId: row.course_id || undefined,
});

export const mapProject = (row: any): Project => ({
    id: row.id,
    name: row.name,
    description: row.description,
    groupId: row.group_id,
    startDate: row.start_date,
    endDate: row.end_date,
});

export const mapTask = (row: any): Task => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as KanbanStatus,
    priority: row.priority as Priority,
    difficulty: row.difficulty as Difficulty,
    assigneeId: row.assignee_id,
    startDate: row.start_date,
    endDate: row.end_date,
    raId: row.ra_id,
    projectId: row.project_id,
    isVerified: row.is_verified,
});

export const mapRA = (row: any): RA => ({
    id: row.id,
    module: row.module,
    code: row.code,
    description: row.description,
});

export const mapTutorial = (row: any): Tutorial => ({
    id: row.id,
    date: row.date,
    summary: row.summary,
    groupId: row.group_id,
    tutorId: row.tutor_id,
    location: row.location || undefined,
    nextDate: row.next_date,
    nextLocation: row.next_location || undefined,
    nextTime: row.next_time || undefined,
});

export const mapStoredFile = (row: any): StoredFile => ({
    id: row.id,
    name: row.name,
    url: row.url,
    uploadedAt: row.uploaded_at,
    groupId: row.group_id,
});

export const mapMessage = (row: any): Message => ({
    id: row.id,
    senderId: row.sender_id,
    targetType: row.target_type as 'tutors' | 'groups' | 'students',
    subject: row.subject,
    body: row.body,
    timestamp: row.timestamp,
    originalMessageId: row.original_message_id || undefined,
    repliedBy: row.replied_by || undefined,
    recipientIds: row.message_recipients?.map((mr: any) => mr.user_id) || [],
    readBy: row.message_recipients?.filter((mr: any) => mr.is_read).map((mr: any) => mr.user_id) || [],
    targetGroupIds: row.message_target_groups?.map((mtg: any) => mtg.group_id) || [],
});
