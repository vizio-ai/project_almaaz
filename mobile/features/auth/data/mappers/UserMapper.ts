import { Mapper } from '@shared/kernel';
import { User } from '../../domain/entities/User';
import { OtpSessionDto } from '../dto/OtpDto';

export class UserMapper implements Mapper<OtpSessionDto, User> {
  map(dto: OtpSessionDto): User {
    return {
      id: dto.user_id,
      phone: dto.phone,
      isOnboarded: dto.is_onboarded,
    };
  }
}
