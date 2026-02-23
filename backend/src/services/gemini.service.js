import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export const generateWealthStrategy = async (profile) => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing from backend environment variables.");
  }

  const { targetAmount, duration, isShort, risk } = profile;
  const months = isShort ? duration : duration * 12;

  const prompt = `You are the Wealth+ Engine, an AI-powered allocation system.
The user wants to accumulate RM${targetAmount} in ${months} months.
Timeline category: ${isShort ? 'SHORT-TERM' : 'LONG-TERM'}
Their risk appetite is: ${risk.toUpperCase()}

You must return a STRICT JSON object representing the strategy.
DO NOT use markdown formatting (\`\`\`json). Return raw JSON only.

Use the following Reference Matrix to determine the best strategy based on Timeline and Risk:

🟢 SHORT-TERM — LOW RISK
Objective: Capital preservation + high liquidity
Typical Allocation: 70–85% savings, 15–30% safe investments (Fixed-Price ASNB)
Savings Options: GXBank, TNG GO+, AEON Bank, Boost Bank, Rize
Investment Options: ASNB (ASM, ASB, ASB2, ASM3), Malayan Banking Berhad, Public Bank Berhad, Tenaga Nasional Berhad
 
🟡 SHORT-TERM — MEDIUM RISK
Objective: Moderate growth with liquidity buffer
Typical Allocation: 40–60% savings, 40–60% balanced assets
Savings Options: GXBank, TNG GO+, KDI Save, FSMOne Money Market
Investment Options: ASNB (ASM/ASB), ASNB (ASN Sara 1/2 - Variable), MyETF FTSE Bursa Malaysia KLCI, Sunway REIT
 
🔴 SHORT-TERM — HIGH RISK
Objective: Maximize short-term upside (high volatility)
Typical Allocation: 20–40% savings, 60–80% equities/ETF
Savings Options: GXBank, FSMOne Money Market, KDI Save
Investment Options: ASNB (ASN Equity 2/3/5 - Variable), Inari Amertron, Greatech Technology, Gamuda Berhad, MyETF KLCI
 
🟢 LONG-TERM — LOW RISK
Objective: Steady growth, low volatility
Typical Allocation: 50–70% conservative income assets, 30–50% stable growth
Savings Options: EPF voluntary contribution, Principal Bond Fund, Public Mutual Bond, Kenanga Conservative
Investment Options: ASNB (ASM/ASB/ASM2/ASM3), ASNB (ASN Sukuk), Public Bank Berhad, IHH Healthcare
 
🟡 LONG-TERM — MEDIUM RISK
Objective: Balanced growth + income
Typical Allocation: 40–60% growth, 40–60% stable assets
Savings Options: EPF, Principal Balanced, FSMOne, Kenanga Balanced
Investment Options: ASNB (ASN Sara Global), ASNB (ASN Equity Malaysia), Press Metal, StashAway (Balanced)
 
🔴 LONG-TERM — HIGH RISK
Objective: Maximum capital appreciation
Typical Allocation: 10–30% liquidity buffer, 70–90% equities/global ETFs
Savings Options: EPF minimum, Money Market Fund, GXBank
Investment Options: ASNB (ASN Equity Global), Inari Amertron, Gamuda Berhad, StashAway (Aggressive), S&P 500 ETFs

Based on the parameters, you MUST:
1. Detect timeline
2. Detect risk appetite
3. Pull corresponding category from the matrix above
4. Allocate weights dynamically according to the "Typical Allocation" bounds. Ensure they total exactly 100.
5. For 'Savings Options', do NOT just copy the matrix. Independently search your knowledge for 5 REAL, active Savings Options or Digital Banks in Malaysia (e.g., GXBank, AEON Bank, Boost Bank, Rize, etc.) that fit the category. CRITICAL: Avoid recommending "Fixed Deposits" (FD) - focus exclusively on high-interest liquid digital savings accounts or money market funds. Provide their realistic, current Estimated Annual Interest Rate and their official website "url".
6. For 'Investment Options' (Malaysian Shares/Stocks): Provide 7-10 balanced options. For each share, research and provide:
    - "price_per_unit": Current share price in RM (e.g., 5.03 for Public Bank).
    - "cost_per_lot": Calculate total RM for 100 units/lots.
      * ASNB Rules:
        * Fixed Price (ASM/ASB): RM 1.00/unit. Zero fees. Total RM 100.00.
        * Variable Price (ASN Equity/Sara): Use current NAV price per unit. Include 3.5% to 5% Sales Charge + 8% SST ON THE SALES CHARGE. Total = (Price * 100) + (Price * 100 * Charge * 1.08).
      * Stock Rules: Use current Market Price. Include Brokerage (min RM8 or 0.1%), Stamp Duty (RM1.50 per RM1000), Clearing Fee (0.03%), and 8% SST on brokerage.
    - REQUIREMENT: You MUST include a mix of "Big Cap" (e.g., Maybank, Tenaga) and "Mid/Small Cap" (e.g., MyEG, Capital A, Dialog). Ensure at least 4 options have a price_per_unit UNDER RM 3.00 to ensure the strategy is accessible for lower budgets.
    - "roe": Return on Equity (%).
    - "dividend_yield": Annual Dividend Yield (%).
    - "url": MANDATORY OFFICIAL DEEP-LINK.
      * For Bursa Stocks: Use \`https://www.bursamalaysia.com/trade/trading_resources/listing_directory/company-profile?stock_code=[CODE]\` where [CODE] is the 4-digit numeric code (e.g., 1295 for Public Bank).
      * For ASNB: Link directly to the specific fund's product page on asnb.com.my (e.g., the specific ASN Sara or ASM page), NOT just the homepage.
7. CRITICAL ACTIONABLE SUGGESTION: In 'analysis.strategy_summary', you MUST provide a concrete, step-by-step monthly action.
   Calculation: Determine the "Optimized Monthly Contribution" needed to reach the target RM within the timeline given the weighted returns.
   Example Suggestion Format: "To reach your RM5000 goal, save RM600 monthly in [Savings Option Name] and purchase 1 lot of [Stock Name] (est. cost RM400) every month. This combined RM1000 monthly effort is reduced from the linear RM1050 because of the expected 6% yield helping you reach the finish line faster."
   Ensure the math for "number of lots" is a whole number (e.g., if RM400 is allocated to growth and stock cost/lot is RM380, suggest 1 lot).

Required JSON Structure:
  {
    "allocation": {
      "savings_percent": number,
        "dividend_percent": number,
          "etf_percent": number,
            "growth_percent": number
    },
    "identified_instruments": [
      {
        "category": "Savings / Conservative",
        "examples": [
          { "name": "Option 1 Name", "estimated_rate": 3.50, "url": "https://example.com" },
          { "name": "Option 2 Name", "estimated_rate": 3.00, "url": "https://example.com" },
          { "name": "Option 3 Name", "estimated_rate": 4.10, "url": "https://example.com" },
          { "name": "Option 4 Name", "estimated_rate": 2.80, "url": "https://example.com" },
          { "name": "Option 5 Name", "estimated_rate": 3.20, "url": "https://example.com" }
        ]
      },
      {
        "category": "Investments / Growth",
        "examples": [
          {
            "name": "Stock Name",
            "price_per_unit": 5.20,
            "cost_per_lot": 525.00,
            "roe": 15.5,
            "dividend_yield": 4.2,
            "estimated_rate": 8.00,
            "url": "https://example.com"
          }
        ]
      }
    ],
      "return_assumptions": {
      "savings_range": [low, high],
        "dividend_range": [low, high],
          "etf_range": [low, high],
            "growth_range": [low, high]
    },
    "analysis": {
      "strategy_summary": "A 1-2 sentence overview referencing the strategy objective.",
        "risk_explanation": "Explanation of risk.",
          "liquidity_commentary": "Comment on liquidity.",
            "goal_feasibility": "Is the goal realistic?",
              "adjustment_suggestion": "Suggested tweaks if any. Also explicitly explain the split percentage here (e.g. This 40/60 split...)."
    },
    "disclaimer": "This allocation is a simulation for educational purposes and does not constitute financial advice. Examples of instruments commonly used for this strategy are illustrative only. Never guarantee returns."
  }
  `;

  if (!ai.models.generateContent) {
    throw new Error("SDK mismatch: generateContent not found on ai.models");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    tools: [{ googleSearch: {} }],
    contents: [{ role: "user", parts: [{ text: prompt + `\n\nCRITICAL: Today's date is ${new Date().toLocaleDateString()}. You MUST search for the absolute latest live market prices for Bursa Malaysia stocks and current ASNB NAVs before responding.` }] }],
  });

  try {
    let text = response.text || "";
    // Pre-process text to remove markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Gemini output:", err);
    throw new Error("Gemini returned invalid output format.");
  }
};

