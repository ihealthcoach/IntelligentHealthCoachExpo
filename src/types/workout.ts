// Enhanced set type with RPE, one-rep max, and PR tracking
export type ExerciseSet = {
    id: string;
    setNumber: number;
    weight: number | null;
    reps: number | null;
    isComplete: boolean;
    isPR?: boolean;
    rpe?: number | null; // Rate of Perceived Exertion (1-10)
    tempo?: string | null; // e.g. "3-1-2" (eccentric-pause-concentric)
    completedAt?: string; // ISO timestamp when set was completed
    restAfter?: number | null; // Rest time in seconds
    previousWeight?: number | null; // Weight from last workout for comparison
    previousReps?: number | null; // Reps from last workout for comparison
  };
  
  // Exercise types for categories
  export enum ExerciseCategory {
    STRENGTH = 'strength',
    CARDIO = 'cardio',
    FLEXIBILITY = 'flexibility',
    BALANCE = 'balance',
    OTHER = 'other'
  }
  
  // SuperSet types
  export enum SupersetType {
    NONE = 'none',
    SUPERSET = 'superset',
    GIANTSET = 'giantset',
    DROPSET = 'dropset',
    CIRCUIT = 'circuit'
  }
  
  // Expanded exercise with more detailed tracking
  export type WorkoutExercise = {
    id: string;
    exerciseId: string;
    name: string;
    primaryMuscles: string;
    equipment: string;
    sets: ExerciseSet[];
    notes: string;
    isExpanded: boolean;
    completed?: boolean;
    category?: ExerciseCategory;
    supersetId?: string | null; // Group exercises in supersets
    supersetType?: SupersetType;
    order: number; // Order in the workout
    restBetweenSets?: number; // Rest time in seconds
    estimatedOneRepMax?: number | null; // Calculated 1RM
    targetMuscleGroups?: string[];
    exerciseHistory?: {
      date: string;
      weight: number;
      reps: number;
      volume: number;
    }[]; // Recent performance data
  };
  
  // Workout status options
  export enum WorkoutStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
  }
  
  // Enhanced workout type
  export type Workout = {
    id: string;
    userId?: string;
    name: string;
    notes?: string;
    startedAt?: string; // ISO timestamp when workout started
    completedAt?: string; // ISO timestamp when workout ended
    duration?: number; // Duration in seconds
    exercises: WorkoutExercise[];
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    totalVolume?: number; // Total weight * reps across all exercises
    split?: string; // e.g., "Upper", "Lower", "Push", "Pull"
    template?: boolean; // Whether this is a template
    plannedDuration?: number; // Estimated duration in minutes
    intensity?: number; // Average RPE/intensity
    caloriesBurned?: number; // Estimated calories
    bodyweight?: number; // User's bodyweight at time of workout
    tags?: string[]; // Custom tags
    supportsOfflineSync?: boolean; // Whether the workout can be synced offline
  };
  
  // Template exercise (simplified for storage)
  export type TemplateExercise = {
    id: string;
    exerciseId: string;
    name: string;
    primaryMuscles: string;
    equipment: string;
    sets: number; // Just the number of sets, not actual set data
    order: number;
    restBetweenSets?: number;
    supersetId?: string | null;
    supersetType?: SupersetType;
  };
  
  // Workout template
  export type WorkoutTemplate = {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    lastUsed?: string;
    exercises: TemplateExercise[];
    category?: string;
    split?: string;
    estimatedDuration?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    isDefault?: boolean;
  };
  
  // Exercise progress data for charts
  export type ExerciseProgressData = {
    exerciseId: string;
    name: string;
    data: {
      date: string;
      maxWeight: number;
      maxReps: number;
      volume: number;
      estimatedOneRepMax: number;
    }[];
  };
  
  // Volume by muscle group for analysis
  export type MuscleGroupVolume = {
    muscleGroup: string;
    volume: number;
    percentage: number;
  };
  
  // Workout analytics summary
  export type WorkoutAnalytics = {
    workoutsCompleted: number;
    totalVolume: number;
    totalDuration: number;
    averageIntensity: number;
    muscleGroupDistribution: MuscleGroupVolume[];
    mostFrequentExercises: {
      id: string;
      name: string;
      count: number;
    }[];
    personalRecords: {
      exerciseId: string;
      exerciseName: string;
      metric: 'weight' | 'reps' | 'volume' | '1rm';
      value: number;
      date: string;
    }[];
  };