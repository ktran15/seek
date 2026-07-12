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
      h2h_matches: {
        Row: {
          id: string;
          challenge_id: string;
          beta_day: number;
          protagonist_id: string;
          opponent_id: string | null;
          vs_mascot: boolean;
          protagonist_submission: string;
          opponent_submission: string | null;
          mascot_target_score: number | null;
          /** null + status 'resolved' = the mascot won (spec §6). */
          winner_user_id: string | null;
          status: 'pending' | 'resolved';
          resolved_at: string | null;
          created_at: string;
        };
        /** Edge Functions (service role) only — never the client. */
        Insert: never;
        Update: never;
        Relationships: [];
      };
      h2h_history: {
        Row: {
          id: string;
          user_id: string;
          faced_user_id: string;
          beta_week: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          submission_id: string;
          voter_id: string;
          beta_day: number;
          created_at: string;
          updated_at: string;
        };
        /** All writes go through the cast_vote RPC (spec §7.7). */
        Insert: never;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | 'h2h_result'
            | 'vote_result'
            | 'vote_countdown'
            | 'weekly_result'
            | 'daily_challenge'
            | 'invite_nudge'
            | 'friend_accepted';
          payload: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: never;
        /** Client may only flip the read flag (column grant). */
        Update: {
          read: boolean;
        };
        Relationships: [];
      };
      feed_posts: {
        Row: {
          id: string;
          submission_id: string;
          author_id: string;
          beta_day: number;
          like_count: number;
          comment_count: number;
          removed: boolean;
          created_at: string;
        };
        /** Created by the submissions trigger — never by the client. */
        Insert: never;
        Update: never;
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          type: 'like';
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          body: string;
          /** One-level replies (IG-style); null = top-level (M6.1). */
          parent_comment_id: string | null;
          /** Image comment in the comment-media bucket (owner folder). */
          media_path: string | null;
          like_count: number;
          removed: boolean;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          body: string;
          parent_comment_id?: string;
          media_path?: string;
        };
        /** No client edits in v1; removal is the admin path (spec §12). */
        Update: never;
        Relationships: [];
      };
      comment_reactions: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          type: 'like';
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string | null;
          comment_id: string | null;
          reported_user_id: string | null;
          reason: 'inappropriate' | 'spam' | 'fake_proof' | 'harassment' | 'other';
          details: string | null;
          status: 'open' | 'actioned' | 'dismissed';
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          post_id?: string;
          comment_id?: string;
          reported_user_id?: string;
          reason: 'inappropriate' | 'spam' | 'fake_proof' | 'harassment' | 'other';
          details?: string;
        };
        Update: never;
        Relationships: [];
      };
      coins_ledger: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          reason:
            | 'completion'
            | 'h2h_win'
            | 'vote_placement'
            | 'weekly_payout'
            | 'solo_weekly_payout'
            | 'crate_purchase'
            | 'dupe_refund'
            | 'invite_reward';
          ref_id: string | null;
          created_at: string;
        };
        /** Append-only, server-written (triggers/RPCs/Edge Fns — spec §2.1). */
        Insert: never;
        Update: never;
        Relationships: [];
      };
      points_ledger: {
        Row: {
          id: string;
          user_id: string;
          beta_week: number;
          delta: number;
          reason: 'completion' | 'h2h_win' | 'vote_placement';
          ref_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      crates: {
        Row: {
          id: string;
          user_id: string;
          tier: 'wood' | 'blue' | 'red' | 'yellow' | 'gold';
          source:
            | 'completion'
            | 'h2h_win'
            | 'vote_top3'
            | 'vote_win'
            | 'weekly_prize'
            | 'purchase'
            | 'invite_reward';
          opened: boolean;
          opened_at: string | null;
          created_at: string;
        };
        /** Awarded server-side; opened via the crate-open Edge Function. */
        Insert: never;
        Update: never;
        Relationships: [];
      };
      cosmetics: {
        Row: {
          id: string;
          slot:
            | 'boots'
            | 'pants'
            | 'backpack'
            | 'hats'
            | 'sunglasses'
            | 'shirts'
            | 'jacket'
            | 'pet';
          name: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          asset_slot_name: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      user_cosmetics: {
        Row: {
          id: string;
          user_id: string;
          cosmetic_id: string;
          created_at: string;
        };
        /** Written only by open_crate_apply (dupes refund instead). */
        Insert: never;
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
      push_tokens: {
        Row: {
          token: string;
          user_id: string;
          platform: 'ios' | 'android';
          updated_at: string;
        };
        /** Writes go through the register_push_token RPC (device may switch accounts). */
        Insert: never;
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
      cast_vote: {
        Args: { target_submission_id: string };
        Returns: undefined;
      };
      register_push_token: {
        Args: { p_token: string; p_platform: 'ios' | 'android' };
        Returns: undefined;
      };
      send_invite: {
        Args: { channel_in?: string };
        Returns: string;
      };
      my_coins: {
        Args: Record<string, never>;
        Returns: number;
      };
      can_view_post: {
        Args: { pid: string };
        Returns: boolean;
      };
      can_view_comment: {
        Args: { cid: string };
        Returns: boolean;
      };
      buy_crate: {
        Args: { tier_in: string };
        Returns: string;
      };
      get_weekly_leaderboard: {
        Args: { week_in?: number };
        Returns: {
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_config: AvatarConfig;
          points: number;
        }[];
      };
      get_public_profile_stats: {
        Args: { target: string };
        Returns: {
          submitted_days: number[];
          h2h_wins: number;
          h2h_losses: number;
          votes_won: number;
          coins_earned: number;
          vote_firsts: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
