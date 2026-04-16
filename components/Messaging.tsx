import React, { useState, useMemo } from 'react';
import { User, Role, Group, Project, Message, Course } from '../types';
import { ChevronDownIcon, XIcon } from './Icons';
import { useLanguage } from '../lib/LanguageContext';
import MessagingHistoryModal from './MessagingHistoryModal';
import PendingMessagesModal from './PendingMessagesModal';
import Modal from './Modal';

interface MessagingProps {
    user: User;
    allUsers: User[];
    groups: Group[];
    projects: Project[];
    messages: Message[];
    courses: Course[];
    onSendMessage: (messageData: { senderId: string; recipientIds: string[]; subject: string; body: string; targetType: 'tutors' | 'groups' | 'students'; targetGroupIds?: string[]; originalMessageId?: string; }) => void;
    onDeleteMessage: (messageId: string) => void;
    onMarkMessagesAsRead: (messageIds: string[]) => void;
}

type ActiveTab = 'tutors' | 'groups' | 'students';

const Messaging: React.FC<MessagingProps> = ({ user, allUsers, groups, projects, messages, courses, onSendMessage, onDeleteMessage, onMarkMessagesAsRead }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
    
    const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [messageDataToSend, setMessageDataToSend] = useState<any>(null);


    const resetMessagingCenter = () => {
        setActiveTab(null);
        setSelectedTutorIds([]);
        setSelectedGroupIds([]);
        setSelectedStudentIds([]);
        setSearchTerm('');
        setSubject('');
        setBody('');
        setExpandedCourses({});
        setIsConfirmModalOpen(false);
        setMessageDataToSend(null);
    };

    const handlePrepareSend = () => {
        if (!activeTab) return;

        let recipientIds: string[] = [];
        
        if (activeTab === 'tutors') {
            recipientIds = selectedTutorIds;
        } else if (activeTab === 'groups') {
            const studentIdsInSelectedGroups = availableGroups
                .filter(g => selectedGroupIds.includes(g.id))
                .flatMap(g => g.members.map(m => m.id));
            recipientIds = Array.from(new Set(studentIdsInSelectedGroups));
        } else {
            recipientIds = selectedStudentIds;
        }

        if (recipientIds.length === 0) {
            alert(t('selectAtLeastOneRecipient'));
            return;
        }
        if (!subject.trim() || !body.trim()) {
            alert(t('subjectAndBodyNotEmpty'));
            return;
        }

        const messageData = {
            senderId: user.id,
            recipientIds,
            subject,
            body,
            targetType: activeTab,
            ...(activeTab === 'groups' && { targetGroupIds: selectedGroupIds }),
        };

        setMessageDataToSend(messageData);
        setIsConfirmModalOpen(true);
    };
    
    const executeSend = () => {
        if (messageDataToSend) {
            onSendMessage(messageDataToSend);
            alert(t('messageSentTo', { count: messageDataToSend.recipientIds.length.toString() }));
            resetMessagingCenter();
        }
    };

    const unreadMessages = useMemo(() => messages.filter(msg => 
        msg.recipientIds.includes(user.id) && !msg.readBy.includes(user.id)
    ), [messages, user.id]);

    const handleClosePendingModal = () => {
        setIsPendingModalOpen(false);
    };

    const { availableTutors, availableGroups, availableStudents } = useMemo(() => {
        if (user.role === Role.Admin) {
            return {
                availableTutors: allUsers.filter(u => u.role === Role.Tutor || u.role === Role.Admin).filter(u => u.id !== user.id),
                availableGroups: groups,
                availableStudents: allUsers.filter(u => u.role === Role.Student)
            };
        }
        if (user.role === Role.Tutor) {
            const myGroups = groups.filter(g => g.tutorId === user.id);
            const myStudentIds = new Set(myGroups.flatMap(g => g.members.map(m => m.id)));
            return {
                availableTutors: allUsers.filter(u => u.role === Role.Admin),
                availableGroups: myGroups,
                availableStudents: allUsers.filter(u => u.role === Role.Student && myStudentIds.has(u.id))
            };
        }
        // Role.Student
        const myGroup = groups.find(g => user.groupIds.includes(g.id));
        const myTutorId = myGroup?.tutorId;
        const myFellowStudentIds = new Set(myGroup?.members.map(m => m.id).filter(id => id !== user.id) || []);

        return {
            availableTutors: allUsers.filter(u => u.role === Role.Admin || u.id === myTutorId),
            availableGroups: myGroup ? [myGroup] : [],
            availableStudents: allUsers.filter(u => u.role === Role.Student && myFellowStudentIds.has(u.id))
        };
    }, [user, allUsers, groups]);


    // FIX: Refactored dataByCourse creation to be more robust. The original logic
    // could miss courses if a group's members weren't in `availableStudents`, leading to
    // downstream type errors. This approach correctly builds the data structure.
    const dataByCourse: Record<string, { groups: Group[]; students: User[] }> = useMemo(() => {
        const result: Record<string, { groups: Group[]; students: User[] }> = {};

        availableStudents.forEach(student => {
            const course = courses.find(c => c.id === student.courseId);
            const courseName = course ? course.name : t('projectsWithoutCourse');
            
            if (!result[courseName]) {
                result[courseName] = { groups: [], students: [] };
            }
            result[courseName].students.push(student);
        });

        availableGroups.forEach(group => {
            const course = courses.find(c => c.id === group.courseId);
            const courseName = course ? course.name : t('projectsWithoutCourse');
            
            if (!result[courseName]) {
                result[courseName] = { groups: [], students: [] };
            }
            // Avoid duplicates if already added by students
            if (!result[courseName].groups.find(g => g.id === group.id)) {
                result[courseName].groups.push(group);
            }
        });
        
        return result;
    }, [availableGroups, availableStudents, courses]);

    const toggleCourseExpansion = (course: string) => {
        setExpandedCourses(prev => ({...prev, [course]: !prev[course]}));
    };
    
    const renderRecipientSelector = () => {
        if (!activeTab) return null;

        const filteredTutors = availableTutors.filter(t => (t.firstName + ' ' + t.lastName).toLowerCase().includes(searchTerm.toLowerCase()));

        switch (activeTab) {
            case 'tutors':
                return (
                    <div className="grid grid-cols-2 gap-4">
                         {/* Available Tutors */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">{t('availableRecipients')}</h4>
                                <button onClick={() => setSelectedTutorIds(filteredTutors.map(t => t.id))} className="text-sm text-blue-600 hover:underline">{t('all')}</button>
                            </div>
                            <ul className="h-64 overflow-y-auto border rounded-md p-2 space-y-1">
                                {filteredTutors.map(tutor => (
                                    <li key={tutor.id}>
                                        <label className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer text-gray-800">
                                            <input type="checkbox" className="mr-2" checked={selectedTutorIds.includes(tutor.id)} onChange={() => {
                                                setSelectedTutorIds(prev => prev.includes(tutor.id) ? prev.filter(id => id !== tutor.id) : [...prev, tutor.id]);
                                            }} />
                                            {tutor.lastName}, {tutor.firstName} {tutor.role === Role.Admin && `(${t('admin')})`}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Selected Tutors */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">{t('selected')} ({selectedTutorIds.length})</h4>
                                <button onClick={() => setSelectedTutorIds([])} className="text-sm text-red-600 hover:underline">{t('clear')}</button>
                            </div>
                            <ul className="h-64 overflow-y-auto border rounded-md p-2 space-y-1">
                                {selectedTutorIds.map(id => {
                                    const tutor = availableTutors.find(t => t.id === id);
                                    return (
                                        <li key={id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                            <span className="text-gray-800">{tutor?.lastName}, {tutor?.firstName}</span>
                                            <button onClick={() => setSelectedTutorIds(prev => prev.filter(tid => tid !== id))}><XIcon className="w-4 h-4 text-gray-500"/></button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                );
            case 'groups':
            case 'students':
                const isGroupMode = activeTab === 'groups';
                const selectedIds = isGroupMode ? selectedGroupIds : selectedStudentIds;
                const setSelectedIds = isGroupMode ? setSelectedGroupIds : setSelectedStudentIds;

                const handleCourseSelection = (course: string, checked: boolean) => {
                    const courseData = dataByCourse[course];
                    if (!courseData) return;
                    
                    const items: (User | Group)[] = isGroupMode ? courseData.groups : courseData.students;
                    const itemIds = items.map(item => item.id);
                    if(checked) {
                        setSelectedIds(prev => Array.from(new Set([...prev, ...itemIds])));
                    } else {
                        setSelectedIds(prev => prev.filter(id => !itemIds.includes(id)));
                    }
                };
                
                return (
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">{isGroupMode ? t('availableGroups') : t('availableStudents')}</h4>
                                <button onClick={() => {
                                    // FIX: Replaced flatMap with map(...).flat() to work around a TypeScript
                                    // type inference issue with unions of array types.
                                    const allIds = Object.values(dataByCourse).map(data => isGroupMode ? data.groups : data.students).flat().map(item => item.id);
                                    setSelectedIds(allIds);
                                }} className="text-sm text-blue-600 hover:underline">{t('all')}</button>
                            </div>
                             <div className="h-64 overflow-y-auto border rounded-md p-2 space-y-1">
                                {Object.keys(dataByCourse).sort().map(course => {
                                    const courseData = dataByCourse[course];
                                    if (!courseData) return null;
                                    
                                    const items: (User | Group)[] = (isGroupMode ? courseData.groups : courseData.students);
                                    const itemIds = items.map(item => item.id);
                                    const isCourseSelected = itemIds.length > 0 && itemIds.every(id => selectedIds.includes(id));

                                    return (
                                        <div key={course}>
                                            <div className="flex items-center justify-between p-2 bg-gray-100 rounded-t-md">
                                                <label className="font-semibold flex items-center cursor-pointer text-gray-800">
                                                     <input type="checkbox" className="mr-2" checked={isCourseSelected} onChange={(e) => handleCourseSelection(course, e.target.checked)}/>
                                                     {course}
                                                </label>
                                                <button onClick={() => toggleCourseExpansion(course)}>
                                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedCourses[course] ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>
                                            {expandedCourses[course] && (
                                                <ul className="pl-4 py-1 border-l border-r border-b rounded-b-md">
                                                    {items.filter(item => {
                                                        const name = isGroupMode ? (item as Group).name : `${(item as User).firstName} ${(item as User).lastName}`;
                                                        return name.toLowerCase().includes(searchTerm.toLowerCase());
                                                    }).map(item => (
                                                        <li key={item.id}>
                                                            <label className="flex items-center p-1 rounded hover:bg-gray-50 cursor-pointer text-gray-800">
                                                                <input type="checkbox" className="mr-2" checked={selectedIds.includes(item.id)} onChange={() => {
                                                                    setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                                                                }} />
                                                                {isGroupMode ? (item as Group).name : `${(item as User).lastName}, ${(item as User).firstName}`}
                                                                {isGroupMode && <span className="ml-2 text-xs text-gray-500">({projects.find(p=>p.groupId === (item as Group).id)?.name || t('noProject')})</span>}
                                                            </label>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">Seleccionados ({selectedIds.length})</h4>
                                <button onClick={() => setSelectedIds([])} className="text-sm text-red-600 hover:underline">Limpiar</button>
                            </div>
                            <ul className="h-64 overflow-y-auto border rounded-md p-2 space-y-1">
                                {selectedIds.map(id => {
                                    const item = (isGroupMode ? availableGroups : availableStudents).find(i => i.id === id);
                                    return (
                                        <li key={id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                            <span className="text-gray-800">{isGroupMode ? item?.name : `${(item as User)?.lastName}, ${(item as User)?.firstName}`}</span>
                                            <button onClick={() => setSelectedIds(prev => prev.filter(itemId => itemId !== id))}><XIcon className="w-4 h-4 text-gray-500"/></button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('messagingCenter')}</h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => unreadMessages.length > 0 && setIsPendingModalOpen(true)}
                        className={`px-4 py-2 font-semibold text-white rounded-md transition-all relative ${
                            unreadMessages.length > 0
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 cursor-default'
                        }`}
                        disabled={unreadMessages.length === 0}
                    >
                        {unreadMessages.length > 0 ? t('pendingMessages') : t('noPendingMessages')}
                        {unreadMessages.length > 0 && (
                            <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 border-2 border-white rounded-full">
                                {unreadMessages.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md whitespace-nowrap hover:bg-gray-300"
                    >
                        {t('messagingHistory')}
                    </button>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b">
                <nav className="flex -mb-px space-x-6">
                    {(['tutors', 'groups', 'students'] as ActiveTab[]).map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                            className={`px-3 py-2 font-semibold text-sm border-b-2 transition-colors ${
                                activeTab === tab 
                                ? 'border-green-600 text-green-700' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab === 'tutors' && t('sendToTutors')}
                            {tab === 'groups' && t('sendToGroups')}
                            {tab === 'students' && t('sendToStudents')}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab ? (
                <>
                    {/* Recipient Selector */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700">{t('step1Message')}</h3>
                        <input 
                            type="text" 
                            placeholder={t('searchByName')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 mb-2 border rounded-md"
                        />
                        {renderRecipientSelector()}
                    </div>
                    
                    {/* Message Composer */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700">{t('step2Message')}</h3>
                        {user.role !== Role.Admin && (
                            <div className="p-4 mb-4 text-sm text-yellow-800 bg-yellow-100 border-l-4 border-yellow-500" role="alert">
                                <p className="font-bold">{t('warning')}</p>
                                <p>{t('messagePermanentWarning')}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">{t('subject')}</label>
                            <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 mt-1 border rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="body" className="block text-sm font-medium text-gray-700">{t('messageBody')}</label>
                            <textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={6} className="w-full p-2 mt-1 border rounded-md" required/>
                        </div>
                    </div>

                    {/* Send Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <button onClick={handlePrepareSend} className="px-6 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">
                            {t('send')}
                        </button>
                    </div>
                </>
            ) : (
                <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <p>{t('selectCategoryToStart')}</p>
                </div>
            )}

            {isConfirmModalOpen && (
                <Modal title={t('confirmSendMessage')} onClose={() => setIsConfirmModalOpen(false)}>
                    <div className="text-center">
                        <p className="mb-6 text-base text-gray-700">
                           {t('confirmMessageWarning')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button onClick={resetMessagingCenter} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                                {t('cancelMessage')}
                            </button>
                            <button onClick={() => setIsConfirmModalOpen(false)} className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                {t('backToEdit')}
                            </button>
                            <button onClick={executeSend} className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                                {t('send')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isHistoryModalOpen && (
                <MessagingHistoryModal
                    user={user}
                    messages={messages}
                    allUsers={allUsers}
                    onClose={() => setIsHistoryModalOpen(false)}
                    onDeleteMessage={onDeleteMessage}
                    onSendMessage={onSendMessage}
                />
            )}

            {isPendingModalOpen && (
                <PendingMessagesModal
                    user={user}
                    messages={unreadMessages}
                    allUsers={allUsers}
                    onClose={handleClosePendingModal}
                    onSendMessage={onSendMessage}
                    onMarkMessagesAsRead={onMarkMessagesAsRead}
                />
            )}
        </div>
    );
};

export default Messaging;
