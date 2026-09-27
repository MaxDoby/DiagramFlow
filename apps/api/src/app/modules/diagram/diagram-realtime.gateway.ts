import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import {
  accessTokenPayloadSchema,
  type AccessTokenPayload,
} from '../auth/schemas/access-token-payload.schema';
import {
  diagramParamsSchema,
  diagramUpdatedEventSchema,
} from '@diagram-flow/contracts';
import { DiagramService } from './diagram.service';

const diagramRoom = (diagramId: string) => `diagram:${diagramId}`;
const userRoom = (userId: string) => `user:${userId}`;

type DiagramSocket = Socket & {
  data: {
    user?: AccessTokenPayload;
  };
};

@WebSocketGateway({})
@Injectable()
export class DiagramRealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly diagramService: DiagramService,
  ) {}

  async handleConnection(client: DiagramSocket): Promise<void> {
    const token = client.handshake.auth.token;

    if (typeof token !== 'string' || token.length === 0) {
      client.disconnect(true);

      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = accessTokenPayloadSchema.parse(payload);
      await client.join(userRoom(client.data.user.sub));
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('diagram:join')
  async joinDiagram(
    @ConnectedSocket() client: DiagramSocket,
    @MessageBody() payload: unknown,
  ): Promise<{ ok: boolean }> {
    const parsedPayload = diagramParamsSchema.safeParse(payload);
    const user = client.data.user;

    if (!parsedPayload.success || !user) {
      return { ok: false };
    }

    try {
      await this.diagramService.getDiagram(
        user.sub,
        parsedPayload.data.diagramId,
      );
    } catch {
      return { ok: false };
    }

    await client.join(diagramRoom(parsedPayload.data.diagramId));

    return { ok: true };
  }

  publishDiagramUpdated(
    diagramId: string,
    sourceUserId: string,
    version: number,
  ): void {
    const event = diagramUpdatedEventSchema.parse({
      diagramId,
      version,
    });
    this.server
      .to(diagramRoom(diagramId))
      .except(userRoom(sourceUserId))
      .emit('diagram:updated', event);
  }
}
