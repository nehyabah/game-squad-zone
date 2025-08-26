import type { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

/**
 * Auth module HTTP handlers.
 */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  async login(_body: LoginDto) {
    // TODO: handle login
  }
}
