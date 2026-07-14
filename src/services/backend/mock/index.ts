import AsyncStorage from "@react-native-async-storage/async-storage";
import { uid, shuffle, countUniqueLocations } from "../../../lib/utils";
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
  Photo,
  ProfileStats,
  Trip,
  TripWithDetails,
  UserProfile,
} from "../types";
import { buildSeed, MockDB } from "./seed";

const DB_KEY = "oyal.mockdb.v1";
const SESSION_KEY = "oyal.session.v1";

/**
 * Local, AsyncStorage-backed implementation of {@link Backend}. Used when no
 * Supabase credentials are provided so the whole app is runnable and testable.
 */
export class MockBackend implements Backend {
  private db: MockDB | null = null;
  private listeners = new Set<(u: UserProfile | null) => void>();

  private async load(): Promise<MockDB> {
    if (this.db) return this.db;
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) {
      this.db = JSON.parse(raw) as MockDB;
    } else {
      this.db = buildSeed();
      await this.persist();
    }
    return this.db;
  }

  private async persist(): Promise<void> {
    if (this.db) await AsyncStorage.setItem(DB_KEY, JSON.stringify(this.db));
  }

  private emit(user: UserProfile | null) {
    this.listeners.forEach((cb) => cb(user));
  }

  private authorOf(db: MockDB, userId: string) {
    const u = db.users.find((x) => x.id === userId);
    return {
      id: userId,
      username: u?.username ?? "traveller",
      profile_photo: u?.profile_photo ?? null,
    };
  }

  private enrichTrip(db: MockDB, trip: Trip): TripWithDetails {
    const photos = db.photos.filter((p) => p.trip_id === trip.id);
    const countries = Array.from(
      new Set(
        photos
          .map((p) => p.country ?? countryFromLocationName(p.location_name))
          .filter((c): c is string => Boolean(c))
      )
    );
    return {
      ...trip,
      photos,
      author: this.authorOf(db, trip.user_id),
      uniqueLocationCount: countUniqueLocations(photos.map((p) => p.location_name)),
      coverImage: photos[0]?.image_url ?? null,
      countries,
    };
  }

  // --- Auth ---
  async getCurrentUser(): Promise<UserProfile | null> {
    const db = await this.load();
    const id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return db.users.find((u) => u.id === id) ?? null;
  }

  onAuthStateChange(cb: (u: UserProfile | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const db = await this.load();
    const key = email.trim().toLowerCase();
    const stored = db.credentials[key];
    if (!stored || stored !== password) {
      throw new Error("Incorrect email or password.");
    }
    const user = db.users.find((u) => u.email.toLowerCase() === key)!;
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    this.emit(user);
    return { user };
  }

  async signUpWithEmail(
    email: string,
    password: string,
    username: string
  ): Promise<AuthResult> {
    const db = await this.load();
    const key = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === key)) {
      throw new Error("An account with this email already exists.");
    }
    const user: UserProfile = {
      id: uid("u"),
      email: key,
      username: username.trim() || key.split("@")[0],
      profile_photo: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(
        username || key
      )}&backgroundColor=b6e3f4`,
      favorite_place: null,
      travel_tip: null,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    db.credentials[key] = password;
    await this.persist();
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    this.emit(user);
    return { user };
  }

  async signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    // Mock OAuth: create/return a demo account for the provider.
    const db = await this.load();
    const email = `${provider}.traveller@oyal.app`;
    let user = db.users.find((u) => u.email === email);
    if (!user) {
      user = {
        id: uid("u"),
        email,
        username: `${provider}_traveller`,
        profile_photo: `https://api.dicebear.com/7.x/adventurer/png?seed=${provider}&backgroundColor=ffd5dc`,
        favorite_place: null,
        travel_tip: null,
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
      await this.persist();
    }
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    this.emit(user);
    return { user };
  }

  async sendPasswordReset(_email: string): Promise<void> {
    // No-op in mock; UI shows a confirmation message.
    return;
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
    this.emit(null);
  }

  // --- Profile ---
  async getProfile(userId: string): Promise<ProfileStats> {
    const db = await this.load();
    const profile = db.users.find((u) => u.id === userId);
    if (!profile) throw new Error("Profile not found.");
    const tripIds = db.trips.filter((t) => t.user_id === userId).map((t) => t.id);
    const locations = db.photos
      .filter((p) => tripIds.includes(p.trip_id))
      .map((p) => p.location_name);
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
    const db = await this.load();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Profile not found.");
    if (updates.username !== undefined) user.username = updates.username;
    if (updates.favorite_place !== undefined)
      user.favorite_place = updates.favorite_place;
    if (updates.travel_tip !== undefined) user.travel_tip = updates.travel_tip;
    if (updates.profilePhotoUri) user.profile_photo = updates.profilePhotoUri;
    if (updates.profile_photo !== undefined)
      user.profile_photo = updates.profile_photo;
    await this.persist();
    this.emit(user);
    return user;
  }

  // --- Trips ---
  async createTrip(userId: string, input: NewTripInput): Promise<Trip> {
    const db = await this.load();
    const trip: Trip = {
      id: uid("t"),
      user_id: userId,
      trip_name: input.trip_name,
      season: input.season,
      spend: input.spend,
      party_size: input.party_size,
      itinerary: input.itinerary,
      created_at: new Date().toISOString(),
    };
    db.trips.push(trip);
    input.photos.forEach((ph) => {
      const photo: Photo = {
        id: uid("p"),
        trip_id: trip.id,
        image_url: ph.uri,
        location_name: ph.location_name,
        latitude: ph.latitude ?? null,
        longitude: ph.longitude ?? null,
        country: ph.country ?? countryFromLocationName(ph.location_name),
      };
      db.photos.push(photo);
    });
    await this.persist();
    return trip;
  }

  async getTrip(tripId: string): Promise<TripWithDetails | null> {
    const db = await this.load();
    const trip = db.trips.find((t) => t.id === tripId);
    return trip ? this.enrichTrip(db, trip) : null;
  }

  async listTrips(): Promise<TripWithDetails[]> {
    const db = await this.load();
    return shuffle(db.trips.map((t) => this.enrichTrip(db, t)));
  }

  async listTripsByUser(userId: string): Promise<TripWithDetails[]> {
    const db = await this.load();
    return db.trips
      .filter((t) => t.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((t) => this.enrichTrip(db, t));
  }

  // --- Forum ---
  async listTopics(): Promise<ForumTopicWithDetails[]> {
    const db = await this.load();
    return db.topics
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((t) => ({
        ...t,
        author: this.authorOf(db, t.user_id),
        replyCount: db.posts.filter((p) => p.topic_id === t.id).length,
      }));
  }

  async getTopic(topicId: string): Promise<ForumTopicWithDetails | null> {
    const db = await this.load();
    const topic = db.topics.find((t) => t.id === topicId);
    if (!topic) return null;
    return {
      ...topic,
      author: this.authorOf(db, topic.user_id),
      replyCount: db.posts.filter((p) => p.topic_id === topic.id).length,
    };
  }

  async createTopic(userId: string, title: string): Promise<ForumTopic> {
    const db = await this.load();
    const topic: ForumTopic = {
      id: uid("ft"),
      user_id: userId,
      title: title.trim(),
      created_at: new Date().toISOString(),
    };
    db.topics.push(topic);
    await this.persist();
    return topic;
  }

  async listPosts(topicId: string): Promise<ForumPostWithAuthor[]> {
    const db = await this.load();
    return db.posts
      .filter((p) => p.topic_id === topicId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((p) => ({ ...p, author: this.authorOf(db, p.user_id) }));
  }

  async createPost(
    topicId: string,
    userId: string,
    message: string
  ): Promise<ForumPost> {
    const db = await this.load();
    const post: ForumPost = {
      id: uid("fp"),
      topic_id: topicId,
      user_id: userId,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };
    db.posts.push(post);
    await this.persist();
    return post;
  }
}
