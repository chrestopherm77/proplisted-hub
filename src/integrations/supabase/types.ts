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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asaas_webhook_events: {
        Row: {
          asaas_event_id: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
          received_at: string | null
        }
        Insert: {
          asaas_event_id?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string | null
        }
        Update: {
          asaas_event_id?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string | null
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      lead_submissions: {
        Row: {
          created_at: string | null
          email: string | null
          form_data: Json
          id: string
          intention: string
          name: string
          phone: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          form_data?: Json
          id?: string
          intention: string
          name: string
          phone: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          form_data?: Json
          id?: string
          intention?: string
          name?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          description: string
          form_data: Json | null
          id: string
          is_active: boolean | null
          lead_submission_id: string | null
          max_purchases: number | null
          name: string
          phone: string
          price: number
          purchase_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          lead_submission_id?: string | null
          max_purchases?: number | null
          name: string
          phone: string
          price: number
          purchase_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          lead_submission_id?: string | null
          max_purchases?: number | null
          name?: string
          phone?: string
          price?: number
          purchase_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_submission_id_fkey"
            columns: ["lead_submission_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      lp_page_views: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      lp_partial_leads: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_step: string | null
          form_data: Json | null
          id: string
          intention: string | null
          name: string | null
          phone: string | null
          recovery_sent_at: string | null
          session_id: string
          source_lp: string | null
          step_index: number | null
          total_steps: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_step?: string | null
          form_data?: Json | null
          id?: string
          intention?: string | null
          name?: string | null
          phone?: string | null
          recovery_sent_at?: string | null
          session_id: string
          source_lp?: string | null
          step_index?: number | null
          total_steps?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_step?: string | null
          form_data?: Json | null
          id?: string
          intention?: string | null
          name?: string | null
          phone?: string | null
          recovery_sent_at?: string | null
          session_id?: string
          source_lp?: string | null
          step_index?: number | null
          total_steps?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_terms: boolean | null
          address: string | null
          address_city: string | null
          address_neighborhood: string | null
          address_uf: string | null
          cau: string | null
          cau_uf: string | null
          cnpj: string | null
          company_name: string | null
          company_type: string | null
          cpf: string | null
          crea: string | null
          crea_pj: string | null
          crea_pj_uf: string | null
          crea_uf: string | null
          created_at: string | null
          creci: string | null
          creci_number: string | null
          creci_pj: string | null
          creci_pj_uf: string | null
          creci_uf: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          person_type: string | null
          phone: string
          profession: string | null
          rt_cau: string | null
          rt_cau_uf: string | null
          rt_cpf: string | null
          rt_crea: string | null
          rt_crea_uf: string | null
          rt_name: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_terms?: boolean | null
          address?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_uf?: string | null
          cau?: string | null
          cau_uf?: string | null
          cnpj?: string | null
          company_name?: string | null
          company_type?: string | null
          cpf?: string | null
          crea?: string | null
          crea_pj?: string | null
          crea_pj_uf?: string | null
          crea_uf?: string | null
          created_at?: string | null
          creci?: string | null
          creci_number?: string | null
          creci_pj?: string | null
          creci_pj_uf?: string | null
          creci_uf?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          name: string
          person_type?: string | null
          phone: string
          profession?: string | null
          rt_cau?: string | null
          rt_cau_uf?: string | null
          rt_cpf?: string | null
          rt_crea?: string | null
          rt_crea_uf?: string | null
          rt_name?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_terms?: boolean | null
          address?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_uf?: string | null
          cau?: string | null
          cau_uf?: string | null
          cnpj?: string | null
          company_name?: string | null
          company_type?: string | null
          cpf?: string | null
          crea?: string | null
          crea_pj?: string | null
          crea_pj_uf?: string | null
          crea_uf?: string | null
          created_at?: string | null
          creci?: string | null
          creci_number?: string | null
          creci_pj?: string | null
          creci_pj_uf?: string | null
          creci_uf?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          person_type?: string | null
          phone?: string
          profession?: string | null
          rt_cau?: string | null
          rt_cau_uf?: string | null
          rt_cpf?: string | null
          rt_crea?: string | null
          rt_crea_uf?: string | null
          rt_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          asaas_checkout_id: string | null
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          id: string
          lead_id: string
          payment_confirmed_at: string | null
          purchased_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asaas_checkout_id?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          id?: string
          lead_id: string
          payment_confirmed_at?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asaas_checkout_id?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          id?: string
          lead_id?: string
          payment_confirmed_at?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart: {
        Row: {
          added_at: string | null
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voucher_redemptions: {
        Row: {
          id: string
          lead_id: string
          redeemed_at: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          id?: string
          lead_id: string
          redeemed_at?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          id?: string
          lead_id?: string
          redeemed_at?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      whatsapp_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_phone_availability: { Args: { p_phone: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "MASTER_ADMIN" | "USER"
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
  public: {
    Enums: {
      app_role: ["MASTER_ADMIN", "USER"],
    },
  },
} as const
