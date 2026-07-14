/** Shared domain types + the backend interface used across the app. */

export type Season = "Summer" | "Autumn" | "Winter" | "Spring";
export const SEASONS: Season[] = ["Summer", "Autumn", "Winter", "Spring"];

export type PartySize = "Solo" | "Group" | "Couple" | "Family";
export const PARTY_SIZES: PartySize[] = ["Solo", "Group", "Couple", "Family"];

export type OAuthProvider = "google" | "apple";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  profile_photo: string | null;
  favorite_place: string | null;
  travel_tip: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  trip_id: string;
  image_url: string;
  location_name: string;
  /** Optional lat/lng captured from EXIF or geocoder for map integration. */
  latitude?: number | null;
  longitude?: number | null;
  /** ISO country name derived from the tagged location (used for filtering). */
  country?: string | null;
}

export interface Trip {
  id: string;
  user_id: string;
  trip_name: string;
  season: Season;
  spend: number;
  party_size: PartySize;
  itinerary: string;
  created_at: string;
}

/** A trip enriched with its photos and author for feed/discovery display. */
export interface TripWithDetails extends Trip {
  photos: Photo[];
  author: Pick<UserProfile, "id" | "username" | "profile_photo">;
  uniqueLocationCount: number;
  coverImage: string | null;
  countries: string[];
}

export interface ForumTopic {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ForumTopicWithDetails extends ForumTopic {
  author: Pick<UserProfile, "id" | "username" | "profile_photo">;
  replyCount: number;
}

export interface ForumPost {
  id: string;
  topic_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface ForumPostWithAuthor extends ForumPost {
  author: Pick<UserProfile, "id" | "username" | "profile_photo">;
}

export interface NewTripInput {
  trip_name: string;
  season: Season;
  spend: number;
  party_size: PartySize;
  itinerary: string;
  photos: NewPhotoInput[];
}

export interface NewPhotoInput {
  /** Local file uri (mock) or an already-uploaded url. */
  uri: string;
  location_name: string;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
}

export interface ProfileStats {
  profile: UserProfile;
  uniqueLocationCount: number;
  tripCount: number;
}

export interface AuthResult {
  user: UserProfile | null;
  /** Present when email confirmation is required before a session is created. */
  needsConfirmation?: boolean;
}

export interface Backend {
  // --- Auth ---
  getCurrentUser(): Promise<UserProfile | null>;
  onAuthStateChange(cb: (user: UserProfile | null) => void): () => void;
  signInWithEmail(email: string, password: string): Promise<AuthResult>;
  signUpWithEmail(
    email: string,
    password: string,
    username: string
  ): Promise<AuthResult>;
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;

  // --- Profile ---
  getProfile(userId: string): Promise<ProfileStats>;
  updateProfile(
    userId: string,
    updates: Partial<
      Pick<
        UserProfile,
        "username" | "favorite_place" | "travel_tip" | "profile_photo"
      >
    > & { profilePhotoUri?: string | null }
  ): Promise<UserProfile>;

  // --- Trips / Photos ---
  createTrip(userId: string, input: NewTripInput): Promise<Trip>;
  getTrip(tripId: string): Promise<TripWithDetails | null>;
  listTrips(): Promise<TripWithDetails[]>;
  listTripsByUser(userId: string): Promise<TripWithDetails[]>;

  // --- Forum ---
  listTopics(): Promise<ForumTopicWithDetails[]>;
  getTopic(topicId: string): Promise<ForumTopicWithDetails | null>;
  createTopic(userId: string, title: string): Promise<ForumTopic>;
  listPosts(topicId: string): Promise<ForumPostWithAuthor[]>;
  createPost(
    topicId: string,
    userId: string,
    message: string
  ): Promise<ForumPost>;
}
