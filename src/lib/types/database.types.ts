// Tipos escritos manualmente a partir das migrations em `supabase/migrations`.
// Depois de criar o projeto no Supabase, regenere com:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts

export type UserRole = "admin" | "trainer" | "student" | "standard";
export type ProtocolType = "workout" | "diet";
export type JoinRequestStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          onboarded?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          role: UserRole;
          full_name: string;
          email: string;
          onboarded: boolean;
        }>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          trainer_id: string;
          profile_id: string;
          nickname: string | null;
          email: string;
          birth_date: string | null;
          notes: string | null;
          has_workout: boolean;
          has_diet: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          profile_id: string;
          nickname?: string | null;
          email: string;
          birth_date?: string | null;
          notes?: string | null;
          has_workout?: boolean;
          has_diet?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          nickname: string | null;
          email: string;
          birth_date: string | null;
          notes: string | null;
          has_workout: boolean;
          has_diet: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "students_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      protocols: {
        Row: {
          id: string;
          student_id: string;
          type: ProtocolType;
          start_date: string;
          end_date: string;
          is_active: boolean;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          type: ProtocolType;
          start_date?: string;
          end_date: string;
          is_active?: boolean;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<{
          end_date: string;
          is_active: boolean;
          notes: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "protocols_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_days: {
        Row: {
          id: string;
          protocol_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          protocol_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          sort_order: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "workout_days_protocol_id_fkey";
            columns: ["protocol_id"];
            isOneToOne: false;
            referencedRelation: "protocols";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          id: string;
          workout_day_id: string;
          name: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          recommended_load_kg: number | null;
          video_url: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_day_id: string;
          name: string;
          sets: number;
          reps: string;
          rest_seconds?: number;
          recommended_load_kg?: number | null;
          video_url?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          recommended_load_kg: number | null;
          video_url: string | null;
          notes: string | null;
          sort_order: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "exercises_workout_day_id_fkey";
            columns: ["workout_day_id"];
            isOneToOne: false;
            referencedRelation: "workout_days";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_load_logs: {
        Row: {
          id: string;
          exercise_id: string;
          logged_at: string;
          weight_kg: number;
          reps_done: number | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          logged_at?: string;
          weight_kg: number;
          reps_done?: number | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<{
          logged_at: string;
          weight_kg: number;
          reps_done: number | null;
          notes: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "exercise_load_logs_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      meals: {
        Row: {
          id: string;
          protocol_id: string;
          name: string;
          suggested_time: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          protocol_id: string;
          name: string;
          suggested_time?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          suggested_time: string | null;
          sort_order: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "meals_protocol_id_fkey";
            columns: ["protocol_id"];
            isOneToOne: false;
            referencedRelation: "protocols";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_options: {
        Row: {
          id: string;
          meal_id: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          label: string;
          sort_order: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "meal_options_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_items: {
        Row: {
          id: string;
          meal_option_id: string;
          food_name: string;
          quantity: number;
          unit: string;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_option_id: string;
          food_name: string;
          quantity: number;
          unit: string;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          food_name: string;
          quantity: number;
          unit: string;
          notes: string | null;
          sort_order: number;
        }>;
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_option_id_fkey";
            columns: ["meal_option_id"];
            isOneToOne: false;
            referencedRelation: "meal_options";
            referencedColumns: ["id"];
          },
        ];
      };
      team_codes: {
        Row: {
          trainer_id: string;
          code: string;
          created_at: string;
        };
        Insert: {
          trainer_id: string;
          code: string;
          created_at?: string;
        };
        Update: Partial<{
          code: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "team_codes_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_join_requests: {
        Row: {
          id: string;
          trainer_id: string;
          user_id: string;
          status: JoinRequestStatus;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          user_id: string;
          status?: JoinRequestStatus;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: Partial<{
          status: JoinRequestStatus;
          decided_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "team_join_requests_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_join_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_join_attempts: {
        Row: {
          id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<{
          created_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "team_join_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_new_protocol: {
        Args: {
          p_student_id: string;
          p_type: ProtocolType;
          p_end_date: string;
          p_duplicate: boolean;
          p_start_date?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      protocol_type: ProtocolType;
      join_request_status: JoinRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
