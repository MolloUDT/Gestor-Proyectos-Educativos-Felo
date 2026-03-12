
import React, { useState } from 'react';

interface ProjectDatesProps {
    courseDates: { startDate: string; endDate: string; };
    onUpdate: (dates: { startDate: string; endDate: string; }) => void;
}

const ProjectDates: React.FC<ProjectDatesProps> = ({ courseDates, onUpdate }) => {
    const [startDate, setStartDate] = useState(courseDates.startDate);
    const [endDate, setEndDate] = useState(courseDates.endDate);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (new Date(startDate) >= new Date(endDate)) {
            setFeedback('La fecha de inicio debe ser anterior a la fecha de fin.');
            return;
        }
        onUpdate({ startDate, endDate });
        setFeedback('Fechas del curso actualizadas correctamente.');
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurar Fechas del Curso Escolar</h2>
            <p className="text-gray-600 mb-6">
                Establece las fechas de inicio y fin del curso. Todos los proyectos y tareas deberán estar dentro de este rango.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio del Curso</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin del Curso</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                     <div className="flex-grow">
                        {feedback && <p className={`text-sm font-semibold ${feedback.includes('anterior') ? 'text-red-600' : 'text-green-600'}`}>{feedback}</p>}
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 ml-4 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        Guardar Fechas
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectDates;