export const generateTravelOptimization = async (commuteData) => {
  try {
    const {
      start_location,
      destination,
      method,
      trips_per_week,
      cost_per_trip,
      weekly_cost,
      monthly_cost,
      yearly_cost,
      avg_travel_time_total
    } = commuteData || {};
    if (!ai) {
      throw new Error("GEMINI_API_KEY is missing from backend environment variables.");
    }

    const prompt = `You are a cost optimization and urban mobility expert.

A user has the following commute:

Start: ${start_location}
Destination: ${destination}
Current Method: ${method}
Trips per week: ${trips_per_week}
Average cost per trip: ${cost_per_trip}
Weekly cost: ${weekly_cost}
Monthly cost: ${monthly_cost}
Yearly cost: ${yearly_cost}
Average travel time (total daily): ${avg_travel_time_total}

Your task:
1. Suggest alternative travel methods that reduce cost.
2. Suggest route adjustments if possible.
3. Estimate potential weekly, monthly and yearly savings.
4. Consider trade-offs between cost and time.

Provide 3 optimized scenarios:
- Cheapest possible option
- Balanced cost/time option
- Time-saving option

DO NOT use markdown formatting (\`\`\`json). Return raw STRICT JSON only.

Required JSON structure:
{
  "cheapest_option": {
    "method": "string",
    "estimated_cost_per_trip": number,
    "weekly_cost": number,
    "monthly_cost": number,
    "yearly_cost": number,
    "estimated_time": "string (e.g. 45 mins)",
    "reasoning": "string"
  },
  "balanced_option": {
    "method": "string",
    "estimated_cost_per_trip": number,
    "weekly_cost": number,
    "monthly_cost": number,
    "yearly_cost": number,
    "estimated_time": "string",
    "reasoning": "string"
  },
  "fastest_option": {
    "method": "string",
    "estimated_cost_per_trip": number,
    "weekly_cost": number,
    "monthly_cost": number,
    "yearly_cost": number,
    "estimated_time": "string",
    "reasoning": "string"
  },
  "estimated_monthly_savings": number,
  "estimated_yearly_savings": number
}

Be realistic and practical.`;

    if (!ai.models.generateContent) {
      throw new Error("SDK mismatch: generateContent not found on ai.models");
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini Travel Optimization Error (triggering fallback):", err.message);

    const fallback = {
      "cheapest_option": {
        "method": "Public Transport (LRT/Bus Combo)",
        "estimated_cost_per_trip": 3.50,
        "weekly_cost": 35.00,
        "monthly_cost": 151.55,
        "yearly_cost": 1820.00,
        "estimated_time": "55 mins",
        "reasoning": `Switching to public transport for ${commuteData?.destination || 'your destination'} eliminates parking and petrol costs. While it takes longer, it provides the maximum possible savings for this route.`
      },
      "balanced_option": {
        "method": "Carpooling with Colleagues",
        "estimated_cost_per_trip": 6.00,
        "weekly_cost": 60.00,
        "monthly_cost": 259.80,
        "yearly_cost": 3120.00,
        "estimated_time": "35 mins",
        "reasoning": "Splitting petrol and toll costs with 2 other people reduces your individual burden significantly while maintaining the comfort of car travel."
      },
      "fastest_option": {
        "method": "Motorbike / Scooter",
        "estimated_cost_per_trip": 2.50,
        "weekly_cost": 25.00,
        "monthly_cost": 108.25,
        "yearly_cost": 1300.00,
        "estimated_time": "25 mins",
        "reasoning": "A motorbike allows you to bypass peak hour traffic gridlock. It is both cheaper in fuel and significantly faster than a car during rush hour."
      },
      "estimated_monthly_savings": (commuteData?.monthly_cost || 0) - 151.55,
      "estimated_yearly_savings": (commuteData?.yearly_cost || 0) - 1820.00
    };
    console.log("Returning fallback data:", JSON.stringify(fallback, null, 2));
    return fallback;
  }
};

export const generateEVComparison = async (vehicleData) => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing from backend environment variables.");
  }

  const {
    monthly_distance_km,
    current_fuel_cost_per_litre,
    current_fuel_consumption_per_100km,
    current_monthly_petrol_cost,
    current_monthly_maintenance,
    current_monthly_roadtax,
    current_monthly_insurance,
    current_car_model,
    commute_routes
  } = vehicleData || {};

  const prompt = `You are an automotive finance expert specializing in Malaysian EV vs ICE (petrol) vehicle cost analysis.

User's current petrol vehicle profile:
- Car model (if provided): ${current_car_model || 'Generic petrol car'}
- Monthly driving distance: ${monthly_distance_km || 1500} km
- Fuel price: RM${current_fuel_cost_per_litre || 2.05}/litre (RON95)
- Fuel consumption: ${current_fuel_consumption_per_100km || 10} L/100km
- Current monthly petrol cost: RM${current_monthly_petrol_cost || 300}
- Current monthly maintenance: RM${current_monthly_maintenance || 100}
- Current monthly road tax: RM${current_monthly_roadtax || 50}
- Current monthly insurance: RM${current_monthly_insurance || 200}
${commute_routes ? `- Common routes: ${JSON.stringify(commute_routes)}` : ''}

Your task:
1. Calculate the user's TRUE monthly cost of owning their current petrol car.
2. Compare with 3 EV options available in Malaysia (budget, mid-range, premium).
3. Consider Malaysia-specific EV incentives:
   - Road tax exemption for EVs until 2027
   - Import/excise duty exemption
   - EV charging costs in Malaysia (DC fast charge ~RM1.20/kWh, home charge ~RM0.57/kWh)
4. Calculate break-even point (when EV savings offset the price difference).
5. Provide realistic monthly installment estimates for each EV.

DO NOT use markdown formatting. Return raw STRICT JSON only.

Required JSON structure:
{
  "current_petrol_analysis": {
    "car_model": "string",
    "monthly_fuel": number,
    "monthly_maintenance": number,
    "monthly_roadtax": number,
    "monthly_insurance": number,
    "monthly_total": number,
    "yearly_total": number,
    "five_year_total": number,
    "co2_monthly_kg": number
  },
  "ev_options": [
    {
      "model": "string (real Malaysian market EV)",
      "category": "budget | mid-range | premium",
      "price_rm": number,
      "monthly_installment": number,
      "battery_kwh": number,
      "range_km": number,
      "efficiency_kwh_per_100km": number,
      "monthly_charging_cost": number,
      "monthly_maintenance": number,
      "monthly_roadtax": 0,
      "monthly_insurance": number,
      "monthly_total_with_installment": number,
      "monthly_total_running_only": number,
      "yearly_total_running_only": number,
      "five_year_total_running_only": number,
      "monthly_savings_vs_petrol": number,
      "yearly_savings_vs_petrol": number,
      "break_even_months": number,
      "co2_monthly_kg": number,
      "key_features": ["string"]
    }
  ],
  "summary": {
    "best_value_pick": "string (model name)",
    "highest_savings_pick": "string (model name)",
    "recommendation": "string (1-2 sentences)",
    "environmental_impact": "string (CO2 reduction summary)",
    "malaysia_incentives": ["string (list of current incentives)"]
  }
}

Be realistic with Malaysian market prices and electricity costs. Use actual EV models sold in Malaysia (e.g., BYD Atto 3, BYD Dolphin, Tesla Model 3, Neta V, Smart #1, Chery Omoda E5, etc).`;

  try {
    if (!ai.models.generateContent) {
      throw new Error("SDK mismatch: generateContent not found on ai.models");
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini EV Comparison Error:", err.message);
    // Return a sensible fallback
    const monthlyPetrol = current_monthly_petrol_cost || 300;
    return {
      current_petrol_analysis: {
        car_model: current_car_model || "Proton Saga",
        monthly_fuel: monthlyPetrol,
        monthly_maintenance: current_monthly_maintenance || 100,
        monthly_roadtax: current_monthly_roadtax || 50,
        monthly_insurance: current_monthly_insurance || 200,
        monthly_total: monthlyPetrol + 350,
        yearly_total: (monthlyPetrol + 350) * 12,
        five_year_total: (monthlyPetrol + 350) * 60,
        co2_monthly_kg: (monthly_distance_km || 1500) * 0.12
      },
      ev_options: [
        {
          model: "BYD Dolphin Standard Range",
          category: "budget",
          price_rm: 99800,
          monthly_installment: 1100,
          battery_kwh: 44.9,
          range_km: 340,
          efficiency_kwh_per_100km: 13.2,
          monthly_charging_cost: Math.round((monthly_distance_km || 1500) * 0.132 * 0.57),
          monthly_maintenance: 40,
          monthly_roadtax: 0,
          monthly_insurance: 180,
          monthly_total_with_installment: 1320 + Math.round((monthly_distance_km || 1500) * 0.132 * 0.57),
          monthly_total_running_only: 220 + Math.round((monthly_distance_km || 1500) * 0.132 * 0.57),
          yearly_total_running_only: (220 + Math.round((monthly_distance_km || 1500) * 0.132 * 0.57)) * 12,
          five_year_total_running_only: (220 + Math.round((monthly_distance_km || 1500) * 0.132 * 0.57)) * 60,
          monthly_savings_vs_petrol: monthlyPetrol + 350 - 220 - Math.round((monthly_distance_km || 1500) * 0.132 * 0.57),
          yearly_savings_vs_petrol: (monthlyPetrol + 350 - 220 - Math.round((monthly_distance_km || 1500) * 0.132 * 0.57)) * 12,
          break_even_months: 48,
          co2_monthly_kg: 0,
          key_features: ["Most affordable EV in Malaysia", "Good city range", "V2L capability"]
        }
      ],
      summary: {
        best_value_pick: "BYD Dolphin Standard Range",
        highest_savings_pick: "BYD Dolphin Standard Range",
        recommendation: "The BYD Dolphin offers significant fuel savings and zero road tax, making it the best value EV for Malaysian buyers.",
        environmental_impact: `Switching to EV could reduce your carbon footprint by approximately ${Math.round((monthly_distance_km || 1500) * 0.12)}kg CO2 per month.`,
        malaysia_incentives: [
          "Road tax exemption until 2027",
          "Full import duty exemption for CBU EVs until 2027",
          "Excise duty exemption until 2027",
          "EV charging infrastructure expansion under NETR"
        ]
      }
    };
  }
};

