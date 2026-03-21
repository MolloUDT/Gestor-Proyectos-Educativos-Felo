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

export const mapTask = (row: any): Task => {
    let status = row.status as KanbanStatus;
    // Handle potential English status or variations from old data
    const rawStatus = String(row.status || '').toLowerCase();
    if (rawStatus === 'backlog' || rawStatus === 'todo' || rawStatus === 'pendiente') status = KanbanStatus.Backlog;
    else if (rawStatus === 'doing' || rawStatus === 'in-progress' || rawStatus === 'en progreso') status = KanbanStatus.Doing;
    else if (rawStatus === 'done' || rawStatus === 'completed' || rawStatus === 'realizadas') status = KanbanStatus.Done;

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: status,
        priority: row.priority as Priority,
        difficulty: row.difficulty as Difficulty,
        assigneeId: row.assignee_id,
        startDate: row.start_date,
        endDate: row.end_date,
        raId: row.ra_id,
        projectId: row.project_id,
        isVerified: row.is_verified,
    };
};

export const mapRA = (row: any): RA => ({
    id: row.id,
    module: row.module,
    code: row.code,
    description: row.description,
});

export const mapTutorial = (row: any): Tutorial => {
    // Improved status inference for old data or missing columns
    let inferredStatus: 'scheduled' | 'held' = 'scheduled';
    
    if (row.status === 'held' || row.status === 'scheduled') {
        inferredStatus = row.status;
    } else {
        // If no status column or invalid status, infer from summary and date
        const summary = row.summary || '';
        const hasRealSummary = summary.trim().length > 0 && 
                             !summary.toLowerCase().includes('resumen de la tutoría') &&
                             !summary.toLowerCase().includes('plantilla');
        
        if (hasRealSummary) {
            inferredStatus = 'held';
        } else {
            // Default to scheduled, especially if it's in the future or a pending past one
            inferredStatus = 'scheduled';
        }
    }

    return {
        id: row.id,
        date: row.date ? row.date.split('T')[0] : '',
        time: row.time || '',
        summary: row.summary || '',
        groupId: row.group_id,
        tutorId: row.tutor_id,
        location: row.location || undefined,
        status: inferredStatus,
        attendeeIds: row.attendee_ids || [],
        type: row.type || 'tutorial',
    };
};

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
