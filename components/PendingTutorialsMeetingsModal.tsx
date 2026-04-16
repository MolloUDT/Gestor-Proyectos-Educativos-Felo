import React from 'react';
import { Tutorial, User, Group, Project, Course } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import Modal from './Modal';

interface PendingTutorialsMeetingsModalProps {
    title: string;
    tutorials: Tutorial[];
    groups: Group[];
    allUsers: User[];
    projects: Project[];
    courses: Course[];
    onClose: () => void;
    onEdit: (tutorial: Tutorial) => void;
}
const PendingTutorialsMeetingsModal: React.FC<PendingTutorialsMeetingsModalProps> = ({ 
    title, tutorials, groups, allUsers, projects, courses, onClose, onEdit 
}) => {
    const { t, language } = useLanguage();
    
    const getGroupInfo = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        const course = courses.find(c => c.id === group?.courseId);
        const project = projects.find(p => p.groupId === groupId);
        return { group, course, project };
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const findTutorName = (tutorId: string) => {
        const u = allUsers.find(u => u.id === tutorId);
        return u ? `${u.firstName} ${u.lastName}` : t('unknown');
    };

    return (
        <Modal
            title={title}
            onClose={onClose}
            size="3xl"
        >
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {tutorials.length > 0 ? tutorials.map(tut => {
                    const { group, course, project } = getGroupInfo(tut.groupId);
                    return (
                        <div 
                            key={tut.id} 
                            className="p-4 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onEdit(tut)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-green-800 text-lg mb-2">
                                        {tut.type === 'tutorial' ? t('tutorialTitle') : t('meetingTitle')}
                                    </h4>
                                    <div className="space-y-1">
                                        {course && <p className="text-sm font-medium text-blue-700">{course.name}</p>}
                                        <p className="text-sm text-gray-700"><span className="font-semibold">{t('groupNameLabel')}:</span> {group?.name || t('unknownGroup')}</p>
                                        <p className="text-sm text-gray-700"><span className="font-semibold">{t('projectNameLabel')}:</span> {project?.name || t('noProjectAssigned')}</p>
                                        <p className="text-sm text-gray-700"><span className="font-semibold">{t('tutor')}:</span> {findTutorName(tut.tutorId)}</p>
                                    </div>
                                    {tut.summary && <p className="mt-3 text-sm text-gray-600 italic">"{tut.summary}"</p>}
                                </div>
                                <div className="text-right flex flex-col items-end space-y-1">
                                    <span className="text-sm font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded">
                                        {new Date(tut.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                                    </span>
                                    {tut.location && (
                                        <span className="text-xs text-gray-600 flex items-center mt-1">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            {tut.location}
                                        </span>
                                    )}
                                    {tut.time && (
                                        <span className="text-xs text-gray-600 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            {tut.time}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                     <p className="py-8 text-center text-gray-500">{t('noPendingItems')}</p>
                )}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    {t('close')}
                </button>
            </div>
        </Modal>
    );
};

export default PendingTutorialsMeetingsModal;
