import { Mapper } from '@shared/kernel';
import { PopularTripDto } from '../dto/TripDto';
import { PopularTrip } from '../../domain/entities/PopularTrip';

export class PopularTripMapper implements Mapper<PopularTripDto, PopularTrip> {
  map(dto: PopularTripDto): PopularTrip {
    return {
      id: dto.id,
      title: dto.title,
      savedCount: dto.save_count,
      creatorName: dto.creator_name,
      coverImageUrl: dto.cover_image_url,
    };
  }
}
