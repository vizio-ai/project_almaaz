import { ID } from '@shared/kernel';

export interface PopularTrip {
  id: ID;
  userId: string;
  title: string;
  savedCount: number;
  creatorName: string;
  coverImageUrl: string | null;
}
