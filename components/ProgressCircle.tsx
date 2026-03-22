import React, { useMemo } from 'react';

export const ProgressCircle: React.FC<{ progress: number; size?: number; showText?: boolean }> = ({ progress, size = 48, showText = false }) => {
    const strokeWidth = size < 50 ? 6 : 8;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const progressColorClass = useMemo(() => {
        if (progress <= 0) return 'text-red-500';
        if (progress <= 40) return 'text-red-500';
        if (progress <= 79) return 'text-yellow-500';
        return 'text-green-500';
    }, [progress]);

    if (progress === 100) {
        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        className="text-green-500"
                        fill="currentColor"
                        r={size / 2}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                {showText && <span className={`absolute font-bold text-white ${size < 50 ? 'text-xs' : 'text-lg'}`}>{progress}%</span>}
            </div>
        );
    }

    if (progress <= 0) {
        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        className="text-red-500"
                        fill="currentColor"
                        r={size / 2}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                {showText && <span className={`absolute font-bold text-white ${size < 50 ? 'text-xs' : 'text-lg'}`}>{progress}%</span>}
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-gray-200" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
                <circle
                    className={progressColorClass}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size/2}
                    cy={size/2}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    transform={`rotate(-90 ${size/2} ${size/2})`}
                />
            </svg>
            {showText && <span className={`text-[10px] font-bold ${progressColorClass}`}>{progress}%</span>}
        </div>
    );
};
