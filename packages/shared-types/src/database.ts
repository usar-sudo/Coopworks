export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      federations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      societies: {
        Row: {
          id: string
          federation_id: string
          name: string
          service_area: unknown | null
          created_at: string
        }
        Insert: {
          id?: string
          federation_id: string
          name: string
          service_area?: unknown | null
          created_at?: string
        }
        Update: {
          id?: string
          federation_id?: string
          name?: string
          service_area?: unknown | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "societies_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          name: string
          phone: string
          society_id: string | null
          federation_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          name: string
          phone: string
          society_id?: string | null
          federation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          name?: string
          phone?: string
          society_id?: string | null
          federation_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          }
        ]
      }
      worker_profiles: {
        Row: {
          profile_id: string
          home_location: unknown
          service_area_radius_m: number
          insurance_status: string
          verified: boolean
          available: boolean
          created_at: string
        }
        Insert: {
          profile_id: string
          home_location: unknown
          service_area_radius_m: number
          insurance_status?: string
          verified?: boolean
          available?: boolean
          created_at?: string
        }
        Update: {
          profile_id?: string
          home_location?: unknown
          service_area_radius_m?: number
          insurance_status?: string
          verified?: boolean
          available?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      worker_skills: {
        Row: {
          worker_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          worker_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          worker_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["profile_id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          worker_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["booking_status"]
          is_emergency: boolean
          location: unknown
          scheduled_at: string
          scheduled_end_at: string
          cancelled_by: Database["public"]["Enums"]["cancelled_by_role"] | null
          overtime_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          worker_id?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          is_emergency?: boolean
          location: unknown
          scheduled_at: string
          scheduled_end_at: string
          cancelled_by?: Database["public"]["Enums"]["cancelled_by_role"] | null
          overtime_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          worker_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          is_emergency?: boolean
          location?: unknown
          scheduled_at?: string
          scheduled_end_at?: string
          cancelled_by?: Database["public"]["Enums"]["cancelled_by_role"] | null
          overtime_hours?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["profile_id"]
          }
        ]
      }
      bulk_orders: {
        Row: {
          id: string
          order_no: string
          org_name: string
          contact_name: string
          contact_phone: string
          service_type: string
          workers_needed: number
          scheduled_date: string | null
          location_area: string
          notes: string | null
          status: Database["public"]["Enums"]["bulk_order_status"]
          created_at: string
        }
        Insert: {
          id?: string
          order_no?: string
          org_name: string
          contact_name: string
          contact_phone: string
          service_type: string
          workers_needed: number
          scheduled_date?: string | null
          location_area: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bulk_order_status"]
          created_at?: string
        }
        Update: {
          id?: string
          order_no?: string
          org_name?: string
          contact_name?: string
          contact_phone?: string
          service_type?: string
          workers_needed?: number
          scheduled_date?: string | null
          location_area?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bulk_order_status"]
          created_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          booking_id: string
          stars: number
          comment: string | null
          created_at: string
        }
        Insert: {
          booking_id: string
          stars: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          booking_id?: string
          stars?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          booking_id: string
          amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          created_at: string
        }
        Insert: {
          booking_id: string
          amount: number
          status?: Database["public"]["Enums"]["invoice_status"]
          created_at?: string
        }
        Update: {
          booking_id?: string
          amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_workers: {
        Args: {
          p_lat: number
          p_lng: number
          p_service_type?: string
        }
        Returns: Record<string, unknown>[]
      }
      submit_worker_onboarding: {
        Args: {
          p_society_name: string
          p_radius_m: number
          p_lat: number
          p_lng: number
          p_services: string[]
          p_aadhaar_last4?: string
        }
        Returns: undefined
      }
      list_pending_workers: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      approve_worker: {
        Args: {
          p_worker: string
          p_approve: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      booking_status: "requested" | "accepted" | "in_progress" | "completed" | "cancelled"
      bulk_order_status: "open" | "allocating" | "fulfilled" | "cancelled"
      cancelled_by_role: "customer" | "worker"
      invoice_status: "unpaid" | "paid"
      service_type:
        | "electrician"
        | "plumber"
        | "carpenter"
        | "painter"
        | "domestic_helper"
        | "caregiver"
        | "driver"
        | "gardener"
        | "cleaner"
        | "technician"
      user_role: "customer" | "worker" | "society_admin" | "federation_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}