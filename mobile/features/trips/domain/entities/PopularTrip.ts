import { ID } from '@shared/kernel';

export interface PopularTrip {
  id: ID;
  title: string;
  savedCount: number;
  creatorName: string;
  coverImageUrl: string | null;
}
