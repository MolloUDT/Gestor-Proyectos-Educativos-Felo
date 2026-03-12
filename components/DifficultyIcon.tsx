import React from 'react';
import { Difficulty } from '../types';

interface DifficultyIconProps {
    difficulty: Difficulty;
    className?: string;
}

const DifficultyIcon: React.FC<DifficultyIconProps> = ({ difficulty, className = "w-4 h-4" }) => {
    if (difficulty === Difficulty.Level1) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-green-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="8 12 12 16 16 12"></polyline>
                <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
        );
    } else if (difficulty === Difficulty.Level2) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-yellow-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="8 9 5 12 8 15"></polyline>
                <polyline points="16 9 19 12 16 15"></polyline>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        );
    } else {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-red-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="16 12 12 8 8 12"></polyline>
                <line x1="12" y1="16" x2="12" y2="8"></line>
            </svg>
        );
    }
};

export default DifficultyIcon;
