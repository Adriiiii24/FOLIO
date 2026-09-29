
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_runs": {
                  Row: {
                    "cost_usd": number,"created_at": string,"error_code": string | null,"id": string,"input_tokens": number,"latency_ms": number,"model": string,"output_tokens": number,"status": Database["public"]['Enums']["ai_run_status"],"subject_id": string | null,"subject_table": string | null,"task": Database["public"]['Enums']["ai_task"],"user_id": string
                  }
                  Insert: {
                    "cost_usd"?: number,"created_at"?: string,"error_code"?: string | null,"id"?: string,"input_tokens"?: number,"latency_ms": number,"model": string,"output_tokens"?: number,"status": Database["public"]['Enums']["ai_run_status"],"subject_id"?: string | null,"subject_table"?: string | null,"task": Database["public"]['Enums']["ai_task"],"user_id"?: string
                  }
                  Update: {
                    "cost_usd"?: number,"created_at"?: string,"error_code"?: string | null,"id"?: string,"input_tokens"?: number,"latency_ms"?: number,"model"?: string,"output_tokens"?: number,"status"?: Database["public"]['Enums']["ai_run_status"],"subject_id"?: string | null,"subject_table"?: string | null,"task"?: Database["public"]['Enums']["ai_task"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"daily_briefings": {
                  Row: {
                    "briefing_date": string,"content": NonNullable<Json>,"created_at": string,"feedback": NonNullable<Json>,"id": string,"metrics": NonNullable<Json>,"model": string,"read_at": string | null,"user_id": string
                  }
                  Insert: {
                    "briefing_date": string,"content": NonNullable<Json>,"created_at"?: string,"feedback"?: NonNullable<Json>,"id"?: string,"metrics": NonNullable<Json>,"model": string,"read_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "briefing_date"?: string,"content"?: NonNullable<Json>,"created_at"?: string,"feedback"?: NonNullable<Json>,"id"?: string,"metrics"?: NonNullable<Json>,"model"?: string,"read_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"dish_items": {
                  Row: {
                    "created_at": string,"dish_id": string,"food_id": number,"grams": number,"id": string,"sort_order": number,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"dish_id": string,"food_id": number,"grams": number,"id"?: string,"sort_order"?: number,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"dish_id"?: string,"food_id"?: number,"grams"?: number,"id"?: string,"sort_order"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dish_items_dish_id_user_id_fkey"
      columns: ["dish_id","user_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "dish_items_food_id_fkey"
      columns: ["food_id"]
isOneToOne: false
      referencedRelation: "foods"
      referencedColumns: ["id"]
    }
                  ]
                },"dishes": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"servings": number,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"servings"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"servings"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"financial_transactions": {
                  Row: {
                    "ai_confidence": number | null,"amount": number,"category": Database["public"]['Enums']["transaction_category"],"created_at": string,"currency": string,"description": string | null,"id": string,"kind": Database["public"]['Enums']["transaction_kind"],"merchant": string | null,"occurred_at": string,"payment_method": Database["public"]['Enums']["payment_method"] | null,"raw_extraction": Json | null,"receipt_path": string | null,"source": Database["public"]['Enums']["entry_source"],"tax_amount": number | null,"tax_breakdown": Json | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "ai_confidence"?: number | null,"amount": number,"category"?: Database["public"]['Enums']["transaction_category"],"created_at"?: string,"currency"?: string,"description"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["transaction_kind"],"merchant"?: string | null,"occurred_at"?: string,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"raw_extraction"?: Json | null,"receipt_path"?: string | null,"source"?: Database["public"]['Enums']["entry_source"],"tax_amount"?: number | null,"tax_breakdown"?: Json | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "ai_confidence"?: number | null,"amount"?: number,"category"?: Database["public"]['Enums']["transaction_category"],"created_at"?: string,"currency"?: string,"description"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["transaction_kind"],"merchant"?: string | null,"occurred_at"?: string,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"raw_extraction"?: Json | null,"receipt_path"?: string | null,"source"?: Database["public"]['Enums']["entry_source"],"tax_amount"?: number | null,"tax_breakdown"?: Json | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"focus_sessions": {
                  Row: {
                    "created_at": string,"duration_s": number | null,"ended_at": string | null,"id": string,"interruptions": number,"label": string | null,"planned_minutes": number,"started_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"duration_s"?: never,"ended_at"?: string | null,"id"?: string,"interruptions"?: number,"label"?: string | null,"planned_minutes"?: number,"started_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"duration_s"?: never,"ended_at"?: string | null,"id"?: string,"interruptions"?: number,"label"?: string | null,"planned_minutes"?: number,"started_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"foods": {
                  Row: {
                    "aliases": string,"carbs_g": number,"category": string,"fat_g": number,"id": number,"kcal": number,"name": string,"protein_g": number,"search_aliases": string | null,"search_name": string | null
                  }
                  Insert: {
                    "aliases"?: string,"carbs_g": number,"category": string,"fat_g": number,"id": number,"kcal": number,"name": string,"protein_g": number,"search_aliases"?: never,"search_name"?: never
                  }
                  Update: {
                    "aliases"?: string,"carbs_g"?: number,"category"?: string,"fat_g"?: number,"id"?: number,"kcal"?: number,"name"?: string,"protein_g"?: number,"search_aliases"?: never,"search_name"?: never
                  }
                  Relationships: [
                    
                  ]
                },"habit_logs": {
                  Row: {
                    "created_at": string,"habit_id": string,"id": string,"logged_on": string,"note": string | null,"times": number,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"habit_id": string,"id"?: string,"logged_on": string,"note"?: string | null,"times"?: number,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"habit_id"?: string,"id"?: string,"logged_on"?: string,"note"?: string | null,"times"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "habit_logs_habit_id_user_id_fkey"
      columns: ["habit_id","user_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"habits": {
                  Row: {
                    "archived_at": string | null,"cadence": Database["public"]['Enums']["habit_cadence"],"created_at": string,"id": string,"name": string,"sort_order": number,"target_per_period": number,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"cadence"?: Database["public"]['Enums']["habit_cadence"],"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"target_per_period"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"cadence"?: Database["public"]['Enums']["habit_cadence"],"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"target_per_period"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"macros": {
                  Row: {
                    "ai_confidence": number | null,"calories_kcal": number,"carbs_g": number,"created_at": string,"description": string,"eaten_at": string,"fat_g": number,"id": string,"items": NonNullable<Json>,"meal_type": Database["public"]['Enums']["meal_type"],"photo_path": string | null,"protein_g": number,"raw_extraction": Json | null,"source": Database["public"]['Enums']["entry_source"],"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "ai_confidence"?: number | null,"calories_kcal": number,"carbs_g"?: number,"created_at"?: string,"description": string,"eaten_at"?: string,"fat_g"?: number,"id"?: string,"items"?: NonNullable<Json>,"meal_type": Database["public"]['Enums']["meal_type"],"photo_path"?: string | null,"protein_g"?: number,"raw_extraction"?: Json | null,"source"?: Database["public"]['Enums']["entry_source"],"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "ai_confidence"?: number | null,"calories_kcal"?: number,"carbs_g"?: number,"created_at"?: string,"description"?: string,"eaten_at"?: string,"fat_g"?: number,"id"?: string,"items"?: NonNullable<Json>,"meal_type"?: Database["public"]['Enums']["meal_type"],"photo_path"?: string | null,"protein_g"?: number,"raw_extraction"?: Json | null,"source"?: Database["public"]['Enums']["entry_source"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"media_items": {
                  Row: {
                    "cover_url": string | null,"created_at": string,"creator": string | null,"external_ref": Json | null,"finished_on": string | null,"id": string,"kind": Database["public"]['Enums']["media_kind"],"progress_pct": number | null,"rating": number | null,"review": string | null,"started_on": string | null,"status": Database["public"]['Enums']["media_status"],"title": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "cover_url"?: string | null,"created_at"?: string,"creator"?: string | null,"external_ref"?: Json | null,"finished_on"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["media_kind"],"progress_pct"?: number | null,"rating"?: number | null,"review"?: string | null,"started_on"?: string | null,"status"?: Database["public"]['Enums']["media_status"],"title": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "cover_url"?: string | null,"created_at"?: string,"creator"?: string | null,"external_ref"?: Json | null,"finished_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["media_kind"],"progress_pct"?: number | null,"rating"?: number | null,"review"?: string | null,"started_on"?: string | null,"status"?: Database["public"]['Enums']["media_status"],"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notes": {
                  Row: {
                    "audio_duration_s": number | null,"audio_path": string | null,"content": string,"created_at": string,"embedded_at": string | null,"embedding": string | null,"embedding_model": string | null,"entry_date": string,"fts": unknown,"id": string,"mood": number | null,"source": Database["public"]['Enums']["entry_source"],"tags": (string)[],"title": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "audio_duration_s"?: number | null,"audio_path"?: string | null,"content": string,"created_at"?: string,"embedded_at"?: string | null,"embedding"?: string | null,"embedding_model"?: string | null,"entry_date": string,"fts"?: never,"id"?: string,"mood"?: number | null,"source"?: Database["public"]['Enums']["entry_source"],"tags"?: (string)[],"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "audio_duration_s"?: number | null,"audio_path"?: string | null,"content"?: string,"created_at"?: string,"embedded_at"?: string | null,"embedding"?: string | null,"embedding_model"?: string | null,"entry_date"?: string,"fts"?: never,"id"?: string,"mood"?: number | null,"source"?: Database["public"]['Enums']["entry_source"],"tags"?: (string)[],"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "ai_monthly_budget_usd": number,"briefing_enabled": boolean,"created_at": string,"currency": string,"daily_carbs_g_target": number | null,"daily_fat_g_target": number | null,"daily_kcal_target": number | null,"daily_protein_g_target": number | null,"display_name": string | null,"id": string,"monthly_budget": number | null,"timezone": string,"updated_at": string
                  }
                  Insert: {
                    "ai_monthly_budget_usd"?: number,"briefing_enabled"?: boolean,"created_at"?: string,"currency"?: string,"daily_carbs_g_target"?: number | null,"daily_fat_g_target"?: number | null,"daily_kcal_target"?: number | null,"daily_protein_g_target"?: number | null,"display_name"?: string | null,"id": string,"monthly_budget"?: number | null,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "ai_monthly_budget_usd"?: number,"briefing_enabled"?: boolean,"created_at"?: string,"currency"?: string,"daily_carbs_g_target"?: number | null,"daily_fat_g_target"?: number | null,"daily_kcal_target"?: number | null,"daily_protein_g_target"?: number | null,"display_name"?: string | null,"id"?: string,"monthly_budget"?: number | null,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workout_logs": {
                  Row: {
                    "created_at": string,"exercise": string,"id": string,"is_warmup": boolean,"reps": number,"rpe": number | null,"set_index": number,"user_id": string,"weight_kg": number,"workout_id": string
                  }
                  Insert: {
                    "created_at"?: string,"exercise": string,"id"?: string,"is_warmup"?: boolean,"reps": number,"rpe"?: number | null,"set_index": number,"user_id"?: string,"weight_kg"?: number,"workout_id": string
                  }
                  Update: {
                    "created_at"?: string,"exercise"?: string,"id"?: string,"is_warmup"?: boolean,"reps"?: number,"rpe"?: number | null,"set_index"?: number,"user_id"?: string,"weight_kg"?: number,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_logs_workout_id_user_id_fkey"
      columns: ["workout_id","user_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workouts": {
                  Row: {
                    "created_at": string,"ended_at": string | null,"id": string,"notes": string | null,"perceived_effort": number | null,"source": Database["public"]['Enums']["entry_source"],"started_at": string,"title": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"ended_at"?: string | null,"id"?: string,"notes"?: string | null,"perceived_effort"?: number | null,"source"?: Database["public"]['Enums']["entry_source"],"started_at"?: string,"title": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"ended_at"?: string | null,"id"?: string,"notes"?: string | null,"perceived_effort"?: number | null,"source"?: Database["public"]['Enums']["entry_source"],"started_at"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "ai_spend_this_month":
{ Args: { "p_user_id"?: string }; Returns: number
                           },
"create_dish":
{ Args: { "p_items": Json,"p_name": string,"p_servings": number }; Returns: string
                           },
"exercise_progress":
{ Args: { "p_exercise": string,"p_from"?: string,"p_user_id"?: string }; Returns: {
              "best_e1rm_kg": number,"performed_on": string,"sets": number,"top_weight_kg": number,"volume_kg": number,"workout_id": string
            }[]
                           },
"focus_stats":
{ Args: { "p_from": string,"p_to": string,"p_user_id"?: string }; Returns: {
              "day": string,"focus_minutes": number,"interruptions": number,"sessions": number
            }[]
                           },
"habit_stats":
{ Args: { "p_from": string,"p_to": string,"p_user_id"?: string }; Returns: {
              "cadence": Database["public"]['Enums']["habit_cadence"],"current_streak": number,"done_days": number,"habit_id": string,"name": string,"target_per_period": number
            }[]
                           },
"hybrid_search_notes":
{ Args: { "date_from"?: string,"date_to"?: string,"full_text_weight"?: number,"match_count"?: number,"query_embedding": string,"query_text": string,"rrf_k"?: number,"semantic_weight"?: number }; Returns: {
              "entry_date": string,"excerpt": string,"id": string,"score": number,"tags": (string)[],"title": string
            }[]
                           },
"nutrition_daily":
{ Args: { "p_from": string,"p_to": string,"p_user_id"?: string }; Returns: {
              "calories_kcal": number,"carbs_g": number,"day": string,"fat_g": number,"kcal_target": number,"meals": number,"protein_g": number,"protein_target": number
            }[]
                           },
"search_foods":
{ Args: { "p_limit"?: number,"p_query": string }; Returns: {
              "carbs_g": number,"category": string,"dish_id": string,"fat_g": number,"food_id": number,"grams": number,"kcal": number,"kind": string,"name": string,"protein_g": number
            }[]
                           },
"spending_summary":
{ Args: { "p_from": string,"p_to": string,"p_user_id"?: string }; Returns: {
              "category": Database["public"]['Enums']["transaction_category"],"kind": Database["public"]['Enums']["transaction_kind"],"total": number,"tx_count": number
            }[]
                           }
          }
          Enums: {
            "ai_run_status": "ok"|"error"|"rejected","ai_task": "receipt_extraction"|"meal_extraction"|"voice_transcription"|"voice_structuring"|"embedding"|"chat"|"briefing","entry_source": "manual"|"ocr"|"photo"|"voice"|"import","habit_cadence": "daily"|"weekly","meal_type": "breakfast"|"lunch"|"dinner"|"snack","media_kind": "book"|"film"|"series"|"podcast"|"game"|"album","media_status": "backlog"|"in_progress"|"done"|"dropped","payment_method": "card"|"cash"|"transfer"|"bizum"|"other","transaction_category": "groceries"|"restaurants"|"transport"|"housing"|"utilities"|"health"|"sport"|"leisure"|"shopping"|"subscriptions"|"education"|"travel"|"gifts"|"taxes"|"salary"|"other","transaction_kind": "expense"|"income"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "ai_run_status": ["ok", "error", "rejected"],"ai_task": ["receipt_extraction", "meal_extraction", "voice_transcription", "voice_structuring", "embedding", "chat", "briefing"],"entry_source": ["manual", "ocr", "photo", "voice", "import"],"habit_cadence": ["daily", "weekly"],"meal_type": ["breakfast", "lunch", "dinner", "snack"],"media_kind": ["book", "film", "series", "podcast", "game", "album"],"media_status": ["backlog", "in_progress", "done", "dropped"],"payment_method": ["card", "cash", "transfer", "bizum", "other"],"transaction_category": ["groceries", "restaurants", "transport", "housing", "utilities", "health", "sport", "leisure", "shopping", "subscriptions", "education", "travel", "gifts", "taxes", "salary", "other"],"transaction_kind": ["expense", "income"]
          }
        }
} as const

