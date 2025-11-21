import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private userSockets: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from user sockets
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: string; organizationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User authenticated: ${data.userId}`);
    this.userSockets.set(data.userId, client);
    client.join(`org:${data.organizationId}`);
    return { event: 'authenticated', data: { success: true } };
  }

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { event: 'joined-conversation', data };
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { event: 'left-conversation', data };
  }

  // Emit events to clients
  emitToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Event types
  emitNewMessage(conversationId: string, organizationId: string, message: any) {
    this.emitToConversation(conversationId, 'new-message', message);
    this.emitToOrganization(organizationId, 'conversation-updated', {
      conversationId,
      lastMessage: message,
    });
  }

  emitConversationUpdated(organizationId: string, conversation: any) {
    this.emitToOrganization(organizationId, 'conversation-updated', conversation);
  }

  emitContactUpdated(organizationId: string, contact: any) {
    this.emitToOrganization(organizationId, 'contact-updated', contact);
  }

  emitWhatsAppStatusChange(organizationId: string, session: any) {
    this.emitToOrganization(organizationId, 'whatsapp-status-change', session);
  }
}
