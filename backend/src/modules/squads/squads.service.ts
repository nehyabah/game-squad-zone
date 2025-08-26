import { randomBytes } from 'node:crypto';
import type { CreateSquadInput, JoinSquadInput } from './squads.dto';
import { SquadRepo, type SquadRecord, type SquadMemberRecord } from './squads.repo';
import { AppError } from '../../core/errors';

/**
 * Squads module business logic.
 */
export class SquadNotFoundError extends AppError {
  constructor() {
    super('Squad not found');
  }
}

export class InvalidJoinCodeError extends AppError {
  constructor() {
    super('Invalid join code');
  }
}

export class AlreadyMemberError extends AppError {
  constructor() {
    super('User already a member of squad');
  }
}

export class SquadService {
  constructor(private readonly repo: SquadRepo) {}

  private generateJoinCode() {
    return randomBytes(3).toString('hex');
  }

  async create(data: CreateSquadInput, ownerId: string): Promise<SquadRecord> {
    let joinCode: string;
    do {
      joinCode = this.generateJoinCode();
    } while (await this.repo.findByJoinCode(joinCode));

    const squad = await this.repo.createSquad(data.name, joinCode, ownerId);
    await this.repo.addMember(squad.id, ownerId);
    return squad;
  }

  async join(data: JoinSquadInput, userId: string): Promise<SquadRecord> {
    const squad = await this.repo.findByJoinCode(data.joinCode);
    if (!squad) {
      throw new InvalidJoinCodeError();
    }
    if (await this.repo.isMember(squad.id, userId)) {
      throw new AlreadyMemberError();
    }
    await this.repo.addMember(squad.id, userId);
    return squad;
  }

  async get(id: string): Promise<SquadRecord> {
    const squad = await this.repo.findSquadById(id);
    if (!squad) {
      throw new SquadNotFoundError();
    }
    return squad;
  }

  async listMembers(id: string): Promise<SquadMemberRecord[]> {
    const squad = await this.repo.findSquadById(id);
    if (!squad) {
      throw new SquadNotFoundError();
    }
    return squad.members ?? [];
  }
}
