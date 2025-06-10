export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      citation_edges: {
        Row: {
          source_document_id: string
          target_document_id: string
        }
        Insert: {
          source_document_id: string
          target_document_id: string
        }
        Update: {
          source_document_id?: string
          target_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citation_edges_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citation_edges_target_document_id_fkey"
            columns: ["target_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      citation_nodes: {
        Row: {
          content: string | null
          created_at: string | null
          date: string | null
          document_id: string
          id: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          date?: string | null
          document_id: string
          id?: string
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          date?: string | null
          document_id?: string
          id?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citation_nodes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          cited_document_id: string
          citing_document_id: string
          context: string | null
          created_at: string | null
          id: string
          type: string
        }
        Insert: {
          cited_document_id: string
          citing_document_id: string
          context?: string | null
          created_at?: string | null
          id?: string
          type: string
        }
        Update: {
          cited_document_id?: string
          citing_document_id?: string
          context?: string | null
          created_at?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "citations_cited_document_id_fkey"
            columns: ["cited_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_citing_document_id_fkey"
            columns: ["citing_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_analyses: {
        Row: {
          analyzed_by: string | null
          contract_id: string | null
          created_at: string
          id: string
          recommendations: string[] | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          analyzed_by?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          recommendations?: string[] | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          analyzed_by?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          recommendations?: string[] | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_analyses_analyzed_by_fkey"
            columns: ["analyzed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_analyses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_impacts: {
        Row: {
          action_required: string
          change_id: string | null
          contract_id: string | null
          created_at: string
          id: string
          impact_description: string
          priority_level: Database["public"]["Enums"]["priority_level"]
          updated_at: string
        }
        Insert: {
          action_required: string
          change_id?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          impact_description: string
          priority_level: Database["public"]["Enums"]["priority_level"]
          updated_at?: string
        }
        Update: {
          action_required?: string
          change_id?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          impact_description?: string
          priority_level?: Database["public"]["Enums"]["priority_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_impacts_change_id_fkey"
            columns: ["change_id"]
            isOneToOne: false
            referencedRelation: "legal_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_impacts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          content: string
          contract_name: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          id: string
          last_reviewed: string | null
          risk_level: Database["public"]["Enums"]["impact_level"]
          updated_at: string
        }
        Insert: {
          content: string
          contract_name: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          id?: string
          last_reviewed?: string | null
          risk_level: Database["public"]["Enums"]["impact_level"]
          updated_at?: string
        }
        Update: {
          content?: string
          contract_name?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          id?: string
          last_reviewed?: string | null
          risk_level?: Database["public"]["Enums"]["impact_level"]
          updated_at?: string
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          agent_type: string | null
          answer: string | null
          created_at: string
          id: string
          question: string
          session_id: string
          sources: string[] | null
          user_id: string | null
        }
        Insert: {
          agent_type?: string | null
          answer?: string | null
          created_at?: string
          id?: string
          question: string
          session_id: string
          sources?: string[] | null
          user_id?: string | null
        }
        Update: {
          agent_type?: string | null
          answer?: string | null
          created_at?: string
          id?: string
          question?: string
          session_id?: string
          sources?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          documents_found: number | null
          documents_processed: number | null
          error_message: string | null
          id: string
          source_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["crawler_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          documents_found?: number | null
          documents_processed?: number | null
          error_message?: string | null
          id?: string
          source_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["crawler_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          documents_found?: number | null
          documents_processed?: number | null
          error_message?: string | null
          id?: string
          source_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["crawler_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawler_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "legal_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_proxies: {
        Row: {
          created_at: string
          failure_count: number | null
          host: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          password: string | null
          port: number
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          failure_count?: number | null
          host: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          password?: string | null
          port: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          failure_count?: number | null
          host?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          password?: string | null
          port?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      document_links: {
        Row: {
          created_at: string | null
          id: string
          link_type: string
          source_document_id: string | null
          target_document_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_type: string
          source_document_id?: string | null
          target_document_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link_type?: string
          source_document_id?: string | null
          target_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_links_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_target_document_id_fkey"
            columns: ["target_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content_hash: string
          content_text: string | null
          created_at: string | null
          document_id: string | null
          id: string
          metadata: Json | null
          similarity_score: number | null
        }
        Insert: {
          content_hash: string
          content_text?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          metadata?: Json | null
          similarity_score?: number | null
        }
        Update: {
          content_hash?: string
          content_text?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          metadata?: Json | null
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content_hash: string
          content_text: string | null
          created_at: string | null
          document_type: string
          external_id: string
          id: string
          last_modified: string
          metadata: Json | null
          published_date: string
          source: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          content_hash: string
          content_text?: string | null
          created_at?: string | null
          document_type: string
          external_id: string
          id?: string
          last_modified: string
          metadata?: Json | null
          published_date: string
          source: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          content_hash?: string
          content_text?: string | null
          created_at?: string | null
          document_type?: string
          external_id?: string
          id?: string
          last_modified?: string
          metadata?: Json | null
          published_date?: string
          source?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      impact_analysis_results: {
        Row: {
          analysis_id: string
          created_at: string | null
          document_id: string | null
          impact_summary: string | null
          referenced_documents: Json | null
        }
        Insert: {
          analysis_id?: string
          created_at?: string | null
          document_id?: string | null
          impact_summary?: string | null
          referenced_documents?: Json | null
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          document_id?: string | null
          impact_summary?: string | null
          referenced_documents?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_analysis_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_metrics: {
        Row: {
          agent_id: string
          confidence_score: number | null
          created_at: string | null
          interaction_id: string
          reasoning_log: Json | null
          response_time_ms: number
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          confidence_score?: number | null
          created_at?: string | null
          interaction_id?: string
          reasoning_log?: Json | null
          response_time_ms: number
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          confidence_score?: number | null
          created_at?: string | null
          interaction_id?: string
          reasoning_log?: Json | null
          response_time_ms?: number
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interaction_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_change_events: {
        Row: {
          change_type: Database["public"]["Enums"]["change_type"] | null
          detected_at: string | null
          id: string
          source_url: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          summary: string | null
        }
        Insert: {
          change_type?: Database["public"]["Enums"]["change_type"] | null
          detected_at?: string | null
          id?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          summary?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["change_type"] | null
          detected_at?: string | null
          id?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          summary?: string | null
        }
        Relationships: []
      }
      legal_changes: {
        Row: {
          change_type: Database["public"]["Enums"]["change_type"]
          created_at: string
          description: string
          detected_at: string
          document_id: string | null
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"]
          updated_at: string
        }
        Insert: {
          change_type: Database["public"]["Enums"]["change_type"]
          created_at?: string
          description: string
          detected_at?: string
          document_id?: string | null
          id?: string
          impact_level: Database["public"]["Enums"]["impact_level"]
          updated_at?: string
        }
        Update: {
          change_type?: Database["public"]["Enums"]["change_type"]
          created_at?: string
          description?: string
          detected_at?: string
          document_id?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_changes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          cross_references: Json | null
          document_type: Database["public"]["Enums"]["document_type"]
          domain_id: string | null
          hierarchy_level:
            | Database["public"]["Enums"]["legal_hierarchy_level"]
            | null
          id: string
          metadata: Json | null
          publication_date: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          cross_references?: Json | null
          document_type: Database["public"]["Enums"]["document_type"]
          domain_id?: string | null
          hierarchy_level?:
            | Database["public"]["Enums"]["legal_hierarchy_level"]
            | null
          id?: string
          metadata?: Json | null
          publication_date: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          cross_references?: Json | null
          document_type?: Database["public"]["Enums"]["document_type"]
          domain_id?: string | null
          hierarchy_level?:
            | Database["public"]["Enums"]["legal_hierarchy_level"]
            | null
          id?: string
          metadata?: Json | null
          publication_date?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "legal_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_domains: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          parent_domain_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_domain_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_domain_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_domains_parent_domain_id_fkey"
            columns: ["parent_domain_id"]
            isOneToOne: false
            referencedRelation: "legal_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_hierarchy: {
        Row: {
          child_document_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          parent_document_id: string | null
          relationship_type: string
          updated_at: string
        }
        Insert: {
          child_document_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          parent_document_id?: string | null
          relationship_type: string
          updated_at?: string
        }
        Update: {
          child_document_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          parent_document_id?: string | null
          relationship_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_hierarchy_child_document_id_fkey"
            columns: ["child_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_hierarchy_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_sources: {
        Row: {
          base_url: string
          crawl_frequency_minutes: number
          created_at: string
          id: string
          is_active: boolean | null
          last_crawled_at: string | null
          name: string
          type: Database["public"]["Enums"]["legal_source_type"]
          updated_at: string
        }
        Insert: {
          base_url: string
          crawl_frequency_minutes?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_crawled_at?: string | null
          name: string
          type: Database["public"]["Enums"]["legal_source_type"]
          updated_at?: string
        }
        Update: {
          base_url?: string
          crawl_frequency_minutes?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_crawled_at?: string | null
          name?: string
          type?: Database["public"]["Enums"]["legal_source_type"]
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metrics: Json
          operation: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metrics: Json
          operation: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metrics?: Json
          operation?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      queue_messages: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      risks: {
        Row: {
          analysis_id: string | null
          created_at: string
          description: string
          id: string
          recommendation: string | null
          section: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          type: Database["public"]["Enums"]["risk_type"]
          updated_at: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          description: string
          id?: string
          recommendation?: string | null
          section?: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          type: Database["public"]["Enums"]["risk_type"]
          updated_at?: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          description?: string
          id?: string
          recommendation?: string | null
          section?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          type?: Database["public"]["Enums"]["risk_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "contract_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_document_relevance: {
        Row: {
          change_event_id: string | null
          document_id: string | null
          id: string
          relevance_score: number | null
          user_id: string | null
        }
        Insert: {
          change_event_id?: string | null
          document_id?: string | null
          id?: string
          relevance_score?: number | null
          user_id?: string | null
        }
        Update: {
          change_event_id?: string | null
          document_id?: string | null
          id?: string
          relevance_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_document_relevance_change_event_id_fkey"
            columns: ["change_event_id"]
            isOneToOne: false
            referencedRelation: "legal_change_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_document_relevance_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          agent_id: string
          category: string | null
          comments: string | null
          created_at: string | null
          id: string
          interaction_id: string
          rating: string | null
          resolved: boolean | null
          suggested_correction: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          category?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          interaction_id: string
          rating?: string | null
          resolved?: boolean | null
          suggested_correction?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          category?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          interaction_id?: string
          rating?: string | null
          resolved?: boolean | null
          suggested_correction?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interaction_metrics"
            referencedColumns: ["interaction_id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications_enabled: boolean
          in_app_notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications_enabled?: boolean
          in_app_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications_enabled?: boolean
          in_app_notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_cross_domain_similar_documents: {
        Args: {
          query_embedding: string
          similarity_threshold?: number
          match_count?: number
          exclude_domain_id?: string
        }
        Returns: {
          document_id: string
          title: string
          content: string
          document_type: string
          domain_id: string
          metadata: Json
          similarity: number
        }[]
      }
      find_impact_chains: {
        Args: { start_document_id: string; max_depth: number }
        Returns: {
          document_id: string
          path: string[]
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      change_type:
        | "amendment"
        | "repeal"
        | "new_legislation"
        | "interpretation"
        | "other"
      contract_type: "service" | "employment" | "nda" | "partnership" | "other"
      crawler_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "rate_limited"
      document_type: "law" | "regulation" | "policy" | "decision" | "other"
      impact_level: "low" | "medium" | "high" | "critical"
      legal_hierarchy_level:
        | "constitutional"
        | "statutory"
        | "regulatory"
        | "administrative"
        | "judicial"
        | "other"
      legal_source_type:
        | "magyar_kozlony"
        | "official_journal"
        | "court_decision"
        | "legislation"
        | "other"
      notification_status: "detected" | "analyzed" | "notified"
      priority_level: "low" | "medium" | "high" | "urgent"
      risk_level: "low" | "medium" | "high"
      risk_type:
        | "legal"
        | "financial"
        | "operational"
        | "compliance"
        | "security"
        | "privacy"
        | "intellectual_property"
        | "other"
      user_role: "admin" | "jogász" | "analyst" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      change_type: [
        "amendment",
        "repeal",
        "new_legislation",
        "interpretation",
        "other",
      ],
      contract_type: ["service", "employment", "nda", "partnership", "other"],
      crawler_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "rate_limited",
      ],
      document_type: ["law", "regulation", "policy", "decision", "other"],
      impact_level: ["low", "medium", "high", "critical"],
      legal_hierarchy_level: [
        "constitutional",
        "statutory",
        "regulatory",
        "administrative",
        "judicial",
        "other",
      ],
      legal_source_type: [
        "magyar_kozlony",
        "official_journal",
        "court_decision",
        "legislation",
        "other",
      ],
      notification_status: ["detected", "analyzed", "notified"],
      priority_level: ["low", "medium", "high", "urgent"],
      risk_level: ["low", "medium", "high"],
      risk_type: [
        "legal",
        "financial",
        "operational",
        "compliance",
        "security",
        "privacy",
        "intellectual_property",
        "other",
      ],
      user_role: ["admin", "jogász", "analyst", "viewer"],
    },
  },
} as const

