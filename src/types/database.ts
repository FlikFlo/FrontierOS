// FrontierOS CRM — database types.
// Hand-authored to match supabase/schema.sql. When the Supabase CLI is set up,
// these can be regenerated with `supabase gen types typescript`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'owner' | 'sales_manager' | 'brewer'
export type EntityKind = 'deal' | 'client' | 'order'
export type ActivityAction = 'created' | 'updated' | 'deleted'
export type ClientStatus = 'lead' | 'active' | 'inactive'
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          name: string
          industry: string | null
          website: string | null
          email: string | null
          phone: string | null
          address: string | null
          status: ClientStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: ClientStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          client_id: string
          first_name: string
          last_name: string | null
          title: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          first_name: string
          last_name?: string | null
          title?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'contacts_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          id: string
          sku: string | null
          name: string
          description: string | null
          price: number
          currency: string
          unit: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku?: string | null
          name: string
          description?: string | null
          price?: number
          currency?: string
          unit?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      deals: {
        Row: {
          id: string
          title: string
          client_id: string | null
          contact_id: string | null
          stage: DealStage
          amount: number
          currency: string
          probability: number
          est_cases_per_month: number
          outlets: number
          expected_close_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          client_id?: string | null
          contact_id?: string | null
          stage?: DealStage
          amount?: number
          currency?: string
          probability?: number
          est_cases_per_month?: number
          outlets?: number
          expected_close_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['deals']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'deals_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deals_contact_id_fkey'
            columns: ['contact_id']
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          client_id: string | null
          status: OrderStatus
          order_date: string
          currency: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          client_id?: string | null
          status?: OrderStatus
          order_date?: string
          currency?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'orders_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      activity_log: {
        Row: {
          id: string
          actor: string | null
          action: ActivityAction
          entity: string
          entity_id: string | null
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor?: string | null
          action: ActivityAction
          entity: string
          entity_id?: string | null
          label?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          role: 'owner' | 'sales_manager' | 'brewer'
          label: string | null
          created_by: string | null
          expires_at: string | null
          revoked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          role: 'owner' | 'sales_manager' | 'brewer'
          label?: string | null
          created_by?: string | null
          expires_at?: string | null
          revoked?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          entity: EntityKind
          entity_id: string
          body: string
          author: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity: EntityKind
          entity_id: string
          body: string
          author?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          entity: EntityKind
          entity_id: string
          name: string
          path: string
          mime: string | null
          size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          entity: EntityKind
          entity_id: string
          name: string
          path: string
          mime?: string | null
          size?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['attachments']['Insert']>
        Relationships: []
      }
      reminders: {
        Row: {
          id: string
          title: string
          due_date: string
          client_id: string | null
          done: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          due_date: string
          client_id?: string | null
          done?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'reminders_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          description: string | null
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/** Convenience row aliases. */
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type Activity = Database['public']['Tables']['activity_log']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
