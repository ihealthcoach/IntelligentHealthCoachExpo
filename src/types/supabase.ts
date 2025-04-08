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
    profiles: {
      Row: {
        id: string
        user_id: string
        first_name: string | null
        last_name: string | null
        avatar_url: string | null
        gender: string | null
        goal: string | null
        workout_days: number[] | null
        level: string | null
        weight: number | null
        height: number | null
        age: number | null
        bodytype: string | null
        created_at: string | null
        updated_at: string | null
        dob: string | null
        body_type: string | null
        main_goal: string | null
        experience: string | null
        preferred_workout_location: string | null
        activity_level: string | null
        injuries: boolean | null
        injuries_list: string[] | null
        steps_goal: string | null
      }
      Insert: {
        id?: string
        user_id: string
        first_name?: string | null
        last_name?: string | null
        avatar_url?: string | null
        gender?: string | null
        goal?: string | null
        workout_days?: number[] | null
        level?: string | null
        weight?: number | null
        height?: number | null
        age?: number | null
        bodytype?: string | null
        created_at?: string | null
        updated_at?: string | null
        dob?: string | null
        body_type?: string | null
        main_goal?: string | null
        experience?: string | null
        preferred_workout_location?: string | null
        activity_level?: string | null
        injuries?: boolean | null
        injuries_list?: string[] | null
        steps_goal?: string | null
      }
      Update: {
        id?: string
        user_id?: string
        first_name?: string | null
        last_name?: string | null
        avatar_url?: string | null
        gender?: string | null
        goal?: string | null
        workout_days?: number[] | null
        level?: string | null
        weight?: number | null
        height?: number | null
        age?: number | null
        bodytype?: string | null
        created_at?: string | null
        updated_at?: string | null
        dob?: string | null
        body_type?: string | null
        main_goal?: string | null
        experience?: string | null
        preferred_workout_location?: string | null
        activity_level?: string | null
        injuries?: boolean | null
        injuries_list?: string[] | null
        steps_goal?: string | null
      }
    }
    exercises: {
      Row: {
        id: string
        exercise_type: string | null
        experience: string | null
        force_type: string | null
        mechanics: string | null
        name: string | null
        primary_muscles: string | null
        secondary_muscles: string | null
        instructions: string | null
        experience_level: string | null
        muscle_group: string | null
        description: string | null
        benefits: string | null
        equipment: string | null
        body_part: string | null
        target: string | null
        gif_url: string | null
      }
      Insert: {
        id?: string
        exercise_type?: string | null
        experience?: string | null
        force_type?: string | null
        mechanics?: string | null
        name?: string | null
        primary_muscles?: string | null
        secondary_muscles?: string | null
        instructions?: string | null
        experience_level?: string | null
        muscle_group?: string | null
        description?: string | null
        benefits?: string | null
        equipment?: string | null
        body_part?: string | null
        target?: string | null
        gif_url?: string | null
      }
      Update: {
        id?: string
        exercise_type?: string | null
        experience?: string | null
        force_type?: string | null
        mechanics?: string | null
        name?: string | null
        primary_muscles?: string | null
        secondary_muscles?: string | null
        instructions?: string | null
        experience_level?: string | null
        muscle_group?: string | null
        description?: string | null
        benefits?: string | null
        equipment?: string | null
        body_part?: string | null
        target?: string | null
        gif_url?: string | null
      }
    }
    workouts: {
      Row: {
        id: string
        created_at: string | null
        updated_at: string | null
        user_id: string | null
        status: string
        name: string | null
        notes: string | null
        duration: number | null
        completed_at: string | null
      }
      Insert: {
        id?: string
        created_at?: string | null
        updated_at?: string | null
        user_id?: string | null
        status: string
        name?: string | null
        notes?: string | null
        duration?: number | null
        completed_at?: string | null
      }
      Update: {
        id?: string
        created_at?: string | null
        updated_at?: string | null
        user_id?: string | null
        status?: string
        name?: string | null
        notes?: string | null
        duration?: number | null
        completed_at?: string | null
      }
    }
    workout_exercise_details: {
      Row: {
        id: string
        created_at: string
        updated_at: string | null
        exercise_id: string | null
        workout_id: string | null
        order: number | null
        notes: string | null
        superset_id: string | null
        superset_type: string | null
        rest_between_sets: number | null
      }
      Insert: {
        id?: string
        created_at?: string
        updated_at?: string | null
        exercise_id?: string | null
        workout_id?: string | null
        order?: number | null
        notes?: string | null
        superset_id?: string | null
        superset_type?: string | null
        rest_between_sets?: number | null
      }
      Update: {
        id?: string
        created_at?: string
        updated_at?: string | null
        exercise_id?: string | null
        workout_id?: string | null
        order?: number | null
        notes?: string | null
        superset_id?: string | null
        superset_type?: string | null
        rest_between_sets?: number | null
      }
    }
    workout_sets: {
      Row: {
        id: string
        created_at: string
        updated_at: string | null
        type: string | null
        workout_exercise_details_id: string | null
        completed: boolean
        weight: number | null
        reps: number | null
        distance: number | null
        duration: number | null
        rpe: number | null
        notes: string | null
        is_pr: boolean | null
        set_number: number | null
      }
      Insert: {
        id?: string
        created_at?: string
        updated_at?: string | null
        type?: string | null
        workout_exercise_details_id?: string | null
        completed?: boolean
        weight?: number | null
        reps?: number | null
        distance?: number | null
        duration?: number | null
        rpe?: number | null
        notes?: string | null
        is_pr?: boolean | null
        set_number?: number | null
      }
      Update: {
        id?: string
        created_at?: string
        updated_at?: string | null
        type?: string | null
        workout_exercise_details_id?: string | null
        completed?: boolean
        weight?: number | null
        reps?: number | null
        distance?: number | null
        duration?: number | null
        rpe?: number | null
        notes?: string | null
        is_pr?: boolean | null
        set_number?: number | null
      }
    }
    workout_templates: {
      Row: {
        id: string
        user_id: string
        name: string
        description: string | null
        created_at: string
        last_used: string | null
        category: string | null
        split: string | null
        estimated_duration: number | null
        difficulty: string | null
        tags: string[] | null
        is_default: boolean | null
      }
      Insert: {
        id?: string
        user_id: string
        name: string
        description?: string | null
        created_at?: string
        last_used?: string | null
        category?: string | null
        split?: string | null
        estimated_duration?: number | null
        difficulty?: string | null
        tags?: string[] | null
        is_default?: boolean | null
      }
      Update: {
        id?: string
        user_id?: string
        name?: string
        description?: string | null
        created_at?: string
        last_used?: string | null
        category?: string | null
        split?: string | null
        estimated_duration?: number | null
        difficulty?: string | null
        tags?: string[] | null
        is_default?: boolean | null
      }
    }
    template_exercises: {
      Row: {
        id: string
        template_id: string
        exercise_id: string
        name: string
        primary_muscles: string | null
        equipment: string | null
        sets: number
        order: number
        rest_between_sets: number | null
        superset_id: string | null
        superset_type: string | null
      }
      Insert: {
        id?: string
        template_id: string
        exercise_id: string
        name: string
        primary_muscles?: string | null
        equipment?: string | null
        sets?: number
        order?: number
        rest_between_sets?: number | null
        superset_id?: string | null
        superset_type?: string | null
      }
      Update: {
        id?: string
        template_id?: string
        exercise_id?: string
        name?: string
        primary_muscles?: string | null
        equipment?: string | null
        sets?: number
        order?: number
        rest_between_sets?: number | null
        superset_id?: string | null
        superset_type?: string | null
      }
    }
  }
  Views: {
    [_ in never]: never
  }
  Functions: {
    [_ in never]: never
  }
  Enums: {
    workout_status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
    set_type: 'normal' | 'warmup' | 'dropset' | 'failure'
  }
  CompositeTypes: {
    [_ in never]: never
  }
}
}

// Helper types for Supabase
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Commonly used types
export type Profile = Tables<'profiles'>
export type Exercise = Tables<'exercises'>
export type Workout = Tables<'workouts'>
export type WorkoutExerciseDetail = Tables<'workout_exercise_details'>
export type WorkoutSet = Tables<'workout_sets'>
export type WorkoutTemplate = Tables<'workout_templates'>
export type TemplateExercise = Tables<'template_exercises'>

// Enum types
export type WorkoutStatus = Enums<'workout_status'>
export type SetType = Enums<'set_type'>