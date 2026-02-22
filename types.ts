export interface UserProfile {
  name: string;
  photoUrl?: string;
  income: number;
  rent: number;
  location?: { lat: number; lng: number; label?: string } | string;
  occupation: string;
  age?: number;
  employmentStatus?: 'employed' | 'unemployed' | 'student' | 'self-employed';
  state?: string;
  householdSize: number;
  commuteMethod: string | string[];
  commuteDistanceKm: number;
  // Financial specifics (monthly in RM)
  utilities: number;
  transportCost: number; // calculated or estimated
  food: number;
  debt: number;
  subscriptions: number;
  savings: number;
  emergencySavings?: number;
  // Track which optimization categories user has already accepted (e.g., ['housing', 'transport'])
  optimizedCategories?: string[];
  hasCompletedOnboarding?: boolean;
  smartGoals?: SmartGoal[];
  wealthPlusStrategies?: WealthPlusStrategy[];
  transportOptimizations?: TravelOptimization[];
  claimedSubsidies?: ClaimedSubsidy[];
  engineStatus?: Record<string, boolean>;
  appliedLifestyleOptimizations?: AppliedLifestyleOptimization[];
  lifestyleSuggestionCache?: any; // Cached AI suggestions so they persist
}

export interface AppliedLifestyleOptimization {
  title: string;
  category: string;
  monthlySavings: number;
  appliedAt: number;
}

export interface ClaimedSubsidy {
  programId: string;
  name: string;
  monthlyBenefit: number;
  benefitText: string;
  claimedAt: number;
}

export interface WealthPlusStrategy {
  id: string;
  label: string;
  monthlyAmount: number;
  savingsAlloc: number;
  investmentAlloc: number;
  savingsOption?: string;
  investments: { name: string; lots: number; costPerLot: number }[];
  createdAt: number;
  // Metadata for editing
  targetAmount?: number;
  duration?: number;
  risk?: 'conservative' | 'moderate' | 'aggressive';
  goalType?: 'short' | 'long';
}

export interface SmartGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadlineMonths: number;
  category?: string;
  createdAt: number;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'housing' | 'transport' | 'subsidy' | 'career';
  title: string;
  description: string;
  potentialSavings: number;
  impact: 'high' | 'medium' | 'low';
  details?: any; // Flexible for different card types
}

export interface TravelOptimization {
  id: string;
  startLocation: string;
  destination: string;
  method: string;
  tripsPerWeek: number;
  isRoundTrip: boolean;
  avgTravelTimeGo: number;
  avgTravelTimeReturn: number;
  costPerTrip: number;
  weeklyCost: number;
  monthlyCost: number;
  yearlyCost: number;
  avgTravelTimeTotal: number;
  createdAt: number;
  aiScenarios?: {
    cheapest_option: TravelScenario;
    balanced_option: TravelScenario;
    fastest_option: TravelScenario;
    estimated_monthly_savings: number;
    estimated_yearly_savings: number;
  };
  selectedOptionId?: 'cheapest' | 'balanced' | 'fastest' | 'current';
}

export interface TravelScenario {
  method: string;
  estimated_cost_per_trip: number;
  weekly_cost: number;
  monthly_cost: number;
  yearly_cost: number;
  estimated_time: string;
  reasoning: string;
}

export interface SimulationResult {
  currentSavings: number;
  optimizedSavings: number;
  sixMonthSurvivalProbability: number;
  twoYearSustainabilityScore: number;
  riskFactors: string[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  OPTIMIZATION = 'OPTIMIZATION',
  OPTIMIZATION2 = 'OPTIMIZATION2',
  SETTINGS = 'SETTINGS',
  WEALTH_PLUS = 'WEALTH_PLUS',
}
