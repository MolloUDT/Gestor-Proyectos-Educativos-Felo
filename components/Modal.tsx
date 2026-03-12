
import React, { ReactNode } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'lg' }) => {
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
    };
    const widthClass = size ? sizeClasses[size] : sizeClasses['lg'];

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className={`w-full ${widthClass} p-6 mx-4 bg-white rounded-lg shadow-xl flex flex-col`}>
                <div className="flex items-center justify-between pb-3 border-b flex-shrink-0">
                    <h3 id="modal-title" className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="p-1 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600"
                        aria-label="Cerrar modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-4 overflow-y-auto max-h-[80vh]">
                    <div className="pr-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
