/**
 * Database types for the Supabase client — mirror of
 * supabase/migrations/*.sql. Hand-written until the migration is applied;
 * then regenerable via `supabase gen types typescript` (or the MCP tool)
 * and must be kept in sync with every migration.
 */

/** Avatar base choices (onboarding step 4) + equipped cosmetic per slot. */
export interface AvatarConfig {
  skinTone?: string;
  eyes?: string;
  hair?: string;
  hairColor?: string;
  /** slot → cosmetic id; base shirt/pants/backpack auto-equipped (spec §10). */
  equipped?: Record<string, string>;
}

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_config: AvatarConfig;
          coins: number;
          joined_beta_day: number | null;
          bio: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
        };
        /** Rows are created by the signup trigger — never by the client. */
        Insert: never;
        /** Only the client-updatable columns (column-level grants). */
        Update: {
          username?: string;
          display_name?: string;
          avatar_config?: AvatarConfig;
          bio?: string;
          onboarding_completed_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          beta_day: number;
          title: string;
          description: string;
          explainer: string;
          /** Day 4 is stored as SP + difficulty_modes; the chosen difficulty
           *  decides the effective mode (spec §7.2). */
          mode: 'SP' | 'H2H' | 'CV';
          capture_type:
            | 'timer_video'
            | 'camera_photo'
            | 'camera_video'
            | 'screenshot_plus_count'
            | 'multi_photo_count';
          has_difficulty: boolean;
          difficulty_modes: Record<string, 'SP' | 'H2H'> | null;
          victor_rule:
            | 'lower_time'
            | 'fewer_guesses'
            | 'community_vote'
            | 'higher_count'
            | 'higher_made_count'
            | 'pass_fail'
            | null;
          recording_cap_seconds: number | null;
          vote_window: unknown;
          proof_required: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          beta_day: number;
          state: 'in_progress' | 'submitted';
          submitted_at: string | null;
          passed: boolean | null;
          score: number | null;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          media_paths: string[];
          created_at: string;
        };
        Insert: {
          user_id: string;
          challenge_id: string;
          beta_day: number;
          difficulty?: 'easy' | 'medium' | 'hard';
        };
        /** Submitting / crash-safe reset while in_progress (RLS enforces). */
        Update: {
          state?: 'in_progress' | 'submitted';
          submitted_at?: string;
          passed?: boolean;
          score?: number;
          difficulty?: 'easy' | 'medium' | 'hard';
          media_paths?: string[];
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          responded_at: string | null;
        };
        /** Client sends requests only; status starts 'pending' via default. */
        Insert: {
          requester_id: string;
          addressee_id: string;
        };
        /** Addressee responds (RLS enforces); column grants limit the rest. */
        Update: {
          status: 'accepted' | 'declined';
          responded_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
        };
        Update: never;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          inviter_id: string;
          channel: 'imessage' | 'link';
          invite_code: string;
          sent_at: string;
          redeemed_by: string | null;
          redeemed_at: string | null;
        };
        /** Client supplies only these; code/timestamps come from DB defaults. */
        Insert: {
          inviter_id: string;
          channel: 'imessage' | 'link';
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_friend_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      get_fof_profiles: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_config: AvatarConfig;
        }[];
      };
      search_profiles: {
        Args: { term: string };
        Returns: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_config: AvatarConfig;
        }[];
      };
      is_blocked_pair: {
        Args: { a: string; b: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
