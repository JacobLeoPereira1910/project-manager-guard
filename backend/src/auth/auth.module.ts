import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtUtils } from 'src/utils/jwt.utils';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module'; 
import { JwtStrategy } from 'src/utils/jwt.strategy';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'KEYFORGUARDAPP',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtUtils, JwtStrategy],
  exports: [AuthService, JwtUtils],
})
export class AuthModule {}
