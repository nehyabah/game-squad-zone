import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateSquadInput, JoinSquadInput, CreateSquadDto } from './squads.dto';
import {
  AlreadyMemberError,
  InvalidJoinCodeError,
  SquadNotFoundError,
  SquadService,
} from './squads.service';

/**
 * Squads module HTTP handlers.
 */
export class SquadController {
  constructor(private readonly service: SquadService) {}

  async create(
    req: FastifyRequest<{ Body: CreateSquadInput }>,
    reply: FastifyReply,
  ) {
    const userId = (req as { user?: { id?: string } }).user?.id ?? '';
    const squad = await this.service.create(req.body, userId);
    return reply.code(201).send(squad);
  }

  async join(
    req: FastifyRequest<{ Body: JoinSquadInput }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = (req as { user?: { id?: string } }).user?.id ?? '';
      const squad = await this.service.join(req.body, userId);
      return reply.send(squad);
    } catch (err) {
      if (err instanceof InvalidJoinCodeError) {
        return reply
          .status(400)
          .type('application/problem+json')
          .send({
            type: 'https://errors.game-squad-zone/squads/invalid-join-code',
            title: 'Invalid join code',
            status: 400,
            detail: 'The provided join code is not valid.',
          });
      }
      if (err instanceof AlreadyMemberError) {
        return reply
          .status(409)
          .type('application/problem+json')
          .send({
            type: 'https://errors.game-squad-zone/squads/already-member',
            title: 'Already a member',
            status: 409,
            detail: 'User already belongs to this squad.',
          });
      }
      throw err;
    }
  }

  async get(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const squad = await this.service.get(req.params.id);
      const members = await this.service.listMembers(req.params.id);
      return reply.send({ ...squad, members });
    } catch (err) {
      if (err instanceof SquadNotFoundError) {
        return reply
          .status(404)
          .type('application/problem+json')
          .send({
            type: 'https://errors.game-squad-zone/squads/not-found',
            title: 'Squad not found',
            status: 404,
            detail: 'The requested squad does not exist.',
          });
      }
      throw err;
    }
  }
}