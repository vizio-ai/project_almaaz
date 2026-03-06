import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../supabase';
import type {
  ManualItineraryRepository,
  CreateItineraryParams,
  UpdateItineraryParams,
  AddDayParams,
  UpdateDayParams,
  AddActivityParams,
  UpdateActivityParams,
  AddTravelInfoParams,
  UpdateTravelInfoParams,
  ItineraryWithDetails,
} from '@shared/manual-itinerary';
import type { Itinerary } from '@shared/manual-itinerary';
import type { ItineraryDay } from '@shared/manual-itinerary';
import type { Activity } from '@shared/manual-itinerary';
import type { TravelInfo } from '@shared/manual-itinerary';

export function createManualItineraryRepository(): ManualItineraryRepository {
  return {
    // ─── Itinerary ──────────────────────────────────────────────────────────

    async getById(id: string): Promise<ItineraryWithDetails | null> {
      const { data: row, error } = await supabase
        .from('itineraries')
        .select(`
          id, title, destination, start_date, end_date,
          cover_image_url, trip_notes, is_public, is_clonable, is_ai_generated,
          profiles:user_id (name, surname, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error || !row) return null;

      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const creatorName = profile
        ? `${profile.name ?? ''} ${profile.surname ?? ''}`.trim() || null
        : null;

      const itinerary: Itinerary = {
        id: row.id,
        title: row.title,
        destination: row.destination,
        startDate: row.start_date,
        endDate: row.end_date,
        coverImageUrl: row.cover_image_url,
        tripNotes: row.trip_notes,
        isPublic: row.is_public,
        isClonable: row.is_clonable,
        isAiGenerated: row.is_ai_generated,
        creatorName,
        creatorAvatarUrl: profile?.avatar_url ?? null,
      };

      const { data: daysData } = await supabase
        .from('itinerary_days')
        .select('id, day_number, date, notes, accommodation')
        .eq('itinerary_id', id)
        .order('day_number', { ascending: true });

      const days: ItineraryDay[] = (daysData ?? []).map((d) => ({
        id: d.id,
        dayNumber: d.day_number,
        date: d.date,
        notes: d.notes ?? null,
        accommodation: d.accommodation ?? null,
      }));

      const activities: Activity[] = [];
      const dayIds = days.map((d) => d.id);
      if (dayIds.length > 0) {
        const { data: actsData } = await supabase
          .from('itinerary_activities')
          .select('id, day_id, sort_order, name, activity_type, start_time, location_text, latitude, longitude')
          .in('day_id', dayIds)
          .order('sort_order', { ascending: true });

        (actsData ?? []).forEach((a) => {
          activities.push({
            id: a.id,
            dayId: a.day_id,
            sortOrder: a.sort_order,
            name: a.name,
            activityType: a.activity_type ?? null,
            startTime: a.start_time ?? null,
            locationText: a.location_text,
            latitude: a.latitude,
            longitude: a.longitude,
          });
        });
      }

      const { data: travelData } = await supabase
        .from('itinerary_travel_info')
        .select('id, type, title, provider, detail, start_datetime, end_datetime')
        .eq('itinerary_id', id)
        .order('created_at', { ascending: true });

      const travelInfo: TravelInfo[] = (travelData ?? []).map((t) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        provider: t.provider,
        detail: t.detail,
        startDatetime: t.start_datetime,
        endDatetime: t.end_datetime,
      }));

      return { itinerary, days, activities, travelInfo };
    },

    async create(params: CreateItineraryParams) {
      const { data, error } = await supabase
        .from('itineraries')
        .insert({
          user_id: params.userId,
          title: params.title,
          destination: params.destination,
          start_date: params.startDate ?? null,
          end_date: params.endDate ?? null,
          is_public: params.isPublic ?? false,
          is_clonable: params.isClonable ?? false,
          trip_notes: params.tripNotes ?? null,
          is_ai_generated: params.isAiGenerated ?? false,
        })
        .select('id')
        .single();

      if (error || !data) return { success: false };

      if (params.travelInfo && params.travelInfo.length > 0) {
        const rows = params.travelInfo.map((t) => ({
          itinerary_id: data.id,
          type: t.type,
          title: t.title,
          provider: t.provider ?? null,
          detail: t.detail ?? null,
          start_datetime: t.startDatetime ?? null,
          end_datetime: t.endDatetime ?? null,
        }));

        await supabase.from('itinerary_travel_info').insert(rows);
      }

      return { success: true, id: data.id };
    },

    async update(id: string, params: UpdateItineraryParams) {
      const payload: Record<string, unknown> = {};
      if (params.title !== undefined) payload.title = params.title;
      if (params.destination !== undefined) payload.destination = params.destination;
      if (params.startDate !== undefined) payload.start_date = params.startDate;
      if (params.endDate !== undefined) payload.end_date = params.endDate;
      if (params.tripNotes !== undefined) payload.trip_notes = params.tripNotes;
      if (params.isPublic !== undefined) payload.is_public = params.isPublic;
      if (params.isClonable !== undefined) payload.is_clonable = params.isClonable;
      if (params.coverImageUrl !== undefined) payload.cover_image_url = params.coverImageUrl;

      const { error } = await supabase.from('itineraries').update(payload).eq('id', id);
      return { success: !error };
    },

    async remove(id: string) {
      const { error } = await supabase.from('itineraries').delete().eq('id', id);
      return { success: !error };
    },

    // ─── Days ────────────────────────────────────────────────────────────────

    async addDay(itineraryId: string, params: AddDayParams) {
      const { data: maxData } = await supabase
        .from('itinerary_days')
        .select('day_number')
        .eq('itinerary_id', itineraryId)
        .order('day_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextDayNumber = (maxData?.day_number ?? 0) + 1;

      const { data, error } = await supabase
        .from('itinerary_days')
        .insert({
          itinerary_id: itineraryId,
          day_number: nextDayNumber,
          date: params.date ?? null,
          notes: params.notes ?? null,
          accommodation: params.accommodation ?? null,
        })
        .select('id')
        .single();

      if (error) return { success: false };
      return { success: true, id: data.id };
    },

    async updateDay(dayId: string, params: UpdateDayParams) {
      const payload: Record<string, unknown> = {};
      if (params.date !== undefined) payload.date = params.date;
      if (params.notes !== undefined) payload.notes = params.notes;
      if (params.accommodation !== undefined) payload.accommodation = params.accommodation;
      const { error } = await supabase
        .from('itinerary_days')
        .update(payload)
        .eq('id', dayId);
      return { success: !error };
    },

    async removeDay(dayId: string) {
      const { error } = await supabase.from('itinerary_days').delete().eq('id', dayId);
      return { success: !error };
    },

    async reorderDays(itineraryId: string, orderedDayIds: string[]) {
      const results = await Promise.all(
        orderedDayIds.map((dayId, index) =>
          supabase
            .from('itinerary_days')
            .update({ day_number: index + 1 })
            .eq('id', dayId)
            .eq('itinerary_id', itineraryId),
        ),
      );
      return { success: results.every((r) => !r.error) };
    },

    // ─── Activities ──────────────────────────────────────────────────────────

    async addActivity(dayId: string, params: AddActivityParams) {
      let sortOrder = params.sortOrder;
      if (sortOrder === undefined) {
        const { data: maxData } = await supabase
          .from('itinerary_activities')
          .select('sort_order')
          .eq('day_id', dayId)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();
        sortOrder = (maxData?.sort_order ?? 0) + 1;
      }

      const { data, error } = await supabase
        .from('itinerary_activities')
        .insert({
          day_id: dayId,
          sort_order: sortOrder,
          name: params.name,
          activity_type: params.activityType ?? null,
          start_time: params.startTime ?? null,
          location_text: params.locationText ?? null,
          latitude: params.latitude ?? null,
          longitude: params.longitude ?? null,
        })
        .select('id')
        .single();

      if (error) return { success: false };
      return { success: true, id: data.id };
    },

    async updateActivity(activityId: string, params: UpdateActivityParams) {
      const payload: Record<string, unknown> = {};
      if (params.name !== undefined) payload.name = params.name;
      if (params.sortOrder !== undefined) payload.sort_order = params.sortOrder;
      if (params.activityType !== undefined) payload.activity_type = params.activityType;
      if (params.startTime !== undefined) payload.start_time = params.startTime;
      if (params.locationText !== undefined) payload.location_text = params.locationText;
      if (params.latitude !== undefined) payload.latitude = params.latitude;
      if (params.longitude !== undefined) payload.longitude = params.longitude;

      const { error } = await supabase.from('itinerary_activities').update(payload).eq('id', activityId);
      return { success: !error };
    },

    async removeActivity(activityId: string) {
      const { error } = await supabase.from('itinerary_activities').delete().eq('id', activityId);
      return { success: !error };
    },

    async reorderActivities(dayId: string, orderedActivityIds: string[]) {
      const results = await Promise.all(
        orderedActivityIds.map((actId, index) =>
          supabase
            .from('itinerary_activities')
            .update({ sort_order: index + 1 })
            .eq('id', actId)
            .eq('day_id', dayId),
        ),
      );
      return { success: results.every((r) => !r.error) };
    },

    // ─── Travel Info ─────────────────────────────────────────────────────────

    async addTravelInfo(itineraryId: string, params: AddTravelInfoParams) {
      const { data, error } = await supabase
        .from('itinerary_travel_info')
        .insert({
          itinerary_id: itineraryId,
          type: params.type,
          title: params.title,
          provider: params.provider ?? null,
          detail: params.detail ?? null,
          start_datetime: params.startDatetime ?? null,
          end_datetime: params.endDatetime ?? null,
        })
        .select('id')
        .single();

      if (error) return { success: false };
      return { success: true, id: data.id };
    },

    async updateTravelInfo(id: string, params: UpdateTravelInfoParams) {
      const payload: Record<string, unknown> = {};
      if (params.type !== undefined) payload.type = params.type;
      if (params.title !== undefined) payload.title = params.title;
      if (params.provider !== undefined) payload.provider = params.provider;
      if (params.detail !== undefined) payload.detail = params.detail;
      if (params.startDatetime !== undefined) payload.start_datetime = params.startDatetime;
      if (params.endDatetime !== undefined) payload.end_datetime = params.endDatetime;

      const { error } = await supabase.from('itinerary_travel_info').update(payload).eq('id', id);
      return { success: !error };
    },

    async removeTravelInfo(id: string) {
      const { error } = await supabase.from('itinerary_travel_info').delete().eq('id', id);
      return { success: !error };
    },

    // ─── Cover Image ─────────────────────────────────────────────────────────

    async uploadCoverImage(userId: string, itineraryId: string, localUri: string) {
      try {
        // Compress to JPEG, max 1280px wide (16:9 cover, ~150–400 KB)
        const compressed = await ImageManipulator.manipulateAsync(
          localUri,
          [{ resize: { width: 1280 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        if (!compressed.base64) return { success: false };

        const path = `${userId}/${itineraryId}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(path, decode(compressed.base64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) return { success: false };

        const { data } = supabase.storage.from('covers').getPublicUrl(path);
        return { success: true, url: data.publicUrl };
      } catch {
        return { success: false };
      }
    },
  };
}
