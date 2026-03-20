
import { User, Group, Project, Task, Role, Priority, KanbanStatus, RA, Tutorial, StoredFile, Message, Difficulty } from './types';

// USERS
export const MOCK_USERS: User[] = [
    // Admin
    { id: 'user-1', firstName: 'Admin', lastName: 'General', username: 'Admin', password: 'esperanza2026', role: Role.Admin, groupIds: [] },
    
    // Tutors
    { id: 'user-2', firstName: 'Laura', lastName: 'Martinez (Tutora)', username: 'Tutor', password: 'felo2627', role: Role.Tutor, groupIds: ['group-1'] },
    { id: 'user-12', firstName: 'Roberto', lastName: 'Vega (Tutor)', username: 'Tutor2', password: 'felo2627', role: Role.Tutor, groupIds: ['group-2'] },
    { id: 'user-13', firstName: 'Elena', lastName: 'Navarro (Tutora)', username: 'Tutor3', password: 'felo2627', role: Role.Tutor, groupIds: ['group-3'] },
    { id: 'user-14', firstName: 'Miguel', lastName: 'Torres (Tutor)', username: 'Tutor4', password: 'felo2627', role: Role.Tutor, groupIds: ['group-4'] },
    
    // Students Group 1 (1º TSAF)
    { id: 'user-3', firstName: 'Carlos', lastName: 'Gomez', username: 'alumno', password: 'alumno2627', role: Role.Student, groupIds: ['group-1'], courseId: 'course-1' },
    { id: 'user-4', firstName: 'Ana', lastName: 'Fernandez', username: 'ana', password: 'password', role: Role.Student, groupIds: ['group-1'], courseId: 'course-1' },
    { id: 'user-5', firstName: 'David', lastName: 'Garcia', username: 'david', password: 'password', role: Role.Student, groupIds: ['group-1'], courseId: 'course-1' },
    
    // Students Group 2 (2º TSAF)
    { id: 'user-6', firstName: 'Sofia', lastName: 'Rodriguez', username: 'sofia', password: 'password', role: Role.Student, groupIds: ['group-2'], courseId: 'course-2' },
    { id: 'user-7', firstName: 'Javier', lastName: 'Lopez', username: 'javier', password: 'password', role: Role.Student, groupIds: ['group-2'], courseId: 'course-2' },

    // Students Group 3 (1º TSEAS)
    { id: 'user-15', firstName: 'Paula', lastName: 'Alonso', username: 'paula', password: 'password', role: Role.Student, groupIds: ['group-3'], courseId: 'course-3' },
    { id: 'user-16', firstName: 'Marcos', lastName: 'Ruiz', username: 'marcos', password: 'password', role: Role.Student, groupIds: ['group-3'], courseId: 'course-3' },

    // Students Group 4 (2º TSEAS)
    { id: 'user-17', firstName: 'Sara', lastName: 'Moreno', username: 'sara', password: 'password', role: Role.Student, groupIds: ['group-4'], courseId: 'course-4' },
    { id: 'user-18', firstName: 'Adrián', lastName: 'Gil', username: 'adrian', password: 'password', role: Role.Student, groupIds: ['group-4'], courseId: 'course-4' },
    
    // Unassigned Students
    { id: 'user-8', firstName: 'Maria', lastName: 'Sanchez', username: 'maria', password: 'password', role: Role.Student, groupIds: [], courseId: 'course-1' },
    { id: 'user-9', firstName: 'Pedro', lastName: 'Ramirez', username: 'pedro', password: 'password', role: Role.Student, groupIds: [], courseId: 'course-2' },
    { id: 'user-10', firstName: 'Lucia', lastName: 'Jimenez', username: 'lucia', password: 'password', role: Role.Student, groupIds: [], courseId: 'course-3' },
    { id: 'user-11', firstName: 'Daniel', lastName: 'Martin', username: 'daniel', password: 'password', role: Role.Student, groupIds: [], courseId: 'course-4' },
];

// RAs (Resultados de Aprendizaje)
export const MOCK_RAS: RA[] = [
    { id: 'ra-1', module: 'Desarrollo de Aplicaciones Web', code: 'RA1', description: 'Diseño de Interfaces' },
    { id: 'ra-2', module: 'Desarrollo de Aplicaciones Web', code: 'RA2', description: 'Programación Frontend' },
    { id: 'ra-3', module: 'Desarrollo de Aplicaciones Web', code: 'RA3', description: 'Gestión de Servidores' },
    { id: 'ra-4', module: 'Desarrollo de Aplicaciones Web', code: 'RA5', description: 'Elaboración de Documentación Técnica' },
    { id: 'ra-5', module: 'Gestión de Eventos Deportivos', code: 'RA1', description: 'Marketing y Comunicación Deportiva' },
    { id: 'ra-6', module: 'Gestión de Eventos Deportivos', code: 'RA2', description: 'Organización de Eventos Deportivos' },
];

