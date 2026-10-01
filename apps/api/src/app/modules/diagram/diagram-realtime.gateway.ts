import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  type OnGatewayInit,
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
import type { DiagramOperationEvent } from '@diagram-flow/contracts';

const diagramRoom = (diagramId: string) => `diagram:${diagramId}`;
const userRoom = (userId: string) => `user:${userId}`;

type DiagramSocket = Socket & {
  data: {
    user?: AccessTokenPayload;
    expiryTimer?: ReturnType<typeof setTimeout>;
  };
};

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowed = (process.env.REALTIME_ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      callback(null, !origin || allowed.includes(origin));
    },
  },
})
@Injectable()
export class DiagramRealtimeGateway
  implements OnGatewayConnection, OnGatewayInit
{
  @WebSocketServer()
  private server!: Server;

  publishOperation(event: DiagramOperationEvent): void {
    // Include the originating user: their other tabs must receive the operation too.
    this.server
      .to(diagramRoom(event.diagramId))
      .emit('diagram:operation', event);
  }

  constructor(
    private readonly jwtService: JwtService,
    private readonly diagramService: DiagramService,
  ) {}

  afterInit(server: Server): void {
    // Authenticate before the client can send its first room-join message.
    server.use(async (client: DiagramSocket, next) => {
      const token = client.handshake.auth.token;
      try {
        if (typeof token !== 'string' || !token)
          throw new Error('Missing access token');
        client.data.user = accessTokenPayloadSchema.parse(
          await this.jwtService.verifyAsync(token),
        );
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  async handleConnection(client: DiagramSocket): Promise<void> {
    const user = client.data.user;
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.expiryTimer = setTimeout(
      () => client.disconnect(true),
      Math.max(0, user.exp * 1000 - Date.now()),
    );
    client.once('disconnect', () => clearTimeout(client.data.expiryTimer));
    await client.join(userRoom(user.sub));
  }

  @SubscribeMessage('diagram:join')
  async joinDiagram(
    @ConnectedSocket() client: DiagramSocket,
    @MessageBody() payload: unknown,
  ): Promise<{ ok: boolean }> {
    const parsedPayload = diagramParamsSchema.safeParse(payload);
    const user = client.data.user;

    if (!parsedPayload.success || !user || user.exp * 1000 <= Date.now()) {
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
    _sourceUserId: string,
    version: number,
  ): void {
    const event = diagramUpdatedEventSchema.parse({
      diagramId,
      version,
    });
    this.server.to(diagramRoom(diagramId)).emit('diagram:updated', event);
  }
}
