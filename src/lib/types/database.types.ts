// Tipos escritos manualmente a partir das migrations em `supabase/migrations`.
// Depois de criar o projeto no Supabase, regenere com:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts

export type UserRole = "admin" | "trainer" | "student" | "standard";
export type ProtocolType = "workout" | "diet";
export type ExerciseKind = "strength" | "cardio";
export type IncentiveEvent = "workout" | "diet" | "day" | "streak";
// Linhas de selo: treino, dieta, ou os dois juntos.
export type SealLine = "workout" | "diet" | "both";
export type JoinRequestStatus ="pending" | "approved" | "rejected";

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
          ranking_opt_in: boolean;
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
          ranking_opt_in?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          nickname: string | null;
          email: string;
          birth_date: string | null;
          notes: string | null;
          has_workout: boolean;
          has_diet: boolean;
          ranking_opt_in: boolean;
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
          student_id: string | null;
          owner_trainer_id: string | null;
          template_name: string | null;
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
          student_id?: string | null;
          owner_trainer_id?: string | null;
          template_name?: string | null;
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
          template_name: string | null;
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
          kind: ExerciseKind;
          sets: number | null;
          reps: string | null;
          // Nulo = sem descanso definido (treino gerado, cardio). Sem valor padrão no banco (0038).
          rest_seconds: number | null;
          recommended_load_kg: number | null;
          target_minutes: number | null;
          target_distance_km: number | null;
          video_url: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_day_id: string;
          name: string;
          kind?: ExerciseKind;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          recommended_load_kg?: number | null;
          target_minutes?: number | null;
          target_distance_km?: number | null;
          video_url?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          sets: number | null;
          reps: string | null;
          rest_seconds: number | null;
          recommended_load_kg: number | null;
          target_minutes: number | null;
          target_distance_km: number | null;
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
          weight_kg: number | null;
          reps_done: number | null;
          sets_done: number | null;
          equipment: string | null;
          weight_text: string | null;
          reps_text: string | null;
          duration_minutes: number | null;
          distance_km: number | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          logged_at?: string;
          weight_kg?: number | null;
          reps_done?: number | null;
          sets_done?: number | null;
          equipment?: string | null;
          weight_text?: string | null;
          reps_text?: string | null;
          duration_minutes?: number | null;
          distance_km?: number | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<{
          logged_at: string;
          weight_kg: number | null;
          reps_done: number | null;
          sets_done: number | null;
          equipment: string | null;
          weight_text: string | null;
          reps_text: string | null;
          duration_minutes: number | null;
          distance_km: number | null;
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
          choice_group: string | null;
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
          choice_group?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          food_name: string;
          quantity: number;
          unit: string;
          notes: string | null;
          choice_group: string | null;
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
      meal_logs: {
        Row: {
          id: string;
          meal_id: string;
          log_date: string;
          done: boolean;
          note: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          log_date: string;
          done: boolean;
          note?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          done: boolean;
          note: string | null;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "meal_logs_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        // Só a função register_push_subscription grava; o cliente lê e apaga.
        Insert: Record<string, never>;
        Update: Partial<Record<never, never>>;
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rest_alarms: {
        Row: {
          id: string;
          user_id: string;
          due_at: string;
          body: string | null;
          status: "pending" | "sent" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          due_at: string;
          body?: string | null;
          status?: "pending";
          created_at?: string;
        };
        Update: Partial<{
          status: "sent" | "cancelled";
        }>;
        Relationships: [
          {
            foreignKeyName: "rest_alarms_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_catalog: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          muscle_group: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string | null;
          name: string;
          muscle_group: string;
          created_at?: string;
        };
        Update: Partial<Record<never, never>>;
        Relationships: [
          {
            foreignKeyName: "exercise_catalog_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      incentive_messages: {
        Row: {
          id: string;
          owner_id: string | null;
          event: IncentiveEvent;
          body: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string | null;
          event: IncentiveEvent;
          body: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          body: string;
          active: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "incentive_messages_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_scores: {
        Row: {
          student_id: string;
          score_date: string;
          workout_done: boolean;
          diet_done: boolean;
          updated_at: string;
        };
        // Só os gatilhos do banco gravam (o cliente tem apenas leitura).
        Insert: {
          student_id: string;
          score_date: string;
          workout_done?: boolean;
          diet_done?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          workout_done: boolean;
          diet_done: boolean;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "daily_scores_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      trainer_settings: {
        Row: {
          trainer_id: string;
          ranking_enabled: boolean;
          updated_at: string;
        };
        // Só o próprio profissional lê e grava (RLS).
        Insert: {
          trainer_id: string;
          ranking_enabled?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          ranking_enabled: boolean;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "trainer_settings_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      body_data: {
        Row: {
          profile_id: string;
          birth_date: string;
          height_cm: number | null;
          weight_kg: number | null;
          consented_at: string;
          updated_at: string;
        };
        // A própria pessoa grava (e o profissional do time só lê). consented_at e updated_at são do banco.
        Insert: {
          profile_id: string;
          birth_date: string;
          height_cm?: number | null;
          weight_kg?: number | null;
        };
        Update: Partial<{
          birth_date: string;
          height_cm: number | null;
          weight_kg: number | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "body_data_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rest_days: {
        Row: {
          student_id: string;
          rest_date: string;
          created_at: string;
        };
        // Só o dono do plano grava e apaga (o profissional só lê).
        Insert: {
          student_id: string;
          rest_date: string;
          created_at?: string;
        };
        Update: Partial<{
          rest_date: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "rest_days_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      achievements: {
        Row: {
          id: string;
          student_id: string;
          line: SealLine;
          milestone: number;
          earned_on: string;
          created_at: string;
        };
        // Só o servidor (service role) grava os selos.
        Insert: {
          id?: string;
          student_id: string;
          line: SealLine;
          milestone: number;
          earned_on: string;
          created_at?: string;
        };
        Update: Partial<{
          earned_on: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "achievements_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
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
      // Só o servidor (chave de serviço) chama estas funções; veja src/lib/login-throttle.ts.
      login_throttle_begin: {
        Args: { p_keys: string[]; p_policy: unknown };
        Returns: { blocked: boolean; wait_seconds: number }[];
      };
      login_throttle_fail: {
        Args: { p_key: string; p_step: number; p_decay: number; p_schedule: unknown };
        Returns: number;
      };
      login_throttle_clear: {
        Args: { p_keys: string[] };
        Returns: undefined;
      };
      register_push_subscription: {
        Args: { p_endpoint: string; p_p256dh: string; p_auth: string; p_user_agent?: string };
        Returns: undefined;
      };
      // Grava o treino gerado (protocolo, dias e exercícios) numa transação; só o Usuário Padrão, no plano próprio.
      create_generated_workout: {
        Args: { p_student_id: string; p_start_date: string; p_end_date: string; p_notes: string | null; p_days: unknown };
        Returns: string;
      };
      my_ranking_state: {
        Args: Record<string, never>;
        Returns: { enabled: boolean; opted_in: boolean; participants: number }[];
      };
      set_ranking_participation: {
        Args: { p_join: boolean };
        Returns: boolean;
      };
      team_leaderboard: {
        Args: { p_month: string };
        Returns: { display_name: string; total_points: number; is_me: boolean }[];
      };
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
      apply_protocol: {
        Args: {
          p_source_protocol_id: string;
          p_student_id: string;
          p_end_date: string;
          p_start_date?: string;
        };
        Returns: string;
      };
      register_join_attempt: {
        Args: {
          p_user_id: string;
          p_max_attempts: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      copy_protocol_content: {
        Args: {
          p_source: string;
          p_target: string;
        };
        Returns: undefined;
      };
      create_template_from_protocol: {
        Args: {
          p_source_protocol_id: string;
          p_name: string;
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
