import { Mapper } from '@shared/kernel';
import { AuthToken } from '../../domain/entities/AuthToken';
import { OtpSessionDto } from '../dto/OtpDto';

export class AuthTokenMapper implements Mapper<OtpSessionDto, AuthToken> {
  map(dto: OtpSessionDto): AuthToken {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      expiresAt: dto.expires_at,
    };
  }
}
