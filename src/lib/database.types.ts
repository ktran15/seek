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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
