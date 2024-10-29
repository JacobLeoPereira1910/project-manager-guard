import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtUtils {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: object): string {
    return this.jwtService.sign(payload);
  }
}
