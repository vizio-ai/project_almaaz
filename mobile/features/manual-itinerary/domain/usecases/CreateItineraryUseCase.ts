import type {
  ManualItineraryRepository,
  CreateItineraryParams,
} from '../repository/ManualItineraryRepository';

export class CreateItineraryUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(params: CreateItineraryParams): Promise<{ success: boolean; id?: string }> {
    const title = params.title?.trim() || 'Untitled trip';
    return this.repository.create({ ...params, title });
  }
}
