import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import { DIAGRAM_REPOSITORY_PORT } from '@diagram-flow/api-ports';
import {
  diagramNodeSchema,
  diagramSnapshotSchema,
  type DiagramOperation,
  type DiagramOperationEvent,
} from '@diagram-flow/contracts';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { DiagramController } from './diagram.controller';
import { DiagramService } from './diagram.service';
import { PrismaDiagramRepository } from './prisma-diagram.repository';
import { DiagramRealtimeGateway } from './diagram-realtime.gateway';
import { DiagramImageStorageService } from './image/diagram-image-storage.service';

// Opt in with an isolated, migrated PostgreSQL database. Never use production.
const databaseUrl = process.env.DIAGRAMFLOW_TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;
const empty = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
const node = () =>
  diagramNodeSchema.parse({
    id: randomUUID(),
    type: 'shape',
    position: { x: 80, y: 80 },
    width: 140,
    height: 80,
    zIndex: 0,
    data: {
      label: 'Rectangle',
      shapeType: 'rectangle',
      backgroundColor: '#ffffff',
      borderColor: '#52525b',
      borderWidth: 2,
      opacity: 1,
      rotation: 0,
      fontFamily: 'sans',
      textAlign: 'center',
    },
  });
const addition = (): DiagramOperation => ({
  id: randomUUID(),
  changes: [{ type: 'node.add', node: node() }],
});

