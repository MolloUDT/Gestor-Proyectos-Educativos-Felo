
import React, { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface ProjectDatesProps {
    courseDates: { startDate: string; endDate: string; };
    onUpdate: (dates: { startDate: string; endDate: string; }) => void;
}

const ProjectDates: React.FC<ProjectDatesProps> = ({ courseDates, onUpdate }) => {
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState(courseDates.startDate);
    const [endDate, setEndDate] = useState(courseDates.endDate);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (new Date(startDate) >= new Date(endDate)) {
            setFeedback(t('startDateError'));
            return;
        }
        onUpdate({ startDate, endDate });
        setFeedback(t('datesUpdatedSuccess'));
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">{t('projectDatesTitle')}</h2>
            <p className="text-gray-600 text-center mb-8">
                {t('projectDatesSubtitle')}
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row justify-center gap-8">
                    <div className="w-full max-w-48">
                        <label htmlFor="startDate" className="block text-sm font-bold text-green-600 text-center">{t('startDateLimit')}</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full py-2 mt-2 border border-green-200 bg-green-50 text-green-800 rounded-md text-center"
                            required
                        />
                    </div>
                    <div className="w-full max-w-48">
                        <label htmlFor="endDate" className="block text-sm font-bold text-red-600 text-center">{t('endDateLimit')}</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full py-2 mt-2 border border-red-200 bg-red-50 text-red-800 rounded-md text-center"
                            required
                        />
                    </div>
                </div>
                <div className="flex flex-col items-center pt-4">
                    {feedback && <p className={`text-sm font-semibold mb-4 ${feedback.includes('anterior') || feedback === t('startDateError') ? 'text-red-600' : 'text-green-600'}`}>{feedback}</p>}
                    <button
                        type="submit"
                        className="px-10 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                        {t('save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectDates;
