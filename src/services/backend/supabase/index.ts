import { SupabaseClient } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { getSupabase } from "../../../lib/supabase";
import { countUniqueLocations, shuffle } from "../../../lib/utils";
import { countryFromLocationName } from "../../location";
import type {
  AuthResult,
  Backend,
  ForumPost,
  ForumPostWithAuthor,
  ForumTopic,
  ForumTopicWithDetails,
  NewTripInput,
  OAuthProvider,
  ProfileStats,
  Trip,
  TripWithDetails,
  UserProfile,
} from "../types";
import { uploadImage } from "./storage";

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  profile_photo: string | null;
  favorite_place: string | null;
  travel_tip: string | null;
  created_at: string;
};

const PROFILE_COLS =
  "id, email, username, profile_photo, favorite_place, travel_tip, created_at";

/**
 * Supabase-backed implementation of {@link Backend}.
 *
 * Expects the schema in `supabase/schema.sql`:
 *   profiles, trips, photos, forum_topics, forum_posts
 * and a public storage bucket named `media`.
 */
export class SupabaseBackend implements Backend {
  private sb: SupabaseClient;

  constructor() {
    this.sb = getSupabase();
  }

  private mapProfile(row: ProfileRow): UserProfile {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      profile_photo: row.profile_photo,
      favorite_place: row.favorite_place,
      travel_tip: row.travel_tip,
      created_at: row.created_at,
    };
  }

  private async profileById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.sb
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapProfile(data as ProfileRow) : null;
  }

  // --- Auth ---
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data } = await this.sb.auth.getUser();
    if (!data.user) return null;
    return this.profileById(data.user.id);
  }

  onAuthStateChange(cb: (u: UserProfile | null) => void): () => void {
    const { data } = this.sb.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        cb(null);
        return;
      }
      cb(await this.profileById(session.user.id));
    });
    return () => data.subscription.unsubscribe();
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    const user = data.user ? await this.profileById(data.user.id) : null;
    return { user };
  }

  async signUpWithEmail(
    email: string,
    password: string,
    username: string
  ): Promise<AuthResult> {
    const { data, error } = await this.sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    if (error) throw error;
    if (!data.session) {
      // Email confirmation flow enabled.
      return { user: null, needsConfirmation: true };
    }
    const user = data.user ? await this.profileById(data.user.id) : null;
    return { user };
  }

  async signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    const redirectTo = Linking.createURL("/auth/callback");
    const { data, error } = await this.sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== "web",
      },
    });
    if (error) throw error;

    if (Platform.OS !== "web" && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(
          url.hash ? url.hash.substring(1) : url.search
        );
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await this.sb.auth.setSession({ access_token, refresh_token });
        }
      }
    }
    const user = await this.getCurrentUser();
    return { user };
  }

  async sendPasswordReset(email: string): Promise<void> {
    const redirectTo = Linking.createURL("/auth/reset");
    const { error } = await this.sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.sb.auth.signOut();
  }

  // --- Profile ---
  async getProfile(userId: string): Promise<ProfileStats> {
    const profile = await this.profileById(userId);
    if (!profile) throw new Error("Profile not found.");
    const { data: trips, error } = await this.sb
      .from("trips")
      .select("id")
      .eq("user_id", userId);
    if (error) throw error;
    const tripIds = (trips ?? []).map((t) => t.id as string);
    let locations: string[] = [];
    if (tripIds.length) {
      const { data: photos, error: pErr } = await this.sb
        .from("photos")
        .select("location_name")
        .in("trip_id", tripIds);
      if (pErr) throw pErr;
      locations = (photos ?? []).map((p) => p.location_name as string);
    }
    return {
      profile,
      uniqueLocationCount: countUniqueLocations(locations),
      tripCount: tripIds.length,
    };
  }

  async updateProfile(
    userId: string,
    updates: Partial<
      Pick<UserProfile, "username" | "favorite_place" | "travel_tip" | "profile_photo">
    > & { profilePhotoUri?: string | null }
  ): Promise<UserProfile> {
    const patch: Record<string, unknown> = {};
    if (updates.username !== undefined) patch.username = updates.username;
    if (updates.favorite_place !== undefined)
      patch.favorite_place = updates.favorite_place;
    if (updates.travel_tip !== undefined) patch.travel_tip = updates.travel_tip;
    if (updates.profilePhotoUri) {
      patch.profile_photo = await uploadImage(
        this.sb,
        userId,
        updates.profilePhotoUri
      );
    } else if (updates.profile_photo !== undefined) {
      patch.profile_photo = updates.profile_photo;
    }
    const { data, error } = await this.sb
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select(PROFILE_COLS)
      .single();
    if (error) throw error;
    return this.mapProfile(data as ProfileRow);
  }

  // --- Trips ---
  private async enrich(trips: any[]): Promise<TripWithDetails[]> {
    if (!trips.length) return [];
    const tripIds = trips.map((t) => t.id);
    const userIds = Array.from(new Set(trips.map((t) => t.user_id)));

    const [{ data: photos }, { data: authors }] = await Promise.all([
      this.sb.from("photos").select("*").in("trip_id", tripIds),
      this.sb.from("profiles").select("id, username, profile_photo").in("id", userIds),
    ]);

    const authorMap = new Map(
      (authors ?? []).map((a) => [a.id, a as any])
    );
    return trips.map((t) => {
      const tripPhotos = (photos ?? []).filter((p) => p.trip_id === t.id);
      const countries = Array.from(
        new Set(
          tripPhotos
            .map(
              (p) => p.country ?? countryFromLocationName(p.location_name)
            )
            .filter((c): c is string => Boolean(c))
        )
      );
      const author = authorMap.get(t.user_id);
      return {
        ...(t as Trip),
        photos: tripPhotos,
        author: {
          id: t.user_id,
          username: author?.username ?? "traveller",
          profile_photo: author?.profile_photo ?? null,
        },
        uniqueLocationCount: countUniqueLocations(
          tripPhotos.map((p) => p.location_name)
        ),
        coverImage: tripPhotos[0]?.image_url ?? null,
        countries,
      };
    });
  }

  async createTrip(userId: string, input: NewTripInput): Promise<Trip> {
    const { data: trip, error } = await this.sb
      .from("trips")
      .insert({
        user_id: userId,
        trip_name: input.trip_name,
        season: input.season,
        spend: input.spend,
        party_size: input.party_size,
        itinerary: input.itinerary,
      })
      .select("*")
      .single();
    if (error) throw error;

    if (input.photos.length) {
      const rows = [];
      for (const ph of input.photos) {
        const url = await uploadImage(this.sb, userId, ph.uri);
        rows.push({
          trip_id: trip.id,
          image_url: url,
          location_name: ph.location_name,
          latitude: ph.latitude ?? null,
          longitude: ph.longitude ?? null,
          country: ph.country ?? countryFromLocationName(ph.location_name),
        });
      }
      const { error: pErr } = await this.sb.from("photos").insert(rows);
      if (pErr) throw pErr;
    }
    return trip as Trip;
  }

  async getTrip(tripId: string): Promise<TripWithDetails | null> {
    const { data, error } = await this.sb
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [enriched] = await this.enrich([data]);
    return enriched ?? null;
  }

  async listTrips(): Promise<TripWithDetails[]> {
    const { data, error } = await this.sb
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return shuffle(await this.enrich(data ?? []));
  }

  async listTripsByUser(userId: string): Promise<TripWithDetails[]> {
    const { data, error } = await this.sb
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.enrich(data ?? []);
  }

  // --- Forum ---
  async listTopics(): Promise<ForumTopicWithDetails[]> {
    const { data, error } = await this.sb
      .from("forum_topics")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const topics = data ?? [];
    if (!topics.length) return [];
    const userIds = Array.from(new Set(topics.map((t) => t.user_id)));
    const topicIds = topics.map((t) => t.id);
    const [{ data: authors }, { data: posts }] = await Promise.all([
      this.sb.from("profiles").select("id, username, profile_photo").in("id", userIds),
      this.sb.from("forum_posts").select("id, topic_id").in("topic_id", topicIds),
    ]);
    const authorMap = new Map((authors ?? []).map((a) => [a.id, a as any]));
    return topics.map((t) => ({
      ...(t as ForumTopic),
      author: {
        id: t.user_id,
        username: authorMap.get(t.user_id)?.username ?? "traveller",
        profile_photo: authorMap.get(t.user_id)?.profile_photo ?? null,
      },
      replyCount: (posts ?? []).filter((p) => p.topic_id === t.id).length,
    }));
  }

  async getTopic(topicId: string): Promise<ForumTopicWithDetails | null> {
    const { data, error } = await this.sb
      .from("forum_topics")
      .select("*")
      .eq("id", topicId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const author = await this.profileById(data.user_id);
    const { count } = await this.sb
      .from("forum_posts")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId);
    return {
      ...(data as ForumTopic),
      author: {
        id: data.user_id,
        username: author?.username ?? "traveller",
        profile_photo: author?.profile_photo ?? null,
      },
      replyCount: count ?? 0,
    };
  }

  async createTopic(userId: string, title: string): Promise<ForumTopic> {
    const { data, error } = await this.sb
      .from("forum_topics")
      .insert({ user_id: userId, title: title.trim() })
      .select("*")
      .single();
    if (error) throw error;
    return data as ForumTopic;
  }

  async listPosts(topicId: string): Promise<ForumPostWithAuthor[]> {
    const { data, error } = await this.sb
      .from("forum_posts")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const posts = data ?? [];
    if (!posts.length) return [];
    const userIds = Array.from(new Set(posts.map((p) => p.user_id)));
    const { data: authors } = await this.sb
      .from("profiles")
      .select("id, username, profile_photo")
      .in("id", userIds);
    const authorMap = new Map((authors ?? []).map((a) => [a.id, a as any]));
    return posts.map((p) => ({
      ...(p as ForumPost),
      author: {
        id: p.user_id,
        username: authorMap.get(p.user_id)?.username ?? "traveller",
        profile_photo: authorMap.get(p.user_id)?.profile_photo ?? null,
      },
    }));
  }

  async createPost(
    topicId: string,
    userId: string,
    message: string
  ): Promise<ForumPost> {
    const { data, error } = await this.sb
      .from("forum_posts")
      .insert({ topic_id: topicId, user_id: userId, message: message.trim() })
      .select("*")
      .single();
    if (error) throw error;
    return data as ForumPost;
  }
}
