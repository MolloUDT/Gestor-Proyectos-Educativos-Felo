
export enum Role {
    Admin = 'Administrador General',
    Tutor = 'Tutor de grupos',
    Student = 'Alumno de grupo',
}

export enum Priority {
    High = 'Alta',
    Medium = 'Media',
    Low = 'Baja',
}

export enum Difficulty {
    Level1 = 'Nivel 1', // Fácil
    Level2 = 'Nivel 2', // Media
    Level3 = 'Nivel 3', // Difícil
}

export enum KanbanStatus {
    Backlog = 'Pendiente',
    Doing = 'En Progreso',
    Done = 'Realizadas',
}

export interface User {
    id: string;
    name: string;
    username: string;
    password?: string; // Should not be stored long-term
    role: Role;
    groupIds: string[];
    courseGroup?: string;
}

export interface RA {
    id: string;
    module: string;
    code: string;
    description: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: KanbanStatus;
    priority: Priority;
    difficulty: Difficulty;
    assigneeId: string;
    startDate: string; // ISO 8601 format: 'YYYY-MM-DD'
    endDate: string; // ISO 8601 format: 'YYYY-MM-DD'
    raId: string; // Resultado de Aprendizaje ID
    projectId: string;
    isVerified?: boolean;
}

export interface Group {
    id: string;
    name: string;
    members: User[];
    tutorId: string;
    logbook?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    groupId: string;
    startDate: string; // ISO 8601 format: 'YYYY-MM-DD'
    endDate: string;   // ISO 8601 format: 'YYYY-MM-DD'
}

export interface SessionLog {
    id: string;
    date: string; // ISO 8601 format: 'YYYY-MM-DD'
    content: string;
    groupId: string;
}

export interface Tutorial {
    id: string;
    date: string; // ISO 8601 format: 'YYYY-MM-DD'
    summary: string;
    groupId: string;
    tutorId: string;
    location?: string;
    nextDate: string; // ISO 8601 format: 'YYYY-MM-DD'
    nextLocation?: string;
    nextTime?: string;
}

export interface StoredFile {
    id: string;
    name: string;
    url: string;
    uploadedAt: string; // ISO 8601 format
    groupId: string;
}

export interface Message {
    id: string;
    senderId: string;
    recipientIds: string[];
    targetType: 'tutors' | 'groups' | 'students';
    targetGroupIds?: string[];
    subject: string;
    body: string;
    timestamp: string; // ISO 8601 format
    readBy: string[];
    originalMessageId?: string;
    repliedBy?: string;
}
