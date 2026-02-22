import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
// #region agent log
fetch('http://127.0.0.1:7851/ingest/b113cee4-9fd7-4c43-84f5-997eb73d90d2', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9cfd23' }, body: JSON.stringify({ sessionId: '9cfd23', location: 'api.ts:3', message: 'API_URL configured', data: { apiUrl: API_URL, envVar: import.meta.env.VITE_API_BASE }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion

export interface MonthlyInputs {
    incomeMonthly: number;
    rentMonthly: number;
    utilitiesMonthly: number;
    transportMonthly: number;
    foodMonthly: number;
    debtMonthly: number;
    subscriptionsMonthly: number;
    savingsBalance: number;
}

export interface StressResult {
    stressScore: number;
    riskLevel: 'Low' | 'Moderate' | 'High';
    expenseRatio: number;
    bufferMonths: number;
    debtRatio: number;
    pressureSources: string[];
}

export interface ScenarioResult {
    base: StressResult;
    after: StressResult;
    delta: {
        stressScore: number;
        monthlyBalance: number;
        survivalMonths: number;
    };
}

export interface ExplainRequest {
    type: 'stress' | 'scenario' | 'optimize';
    facts: any;
}

export interface ExplainResponse {
    headline: string;
    reason: string;
    tradeoff: string;
    confidence: number;
    // New fields for extended recommendation (V2 Design)
    context?: string;
    highlight_box?: {
        title: string;
        tags: string[];
        description: string;
    };
    outcome_headline?: string;
    outcome_bullets?: string[];

    // Legacy/Other
    impact?: string;
    ask_next?: string;
    outcome?: string; // Older string version
    top_drivers?: any[];
    next_moves?: any[];
    eligible?: any[];
    not_eligible?: any[];
    missing_fields?: string[];
}

export interface OptimizationRecommendation {
    type: 'housing' | 'transport' | 'lifestyle' | 'debt';
    title: string;
    changes: Partial<MonthlyInputs>;
    simulationResult: ScenarioResult;
    potentialSavings: number;
    reason: string;
}

export interface OptimizeResult {
    base: StressResult;
    recommendations: OptimizationRecommendation[];
    totalSavings: number;
}

export interface SubsidyMatch {
    programId: string;
    name: string;
    eligible: boolean;
    matchConfidence: number;
    benefitText?: string;
    reasons?: string[];
    missingFields?: string[];
    link?: string;
    locationContext?: {
        city: string;
        state: string;
        nearbyTransit?: any[];
    };
}

// Assuming UserProfile is defined elsewhere or will be added. For now, using 'any' as a placeholder if not provided.
export type UserProfile = any;

export const api = {
    // Removed getSummary

    async simulateScenario(base: MonthlyInputs, changes: Partial<MonthlyInputs>): Promise<ScenarioResult> {
        const res = await fetch(`${API_URL}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base, changes })
        });
        if (!res.ok) throw new Error("Failed to simulate scenario");
        return res.json();
    },

    // Updated to support new insight types
    async getExplanation(type: 'stress' | 'scenario' | 'optimize' | 'dashboard' | 'subsidy', facts: any): Promise<ExplainResponse> {
        // For dashboard/subsidy, we might not strictly need 'stress' compatible response,
        // but our ExplainResponse type is generic enough?
        // Let's check ExplainResponse definition. If it's strict, we might need a Union return type.
        // For now, assuming backend returns JSON that fits or we cast.
        const res = await fetch(`${API_URL}/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, facts })
        });
        if (!res.ok) throw new Error("Failed to get explanation");
        return res.json();
    },

    optimizeProfile: async (inputs: MonthlyInputs) => {
        const response = await axios.post<OptimizeResult>(`${API_URL}/optimize`, inputs);
        return response.data;
    },

    matchSubsidies: async (profile: any) => {
        const response = await axios.post<{ matches: SubsidyMatch[]; notEligible: SubsidyMatch[] }>(`${API_URL}/subsidies/match`, profile);
        return response.data;
    },

    getAnalysis: async (inputs: any) => {
        // #region agent log
        console.log('[DEBUG] getAnalysis called', { apiUrl: `${API_URL}/analysis`, hasInputs: !!inputs });
        fetch('http://127.0.0.1:7851/ingest/b113cee4-9fd7-4c43-84f5-997eb73d90d2', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9cfd23' }, body: JSON.stringify({ sessionId: '9cfd23', location: 'api.ts:138', message: 'getAnalysis called', data: { apiUrl: `${API_URL}/analysis`, hasInputs: !!inputs }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A,B,C' }) }).catch(() => { });
        // #endregion
        try {
            const response = await axios.post<AnalysisResult>(`${API_URL}/analysis`, inputs);
            // #region agent log
            console.log('[DEBUG] getAnalysis success', { status: response.status, hasData: !!response.data });
            fetch('http://127.0.0.1:7851/ingest/b113cee4-9fd7-4c43-84f5-997eb73d90d2', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9cfd23' }, body: JSON.stringify({ sessionId: '9cfd23', location: 'api.ts:141', message: 'getAnalysis success', data: { status: response.status, hasData: !!response.data }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A,B,C,D' }) }).catch(() => { });
            // #endregion
            return response.data;
        } catch (error: any) {
            // #region agent log
            console.error('[DEBUG] getAnalysis error', { errorCode: error.code, errorMessage: error.message, hasResponse: !!error.response, responseStatus: error.response?.status, hasRequest: !!error.request, errorType: error.constructor.name });
            fetch('http://127.0.0.1:7851/ingest/b113cee4-9fd7-4c43-84f5-997eb73d90d2', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9cfd23' }, body: JSON.stringify({ sessionId: '9cfd23', location: 'api.ts:144', message: 'getAnalysis error caught', data: { errorCode: error.code, errorMessage: error.message, hasResponse: !!error.response, responseStatus: error.response?.status, hasRequest: !!error.request, errorType: error.constructor.name }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A,B,C,D,E' }) }).catch(() => { });
            // #endregion
            // Enhance error messages for better debugging
            if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
                throw new Error(`Cannot connect to backend server at ${API_URL}. Make sure the backend is running with 'npm run dev:backend' or 'npm run dev'.`);
            }
            if (error.response) {
                // Server responded with error status
                throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
            }
            if (error.request) {
                // Request made but no response received
                throw new Error(`No response from server at ${API_URL}. Check if the backend is running.`);
            }
            // Something else happened
            throw error;
        }
    },

    generateWealthStrategy: async (params: {
        targetAmount: number;
        duration: number;
        risk: 'conservative' | 'moderate' | 'aggressive';
        isShort: boolean;
    }) => {
        try {
            const response = await axios.post(`${API_URL}/wealth/strategy`, params);
            return response.data;
        } catch (error: any) {
            console.error('Wealth strategy generation error:', error);
            throw new Error(error.response?.data?.error || 'Failed to generate wealth strategy.');
        }
    },

    optimizeTravel: async (commuteData: any) => {
        try {
            const response = await axios.post(`${API_URL}/optimize/travel`, commuteData);
            return response.data;
        } catch (error: any) {
            console.error('Travel optimization error:', error);
            throw new Error(error.response?.data?.error || 'Failed to generate travel optimization.');
        }
    },

    compareEV: async (vehicleData: any) => {
        try {
            const response = await axios.post(`${API_URL}/optimize/ev-comparison`, vehicleData);
            return response.data;
        } catch (error: any) {
            console.error('EV comparison error:', error);
            throw new Error(error.response?.data?.error || 'Failed to generate EV comparison.');
        }
    },

    suggestRelocation: async (locationData: any) => {
        try {
            const response = await axios.post(`${API_URL}/optimize/relocation`, locationData);
            return response.data;
        } catch (error: any) {
            console.error('Relocation suggestion error:', error);
            throw new Error(error.response?.data?.error || 'Failed to generate relocation suggestions.');
        }
    },

    suggestLifestyle: async (lifestyleData: any) => {
        try {
            const response = await axios.post(`${API_URL}/optimize/lifestyle`, lifestyleData);
            return response.data;
        } catch (error: any) {
            console.error('Lifestyle suggestion error:', error);
            throw new Error(error.response?.data?.error || 'Failed to generate lifestyle suggestions.');
        }
    }
};

export interface AnalysisResult {
    financials: {
        stress: StressResult;
        signals: any;
        derived: {
            monthlyBalance: number;
            survivalMonths: number;
        };
    };
    subsidies: {
        matches: SubsidyMatch[];
        notEligible: SubsidyMatch[];
    };
    optimization: {
        base: { stress: StressResult; signals: any };
        recommendations: OptimizationRecommendation[];
        totalSavings: number;
    };
    locationContext?: {
        city: string;
        state: string;
        nearbyTransit?: any[];
    };
}
