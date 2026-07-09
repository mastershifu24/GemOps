export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      components: {
        Row: {
          id: string;
          name: string;
          component_type: string;
          sku: string | null;
          display_color: string;
          spline_asset_url: string | null;
          unit_cost_cents: number;
          configuration_rules: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          component_type: string;
          sku?: string | null;
          display_color?: string;
          spline_asset_url?: string | null;
          unit_cost_cents?: number;
          configuration_rules?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          component_type?: string;
          sku?: string | null;
          display_color?: string;
          spline_asset_url?: string | null;
          unit_cost_cents?: number;
          configuration_rules?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      design_templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          slot_count: number;
          configuration_rules: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          slot_count: number;
          configuration_rules?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          slot_count?: number;
          configuration_rules?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_code: string;
          design_template_id: string;
          slot_layout: Json;
          status: string;
          assembly_script: string | null;
          total_slot_count: number;
          filled_slot_count: number;
          total_cents: number;
          payment_method: string | null;
          amount_paid_cents: number | null;
          sizing_metadata: Json | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          order_code: string;
          design_template_id: string;
          slot_layout: Json;
          status?: string;
          assembly_script?: string | null;
          total_slot_count: number;
          filled_slot_count?: number;
          total_cents?: number;
          payment_method?: string | null;
          amount_paid_cents?: number | null;
          sizing_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          order_code?: string;
          design_template_id?: string;
          slot_layout?: Json;
          status?: string;
          assembly_script?: string | null;
          total_slot_count?: number;
          filled_slot_count?: number;
          total_cents?: number;
          payment_method?: string | null;
          amount_paid_cents?: number | null;
          sizing_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_order_code: { Args: Record<string, never>; Returns: string };
      build_assembly_script: { Args: { p_layout: Json }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
