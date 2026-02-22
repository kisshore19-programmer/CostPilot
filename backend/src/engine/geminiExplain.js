import dotenv from "dotenv";
import { fallbackExplain } from "./explainFallback.js";

dotenv.config();

// Schemas for strict validation
const SCHEMAS = {
  dashboard: {
    required: ["headline", "top_drivers", "next_moves", "warnings"],
    types: {
      headline: "string",
      top_drivers: "array",
      next_moves: "array",
      warnings: "array"
    }
  },
  recommendation: {
    required: ["context", "outcome_headline", "outcome_bullets", "tradeoff"],
    types: {
      context: "string",
      outcome_headline: "string",
      outcome_bullets: "array",
      tradeoff: "string"
    }
  },
  subsidy: {
    required: ["eligible", "not_eligible", "missing_fields"],
    types: {
      eligible: "array",
      not_eligible: "array",
      missing_fields: "array"
    }
  }
};

const PROMPTS = {
  dashboard: (facts) => `
Type: Dashboard Insight
Context: User overview.
Facts: ${JSON.stringify(facts)}

Output JSON:
{
  "headline": "Short, punchy summary of financial health (e.g., 'Stable but Low Buffer').",
  "top_drivers": [{ "name": "Category", "value": "Amount or %", "why": "Brief reason" }],
  "next_moves": [{ "title": "Action", "impact_rm": 0, "difficulty": "Easy/Med/Hard", "steps": ["Step 1", "Step 2"] }],
  "warnings": ["Specific risk 1", "Specific risk 2"]
}
`,
  recommendation: (facts) => `
Type: Recommendation Specific
Context: Deep dive into a specific optimization for a user with these profile details: ${JSON.stringify(facts.profile || {})} and location context: ${JSON.stringify(facts.location || {})}.
The optimization is: ${facts.title}
The reason is: ${facts.reason}
Financial Impact: ${JSON.stringify(facts.delta || {})}

Output JSON with specific structure for a rich UI card:
{
  "context": "A **very brief** (max 2 sentences) personalized explanation. sentence 1: State the benefit clearly. sentence 2: Provide **specific, named Malaysian examples** (e.g. 'Use *NSK Trade City* or *Pasar Borong*'). Use *single asterisks* for bolding key terms (e.g. *RM 450*, *Karak*). Do NOT use double asterisks (**).",
  "highlight_box": { 
    "title": "KEY INSIGHT", 
    "tags": ["Rent Optimization", "Savings Potential"], 
    "description": "A punchy, actionable 1-sentence insight. e.g. 'By moving to [Specific Area], you save...'" 
  }, 
  "outcome_headline": "Estimated *RM ${facts.delta?.monthlyBalance || '...'}* increase in monthly cash flow",
  "outcome_bullets": ["Increased monthly cash buffer by RM ${facts.delta?.monthlyBalance || '...'}", "Reduced financial stress score", "Enhanced financial resilience"],
  "tradeoff": "The downside, like 'Tradeoff: Increased travel time by 20 mins.'"
}
IMPORTANT: 
- **EXTREME BREVITY.** Max 2 sentences total in 'context'.
- **SPECIFIC EXAMPLES.** Name actual places/brands.
- **FORMATTING:** Use *single asterisks* for bolding (e.g. *Word*). Do NOT use double (**).
`,
  subsidy: (facts) => `
Type: Subsidy Analysis
Context: Explain eligibility for government aid.
Facts: ${JSON.stringify(facts)}

Output JSON:
{
  "eligible": [{ "name": "Program Name", "benefit": "RM Value", "why_eligible": "matches income X and profile Y" }],
  "not_eligible": [{ "name": "Program Name", "reason": "income too high", "fix": "check household members?" }],
  "missing_fields": ["details needed to check other programs"]
}
`
};

export async function explainWithGemini(type, facts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key missing, using fallback.");
    return fallbackExplain(type, facts);
  } // Map 'optimize' to 'recommendation'
  const promptKey = type === 'optimize' ? 'recommendation' : type;

  if (!PROMPTS[promptKey]) {
    console.error(`Unknown explain type: ${type}`);
    return fallbackExplain(type, facts);
  }

  const promptText = `
You are a financial assistant for Malaysia cost-of-living planning.
Your goal is to provide actionable, personalized, and location-aware insights.
Do NOT invent numbers. Use only the provided facts.
Do NOT provide financial advice (investment products).
Use "RM" for currency.

${PROMPTS[promptKey](facts)}

Return ONLY valid JSON.
`.trim();

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn("Gemini Rate Limit Exceeded (429). Using fallback.");
      } else {
        console.error("Gemini API Error:", resp.status, resp.statusText);
      }
      return fallbackExplain(type, facts);
    }

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const parsed = parseAndValidate(text, promptKey); // Use mapped key for schema check
    if (!parsed) return fallbackExplain(type, facts);

    return parsed;
  } catch (e) {
    console.error("Gemini call failed", e);
    return fallbackExplain(type, facts);
  }
}

function parseAndValidate(text, type) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;

    const json = JSON.parse(text.slice(start, end + 1));
    const schemaKey = type === 'optimize' ? 'recommendation' : type;
    const schema = SCHEMAS[schemaKey];

    if (!schema) return json; // No strict schema for this type?

    // Basic Type Check
    for (const key of schema.required) {
      if (!(key in json)) return null;
    }

    return json;
  } catch (e) {
    return null;
  }
}
