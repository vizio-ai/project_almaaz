import { HomeItineraryDto } from '../dto/TripDto';
import { HomeItinerary } from '../../domain/entities/HomeItinerary';

export class HomeItineraryMapper {
  map(dto: HomeItineraryDto): HomeItinerary {
    return {
      id: dto.id,
      title: dto.title,
      destination: dto.destination,
      startDate: dto.start_date,
      endDate: dto.end_date,
      coverImageUrl: dto.cover_image_url,
      todayAccommodation: dto.today_accommodation,
      todayActivities: dto.today_activities.map((a) => ({
        id: a.id,
        name: a.name,
        activityType: a.activity_type,
        startTime: a.start_time,
        locationText: a.location_text,
      })),
    };
  }
}