integration('Diagram operations with PostgreSQL, HTTP and Socket.IO', () => {
  jest.setTimeout(15000);
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let baseUrl: string;
  let diagramId: string;
  const owner = randomUUID();
  const collaborator = randomUUID();
  const outsider = randomUUID();
  const sockets: Socket[] = [];
  const token = (userId: string, expiresIn = 60) =>
    jwt.sign(
      { sub: userId, email: `${userId}@diagramflow.test` },
      { expiresIn },
    );
  const post = (userId: string, path: string, body: unknown) =>
    fetch(`${baseUrl}/api/diagrams/${diagramId}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token(userId)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  const connect = async (accessToken: string) => {
    const socket = io(baseUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
    });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Socket connection timed out')),
        5000,
      );
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once('connect_error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      socket.connect();
    });
    return socket;
  };
  const join = (socket: Socket) =>
    new Promise<{ ok: boolean }>((resolve, reject) => {
      socket
        .timeout(5000)
        .emit(
          'diagram:join',
          { diagramId },
          (error: Error | null, response: { ok: boolean }) =>
            error ? reject(error) : resolve(response),
        );
    });
  const nextOperation = (socket: Socket) =>
    new Promise<DiagramOperationEvent>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Operation broadcast timed out')),
        5000,
      );
      socket.once('diagram:operation', (event) => {
        clearTimeout(timer);
        resolve(event);
      });
    });

  beforeAll(async () => {
    prisma = new PrismaService(
      new ConfigService({ DATABASE_URL: databaseUrl }),
    );
    await prisma.$connect();
    await prisma.user.createMany({
      data: [owner, collaborator, outsider].map((id) => ({
        id,
        email: `${id}@diagramflow.test`,
        passwordHash: 'integration-test-only',
        emailConfirmedAt: new Date(),
      })),
    });
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'isolated-integration-test-secret-only' }),
      ],
      controllers: [DiagramController],
      providers: [
        AccessTokenGuard,
        DiagramService,
        DiagramRealtimeGateway,
        { provide: PrismaService, useValue: prisma },
        {
          provide: DIAGRAM_REPOSITORY_PORT,
          useValue: new PrismaDiagramRepository(prisma),
        },
        { provide: DiagramImageStorageService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    jwt = app.get(JwtService);
  });
  beforeEach(async () => {
    const diagram = await prisma.diagram.create({
      data: {
        ownerId: owner,
        name: 'Operation integration test',
        snapshot: empty,
        collaborators: { create: { userId: collaborator } },
      },
    });
    diagramId = diagram.id;
  });
  afterEach(async () => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
    if (diagramId) await prisma.diagram.delete({ where: { id: diagramId } });
  });
  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { id: { in: [owner, collaborator, outsider] } },
      });
      if (app) await app.close();
      await prisma.$disconnect();
    }
  });

  it('serializes simultaneous editors without losing either addition', async () => {
    const operations = Array.from({ length: 12 }, addition);
    const responses = await Promise.all(
      operations.map((operation, index) =>
        post(index % 2 ? collaborator : owner, 'operations', operation),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual(
      Array(12).fill(201),
    );
    const events: DiagramOperationEvent[] = await Promise.all(
      responses.map((response) => response.json()),
    );
    expect(events.map((event) => event.version).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    const saved = await prisma.diagram.findUniqueOrThrow({
      where: { id: diagramId },
    });
    expect(saved.snapshot).toMatchObject({
      nodes: expect.arrayContaining(
        operations.map((op) => (op.changes[0] as { node: unknown }).node),
      ),
    });
    expect(await prisma.diagramOperation.count({ where: { diagramId } })).toBe(
      12,
    );
  });

  it('returns the original receipt on retry and rejects reuse with different content', async () => {
    const operation = addition();
    const first = await (await post(owner, 'operations', operation)).json();
    const retry = await (await post(owner, 'operations', operation)).json();
    expect(retry).toEqual(first);
    expect(await prisma.diagramOperation.count({ where: { diagramId } })).toBe(
      1,
    );
    const invalid = await post(owner, 'operations', {
      ...addition(),
      id: operation.id,
    });
    expect(invalid.status).toBe(409);
    expect(
      (await prisma.diagram.findUniqueOrThrow({ where: { id: diagramId } }))
        .version,
    ).toBe(1);
  });

  it('retains simultaneous label and position changes to the same node', async () => {
    const initial = node();
    await post(owner, 'operations', {
      id: randomUUID(),
      changes: [{ type: 'node.add', node: initial }],
    });
    const responses = await Promise.all([
      post(owner, 'operations', {
        id: randomUUID(),
        changes: [
          {
            type: 'node.update',
            id: initial.id,
            patch: { position: { x: 450, y: 150 } },
          },
        ],
      }),
      post(collaborator, 'operations', {
        id: randomUUID(),
        changes: [
          {
            type: 'node.update',
            id: initial.id,
            patch: { data: { label: 'Collaborator label' } },
          },
        ],
      }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    const saved = await prisma.diagram.findUniqueOrThrow({
      where: { id: diagramId },
    });
    expect(diagramSnapshotSchema.parse(saved.snapshot).nodes[0]).toMatchObject({
      position: { x: 450, y: 150 },
      data: { label: 'Collaborator label' },
    });
    expect(saved.version).toBe(3);
  });

  it('also logs a legacy snapshot replacement and rejects a stale replacement', async () => {
    const snapshot = { ...empty, nodes: [node()] };
    const put = (expectedVersion: number) =>
      fetch(`${baseUrl}/api/diagrams/${diagramId}/snapshot`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token(owner)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snapshot, expectedVersion }),
      });
    expect((await put(0)).status).toBe(200);
    const records = await prisma.diagramOperation.findMany({
      where: { diagramId },
    });
    expect(records).toHaveLength(1);
    expect(records[0].payload).toEqual([
      { type: 'node.add', node: snapshot.nodes[0] },
    ]);
    expect((await put(0)).status).toBe(409);
    expect(await prisma.diagramOperation.count({ where: { diagramId } })).toBe(
      1,
    );
  });

  it('rolls back snapshot, version and log when an image is unavailable', async () => {
    const imageNode = node();
    imageNode.data.shapeType = 'image';
    imageNode.data.imageUrl = `/uploads/diagram-images/${randomUUID()}.png`;
    const operation: DiagramOperation = {
      id: randomUUID(),
      changes: [{ type: 'node.add', node: imageNode }],
    };
    expect((await post(owner, 'operations', operation)).status).toBe(400);
    expect(
      (await prisma.diagram.findUniqueOrThrow({ where: { id: diagramId } }))
        .version,
    ).toBe(0);
    expect(await prisma.diagramOperation.count({ where: { diagramId } })).toBe(
      0,
    );
  });

  it('reconciles committed IDs only for their author and rejects nonmembers', async () => {
    const operation = addition();
    await post(owner, 'operations', operation);
    const response = await (
      await post(owner, 'sync', { pendingIds: [operation.id] })
    ).json();
    expect(response).toMatchObject({
      version: 1,
      acknowledgedIds: [operation.id],
    });
    expect(
      await (
        await post(collaborator, 'sync', { pendingIds: [operation.id] })
      ).json(),
    ).toMatchObject({ acknowledgedIds: [] });
    expect((await post(outsider, 'operations', addition())).status).toBe(404);
    expect((await post(outsider, 'sync', { pendingIds: [] })).status).toBe(404);
  });

  it('broadcasts the committed operation to both editors, including its author', async () => {
    const authorSocket = await connect(token(owner));
    const otherSocket = await connect(token(collaborator));
    expect(await join(authorSocket)).toEqual({ ok: true });
    expect(await join(otherSocket)).toEqual({ ok: true });
    const authorEvent = nextOperation(authorSocket);
    const otherEvent = nextOperation(otherSocket);
    const operation = addition();
    const saved = await (await post(owner, 'operations', operation)).json();
    expect(await authorEvent).toEqual(saved);
    expect(await otherEvent).toEqual(saved);
  });

  it('denies an unauthorized room and an invalid handshake token', async () => {
    const socket = await connect(token(outsider));
    expect(await join(socket)).toEqual({ ok: false });
    await expect(connect('invalid-token')).rejects.toThrow('Unauthorized');
  });

  it('disconnects a socket when its access token expires', async () => {
    const socket = await connect(token(owner, 2));
    const reason = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Expired socket stayed connected')),
        4000,
      );
      socket.once('disconnect', (value) => {
        clearTimeout(timer);
        resolve(value);
      });
    });
    expect(reason).toBe('io server disconnect');
  });
});
