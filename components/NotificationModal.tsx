
import React from 'react';
import { Message, User } from '../types';
import Modal from './Modal';

interface NotificationModalProps {
    messages: Message[];
    allUsers: User[];
    onClose: () => void;
    onReply: () => void;
    onMarkMessagesAsRead: (messageIds: string[]) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ messages, allUsers, onClose, onReply, onMarkMessagesAsRead }) => {
    
    const findSenderName = (senderId: string) => {
        const sender = allUsers.find(u => u.id === senderId);
        return sender ? sender.name : 'Desconocido';
    };

    const allAreReplies = messages.every(msg => !!msg.originalMessageId);

    const handleMarkAllAsRead = () => {
        const messageIds = messages.map(msg => msg.id);
        onMarkMessagesAsRead(messageIds);
        onClose();
    };

    return (
        <Modal 
            title={`Tienes ${messages.length} mensaje(s) nuevo(s)`} 
            onClose={onClose}
            size="2xl"
        >
            <div className="space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-baseline justify-between">
                             <p className="text-sm text-gray-600">
                                De: <span className="font-bold">{findSenderName(msg.senderId)}</span>
                            </p>
                            <span className="text-xs text-gray-400">
                                {new Date(msg.timestamp).toLocaleString('es-ES')}
                            </span>
                        </div>
                        <h4 className="mt-1 text-lg font-semibold text-green-800">{msg.subject}</h4>
                        <p className="mt-2 text-gray-700 whitespace-pre-wrap">{msg.body}</p>
                    </div>
                ))}

                <div className="flex justify-end pt-4 mt-4 border-t space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        {allAreReplies ? 'Cerrar' : 'Contestar más tarde'}
                    </button>
                    {allAreReplies ? (
                        <button onClick={handleMarkAllAsRead} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Leído
                        </button>
                    ) : (
                        <button onClick={onReply} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Responder
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default NotificationModal;