export const generateRelocationSuggestions = async (locationData) => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing from backend environment variables.");
  }

  const {
    current_location,
    work_location,
    preferred_areas,
    current_rent,
    monthly_income,
    transport_method,
    monthly_transport_cost
  } = locationData || {};

  const prompt = `You are a Malaysian housing and relocation cost-optimization expert.

A user is considering relocating to reduce their overall living costs. Analyze their situation:

Current Details:
- Current location: ${current_location || 'Not specified'}
- Work location: ${work_location || 'Not specified / Remote'}
- Preferred areas to explore: ${preferred_areas || 'No preference'}
- Current monthly rent: RM${current_rent || 'Not specified'}
- Monthly income: RM${monthly_income || 'Not specified'}
- Current transport method: ${transport_method || 'Car'}
- Current monthly transport cost: RM${monthly_transport_cost || 'Not specified'}

Your task:
1. Suggest 2-3 realistic relocation options in Malaysia based on their preferences and work location.
2. For each suggestion, focus on FINANCIAL benefits:
   - Expected rent range compared to current area
   - Transport cost impact (closer/further from work, public transport access)
   - Cost of living differences (groceries, utilities, etc.)
   - Accessibility to amenities (malls, hospitals, public transport)
3. Calculate estimated monthly savings for each option.
4. Provide point-form reasons why each location is better financially.
5. Include any downsides or trade-offs honestly.

Consider real Malaysian areas, realistic rental prices, and actual public transport coverage (LRT, MRT, KTM, bus routes).

DO NOT use markdown formatting. Return raw STRICT JSON only.

Required JSON structure:
{
  "current_analysis": {
    "location": "string",
    "estimated_monthly_rent": number,
    "estimated_transport_cost": number,
    "estimated_total_living_cost": number,
    "area_pros": ["string"],
    "area_cons": ["string"]
  },
  "relocation_options": [
    {
      "location": "string (specific area name, e.g. 'Setia Alam, Shah Alam')",
      "estimated_rent_range": "string (e.g. 'RM800 - RM1,200')",
      "estimated_avg_rent": number,
      "rent_savings_vs_current": number,
      "estimated_transport_cost": number,
      "transport_savings_vs_current": number,
      "estimated_total_monthly_savings": number,
      "estimated_yearly_savings": number,
      "commute_to_work": "string (e.g. '25 mins via LRT')",
      "public_transport_access": ["string (nearby stations/routes)"],
      "financial_benefits": ["string (point-form reasons why financially better)"],
      "trade_offs": ["string (honest downsides)"],
      "suitability_score": number (1-10, how well it matches their preferences)
    }
  ],
  "summary": {
    "best_overall_pick": "string (location name)",
    "highest_savings_pick": "string (location name)",
    "recommendation": "string (2-3 sentences with actionable advice)",
    "key_insight": "string (1 sentence financial insight)"
  }
}

Be realistic with Malaysian rental prices, transport costs, and area characteristics. Use actual area names and real public transport stations.`;

  try {
    if (!ai.models.generateContent) {
      throw new Error("SDK mismatch: generateContent not found on ai.models");
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini Relocation Error:", err.message);
    return {
      current_analysis: {
        location: current_location || "Current Location",
        estimated_monthly_rent: current_rent || 1500,
        estimated_transport_cost: monthly_transport_cost || 400,
        estimated_total_living_cost: (current_rent || 1500) + (monthly_transport_cost || 400) + 800,
        area_pros: ["Familiar surroundings", "Established routine"],
        area_cons: ["Higher rental costs", "Traffic congestion"]
      },
      relocation_options: [
        {
          location: "Setia Alam, Shah Alam",
          estimated_rent_range: "RM800 - RM1,200",
          estimated_avg_rent: 1000,
          rent_savings_vs_current: (current_rent || 1500) - 1000,
          estimated_transport_cost: 300,
          transport_savings_vs_current: (monthly_transport_cost || 400) - 300,
          estimated_total_monthly_savings: ((current_rent || 1500) - 1000) + ((monthly_transport_cost || 400) - 300),
          estimated_yearly_savings: (((current_rent || 1500) - 1000) + ((monthly_transport_cost || 400) - 300)) * 12,
          commute_to_work: "35 mins via NKVE/Federal Highway",
          public_transport_access: ["KTM Setia Jaya (nearby)", "Bus routes to Shah Alam"],
          financial_benefits: [
            "Rent 30-40% cheaper than KL city center",
            "Lower cost of living for groceries and dining",
            "Free parking in most residential areas",
            "Growing township with modern amenities"
          ],
          trade_offs: [
            "Longer commute to KL city center",
            "Limited MRT/LRT direct access",
            "Car dependency for most errands"
          ],
          suitability_score: 7
        },
        {
          location: "Kelana Jaya, Petaling Jaya",
          estimated_rent_range: "RM1,000 - RM1,500",
          estimated_avg_rent: 1200,
          rent_savings_vs_current: (current_rent || 1500) - 1200,
          estimated_transport_cost: 200,
          transport_savings_vs_current: (monthly_transport_cost || 400) - 200,
          estimated_total_monthly_savings: ((current_rent || 1500) - 1200) + ((monthly_transport_cost || 400) - 200),
          estimated_yearly_savings: (((current_rent || 1500) - 1200) + ((monthly_transport_cost || 400) - 200)) * 12,
          commute_to_work: "20 mins via LRT Kelana Jaya Line",
          public_transport_access: ["LRT Kelana Jaya station", "Multiple bus routes", "Near LDP highway"],
          financial_benefits: [
            "Excellent LRT connectivity reduces transport costs",
            "Moderate rent with good facilities",
            "Walking distance to Paradigm Mall and eateries",
            "Can potentially go car-free, saving RM500+/mo"
          ],
          trade_offs: [
            "Rent only slightly cheaper than current",
            "Can be congested during peak hours",
            "Parking charges at some condos"
          ],
          suitability_score: 8
        }
      ],
      summary: {
        best_overall_pick: "Kelana Jaya, Petaling Jaya",
        highest_savings_pick: "Setia Alam, Shah Alam",
        recommendation: "Kelana Jaya offers the best balance of affordability and connectivity. The LRT access could significantly reduce your transport costs and commute time.",
        key_insight: "Relocating strategically could save you RM300-600 per month by combining cheaper rent with better public transport access."
      }
    };
  }
};

