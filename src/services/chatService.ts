import { io, Socket } from 'socket.io-client';
import { dbService } from './dbService';
import { Message } from '../types';

class ChatService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;
    
    // In production, the socket server is the same as the host
    const socketUrl = window.location.origin;
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
  }

  joinRoom(chatId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('join', chatId);
  }

  sendMessage(message: Partial<Message>) {
    if (!this.socket) this.connect();
    this.socket?.emit('sendMessage', message);
  }

  onMessage(callback: (message: Message) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('message', callback);
  }

  offMessage(callback: (message: Message) => void) {
    this.socket?.off('message', callback);
  }

  async getMessages(chatId: string) {
    // Get historical messages from Firestore
    const messages = await dbService.messages.list({
      where: [['chatId', '==', chatId]],
      limit: 100,
      orderBy: [['timestamp', 'asc']]
    });
    return messages;
  }
}

export const chatService = new ChatService();
