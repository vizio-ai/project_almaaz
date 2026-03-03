import type { ManualItineraryRepository } from '../domain/repository/ManualItineraryRepository';

/** Stub implementation for development; replace with real Supabase impl in app. */
export function createStubManualItineraryRepository(): ManualItineraryRepository {
  return {
    // Itinerary
    async getById() { return null; },
    async create() { return { success: true, id: 'stub-id' }; },
    async update() { return { success: true }; },
    async remove() { return { success: true }; },

    // Days
    async addDay() { return { success: true, id: 'stub-day-id' }; },
    async updateDay() { return { success: true }; },
    async removeDay() { return { success: true }; },
    async reorderDays() { return { success: true }; },

    // Activities
    async addActivity() { return { success: true, id: 'stub-activity-id' }; },
    async updateActivity() { return { success: true }; },
    async removeActivity() { return { success: true }; },
    async reorderActivities() { return { success: true }; },

    // Travel Info
    async addTravelInfo() { return { success: true, id: 'stub-travel-info-id' }; },
    async updateTravelInfo() { return { success: true }; },
    async removeTravelInfo() { return { success: true }; },

    // Cover image
    async uploadCoverImage() { return { success: false }; },
  };
}
