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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversation_logs: {
        Row: {
          ai_response: string | null
          created_at: string
          id: string
          problem_identified: string | null
          products_suggested: Json | null
          session_id: string | null
          user_question: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string
          id?: string
          problem_identified?: string | null
          products_suggested?: Json | null
          session_id?: string | null
          user_question: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string
          id?: string
          problem_identified?: string | null
          products_suggested?: Json | null
          session_id?: string | null
          user_question?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_used: boolean
          order_id: string | null
          reward_redemption_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          order_id?: string | null
          reward_redemption_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          order_id?: string | null
          reward_redemption_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_coupons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_coupons_reward_redemption_id_fkey"
            columns: ["reward_redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string
          discount_code: string
          email: string
          id: string
          is_used: boolean
        }
        Insert: {
          created_at?: string
          discount_code: string
          email: string
          id?: string
          is_used?: boolean
        }
        Update: {
          created_at?: string
          discount_code?: string
          email?: string
          id?: string
          is_used?: boolean
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          file_name: string
          file_type: string
          id: string
          products_created: number
          products_failed: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          file_name: string
          file_type: string
          id?: string
          products_created?: number
          products_failed?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          file_name?: string
          file_type?: string
          id?: string
          products_created?: number
          products_failed?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          product_ids: string[] | null
          start_date: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          product_ids?: string[] | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          product_ids?: string[] | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_creatives: {
        Row: {
          body_text: string | null
          campaign_id: string | null
          created_at: string
          cta: string | null
          format: string
          hashtags: string | null
          headline: string | null
          id: string
          image_url: string | null
          product_id: string | null
          status: string
          title: string
        }
        Insert: {
          body_text?: string | null
          campaign_id?: string | null
          created_at?: string
          cta?: string | null
          format?: string
          hashtags?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          status?: string
          title: string
        }
        Update: {
          body_text?: string | null
          campaign_id?: string | null
          created_at?: string
          cta?: string | null
          format?: string
          hashtags?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          campaign_id: string | null
          content: string | null
          created_at: string
          creative_id: string | null
          id: string
          platform: string
          published_at: string | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          creative_id?: string | null
          id?: string
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          creative_id?: string | null
          id?: string
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_posts_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "marketing_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_videos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      mechanics: {
        Row: {
          cnpj: string | null
          company_name: string | null
          created_at: string
          discount_rate: number
          id: string
          is_approved: boolean
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          discount_rate?: number
          id?: string
          is_approved?: boolean
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          discount_rate?: number
          id?: string
          is_approved?: boolean
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          seller_id: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          seller_id?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          seller_id?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_status_detail: string | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status_detail?: string | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status_detail?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      price_research: {
        Row: {
          ai_analysis: string | null
          competitor_name: string
          competitor_price: number | null
          competitor_url: string | null
          created_at: string
          id: string
          our_price: number
          price_difference: number | null
          price_difference_pct: number | null
          product_id: string
          raw_results: Json | null
          search_query: string | null
          suggested_price: number | null
        }
        Insert: {
          ai_analysis?: string | null
          competitor_name: string
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string
          id?: string
          our_price: number
          price_difference?: number | null
          price_difference_pct?: number | null
          product_id: string
          raw_results?: Json | null
          search_query?: string | null
          suggested_price?: number | null
        }
        Update: {
          ai_analysis?: string | null
          competitor_name?: string
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string
          id?: string
          our_price?: number
          price_difference?: number | null
          price_difference_pct?: number | null
          product_id?: string
          raw_results?: Json | null
          search_query?: string | null
          suggested_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_research_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          product_id: string
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id: string
          rating?: number
          title?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          additional_images: string[] | null
          brand: string | null
          category_id: string | null
          compatible_motors: string[] | null
          created_at: string
          description: string | null
          documents: string[] | null
          engine_model: string | null
          free_shipping: boolean
          hp: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          original_price: number | null
          price: number
          sku: string | null
          specifications: Json | null
          stock_quantity: number
          subcategory_id: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          additional_images?: string[] | null
          brand?: string | null
          category_id?: string | null
          compatible_motors?: string[] | null
          created_at?: string
          description?: string | null
          documents?: string[] | null
          engine_model?: string | null
          free_shipping?: boolean
          hp?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          original_price?: number | null
          price?: number
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number
          subcategory_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          additional_images?: string[] | null
          brand?: string | null
          category_id?: string | null
          compatible_motors?: string[] | null
          created_at?: string
          description?: string | null
          documents?: string[] | null
          engine_model?: string | null
          free_shipping?: boolean
          hp?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          original_price?: number | null
          price?: number
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number
          subcategory_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          city: string | null
          company_name: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          neighborhood: string | null
          notes: string | null
          phone: string | null
          referral_code: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          city?: string | null
          company_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          referral_code?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          city?: string | null
          company_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          referral_code?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          quote_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity?: number
          quote_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          quote_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_company: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          status: string
          total_estimated: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          status?: string
          total_estimated?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          status?: string
          total_estimated?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_points_credited: boolean
          referrer_id: string
          referrer_points_credited: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_points_credited?: boolean
          referrer_id: string
          referrer_points_credited?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_points_credited?: boolean
          referrer_id?: string
          referrer_points_credited?: boolean
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_required: number
          reward_type: string
          reward_value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_required?: number
          reward_type?: string
          reward_value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_required?: number
          reward_type?: string
          reward_value?: number
        }
        Relationships: []
      }
      sale_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string
          order_total: number
          seller_id: string
          status: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id: string
          order_total?: number
          seller_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string
          order_total?: number
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          total_commission: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          total_commission?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          total_commission?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          id: string
          is_active: boolean
          pac_days: string
          pac_price: number
          region_code: string
          region_label: string
          sedex_days: string
          sedex_price: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          pac_days?: string
          pac_price?: number
          region_code: string
          region_label: string
          sedex_days?: string
          sedex_price?: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          pac_days?: string
          pac_price?: number
          region_code?: string
          region_label?: string
          sedex_days?: string
          sedex_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          is_published: boolean
          read_time: string
          search_vector: unknown
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          read_time?: string
          search_vector?: unknown
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          read_time?: string
          search_vector?: unknown
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      technical_catalogs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          comment: string
          created_at: string
          customer_city: string | null
          customer_name: string
          id: string
          is_approved: boolean
          rating: number
        }
        Insert: {
          comment: string
          created_at?: string
          customer_city?: string | null
          customer_name: string
          id?: string
          is_approved?: boolean
          rating?: number
        }
        Update: {
          comment?: string
          created_at?: string
          customer_city?: string | null
          customer_name?: string
          id?: string
          is_approved?: boolean
          rating?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_points: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      process_referral: {
        Args: { p_referral_code: string; p_referred_id: string }
        Returns: boolean
      }
      search_articles: {
        Args: { search_query: string }
        Returns: {
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          is_published: boolean
          read_time: string
          search_vector: unknown
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "technical_articles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "user" | "seller"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "user", "seller"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