// GROUPS
export const MOCK_GROUPS: Group[] = [
    { id: 'group-1', name: 'Grupo TSAF-1', members: MOCK_USERS.filter(u => u.groupIds.includes('group-1')), tutorId: 'user-2', logbook: '[Laura Martinez (Tutora) - 01/03/2026 10:00]\nEl grupo está trabajando bien en el diseño. Han mostrado progresos significativos en Figma.\n' },
    { id: 'group-2', name: 'Grupo TSAF-2', members: MOCK_USERS.filter(u => u.groupIds.includes('group-2')), tutorId: 'user-12', logbook: '[Roberto Vega (Tutor) - 02/03/2026 11:30]\nNecesitan mejorar la comunicación interna. Les he sugerido usar Slack o Discord.\n' },
    { id: 'group-3', name: 'Grupo TSEAS-1', members: MOCK_USERS.filter(u => u.groupIds.includes('group-3')), tutorId: 'user-13', logbook: '' },
    { id: 'group-4', name: 'Grupo TSEAS-2', members: MOCK_USERS.filter(u => u.groupIds.includes('group-4')), tutorId: 'user-14', logbook: '' },
];

// PROJECTS
export const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', name: 'Desarrollo App Móvil Fitness', groupId: 'group-1', description: 'Una aplicación para seguir rutinas de ejercicio y nutrición.', startDate: '2025-09-22', endDate: '2026-01-31' },
    { id: 'proj-2', name: 'Organización Evento Deportivo', groupId: 'group-2', description: 'Planificación y ejecución de un torneo de voleibol escolar.', startDate: '2025-10-01', endDate: '2026-02-15' },
    { id: 'proj-3', name: 'Campaña de Marketing Digital', groupId: 'group-3', description: 'Campaña para un club deportivo local.', startDate: '2026-02-01', endDate: '2026-05-30' },
    { id: 'proj-4', name: 'Análisis de Rendimiento Deportivo', groupId: 'group-4', description: 'Estudio y análisis de datos para mejorar el rendimiento de atletas.', startDate: '2026-01-15', endDate: '2026-06-10' },
];

// TASKS
export const MOCK_TASKS: Task[] = [
    // Project 1 Tasks
    { id: 'task-1', projectId: 'proj-1', title: 'Diseño de la Interfaz', description: 'Crear los mockups y el prototipo de la app en Figma.', status: KanbanStatus.Done, priority: Priority.High, difficulty: Difficulty.Level2, assigneeId: 'user-4', startDate: '2025-09-22', endDate: '2025-10-10', raId: 'ra-1', isVerified: true },
    { id: 'task-2', projectId: 'proj-1', title: 'Configuración del Backend', description: 'Inicializar el servidor y la base de datos.', status: KanbanStatus.Doing, priority: Priority.High, difficulty: Difficulty.Level3, assigneeId: 'user-5', startDate: '2025-10-01', endDate: '2025-10-20', raId: 'ra-3', isVerified: true },
    { id: 'task-3', projectId: 'proj-1', title: 'Desarrollo del Login', description: 'Implementar la autenticación de usuarios.', status: KanbanStatus.Doing, priority: Priority.Medium, difficulty: Difficulty.Level2, assigneeId: 'user-3', startDate: '2025-10-11', endDate: '2025-11-05', raId: 'ra-2', isVerified: false },
    { id: 'task-4', projectId: 'proj-1', title: 'Crear componente Dashboard', description: 'Componente principal para mostrar datos.', status: KanbanStatus.Backlog, priority: Priority.Medium, difficulty: Difficulty.Level2, assigneeId: 'user-3', startDate: '2025-11-06', endDate: '2025-12-10', raId: 'ra-2', isVerified: false },
    { id: 'task-5', projectId: 'proj-1', title: 'Redactar documentación', description: 'Documentar la API y el uso de la app.', status: KanbanStatus.Backlog, priority: Priority.Low, difficulty: Difficulty.Level1, assigneeId: 'user-4', startDate: '2026-01-10', endDate: '2026-01-25', raId: 'ra-4', isVerified: true },
    
    // Project 2 Tasks
    { id: 'task-6', projectId: 'proj-2', title: 'Búsqueda de Patrocinadores', description: 'Contactar empresas locales para patrocinio.', status: KanbanStatus.Doing, priority: Priority.High, difficulty: Difficulty.Level2, assigneeId: 'user-6', startDate: '2025-10-01', endDate: '2025-10-30', raId: 'ra-5' },
    { id: 'task-7', projectId: 'proj-2', title: 'Plan de Comunicación', description: 'Definir estrategia en redes sociales y prensa.', status: KanbanStatus.Backlog, priority: Priority.Medium, difficulty: Difficulty.Level2, assigneeId: 'user-7', startDate: '2025-10-15', endDate: '2025-11-15', raId: 'ra-6' },
    { id: 'task-8', projectId: 'proj-2', title: 'Logística del evento', description: 'Reservar instalaciones y material.', status: KanbanStatus.Done, priority: Priority.High, difficulty: Difficulty.Level1, assigneeId: 'user-6', startDate: '2025-11-01', endDate: '2025-11-20', raId: 'ra-6' },
    
    // Project 3 Tasks
    { id: 'task-9', projectId: 'proj-3', title: 'Análisis de Mercado', description: 'Investigar público objetivo y competencia.', status: KanbanStatus.Done, priority: Priority.High, difficulty: Difficulty.Level2, assigneeId: 'user-15', startDate: '2026-02-01', endDate: '2026-02-20', raId: 'ra-5' },
    { id: 'task-10', projectId: 'proj-3', title: 'Creación de Contenido', description: 'Diseñar posts y vídeos para redes sociales.', status: KanbanStatus.Doing, priority: Priority.Medium, difficulty: Difficulty.Level1, assigneeId: 'user-16', startDate: '2026-02-21', endDate: '2026-03-31', raId: 'ra-5' },
    
    // Project 4 Tasks
    { id: 'task-11', projectId: 'proj-4', title: 'Recopilación de Datos', description: 'Obtener datos de rendimiento de partidos anteriores.', status: KanbanStatus.Doing, priority: Priority.High, difficulty: Difficulty.Level2, assigneeId: 'user-17', startDate: '2026-01-15', endDate: '2026-02-15', raId: 'ra-6' },
    { id: 'task-12', projectId: 'proj-4', title: 'Implementar Software de Análisis', description: 'Configurar herramientas para procesar los datos.', status: KanbanStatus.Backlog, priority: Priority.Medium, difficulty: Difficulty.Level3, assigneeId: 'user-18', startDate: '2026-02-16', endDate: '2026-03-15', raId: 'ra-6' },
];

