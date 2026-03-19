import React, { useState } from 'react';
import { Message, User } from '../types';
import Modal from './Modal';

const ReplyForm: React.FC<{
    originalMessage: Message;
    onSend: (body: string) => void;
    onCancel: () => void;
}> = ({ originalMessage, onSend, onCancel }) => {
    const [body, setBody] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(body);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mt-2 space-y-4 bg-gray-100 border-t rounded-b-lg">
            <h4 className="font-semibold text-gray-800">Responder a: {originalMessage.subject}</h4>
            <div>
                <label htmlFor="replyBody" className="sr-only">Cuerpo de la respuesta</label>
                <textarea
                    id="replyBody"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Escribe tu respuesta aquí..."
                    required
                />
            </div>
             <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                    Enviar Respuesta
                </button>
            </div>
        </form>
    );
};

interface PendingMessagesModalProps {
    user: User;
    messages: Message[]; // unread messages
    allUsers: User[];
    onClose: () => void;
    onSendMessage: (messageData: { senderId: string; recipientIds: string[]; subject: string; body: string; targetType: 'tutors' | 'groups' | 'students'; originalMessageId: string; }) => void;
    onMarkMessagesAsRead: (messageIds: string[]) => void;
}

const PendingMessagesModal: React.FC<PendingMessagesModalProps> = ({ user, messages, allUsers, onClose, onSendMessage, onMarkMessagesAsRead }) => {
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const findSenderName = (senderId: string) => {
        const u = allUsers.find(u => u.id === senderId);
        return u ? `${u.lastName}, ${u.firstName}` : 'Desconocido';
    };

    const handleSendReply = (body: string) => {
        if (replyingTo) {
            onSendMessage({
                senderId: user.id,
                recipientIds: [replyingTo.senderId],
                subject: `Re: ${replyingTo.subject}`,
                body,
                targetType: 'students', // This is less critical for a direct reply
                originalMessageId: replyingTo.id,
            });
            onMarkMessagesAsRead([replyingTo.id]);
            setReplyingTo(null);

            if (messages.length === 1 && messages[0].id === replyingTo.id) {
                onClose();
            }
        }
    };

    const handleMarkAsRead = (messageId: string) => {
        onMarkMessagesAsRead([messageId]);
        if (messages.length === 1 && messages[0].id === messageId) {
            onClose();
        }
    };

    return (
        <Modal
            title={`Tienes ${messages.length} mensaje(s) pendiente(s)`}
            onClose={onClose}
            size="3xl"
        >
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {messages.length > 0 ? messages.map(msg => (
                    <div key={msg.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-baseline justify-between">
                            <p className="text-sm text-gray-600">
                                De: <span className="font-bold">{findSenderName(msg.senderId)}</span>
                            </p>
                            <span className="text-xs text-gray-400">
                                {new Date(msg.timestamp).toLocaleString('es-ES')}
                            </span>
                        </div>
                        <h4 className="mt-1 font-semibold text-green-800">{msg.subject}</h4>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{msg.body}</p>
                        
                        {replyingTo?.id === msg.id ? (
                             <ReplyForm 
                                originalMessage={replyingTo}
                                onSend={handleSendReply}
                                onCancel={() => setReplyingTo(null)}
                            />
                        ) : (
                            <div className="flex justify-end pt-2 mt-2 border-t">
                                {msg.originalMessageId ? (
                                    <button
                                        onClick={() => handleMarkAsRead(msg.id)}
                                        className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        Leído
                                    </button>
                                ) : !msg.repliedBy ? (
                                    <button
                                        onClick={() => setReplyingTo(msg)}
                                        className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        Responder
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                )) : (
                     <p className="py-8 text-center text-gray-500">No hay mensajes pendientes.</p>
                )}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Cerrar
                </button>
            </div>
        </Modal>
    );
};

export default PendingMessagesModal;