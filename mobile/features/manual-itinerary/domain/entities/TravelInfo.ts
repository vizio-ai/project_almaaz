export type TravelInfoType = 'flight' | 'rental_car' | 'hotel' | 'other';

export interface TravelInfo {
  id: string;
  type: TravelInfoType;
  title: string;
  provider?: string | null;
  detail?: string | null;
  startDatetime?: string | null;
  /** Optional end datetime, used for hotel check-out, rental car drop-off, etc. */
  endDatetime?: string | null;
}
