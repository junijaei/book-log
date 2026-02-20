export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      books: {
        Row: {
          author: string;
          cover_image_url: string | null;
          created_at: string;
          id: string;
          title: string;
          total_pages: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          author: string;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          title: string;
          total_pages?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          author?: string;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
          total_pages?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: string;
          requester_id: string;
          status: Database["public"]["Enums"]["friendship_status"];
          updated_at: string;
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["friendship_status"];
          updated_at?: string;
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["friendship_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          id: string;
          nickname: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          id: string;
          nickname: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          id?: string;
          nickname?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          created_at: string;
          id: string;
          noted_at: string | null;
          page_number: number | null;
          reading_log_id: string;
          text: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          noted_at?: string | null;
          page_number?: number | null;
          reading_log_id: string;
          text: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          noted_at?: string | null;
          page_number?: number | null;
          reading_log_id?: string;
          text?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_reading_log_id_fkey";
            columns: ["reading_log_id"];
            isOneToOne: false;
            referencedRelation: "reading_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_logs: {
        Row: {
          book_id: string;
          created_at: string;
          current_page: number | null;
          end_date: string | null;
          id: string;
          notion_page_id: string | null;
          rating: number | null;
          review: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["reading_status"];
          updated_at: string;
          user_id: string | null;
          visibility: Database["public"]["Enums"]["visibility"];
        };
        Insert: {
          book_id: string;
          created_at?: string;
          current_page?: number | null;
          end_date?: string | null;
          id?: string;
          notion_page_id?: string | null;
          rating?: number | null;
          review?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["reading_status"];
          updated_at?: string;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Update: {
          book_id?: string;
          created_at?: string;
          current_page?: number | null;
          end_date?: string | null;
          id?: string;
          notion_page_id?: string | null;
          rating?: number | null;
          review?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["reading_status"];
          updated_at?: string;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "reading_logs_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_logs_user_id_profiles_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          page_number: number | null;
          reading_log_id: string;
          reviewed_at: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          page_number?: number | null;
          reading_log_id: string;
          reviewed_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          page_number?: number | null;
          reading_log_id?: string;
          reviewed_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_reading_log_id_fkey";
            columns: ["reading_log_id"];
            isOneToOne: false;
            referencedRelation: "reading_logs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      upsert_reading_record: {
        Args: {
          p_user_id: string;
          p_payload: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      friendship_status: "pending" | "accepted" | "rejected" | "blocked";
      reading_status: "want_to_read" | "reading" | "finished" | "abandoned";
      visibility: "public" | "friends" | "private";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      friendship_status: ["pending", "accepted", "rejected", "blocked"],
      reading_status: ["want_to_read", "reading", "finished", "abandoned"],
      visibility: ["public", "friends", "private"],
    },
  },
} as const;
