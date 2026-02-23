import { AuthTokenMapper } from '../AuthTokenMapper';
import { OtpSessionDto } from '../../dto/OtpDto';

const mockDto: OtpSessionDto = {
  access_token: 'access-abc',
  refresh_token: 'refresh-xyz',
  expires_at: 1_700_000_000,
  user_id: 'user-1',
  phone: '+15551234567',
  is_onboarded: false,
};

describe('AuthTokenMapper', () => {
  const mapper = new AuthTokenMapper();

  it('maps OtpSessionDto to AuthToken correctly', () => {
    const token = mapper.map(mockDto);
    expect(token.accessToken).toBe('access-abc');
    expect(token.refreshToken).toBe('refresh-xyz');
    expect(token.expiresAt).toBe(1_700_000_000);
  });
});
