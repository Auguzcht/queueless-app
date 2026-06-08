export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          department_id: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      counters: {
        Row: {
          counter_number: number
          created_at: string
          department_id: string
          id: string
          is_active: boolean
          label: string | null
        }
        Insert: {
          counter_number: number
          created_at?: string
          department_id: string
          id?: string
          is_active?: boolean
          label?: string | null
        }
        Update: {
          counter_number?: number
          created_at?: string
          department_id?: string
          id?: string
          is_active?: boolean
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counters_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sequences: {
        Row: {
          date: string
          department_id: string
          id: string
          last_number: number
        }
        Insert: {
          date?: string
          department_id: string
          id?: string
          last_number?: number
        }
        Update: {
          date?: string
          department_id?: string
          id?: string
          last_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_sequences_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_schedules: {
        Row: {
          close_time: string
          day_of_week: number
          department_id: string
          id: string
          is_open: boolean
          open_time: string
        }
        Insert: {
          close_time?: string
          day_of_week: number
          department_id: string
          id?: string
          is_open?: boolean
          open_time?: string
        }
        Update: {
          close_time?: string
          day_of_week?: number
          department_id?: string
          id?: string
          is_open?: boolean
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_schedules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          prefix: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          prefix: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prefix?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          is_verified: boolean
          last_name: string
          middle_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          suffix: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          is_verified?: boolean
          last_name: string
          middle_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suffix?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          is_verified?: boolean
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suffix?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          code: string | null
          college_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          college_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          college_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_tickets: {
        Row: {
          called_at: string | null
          cancelled_at: string | null
          completed_at: string | null
          counter_id: string | null
          created_at: string
          date: string
          department_id: string
          expired_at: string | null
          id: string
          joined_at: string
          notes: string | null
          position: number
          skipped_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          user_id: string
        }
        Insert: {
          called_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          counter_id?: string | null
          created_at?: string
          date?: string
          department_id: string
          expired_at?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          position: number
          skipped_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          user_id: string
        }
        Update: {
          called_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          counter_id?: string | null
          created_at?: string
          date?: string
          department_id?: string
          expired_at?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          position?: number
          skipped_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_tickets_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          is_primary: boolean
          relationship: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          is_primary?: boolean
          relationship?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          is_primary?: boolean
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          college_id: string | null
          created_at: string
          education_level: Database["public"]["Enums"]["education_level"]
          id: string
          profile_id: string
          program_id: string | null
          student_id: string
          updated_at: string
          year_level: Database["public"]["Enums"]["year_level"]
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          education_level: Database["public"]["Enums"]["education_level"]
          id?: string
          profile_id: string
          program_id?: string | null
          student_id: string
          updated_at?: string
          year_level: Database["public"]["Enums"]["year_level"]
        }
        Update: {
          college_id?: string | null
          created_at?: string
          education_level?: Database["public"]["Enums"]["education_level"]
          id?: string
          profile_id?: string
          program_id?: string | null
          student_id?: string
          updated_at?: string
          year_level?: Database["public"]["Enums"]["year_level"]
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_logs: {
        Row: {
          changed_by: string | null
          counter_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["ticket_status"]
          previous_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string
        }
        Insert: {
          changed_by?: string | null
          counter_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["ticket_status"]
          previous_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string
        }
        Update: {
          changed_by?: string | null
          counter_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["ticket_status"]
          previous_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_logs_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "queue_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      wait_time_stats: {
        Row: {
          avg_service_seconds: number
          avg_wait_seconds: number
          date: string
          day_of_week: number
          department_id: string
          hour: number
          id: string
          peak_queue_length: number
          total_cancelled: number
          total_served: number
          total_skipped: number
        }
        Insert: {
          avg_service_seconds?: number
          avg_wait_seconds?: number
          date: string
          day_of_week: number
          department_id: string
          hour: number
          id?: string
          peak_queue_length?: number
          total_cancelled?: number
          total_served?: number
          total_skipped?: number
        }
        Update: {
          avg_service_seconds?: number
          avg_wait_seconds?: number
          date?: string
          day_of_week?: number
          department_id?: string
          hour?: number
          id?: string
          peak_queue_length?: number
          total_cancelled?: number
          total_served?: number
          total_skipped?: number
        }
        Relationships: [
          {
            foreignKeyName: "wait_time_stats_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_estimate_wait_minutes: {
        Args: { p_department_id: string; p_position_ahead: number }
        Returns: number
      }
      fn_get_full_name: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: string
      }
      fn_get_now_serving: {
        Args: { p_department_id: string }
        Returns: {
          counter_label: string
          ticket_number: string
        }[]
      }
      fn_get_position_ahead: { Args: { p_ticket_id: string }; Returns: number }
      increment_daily_sequence: {
        Args: { p_date?: string; p_department_id: string }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      education_level: "junior_high" | "senior_high" | "college"
      notification_type:
        | "queue_joined"
        | "almost_your_turn"
        | "your_turn"
        | "queue_completed"
        | "queue_cancelled"
        | "queue_skipped"
        | "queue_expired"
        | "system_announcement"
      ticket_status:
        | "waiting"
        | "serving"
        | "completed"
        | "skipped"
        | "cancelled"
        | "expired"
      user_role: "student" | "parent" | "staff" | "admin"
      year_level:
        | "grade_7"
        | "grade_8"
        | "grade_9"
        | "grade_10"
        | "grade_11"
        | "grade_12"
        | "first_year"
        | "second_year"
        | "third_year"
        | "fourth_year"
        | "fifth_year"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      education_level: ["junior_high", "senior_high", "college"],
      notification_type: [
        "queue_joined",
        "almost_your_turn",
        "your_turn",
        "queue_completed",
        "queue_cancelled",
        "queue_skipped",
        "queue_expired",
        "system_announcement",
      ],
      ticket_status: [
        "waiting",
        "serving",
        "completed",
        "skipped",
        "cancelled",
        "expired",
      ],
      user_role: ["student", "parent", "staff", "admin"],
      year_level: [
        "grade_7",
        "grade_8",
        "grade_9",
        "grade_10",
        "grade_11",
        "grade_12",
        "first_year",
        "second_year",
        "third_year",
        "fourth_year",
        "fifth_year",
      ],
    },
  },
} as const
