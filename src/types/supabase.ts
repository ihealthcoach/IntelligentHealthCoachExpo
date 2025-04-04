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
        created_at: string
        updated_at: string
        email: string
        username: string | null
        full_name: string | null
        avatar_url: string | null
        age: number | null
        height: number | null
        weight: number | null
        fitness_goal: string | null
      }
      Insert: {
        id: string
        created_at?: string
        updated_at?: string
        email: string
        username?: string | null
        full_name?: string | null
        avatar_url?: string | null
        age?: number | null
        height?: number | null
        weight?: number | null
        fitness_goal?: string | null
      }
      Update: {
        id?: string
        created_at?: string
        updated_at?: string
        email?: string
        username?: string | null
        full_name?: string | null
        avatar_url?: string | null
        age?: number | null
        height?: number | null
        weight?: number | null
        fitness_goal?: string | null
      }
    }
    exercises: {
      Row: {
        id: string
        created_at: string
        name: string
        description: string | null
        muscle_group: string
        equipment: string | null
        difficulty: string | null
        instructions: string | null
        image_url: string | null
      }
      Insert: {
        id?: string
        created_at?: string
        name: string
        description?: string | null
        muscle_group: string
        equipment?: string | null
        difficulty?: string | null
        instructions?: string | null
        image_url?: string | null
      }
      Update: {
        id?: string
        created_at?: string
        name?: string
        description?: string | null
        muscle_group?: string
        equipment?: string | null
        difficulty?: string | null
        instructions?: string | null
        image_url?: string | null
      }
    }
    workouts: {
      Row: {
        id: string
        created_at: string
        user_id: string
        name: string
        date: string
        notes: string | null
        duration: number | null
        completed: boolean
      }
      Insert: {
        id?: string
        created_at?: string
        user_id: string
        name: string
        date: string
        notes?: string | null
        duration?: number | null
        completed?: boolean
      }
      Update: {
        id?: string
        created_at?: string
        user_id?: string
        name?: string
        date?: string
        notes?: string | null
        duration?: number | null
        completed?: boolean
      }
    }
    workout_exercise_details: {
      Row: {
        id: string
        workout_id: string
        exercise_id: string
        order: number
        notes: string | null
      }
      Insert: {
        id?: string
        workout_id: string
        exercise_id: string
        order: number
        notes?: string | null
      }
      Update: {
        id?: string
        workout_id?: string
        exercise_id?: string
        order?: number
        notes?: string | null
      }
    }
    workout_sets: {
      Row: {
        id: string
        workout_exercise_id: string
        set_number: number
        reps: number | null
        weight: number | null
        duration: number | null
        distance: number | null
        notes: string | null
      }
      Insert: {
        id?: string
        workout_exercise_id: string
        set_number: number
        reps?: number | null
        weight?: number | null
        duration?: number | null
        distance?: number | null
        notes?: string | null
      }
      Update: {
        id?: string
        workout_exercise_id?: string
        set_number?: number
        reps?: number | null
        weight?: number | null
        duration?: number | null
        distance?: number | null
        notes?: string | null
      }
    }
    workout_templates: {
      Row: {
        id: string
        user_id: string
        name: string
        description: string | null
        created_at: string
      }
      Insert: {
        id?: string
        user_id: string
        name: string
        description?: string | null
        created_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        name?: string
        description?: string | null
        created_at?: string
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
    [_ in never]: never
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

// Commonly used types
export type Profile = Tables<'profiles'>
export type Exercise = Tables<'exercises'>
export type Workout = Tables<'workouts'>
export type WorkoutExerciseDetail = Tables<'workout_exercise_details'>
export type WorkoutSet = Tables<'workout_sets'>
export type WorkoutTemplate = Tables<'workout_templates'>