import React, { useState, useMemo } from 'react';
import { Message, User, Role } from '../types';
import Modal from './Modal';
import { TrashIcon } from './Icons';

interface MessagingHistoryModalProps {
    user: User;
    messages: Message[];
    allUsers: User[];
    onClose: () => void;
    onDeleteMessage: (messageId: string) => void;
    onSendMessage: (messageData: any) => void; // Added for completeness, but not used in this modal directly
}

const MessagingHistoryModal: React.FC<Omit<MessagingHistoryModalProps, 'onSendMessage'>> = ({ user, messages, allUsers, onClose, onDeleteMessage }) => {
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

    const threads = useMemo(() => {
        const messageMap = new Map<string, Message>(messages.map(m => [m.id, m]));
        const threadsMap = new Map<string, { original: Message; reply?: Message }>();

        messages.forEach(msg => {
            if (msg.originalMessageId) {
                const original = threadsMap.get(msg.originalMessageId)?.original || messageMap.get(msg.originalMessageId);
                if (original) {
                    threadsMap.set(original.id, { original, reply: msg });
                }
            } else {
                if (!threadsMap.has(msg.id)) {
                    threadsMap.set(msg.id, { original: msg });
                }
            }
        });

        return Array.from(threadsMap.values())
            .filter(({ original }) => original.senderId === user.id || original.recipientIds.includes(user.id))
            .sort((a, b) => new Date(b.original.timestamp).getTime() - new Date(a.original.timestamp).getTime());
    }, [messages, user.id]);

    const handleConfirmDelete = () => {
        if (messageToDelete) {
            onDeleteMessage(messageToDelete.id);
            setMessageToDelete(null);
        }
    };
    
    const findUserName = (id: string) => allUsers.find(u => u.id === id)?.name || 'Desconocido';

    return (
        <>
            <Modal title="Historial de Conversaciones" onClose={onClose} size="4xl">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {threads.length > 0 ? threads.map(({ original, reply }) => {
                        const isUserSender = original.senderId === user.id;
                        
                        const isOriginalCrossed = !!original.repliedBy;
                        const isReplyCrossed = !!(reply && reply.readBy.includes(original.senderId));
                        
                        const originalStyle = isReplyCrossed ? 'line-through text-gray-500' : isOriginalCrossed ? 'line-through text-gray-500' : '';
                        const replyStyle = isReplyCrossed ? 'line-through text-gray-500' : '';

                        return (
                            <div key={original.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                {/* Original Message */}
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className={originalStyle}>
                                            <p className="text-sm font-semibold text-gray-800">{original.subject}</p>
                                            <p className="text-xs text-gray-500">
                                                <span className="font-medium">{isUserSender ? 'Para' : 'De'}:</span> {findUserName(isUserSender ? original.recipientIds[0] : original.senderId)}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-xs text-gray-400">{new Date(original.timestamp).toLocaleString('es-ES')}</p>
                                            {user.role === Role.Admin && (
                                                <button onClick={() => setMessageToDelete(original)} className="text-gray-400 hover:text-red-500">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`mt-2 text-sm text-gray-700 whitespace-pre-wrap ${originalStyle}`}>{original.body}</p>
                                </div>
                                
                                {reply && (
                                    <div className="pl-6 mt-3 border-l-4 border-green-300">
                                        <div className="flex items-start justify-between">
                                            <div className={replyStyle}>
                                                <p className="text-sm font-semibold text-gray-800">{reply.subject}</p>
                                                <p className="text-xs text-gray-500">
                                                    <span className="font-medium">{reply.senderId === user.id ? 'Para' : 'De'}:</span> {findUserName(reply.senderId === user.id ? reply.recipientIds[0] : reply.senderId)}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-xs text-gray-400">{new Date(reply.timestamp).toLocaleString('es-ES')}</p>
                                                {user.role === Role.Admin && (
                                                    <button onClick={() => setMessageToDelete(reply)} className="text-gray-400 hover:text-red-500">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`mt-2 text-sm text-gray-700 whitespace-pre-wrap ${replyStyle}`}>{reply.body}</p>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <p className="py-8 text-center text-gray-500">No tienes conversaciones en tu historial.</p>
                    )}
                </div>
            </Modal>
            
            {messageToDelete && (
                <Modal title="Confirmar Eliminación" onClose={() => setMessageToDelete(null)}>
                    <div className="text-center">
                        <p className="text-lg text-gray-700">¿Estás seguro de que quieres eliminar este mensaje?</p>
                        <div className="p-3 my-4 text-left bg-gray-50 border rounded-md">
                            <p className="font-semibold">{messageToDelete.subject}</p>
                            <p className="text-sm text-gray-600 truncate">{messageToDelete.body}</p>
                        </div>
                        <p className="text-sm text-yellow-700">Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center mt-6 space-x-4">
                            <button onClick={() => setMessageToDelete(null)} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default MessagingHistoryModal;