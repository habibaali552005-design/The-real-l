export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          name: string;
          phone: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          name: string;
          phone: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string;
          status?: string;
        };
        Relationships: [];
      };
      facebook_connections: {
        Row: {
          access_token: string;
          auto_sync: boolean;
          connected_by: string | null;
          created_at: string;
          id: string;
          last_sync_at: string | null;
          page_id: string;
          page_name: string | null;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          auto_sync?: boolean;
          connected_by?: string | null;
          created_at?: string;
          id?: string;
          last_sync_at?: string | null;
          page_id: string;
          page_name?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          auto_sync?: boolean;
          connected_by?: string | null;
          created_at?: string;
          id?: string;
          last_sync_at?: string | null;
          page_id?: string;
          page_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      facebook_post_links: {
        Row: {
          fb_post_id: string;
          id: string;
          image_hash: string | null;
          imported_at: string;
          product_id: string;
          title_hash: string | null;
        };
        Insert: {
          fb_post_id: string;
          id?: string;
          image_hash?: string | null;
          imported_at?: string;
          product_id: string;
          title_hash?: string | null;
        };
        Update: {
          fb_post_id?: string;
          id?: string;
          image_hash?: string | null;
          imported_at?: string;
          product_id?: string;
          title_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "facebook_post_links_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          area: string;
          created_at: string;
          customer_name: string;
          governorate: string;
          id: string;
          items: Json;
          notes: string | null;
          phone: string;
          status: string;
          total: number;
        };
        Insert: {
          address: string;
          area: string;
          created_at?: string;
          customer_name: string;
          governorate: string;
          id?: string;
          items: Json;
          notes?: string | null;
          phone: string;
          status?: string;
          total: number;
        };
        Update: {
          address?: string;
          area?: string;
          created_at?: string;
          customer_name?: string;
          governorate?: string;
          id?: string;
          items?: Json;
          notes?: string | null;
          phone?: string;
          status?: string;
          total?: number;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          is_cover: boolean;
          original_url: string | null;
          product_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_cover?: boolean;
          original_url?: string | null;
          product_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_cover?: boolean;
          original_url?: string | null;
          product_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          colors: string[];
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          image_url: string | null;
          in_stock: boolean;
          is_published: boolean;
          keywords: string[];
          manually_edited_fields: string[];
          name: string;
          price: number;
          seo_description: string | null;
          seo_title: string | null;
          short_description: string | null;
          sizes: string[];
          source: string;
          specifications: Json;
          tags: string[];
          updated_at: string;
        };
        Insert: {
          category: string;
          colors?: string[];
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          in_stock?: boolean;
          is_published?: boolean;
          keywords?: string[];
          manually_edited_fields?: string[];
          name: string;
          price: number;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          sizes?: string[];
          source?: string;
          specifications?: Json;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          category?: string;
          colors?: string[];
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          in_stock?: boolean;
          is_published?: boolean;
          keywords?: string[];
          manually_edited_fields?: string[];
          name?: string;
          price?: number;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          sizes?: string[];
          source?: string;
          specifications?: Json;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          about: string | null;
          address: string | null;
          email: string | null;
          facebook: string | null;
          id: number;
          instagram: string | null;
          phone: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          about?: string | null;
          address?: string | null;
          email?: string | null;
          facebook?: string | null;
          id?: number;
          instagram?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          about?: string | null;
          address?: string | null;
          email?: string | null;
          facebook?: string | null;
          id?: number;
          instagram?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          created_at: string;
          details: Json;
          fb_post_id: string | null;
          id: string;
          kind: string;
          message: string | null;
          product_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          details?: Json;
          fb_post_id?: string | null;
          id?: string;
          kind: string;
          message?: string | null;
          product_id?: string | null;
          status: string;
        };
        Update: {
          created_at?: string;
          details?: Json;
          fb_post_id?: string | null;
          id?: string;
          kind?: string;
          message?: string | null;
          product_id?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const;
