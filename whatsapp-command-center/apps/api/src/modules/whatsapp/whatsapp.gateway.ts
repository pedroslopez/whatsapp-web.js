import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SessionManager } from './session.manager';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'whatsapp',
})
export class WhatsAppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WhatsAppGateway.name);

  constructor(private sessionManager: SessionManager) {}

  handleConnection(client: Socket) {
    this.logger.log(`WhatsApp WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WhatsApp WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-session')
  handleSubscribeSession(client: Socket, sessionId: string) {
    this.logger.log(`Client ${client.id} subscribing to session ${sessionId}`);
    client.join(`session:${sessionId}`);
    return { event: 'subscribed', data: { sessionId } };
  }

  @SubscribeMessage('unsubscribe-session')
  handleUnsubscribeSession(client: Socket, sessionId: string) {
    this.logger.log(`Client ${client.id} unsubscribing from session ${sessionId}`);
    client.leave(`session:${sessionId}`);
    return { event: 'unsubscribed', data: { sessionId } };
  }

  // Emit QR code to subscribed clients
  emitQRCode(sessionId: string, qrCode: string) {
    this.server.to(`session:${sessionId}`).emit('qr-code', { sessionId, qrCode });
  }

  // Emit session status change
  emitStatusChange(sessionId: string, status: string) {
    this.server.to(`session:${sessionId}`).emit('status-change', { sessionId, status });
  }

  // Emit incoming message
  emitMessage(sessionId: string, message: any) {
    this.server.to(`session:${sessionId}`).emit('message', { sessionId, message });
  }
}
