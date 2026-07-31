import type { Request } from 'express';
import type { AccessTokenPayload } from '../schemas/access-token-payload.schema';

export type AuthenticatedRequest = Request & {
  user?: AccessTokenPayload;
};
