import axios from 'axios';
import Papa from 'papaparse';

let subsidiesCache = [
    {
        programId: "STR",
        name: "Sumbangan Tunai Rahmah (STR)",
        benefitText: "Up to RM 3,700/year for households",
        monthlyBenefit: 308,
        incomeMaxMonthly: 5000,
        householdMin: 0,
        link: "https://bantuantunai.hasil.gov.my/",
        category: "Cash Aid",
        requiredFields: ["income", "householdSize", "state"],
        stateRestriction: null
    },
    {
        programId: "SARA",
        name: "Sumbangan Asas Rahmah (SARA)",
        benefitText: "RM 100/month for groceries via eWallet",
        monthlyBenefit: 100,
        incomeMaxMonthly: 2500,
        link: "https://budget.mof.gov.my/manfaat/",
        category: "Groceries",
        requiredFields: ["income"],
        stateRestriction: null
    },
    {
        programId: "MySalam",
        name: "mySalam Takaful Protection",
        benefitText: "Free health protection & RM8k payout if hospitalized",
        monthlyBenefit: 0,
        incomeMaxMonthly: 8000,
        ageMin: 18,
        ageMax: 65,
        category: "Health",
        link: "https://www.mysalam.com.my/",
        requiredFields: ["income", "age"],
        stateRestriction: null
    },
    {
        programId: "PTPTN-Discount",
        name: "PTPTN Repayment Discount",
        benefitText: "10-15% discount on loan repayment",
        monthlyBenefit: 0,
        link: "https://www.ptptn.gov.my/",
        category: "Education",
        requiresStudent: false,
        requiredFields: [],
        stateRestriction: null
    },
    {
        programId: "eBelia",
        name: "e-Tunai Belia Rahmah",
        benefitText: "RM 200 one-off e-wallet credit for youth",
        monthlyBenefit: 0,
        ageMin: 18,
        ageMax: 20,
        requiresStudent: true,
        link: "https://budget.mof.gov.my/manfaat/",
        category: "Youth",
        requiredFields: ["age", "employmentStatus"],
        stateRestriction: null
    },
    {
        programId: "IPR",
        name: "Skim Perumahan Rakyat (IPR / PPR)",
        benefitText: "Affordable housing from RM124k - RM300k",
        monthlyBenefit: 200,
        incomeMaxMonthly: 5000,
        link: "https://ehome.kpkt.gov.my/",
        category: "Housing",
        requiredFields: ["income", "state"],
        stateRestriction: null
    },
    {
        programId: "PeKa-B40",
        name: "PeKa B40 Health Screening",
        benefitText: "Free health screening + RM500 treatment support",
        monthlyBenefit: 0,
        incomeMaxMonthly: 3166,
        ageMin: 18,
        link: "https://www.pekab40.com.my/",
        category: "Health",
        requiredFields: ["income", "age"],
        stateRestriction: null
    },
    {
        programId: "SSPN",
        name: "SSPN-i Savings (Tax Relief)",
        benefitText: "Tax relief up to RM8,000/year on education savings",
        monthlyBenefit: 50,
        link: "https://www.ptptn.gov.my/sspn-i",
        category: "Education",
        requiredFields: [],
        stateRestriction: null
    },
    {
        programId: "EV-RoadTax",
        name: "EV Road Tax Exemption",
        benefitText: "100% road tax exemption for EVs until 2027",
        monthlyBenefit: 50,
        link: "https://www.jpj.gov.my/",
        category: "Transport",
        requiredFields: [],
        stateRestriction: null
    },
    {
        programId: "MyDeposit",
        name: "MyDeposit Home Ownership Scheme",
        benefitText: "Up to RM30,000 deposit assistance for first home",
        monthlyBenefit: 0,
        incomeMaxMonthly: 5000,
        link: "https://ehome.kpkt.gov.my/",
        category: "Housing",
        requiredFields: ["income", "state"],
        stateRestriction: null
    },
    {
        programId: "SOCSO-SIP",
        name: "SOCSO Self-Employment (SIP)",
        benefitText: "Social security coverage for self-employed / gig workers",
        monthlyBenefit: 0,
        link: "https://www.perkeso.gov.my/",
        category: "Employment",
        requiredFields: ["employmentStatus"],
        employmentRestriction: "self-employed",
        stateRestriction: null
    }
];


