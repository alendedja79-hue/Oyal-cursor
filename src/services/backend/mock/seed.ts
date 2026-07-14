import type {
  ForumPost,
  ForumTopic,
  Photo,
  Trip,
  UserProfile,
} from "../types";

/** Deterministic demo content so the app is explorable without a backend. */

export interface MockDB {
  users: UserProfile[];
  trips: Trip[];
  photos: Photo[];
  topics: ForumTopic[];
  posts: ForumPost[];
  /** email -> password, mock auth only. */
  credentials: Record<string, string>;
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=70`;

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=b6e3f4`;

export function buildSeed(): MockDB {
  const users: UserProfile[] = [
    {
      id: "u_maya",
      email: "maya@oyal.app",
      username: "maya_wanders",
      profile_photo: avatar("maya"),
      favorite_place: "Kyoto, Japan",
      travel_tip: "Wake up for sunrise — the best places are empty at 6am.",
      created_at: "2025-11-02T09:00:00.000Z",
    },
    {
      id: "u_leo",
      email: "leo@oyal.app",
      username: "leo_offgrid",
      profile_photo: avatar("leo"),
      favorite_place: "Patagonia, Chile",
      travel_tip: "Pack half the clothes and twice the snacks.",
      created_at: "2025-11-08T09:00:00.000Z",
    },
    {
      id: "u_amara",
      email: "amara@oyal.app",
      username: "amara.roams",
      profile_photo: avatar("amara"),
      favorite_place: "Lisbon, Portugal",
      travel_tip: "Eat where the taxi drivers eat.",
      created_at: "2025-11-15T09:00:00.000Z",
    },
  ];

  const trips: Trip[] = [
    {
      id: "t_japan",
      user_id: "u_maya",
      trip_name: "Slow mornings in Japan",
      season: "Autumn",
      spend: 2400,
      party_size: "Couple",
      itinerary:
        "Day 1 Tokyo street food. Day 2 bullet train to Kyoto. Day 3 temples of Arashiyama. Day 4 tea ceremony + Fushimi Inari at dawn.",
      created_at: "2025-11-20T10:00:00.000Z",
    },
    {
      id: "t_patagonia",
      user_id: "u_leo",
      trip_name: "Patagonia on foot",
      season: "Summer",
      spend: 1800,
      party_size: "Solo",
      itinerary:
        "W-trek across Torres del Paine over 5 days. Camp under the towers, kayak past glaciers, finish with a steak in Puerto Natales.",
      created_at: "2025-12-01T10:00:00.000Z",
    },
    {
      id: "t_portugal",
      user_id: "u_amara",
      trip_name: "Tiles, trams & tarts",
      season: "Spring",
      spend: 950,
      party_size: "Group",
      itinerary:
        "Lisbon miradouros, a day trip to Sintra's palaces, then surf lessons in Cascais. Pastéis de nata every single morning.",
      created_at: "2025-12-10T10:00:00.000Z",
    },
    {
      id: "t_iceland",
      user_id: "u_maya",
      trip_name: "Chasing the northern lights",
      season: "Winter",
      spend: 3100,
      party_size: "Family",
      itinerary:
        "Golden Circle, black sand beaches at Vík, a soak in the Blue Lagoon, and three clear nights of aurora over the highlands.",
      created_at: "2025-12-18T10:00:00.000Z",
    },
  ];

  const photos: Photo[] = [
    {
      id: "p_1",
      trip_id: "t_japan",
      image_url: img("1493976040374-85c8e12f0c0e"),
      location_name: "Tokyo, Japan",
      country: "Japan",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    {
      id: "p_2",
      trip_id: "t_japan",
      image_url: img("1524413840807-0c3cb6fa808d"),
      location_name: "Kyoto, Japan",
      country: "Japan",
      latitude: 35.0116,
      longitude: 135.7681,
    },
    {
      id: "p_3",
      trip_id: "t_japan",
      image_url: img("1478436127897-769e1b3f0f36"),
      location_name: "Arashiyama, Kyoto, Japan",
      country: "Japan",
      latitude: 35.0094,
      longitude: 135.6667,
    },
    {
      id: "p_4",
      trip_id: "t_patagonia",
      image_url: img("1483728642387-6c3bdd6c93e5"),
      location_name: "Torres del Paine, Chile",
      country: "Chile",
      latitude: -50.9423,
      longitude: -73.4068,
    },
    {
      id: "p_5",
      trip_id: "t_patagonia",
      image_url: img("1531794343125-c0c6cd4b7f6c"),
      location_name: "Puerto Natales, Chile",
      country: "Chile",
      latitude: -51.7236,
      longitude: -72.4875,
    },
    {
      id: "p_6",
      trip_id: "t_portugal",
      image_url: img("1585208798174-6cedd86e019a"),
      location_name: "Lisbon, Portugal",
      country: "Portugal",
      latitude: 38.7223,
      longitude: -9.1393,
    },
    {
      id: "p_7",
      trip_id: "t_portugal",
      image_url: img("1512470876302-972faa2aa9a4"),
      location_name: "Sintra, Portugal",
      country: "Portugal",
      latitude: 38.7979,
      longitude: -9.3907,
    },
    {
      id: "p_8",
      trip_id: "t_iceland",
      image_url: img("1504893524553-b855bce32c67"),
      location_name: "Vík í Mýrdal, Iceland",
      country: "Iceland",
      latitude: 63.4194,
      longitude: -19.0064,
    },
    {
      id: "p_9",
      trip_id: "t_iceland",
      image_url: img("1531366936337-7c912a4589a7"),
      location_name: "Reykjavík, Iceland",
      country: "Iceland",
      latitude: 64.1466,
      longitude: -21.9426,
    },
  ];

  const topics: ForumTopic[] = [
    {
      id: "ft_1",
      user_id: "u_leo",
      title: "Best carry-on backpack for 2 weeks?",
      created_at: "2025-12-20T08:00:00.000Z",
    },
    {
      id: "ft_2",
      user_id: "u_amara",
      title: "Underrated cities in Europe you loved?",
      created_at: "2025-12-22T14:30:00.000Z",
    },
    {
      id: "ft_3",
      user_id: "u_maya",
      title: "Tips for solo female travellers in Japan",
      created_at: "2025-12-24T19:15:00.000Z",
    },
  ];

  const posts: ForumPost[] = [
    {
      id: "fp_1",
      topic_id: "ft_1",
      user_id: "u_maya",
      message: "The 40L Osprey Farpoint has never let me down.",
      created_at: "2025-12-20T09:00:00.000Z",
    },
    {
      id: "fp_2",
      topic_id: "ft_1",
      user_id: "u_amara",
      message: "Anything under 45L that fits the cabin sizer + packing cubes.",
      created_at: "2025-12-20T10:30:00.000Z",
    },
    {
      id: "fp_3",
      topic_id: "ft_2",
      user_id: "u_leo",
      message: "Ljubljana blew me away — tiny, green and so walkable.",
      created_at: "2025-12-22T16:00:00.000Z",
    },
    {
      id: "fp_4",
      topic_id: "ft_3",
      user_id: "u_amara",
      message: "Trains are spotless and safe late at night. Get an IC card!",
      created_at: "2025-12-24T20:00:00.000Z",
    },
  ];

  return {
    users,
    trips,
    photos,
    topics,
    posts,
    credentials: {
      "maya@oyal.app": "password",
      "leo@oyal.app": "password",
      "amara@oyal.app": "password",
    },
  };
}