// TUTORIALS
export const MOCK_TUTORIALS: Tutorial[] = [
    { id: 'tut-1', date: '2025-10-15', time: '10:00', summary: 'Revisión inicial del proyecto y asignación de roles.', groupId: 'group-1', tutorId: 'user-2', location: 'Sala de reuniones 1', status: 'held', attendeeIds: [] },
    { id: 'tut-2', date: '2025-10-29', time: '11:30', summary: 'Seguimiento de tareas de backend y resolución de dudas sobre la API.', groupId: 'group-1', tutorId: 'user-2', location: 'Aula 203', status: 'held', attendeeIds: [] },
    { id: 'tut-3', date: '2025-11-12', time: '10:00', summary: 'Próxima revisión de prototipo funcional.', groupId: 'group-1', tutorId: 'user-2', location: 'Online', status: 'held', attendeeIds: [] },
    { id: 'tut-4', date: '2025-10-20', time: '09:00', summary: 'Definición de la estrategia de comunicación y marketing.', groupId: 'group-2', tutorId: 'user-12', location: 'Biblioteca', status: 'held', attendeeIds: [] },
    { id: 'tut-5', date: '2025-11-03', time: '09:30', summary: 'Revisión de contactos de patrocinadores.', groupId: 'group-2', tutorId: 'user-12', location: 'Sala de reuniones 2', status: 'held', attendeeIds: [] },
];

// FILES
export const MOCK_FILES: StoredFile[] = [
    { id: 'file-1', name: 'Prototipo_v1.pdf', url: '#', uploadedAt: '2024-05-10T10:00:00Z', groupId: 'group-1'},
    { id: 'file-2', name: 'Documentacion_API.pdf', url: '#', uploadedAt: '2024-05-15T14:30:00Z', groupId: 'group-1'},
    { id: 'file-3', name: 'Plan_Marketing.pdf', url: '#', uploadedAt: '2024-05-12T09:00:00Z', groupId: 'group-2'},
];

// MESSAGES
export const MOCK_MESSAGES: Message[] = [
    { 
        id: 'msg-1', 
        senderId: 'user-1', 
        recipientIds: ['user-2'], 
        targetType: 'tutors',
        subject: 'Revisión del Proyecto TSAF-1', 
        body: 'Hola Laura, ¿podríamos tener una breve reunión para ver el progreso del proyecto "Desarrollo App Móvil Fitness"? Gracias.', 
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        readBy: ['user-2'],
        repliedBy: 'user-2' // Laura (tutor) replied to this message
    },
    { 
        id: 'msg-2', 
        senderId: 'user-1', 
        recipientIds: ['user-3'], 
        targetType: 'students',
        subject: 'Entrega de documentación', 
        body: 'Hola Carlos, recuerda que la fecha límite para la entrega de la documentación inicial del proyecto es esta semana. Un saludo.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readBy: []
    },
    {
        id: 'msg-3',
        senderId: 'user-2',
        recipientIds: ['user-1'],
        targetType: 'tutors', // Replying to an Admin
        subject: 'Re: Revisión del Proyecto TSAF-1',
        body: 'Hola Admin, claro que sí. Te confirmo que el proyecto va según lo planeado. ¿Te parece bien el próximo martes a las 10:00?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readBy: ['user-1'], // Admin has read the reply
        originalMessageId: 'msg-1' // This is a reply to msg-1
    },
    {
        id: 'msg-4',
        senderId: 'user-12',
        recipientIds: ['user-6', 'user-7'],
        targetType: 'students',
        targetGroupIds: ['group-2'],
        subject: 'Nuevas directrices evento',
        body: 'Equipo, por favor revisad el nuevo documento de directrices para el evento deportivo. Está en la carpeta de archivos del grupo. ¡Gracias!',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        readBy: ['user-6'],
    }
];