export async function refreshSubsidies() {
    if (!process.env.GOOGLE_SHEET_CSV_URL) {
        console.log("No GOOGLE_SHEET_CSV_URL provided, using defaults.");
        return;
    }
    try {
        console.log("Fetching subsidies from Sheet...");
        const response = await axios.get(process.env.GOOGLE_SHEET_CSV_URL);

        Papa.parse(response.data, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed = results.data.map(row => ({
                    programId: row.programId?.trim(),
                    name: row.name?.trim(),
                    benefitText: row.benefitText?.trim(),
                    incomeMaxMonthly: row.incomeMaxMonthly ? Number(row.incomeMaxMonthly) : undefined,
                    ageMin: row.ageMin ? Number(row.ageMin) : undefined,
                    ageMax: row.ageMax ? Number(row.ageMax) : undefined,
                    category: row.category?.trim(),
                    link: row.link?.trim(),
                    requiresStudent: row.requiresStudent?.toLowerCase() === 'true',
                    householdMin: row.householdMin ? Number(row.householdMin) : undefined
                })).filter(p => p.programId && p.name);

                if (parsed.length > 0) {
                    subsidiesCache = parsed;
                    console.log(`Updated subsidies cache with ${parsed.length} programs.`);
                }
            },
            error: (err) => {
                console.error("CSV Parse Error:", err.message);
            }
        });
    } catch (error) {
        console.error("Failed to fetch subsidies sheet:", error.message);
    }
}

// Refresh on load (async, doesn't block startup)
refreshSubsidies();
const REFRESH_INTERVAL = 1000 * 60 * 60; // 1 hour
setInterval(refreshSubsidies, REFRESH_INTERVAL);

export const subsidies = subsidiesCache;

export function matchSubsidies(profile) {
    const matches = [];
    const notEligible = [];

    const income = profile.incomeMonthly || profile.income || 0;
    const age = profile.age || 0;
    const isStudent = profile.employmentStatus === 'student';
    const employmentStatus = profile.employmentStatus || '';
    const householdSize = profile.householdSize || 1;
    const state = profile.state || '';

    subsidiesCache.forEach(program => {
        const reasons = [];
        const missingFields = [];
        let isEligible = true;

        // Check which required fields are missing
        const requiredFields = program.requiredFields || [];
        requiredFields.forEach(field => {
            if (field === 'income' && !income) missingFields.push('income');
            if (field === 'age' && !age) missingFields.push('age');
            if (field === 'state' && !state) missingFields.push('state');
            if (field === 'householdSize' && !profile.householdSize) missingFields.push('householdSize');
            if (field === 'employmentStatus' && !employmentStatus) missingFields.push('employmentStatus');
        });

        // If critical fields missing, mark as needing info but potentially eligible
        if (missingFields.length > 0) {
            notEligible.push({
                ...program,
                eligible: false,
                matchConfidence: 0.5,
                reasons: [`Need more info: ${missingFields.join(', ')}`],
                missingFields,
                needsInfo: true
            });
            return;
        }

        // Income Check
        if (program.incomeMaxMonthly !== undefined) {
            if (income > program.incomeMaxMonthly) {
                isEligible = false;
                reasons.push(`Income RM${income} exceeds limit RM${program.incomeMaxMonthly}`);
            }
        }

        // Age Check
        if (program.ageMin !== undefined && age < program.ageMin) {
            isEligible = false;
            reasons.push(`Age ${age} below minimum ${program.ageMin}`);
        }
        if (program.ageMax !== undefined && age > program.ageMax) {
            isEligible = false;
            reasons.push(`Age ${age} exceeds maximum ${program.ageMax}`);
        }

        // Employment/Student Check
        if (program.requiresStudent && !isStudent) {
            isEligible = false;
            reasons.push("Requires student status");
        }

        // Employment restriction (e.g., self-employed only)
        if (program.employmentRestriction && employmentStatus !== program.employmentRestriction) {
            isEligible = false;
            reasons.push(`Requires ${program.employmentRestriction} status`);
        }

        // Household Check
        if (program.householdMin !== undefined && householdSize < program.householdMin) {
            isEligible = false;
            reasons.push(`Household size ${householdSize} below minimum ${program.householdMin}`);
        }

        if (isEligible) {
            matches.push({
                ...program,
                eligible: true,
                matchConfidence: 1.0,
                reasons: ["Meets all criteria"],
                missingFields: []
            });
        } else {
            notEligible.push({
                ...program,
                eligible: false,
                matchConfidence: 0.0,
                reasons,
                missingFields: []
            });
        }
    });

    return { matches, notEligible };
}
