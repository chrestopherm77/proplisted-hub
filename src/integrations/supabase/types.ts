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
      admin_alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          payload: Json | null
          read_at: string | null
          severity: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          payload?: Json | null
          read_at?: string | null
          severity?: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          payload?: Json | null
          read_at?: string | null
          severity?: string
          type?: string
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          asaas_payment_id: string | null
          commission_amount: number
          commission_percent: number
          created_at: string
          gross_amount: number
          id: string
          paid_at: string | null
          plan_name: string | null
          plan_slug: string | null
          reference_month: string
          referred_user_id: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          affiliate_id: string
          asaas_payment_id?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          gross_amount?: number
          id?: string
          paid_at?: string | null
          plan_name?: string | null
          plan_slug?: string | null
          reference_month?: string
          referred_user_id: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          affiliate_id?: string
          asaas_payment_id?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          gross_amount?: number
          id?: string
          paid_at?: string | null
          plan_name?: string | null
          plan_slug?: string | null
          reference_month?: string
          referred_user_id?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          referred_user_id: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          referred_user_id: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string
          commission_percent: number
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          commission_percent?: number
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          commission_percent?: number
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alert_banners: {
        Row: {
          bg_color: string
          created_at: string
          dismissible: boolean
          ends_at: string | null
          id: string
          is_active: boolean
          link_label: string | null
          link_url: string | null
          message: string
          priority: number
          starts_at: string | null
          text_color: string
          title: string | null
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          dismissible?: boolean
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          message: string
          priority?: number
          starts_at?: string | null
          text_color?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          dismissible?: boolean
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          message?: string
          priority?: number
          starts_at?: string | null
          text_color?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      broker_portal_requests: {
        Row: {
          admin_notes: string | null
          branding: Json
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          custom_domain: string | null
          id: string
          properties_source: string
          seo: Json
          slug: string | null
          state: string | null
          status: string
          template_id: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          branding?: Json
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          properties_source?: string
          seo?: Json
          slug?: string | null
          state?: string | null
          status?: string
          template_id?: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          branding?: Json
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          properties_source?: string
          seo?: Json
          slug?: string | null
          state?: string | null
          status?: string
          template_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      broker_portals: {
        Row: {
          branding: Json
          city: string | null
          created_at: string
          custom_domain: string | null
          id: string
          is_active: boolean
          properties_source: string
          seo: Json
          slug: string
          state: string | null
          template_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          branding?: Json
          city?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean
          properties_source?: string
          seo?: Json
          slug: string
          state?: string | null
          template_id?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          branding?: Json
          city?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean
          properties_source?: string
          seo?: Json
          slug?: string
          state?: string | null
          template_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percent: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
        }
        Relationships: []
      }
      creative_styles: {
        Row: {
          ai_model: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          prompt: string
          slug: string
          updated_at: string
        }
        Insert: {
          ai_model?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prompt?: string
          slug: string
          updated_at?: string
        }
        Update: {
          ai_model?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prompt?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      creatives: {
        Row: {
          created_at: string
          error_message: string | null
          format: string
          id: string
          info_text: string | null
          main_image_url: string | null
          mockup_images: Json
          status: string
          style_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          format: string
          id?: string
          info_text?: string | null
          main_image_url?: string | null
          mockup_images?: Json
          status?: string
          style_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          format?: string
          id?: string
          info_text?: string | null
          main_image_url?: string | null
          mockup_images?: Json
          status?: string
          style_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          lead_count: number
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          is_active?: boolean | null
          lead_count: number
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          lead_count?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount: number
          asaas_checkout_id: string | null
          asaas_payment_id: string | null
          confirmed_at: string | null
          created_at: string | null
          credits: number
          id: string
          package_id: string | null
          payment_method: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asaas_checkout_id?: string | null
          asaas_payment_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          credits: number
          id?: string
          package_id?: string | null
          payment_method?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asaas_checkout_id?: string | null
          asaas_payment_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          credits?: number
          id?: string
          package_id?: string | null
          payment_method?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string | null
          credits_used: number
          id: string
          lead_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used: number
          id?: string
          lead_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          id?: string
          lead_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_landing_pages: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          slug: string
          theme: Json
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          slug: string
          theme?: Json
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          theme?: Json
          title?: string
          updated_at?: string
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
      faq_categories: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category_id: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category_id: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category_id?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_leads: {
        Row: {
          created_at: string
          down_payment: string | null
          id: string
          modality: string | null
          monthly_income: string | null
          name: string
          notes: string | null
          property_value: string | null
          source: string | null
          status: string
          term: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          down_payment?: string | null
          id?: string
          modality?: string | null
          monthly_income?: string | null
          name: string
          notes?: string | null
          property_value?: string | null
          source?: string | null
          status?: string
          term?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          down_payment?: string | null
          id?: string
          modality?: string | null
          monthly_income?: string | null
          name?: string
          notes?: string | null
          property_value?: string | null
          source?: string | null
          status?: string
          term?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      home_page_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      land_search_areas: {
        Row: {
          city: string
          created_at: string
          id: string
          land_search_id: string
          neighborhood: string | null
          state: string
          zone: string | null
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          land_search_id: string
          neighborhood?: string | null
          state: string
          zone?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          land_search_id?: string
          neighborhood?: string | null
          state?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "land_search_areas_land_search_id_fkey"
            columns: ["land_search_id"]
            isOneToOne: false
            referencedRelation: "land_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      land_search_publish_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      land_searches: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_whatsapp: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          min_area_m2: number | null
          notes: string | null
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_whatsapp: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_area_m2?: number | null
          notes?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_whatsapp?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_area_m2?: number | null
          notes?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      launch_alerts: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      launch_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      launches: {
        Row: {
          associative: string | null
          banner_url: string | null
          book_url: string | null
          city: string
          commission: string | null
          coordinator_name: string | null
          coordinator_phone: string | null
          coordinator_phone2: string | null
          created_at: string | null
          delivery_date: string | null
          drive_link: string | null
          drive_url: string | null
          floors: string | null
          id: string
          is_active: boolean | null
          launch_date: string | null
          logo_url: string | null
          name: string
          neighborhood: string | null
          price_from: string | null
          price_max: string | null
          property_type: string | null
          size_m2_max: string | null
          size_m2_min: string | null
          state: string | null
          status: string | null
          table_expires_at: string | null
          table_url: string | null
          total_units: string | null
          user_id: string
          zone: string | null
        }
        Insert: {
          associative?: string | null
          banner_url?: string | null
          book_url?: string | null
          city: string
          commission?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          coordinator_phone2?: string | null
          created_at?: string | null
          delivery_date?: string | null
          drive_link?: string | null
          drive_url?: string | null
          floors?: string | null
          id?: string
          is_active?: boolean | null
          launch_date?: string | null
          logo_url?: string | null
          name: string
          neighborhood?: string | null
          price_from?: string | null
          price_max?: string | null
          property_type?: string | null
          size_m2_max?: string | null
          size_m2_min?: string | null
          state?: string | null
          status?: string | null
          table_expires_at?: string | null
          table_url?: string | null
          total_units?: string | null
          user_id: string
          zone?: string | null
        }
        Update: {
          associative?: string | null
          banner_url?: string | null
          book_url?: string | null
          city?: string
          commission?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          coordinator_phone2?: string | null
          created_at?: string | null
          delivery_date?: string | null
          drive_link?: string | null
          drive_url?: string | null
          floors?: string | null
          id?: string
          is_active?: boolean | null
          launch_date?: string | null
          logo_url?: string | null
          name?: string
          neighborhood?: string | null
          price_from?: string | null
          price_max?: string | null
          property_type?: string | null
          size_m2_max?: string | null
          size_m2_min?: string | null
          state?: string | null
          status?: string | null
          table_expires_at?: string | null
          table_url?: string | null
          total_units?: string | null
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      lead_alerts: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      lead_crm_status: {
        Row: {
          id: string
          is_manual: boolean
          lead_id: string | null
          manual_description: string | null
          manual_email: string | null
          manual_name: string | null
          manual_phone: string | null
          notes: string | null
          purchase_id: string | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_manual?: boolean
          lead_id?: string | null
          manual_description?: string | null
          manual_email?: string | null
          manual_name?: string | null
          manual_phone?: string | null
          notes?: string | null
          purchase_id?: string | null
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_manual?: boolean
          lead_id?: string | null
          manual_description?: string | null
          manual_email?: string | null
          manual_name?: string | null
          manual_phone?: string | null
          notes?: string | null
          purchase_id?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_form_intentions: {
        Row: {
          intention: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          intention: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          intention?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
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
          confirmation_whatsapp_error: string | null
          confirmation_whatsapp_message_id: string | null
          confirmation_whatsapp_sent_at: string | null
          confirmation_whatsapp_status: string | null
          created_at: string | null
          description: string
          feedback_attempts: number
          feedback_responded_at: string | null
          feedback_response: string | null
          feedback_sent_at: string | null
          form_data: Json | null
          id: string
          is_active: boolean | null
          is_exhausted: boolean | null
          is_promotion: boolean | null
          lead_submission_id: string | null
          max_purchases: number | null
          name: string
          phone: string
          price: number
          purchase_count: number | null
          updated_at: string | null
          whatsapp_confirmed: boolean | null
        }
        Insert: {
          confirmation_whatsapp_error?: string | null
          confirmation_whatsapp_message_id?: string | null
          confirmation_whatsapp_sent_at?: string | null
          confirmation_whatsapp_status?: string | null
          created_at?: string | null
          description: string
          feedback_attempts?: number
          feedback_responded_at?: string | null
          feedback_response?: string | null
          feedback_sent_at?: string | null
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_exhausted?: boolean | null
          is_promotion?: boolean | null
          lead_submission_id?: string | null
          max_purchases?: number | null
          name: string
          phone: string
          price: number
          purchase_count?: number | null
          updated_at?: string | null
          whatsapp_confirmed?: boolean | null
        }
        Update: {
          confirmation_whatsapp_error?: string | null
          confirmation_whatsapp_message_id?: string | null
          confirmation_whatsapp_sent_at?: string | null
          confirmation_whatsapp_status?: string | null
          created_at?: string | null
          description?: string
          feedback_attempts?: number
          feedback_responded_at?: string | null
          feedback_response?: string | null
          feedback_sent_at?: string | null
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_exhausted?: boolean | null
          is_promotion?: boolean | null
          lead_submission_id?: string | null
          max_purchases?: number | null
          name?: string
          phone?: string
          price?: number
          purchase_count?: number | null
          updated_at?: string | null
          whatsapp_confirmed?: boolean | null
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
      login_history: {
        Row: {
          id: string
          logged_in_at: string
          user_id: string
        }
        Insert: {
          id?: string
          logged_in_at?: string
          user_id: string
        }
        Update: {
          id?: string
          logged_in_at?: string
          user_id?: string
        }
        Relationships: []
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
      news_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_video: {
        Row: {
          description: string | null
          id: string
          title: string | null
          updated_at: string | null
          updated_by: string | null
          video_type: string
          video_url: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_type?: string
          video_url?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_type?: string
          video_url?: string | null
        }
        Relationships: []
      }
      onboarding_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          thumbnail_url: string | null
          title: string
          topic: string | null
          updated_at: string
          updated_by: string | null
          video_type: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          updated_by?: string | null
          video_type?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          updated_by?: string | null
          video_type?: string
          video_url?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
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
      pending_geocodes: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_contract: boolean
          accepted_dpa: boolean
          accepted_terms: boolean | null
          accepted_terms_of_use: boolean
          address: string | null
          address_city: string | null
          address_neighborhood: string | null
          address_uf: string | null
          avatar_url: string | null
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
          credit_balance: number
          email: string | null
          id: string
          is_active: boolean
          last_completion_reminder_at: string | null
          name: string
          person_type: string | null
          phone: string
          profession: string | null
          profile_completed: boolean
          referral_code: string | null
          referral_credits_granted: boolean
          referred_by: string | null
          rt_cau: string | null
          rt_cau_uf: string | null
          rt_cpf: string | null
          rt_crea: string | null
          rt_crea_uf: string | null
          rt_name: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_contract?: boolean
          accepted_dpa?: boolean
          accepted_terms?: boolean | null
          accepted_terms_of_use?: boolean
          address?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_uf?: string | null
          avatar_url?: string | null
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
          credit_balance?: number
          email?: string | null
          id: string
          is_active?: boolean
          last_completion_reminder_at?: string | null
          name: string
          person_type?: string | null
          phone: string
          profession?: string | null
          profile_completed?: boolean
          referral_code?: string | null
          referral_credits_granted?: boolean
          referred_by?: string | null
          rt_cau?: string | null
          rt_cau_uf?: string | null
          rt_cpf?: string | null
          rt_crea?: string | null
          rt_crea_uf?: string | null
          rt_name?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_contract?: boolean
          accepted_dpa?: boolean
          accepted_terms?: boolean | null
          accepted_terms_of_use?: boolean
          address?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_uf?: string | null
          avatar_url?: string | null
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
          credit_balance?: number
          email?: string | null
          id?: string
          is_active?: boolean
          last_completion_reminder_at?: string | null
          name?: string
          person_type?: string | null
          phone?: string
          profession?: string | null
          profile_completed?: boolean
          referral_code?: string | null
          referral_credits_granted?: boolean
          referred_by?: string | null
          rt_cau?: string | null
          rt_cau_uf?: string | null
          rt_cpf?: string | null
          rt_crea?: string | null
          rt_crea_uf?: string | null
          rt_name?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          accept_affiliation: boolean
          additional_info: string | null
          address: string | null
          amenities: Json
          area_total: number | null
          area_useful: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          condo_fee: number | null
          created_at: string
          id: string
          iptu: number | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          operation_type: string
          parking_spots: number | null
          photos: Json
          price_rent: number | null
          price_sale: number | null
          property_type: string
          reference_code: string
          state: string | null
          status: string | null
          suites: number | null
          title: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          accept_affiliation?: boolean
          additional_info?: string | null
          address?: string | null
          amenities?: Json
          area_total?: number | null
          area_useful?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          condo_fee?: number | null
          created_at?: string
          id?: string
          iptu?: number | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          operation_type?: string
          parking_spots?: number | null
          photos?: Json
          price_rent?: number | null
          price_sale?: number | null
          property_type: string
          reference_code: string
          state?: string | null
          status?: string | null
          suites?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          accept_affiliation?: boolean
          additional_info?: string | null
          address?: string | null
          amenities?: Json
          area_total?: number | null
          area_useful?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          condo_fee?: number | null
          created_at?: string
          id?: string
          iptu?: number | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          operation_type?: string
          parking_spots?: number | null
          photos?: Json
          price_rent?: number | null
          price_sale?: number | null
          property_type?: string
          reference_code?: string
          state?: string | null
          status?: string | null
          suites?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      property_affiliates: {
        Row: {
          affiliate_user_id: string
          created_at: string
          id: string
          property_id: string
          token: string
        }
        Insert: {
          affiliate_user_id: string
          created_at?: string
          id?: string
          property_id: string
          token: string
        }
        Update: {
          affiliate_user_id?: string
          created_at?: string
          id?: string
          property_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_affiliates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_search_alerts: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      property_search_offers: {
        Row: {
          created_at: string | null
          id: string
          offer_link: string | null
          offer_name: string | null
          search_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          offer_link?: string | null
          offer_name?: string | null
          search_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          offer_link?: string | null
          offer_name?: string | null
          search_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_search_offers_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "property_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      property_searches: {
        Row: {
          bedrooms: string | null
          city: string
          condominium: string | null
          created_at: string | null
          floor: string | null
          headline: string | null
          house_type: string | null
          id: string
          is_active: boolean | null
          neighborhood: string | null
          observation: string | null
          offer_count: number
          operation_type: string
          parking_spots: string | null
          property_type: string
          rural_type: string | null
          size_m2: string | null
          state: string | null
          title: string | null
          user_id: string
          value: string | null
          value_max: string | null
          value_min: string | null
          zone: string | null
        }
        Insert: {
          bedrooms?: string | null
          city: string
          condominium?: string | null
          created_at?: string | null
          floor?: string | null
          headline?: string | null
          house_type?: string | null
          id?: string
          is_active?: boolean | null
          neighborhood?: string | null
          observation?: string | null
          offer_count?: number
          operation_type: string
          parking_spots?: string | null
          property_type: string
          rural_type?: string | null
          size_m2?: string | null
          state?: string | null
          title?: string | null
          user_id: string
          value?: string | null
          value_max?: string | null
          value_min?: string | null
          zone?: string | null
        }
        Update: {
          bedrooms?: string | null
          city?: string
          condominium?: string | null
          created_at?: string | null
          floor?: string | null
          headline?: string | null
          house_type?: string | null
          id?: string
          is_active?: boolean | null
          neighborhood?: string | null
          observation?: string | null
          offer_count?: number
          operation_type?: string
          parking_spots?: string | null
          property_type?: string
          rural_type?: string | null
          size_m2?: string | null
          state?: string | null
          title?: string | null
          user_id?: string
          value?: string | null
          value_max?: string | null
          value_min?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      property_views: {
        Row: {
          affiliate_id: string | null
          id: string
          property_id: string
          viewed_at: string
        }
        Insert: {
          affiliate_id?: string | null
          id?: string
          property_id: string
          viewed_at?: string
        }
        Update: {
          affiliate_id?: string | null
          id?: string
          property_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      public_videos: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          slug: string
          title: string
          updated_at: string
          video_type: string
          video_url: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
          video_type?: string
          video_url: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          updated_at?: string
          video_type?: string
          video_url?: string
          view_count?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          asaas_checkout_id: string | null
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          coupon_code: string | null
          id: string
          lead_id: string
          partner_id: string | null
          payment_confirmed_at: string | null
          payment_method: string | null
          purchased_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asaas_checkout_id?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          coupon_code?: string | null
          id?: string
          lead_id: string
          partner_id?: string | null
          payment_confirmed_at?: string | null
          payment_method?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asaas_checkout_id?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          coupon_code?: string | null
          id?: string
          lead_id?: string
          partner_id?: string | null
          payment_confirmed_at?: string | null
          payment_method?: string | null
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
          {
            foreignKeyName: "purchases_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_partners: {
        Row: {
          banner_url: string | null
          city: string
          commission_owner_text: string | null
          commission_owner_when: string | null
          commission_tenant_text: string | null
          commission_tenant_when: string | null
          commission_text: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_user_id: string | null
          service_areas: Json
          slug: string
          sort_order: number
          state: string
          updated_at: string
          website_url: string | null
          whatsapp_phone: string
        }
        Insert: {
          banner_url?: string | null
          city: string
          commission_owner_text?: string | null
          commission_owner_when?: string | null
          commission_tenant_text?: string | null
          commission_tenant_when?: string | null
          commission_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          service_areas?: Json
          slug: string
          sort_order?: number
          state: string
          updated_at?: string
          website_url?: string | null
          whatsapp_phone: string
        }
        Update: {
          banner_url?: string | null
          city?: string
          commission_owner_text?: string | null
          commission_owner_when?: string | null
          commission_tenant_text?: string | null
          commission_tenant_when?: string | null
          commission_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          service_areas?: Json
          slug?: string
          sort_order?: number
          state?: string
          updated_at?: string
          website_url?: string | null
          whatsapp_phone?: string
        }
        Relationships: []
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
      signup_progress: {
        Row: {
          company_type: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          current_step: number
          email: string | null
          form_data: Json
          id: string
          name: string | null
          person_type: string | null
          phone: string | null
          profession: string | null
          session_id: string
          step_label: string | null
          total_steps: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_type?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          form_data?: Json
          id?: string
          name?: string | null
          person_type?: string | null
          phone?: string | null
          profession?: string | null
          session_id: string
          step_label?: string | null
          total_steps?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_type?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          form_data?: Json
          id?: string
          name?: string | null
          person_type?: string | null
          phone?: string | null
          profession?: string | null
          session_id?: string
          step_label?: string | null
          total_steps?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_url: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          amount: number
          asaas_payment_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id: string
          user_id: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          cycle_months: number
          display_order: number
          feature_list: Json
          features: Json
          id: string
          is_active: boolean
          monthly_credits: number
          name: string
          parent_slug: string | null
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          cycle_months?: number
          display_order?: number
          feature_list?: Json
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits?: number
          name: string
          parent_slug?: string | null
          price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          cycle_months?: number
          display_order?: number
          feature_list?: Json
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits?: number
          name?: string
          parent_slug?: string | null
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          last_message_at: string
          status: string
          subject: string | null
          unread_by_admin: boolean
          unread_by_user: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          subject?: string | null
          unread_by_admin?: boolean
          unread_by_user?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          subject?: string | null
          unread_by_admin?: boolean
          unread_by_user?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          created_at: string
          event_label: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_label: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_label?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_brands: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          billing_cycle: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          invoice_url: string | null
          next_due_date: string | null
          payment_method: string | null
          pending_downgrade_to_plan_id: string | null
          plan_id: string
          scheduled_change_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          invoice_url?: string | null
          next_due_date?: string | null
          payment_method?: string | null
          pending_downgrade_to_plan_id?: string | null
          plan_id: string
          scheduled_change_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          invoice_url?: string | null
          next_due_date?: string | null
          payment_method?: string | null
          pending_downgrade_to_plan_id?: string | null
          plan_id?: string
          scheduled_change_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_pending_downgrade_to_plan_id_fkey"
            columns: ["pending_downgrade_to_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
        }
        Relationships: []
      }
      whatsapp_city_groups: {
        Row: {
          city: string
          created_at: string
          group_jid: string
          group_label: string
          id: string
          invite_url: string | null
          is_active: boolean
          uf: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          group_jid: string
          group_label: string
          id?: string
          invite_url?: string | null
          is_active?: boolean
          uf: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          group_jid?: string
          group_label?: string
          id?: string
          invite_url?: string | null
          is_active?: boolean
          uf?: string
          updated_at?: string
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
      add_credits_atomic: {
        Args: {
          p_amount: number
          p_lead_id?: string
          p_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      can_publish_land_search: { Args: { _user_id: string }; Returns: boolean }
      check_phone_availability: { Args: { p_phone: string }; Returns: boolean }
      consume_credits_for_creative: {
        Args: { p_amount?: number; p_creative_id: string; p_user_id: string }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_affiliate_dashboard: { Args: { p_user_id: string }; Returns: Json }
      get_groups_for_city: {
        Args: { p_city: string; p_uf: string }
        Returns: string[]
      }
      get_invite_url_for_city: {
        Args: { p_city: string; p_uf: string }
        Returns: string
      }
      get_profile_phone: { Args: { p_user_id: string }; Returns: string }
      get_public_property: { Args: { p_slug: string }; Returns: Json }
      grant_referral_bonus_if_eligible: {
        Args: { p_user_id: string }
        Returns: Json
      }
      has_active_paid_plan: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      immutable_unaccent_lower: { Args: { p: string }; Returns: string }
      increment_offer_count: {
        Args: { p_search_id: string }
        Returns: undefined
      }
      increment_public_video_view: {
        Args: { p_slug: string }
        Returns: undefined
      }
      increment_purchase_count: {
        Args: { p_lead_id: string }
        Returns: {
          is_now_active: boolean
          max_purchases: number
          new_count: number
        }[]
      }
      list_land_searches_public: {
        Args: never
        Returns: {
          company_name: string
          created_at: string
          id: string
          logo_url: string
          min_area_m2: number
          notes: string
          sort_order: number
        }[]
      }
      log_user_activity: {
        Args: {
          p_event_label: string
          p_event_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      mark_profile_complete: { Args: { p_user_id: string }; Returns: Json }
      purchase_lead_with_credits: {
        Args: { p_lead_id: string; p_user_id: string }
        Returns: Json
      }
      record_affiliate_commission: {
        Args: {
          p_amount: number
          p_asaas_payment_id: string
          p_plan_name: string
          p_plan_slug: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: Json
      }
      redeem_referral: {
        Args: { p_referral_code: string; p_user_id: string }
        Returns: Json
      }
      redeem_voucher_atomic: {
        Args: {
          p_lead_id: string
          p_user_id: string
          p_voucher_code: string
          p_voucher_id: string
        }
        Returns: Json
      }
      register_affiliate_referral: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      touch_completion_reminder: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_signup_progress: {
        Args: { p_payload: Json; p_session_id: string }
        Returns: undefined
      }
      validate_signup_metadata: { Args: { meta: Json }; Returns: undefined }
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