export const generateLifestyleSuggestions = async (lifestyleData) => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing from backend environment variables.");
  }

  const {
    monthly_income, food_budget, subscriptions_budget, utilities_budget,
    cooking_habit, dining_frequency, subscription_list, shopping_habit,
    entertainment_habit, occupation, household_size, state
  } = lifestyleData || {};

  const prompt = `You are a Malaysian personal finance lifestyle coach. Analyze the user's lifestyle habits and provide actionable money-saving suggestions.

User Profile:
- Monthly income: RM${monthly_income || 'Not specified'}
- State: ${state || 'Not specified'}
- Occupation: ${occupation || 'Not specified'}
- Household size: ${household_size || 1}

Current Spending:
- Monthly food budget: RM${food_budget || 'Not specified'}
- Monthly subscriptions: RM${subscriptions_budget || 'Not specified'}
- Monthly utilities: RM${utilities_budget || 'Not specified'}

Lifestyle Habits:
- Cooking habit: ${cooking_habit || 'Not specified'}
- Dining out frequency: ${dining_frequency || 'Not specified'}
- Active subscriptions: ${subscription_list || 'Not specified'}
- Shopping habits: ${shopping_habit || 'Not specified'}
- Entertainment: ${entertainment_habit || 'Not specified'}

Provide 3-5 specific, actionable lifestyle changes that can save the most money. For each suggestion:
1. Title (short, catchy)
2. Description (2-3 sentences explaining the change)
3. Estimated monthly savings in RM
4. Difficulty level (easy/medium/hard)
5. Category (food, subscriptions, utilities, shopping, entertainment, general)
6. Quick tip (one practical sentence)

Be specific to Malaysian context (mention local alternatives, Malaysian prices, apps like Shopee, Grab, etc).

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string",
      "estimated_monthly_savings": number,
      "difficulty": "easy" | "medium" | "hard",
      "category": "string",
      "quick_tip": "string"
    }
  ],
  "summary": {
    "total_potential_savings": number,
    "top_priority": "string",
    "insight": "string"
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7 }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini lifestyle error:", error);
    const fb = food_budget || 800;
    const sb = subscriptions_budget || 100;
    return {
      suggestions: [
        { title: "Meal Prep Sundays", description: `Cooking at home 5 days a week instead of eating out can save significantly. With RM${fb}/month on food, batch cooking saves up to 40%. Use HappyFresh or Tesco Online for cheaper bulk groceries.`, estimated_monthly_savings: Math.round(fb * 0.3), difficulty: "medium", category: "food", quick_tip: "Start with 3 home-cooked dinners per week using a rice cooker." },
        { title: "Subscription Audit", description: "Review all recurring subscriptions. Many Malaysians unknowingly pay for unused services. Check for duplicates and switch to family plans.", estimated_monthly_savings: Math.round(sb * 0.4), difficulty: "easy", category: "subscriptions", quick_tip: "Set a quarterly reminder to review all active subscriptions." },
        { title: "Smart Utility Management", description: "Switch to LED bulbs, use timer switches for water heaters, and set AC to 25 degrees C. TNB MyTNB app helps track electricity usage.", estimated_monthly_savings: 50, difficulty: "easy", category: "utilities", quick_tip: "A 1 degree C increase in AC temperature saves roughly 6% on electricity." },
        { title: "Cashback Stacking", description: "Use Shopee/Lazada coins, credit card cashback, and GrabPay rewards. Stack with bank promos during 11.11 and PayDay sales.", estimated_monthly_savings: 80, difficulty: "easy", category: "shopping", quick_tip: "Use BigPay card for fee-free payments and 1% cashback." },
        { title: "Free Entertainment", description: "Explore free activities: hiking at FRIM, free museum days, public parks. Replace paid gym with outdoor jogging or YouTube workouts.", estimated_monthly_savings: 100, difficulty: "easy", category: "entertainment", quick_tip: "Replace weekend mall trips with outdoor activities at KL free parks." }
      ],
      summary: { total_potential_savings: Math.round(fb * 0.3) + Math.round(sb * 0.4) + 230, top_priority: "Meal Prep Sundays", insight: "The biggest lifestyle savings come from food habits. Even cooking 3 days a week saves hundreds monthly." }
    };
  }
};
