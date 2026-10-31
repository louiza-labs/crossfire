/**
 * GICS (Global Industry Classification Standard) taxonomy with keyword mappings
 * Used for classifying BDC portfolio company descriptions into standardized sectors
 */

export interface GICSSubIndustry {
  name: string;
  keywords: string[];
}

export interface GICSIndustryGroup {
  name: string;
  keywords: string[];
  subIndustries: GICSSubIndustry[];
}

export interface GICSSector {
  name: string;
  keywords: string[];
  industryGroups: GICSIndustryGroup[];
}

export const GICS_SECTORS: GICSSector[] = [
  {
    name: "Information Technology",
    keywords: [
      "software",
      "saas",
      "cloud",
      "platform",
      "technology",
      "tech",
      "developer",
      "application",
      "digital",
      "cyber",
      "data analytics",
      "computing",
      "api",
      "automation",
      "ai",
      "artificial intelligence",
      "machine learning",
    ],
    industryGroups: [
      {
        name: "Software & Services",
        keywords: ["software", "saas", "cloud", "platform", "application"],
        subIndustries: [
          {
            name: "Application Software",
            keywords: [
              "software",
              "saas",
              "application",
              "platform",
              "erp",
              "crm",
              "workflow",
              "enterprise software",
              "business software",
            ],
          },
          {
            name: "Systems Software",
            keywords: [
              "infrastructure",
              "cloud infrastructure",
              "devops",
              "operating system",
              "database",
              "middleware",
            ],
          },
          {
            name: "IT Services",
            keywords: [
              "it services",
              "managed services",
              "consulting",
              "systems integration",
              "outsourcing",
            ],
          },
        ],
      },
      {
        name: "Technology Hardware & Equipment",
        keywords: ["hardware", "equipment", "device", "semiconductor"],
        subIndustries: [
          {
            name: "Communications Equipment",
            keywords: ["networking", "router", "switch", "telecom equipment"],
          },
          {
            name: "Electronic Equipment",
            keywords: ["electronic", "sensor", "instrumentation"],
          },
        ],
      },
    ],
  },
  {
    name: "Health Care",
    keywords: [
      "healthcare",
      "health care",
      "medical",
      "pharma",
      "biotech",
      "clinical",
      "hospital",
      "patient",
      "drug",
      "therapeutic",
      "health",
      "physician",
      "dental",
      "veterinary",
      "diagnostics",
      "life sciences",
    ],
    industryGroups: [
      {
        name: "Health Care Equipment & Services",
        keywords: ["healthcare", "medical", "patient", "clinical"],
        subIndustries: [
          {
            name: "Health Care Services",
            keywords: [
              "provider",
              "clinic",
              "hospital",
              "patient care",
              "home health",
              "behavioral health",
              "mental health",
            ],
          },
          {
            name: "Health Care Technology",
            keywords: [
              "health tech",
              "medical software",
              "emr",
              "ehr",
              "healthcare it",
              "clinical software",
            ],
          },
          {
            name: "Health Care Equipment",
            keywords: ["medical device", "diagnostic", "equipment", "surgical"],
          },
        ],
      },
      {
        name: "Pharmaceuticals & Biotechnology",
        keywords: ["pharma", "drug", "biotech", "therapeutic"],
        subIndustries: [
          {
            name: "Pharmaceuticals",
            keywords: ["pharma", "drug", "pharmaceutical", "medicine"],
          },
          {
            name: "Biotechnology",
            keywords: ["biotech", "biopharmaceutical", "gene", "cell therapy"],
          },
        ],
      },
    ],
  },
  {
    name: "Industrials",
    keywords: [
      "manufacturing",
      "industrial",
      "logistics",
      "supply chain",
      "transportation",
      "aerospace",
      "defense",
      "equipment",
      "machinery",
      "construction",
      "engineering",
      "distribution",
      "fleet",
      "trucking",
      "freight",
    ],
    industryGroups: [
      {
        name: "Capital Goods",
        keywords: ["manufacturing", "machinery", "equipment", "construction"],
        subIndustries: [
          {
            name: "Aerospace & Defense",
            keywords: ["aerospace", "defense", "aircraft", "military", "aviation"],
          },
          {
            name: "Building Products",
            keywords: ["building", "construction materials", "hvac", "plumbing"],
          },
          {
            name: "Machinery",
            keywords: ["machinery", "equipment", "industrial equipment", "tools"],
          },
          {
            name: "Electrical Equipment",
            keywords: ["electrical", "power equipment", "wire", "cable"],
          },
        ],
      },
      {
        name: "Commercial & Professional Services",
        keywords: ["services", "staffing", "consulting", "professional"],
        subIndustries: [
          {
            name: "Commercial Services",
            keywords: ["commercial services", "facility", "security services", "janitorial"],
          },
          {
            name: "Professional Services",
            keywords: [
              "consulting",
              "staffing",
              "hr services",
              "recruitment",
              "training",
              "professional services",
            ],
          },
        ],
      },
      {
        name: "Transportation",
        keywords: ["transportation", "logistics", "freight", "trucking"],
        subIndustries: [
          {
            name: "Air Freight & Logistics",
            keywords: ["air freight", "logistics", "supply chain", "3pl", "warehouse"],
          },
          {
            name: "Ground Transportation",
            keywords: ["trucking", "rail", "ground transportation", "fleet"],
          },
        ],
      },
    ],
  },
  {
    name: "Consumer Discretionary",
    keywords: [
      "consumer",
      "retail",
      "restaurant",
      "hotel",
      "leisure",
      "entertainment",
      "gaming",
      "apparel",
      "automotive",
      "home",
      "e-commerce",
      "travel",
      "hospitality",
    ],
    industryGroups: [
      {
        name: "Consumer Services",
        keywords: ["restaurant", "hotel", "leisure", "entertainment"],
        subIndustries: [
          {
            name: "Hotels, Restaurants & Leisure",
            keywords: ["restaurant", "hotel", "hospitality", "casino", "gaming", "fitness", "spa"],
          },
          {
            name: "Consumer Services",
            keywords: ["education services", "childcare", "personal services"],
          },
        ],
      },
      {
        name: "Consumer Durables & Apparel",
        keywords: ["apparel", "home", "durable", "furniture"],
        subIndustries: [
          {
            name: "Household Durables",
            keywords: ["home", "furniture", "appliance", "housewares"],
          },
          {
            name: "Textiles, Apparel & Luxury",
            keywords: ["apparel", "fashion", "footwear", "luxury"],
          },
        ],
      },
      {
        name: "Retailing",
        keywords: ["retail", "e-commerce", "store", "online retail"],
        subIndustries: [
          {
            name: "Specialty Retail",
            keywords: ["specialty retail", "store", "shop"],
          },
          {
            name: "Internet Retail",
            keywords: ["e-commerce", "online retail", "marketplace"],
          },
        ],
      },
    ],
  },
  {
    name: "Consumer Staples",
    keywords: [
      "food",
      "beverage",
      "grocery",
      "household products",
      "personal products",
      "tobacco",
      "supermarket",
      "consumer goods",
      "packaged food",
    ],
    industryGroups: [
      {
        name: "Food, Beverage & Tobacco",
        keywords: ["food", "beverage", "tobacco"],
        subIndustries: [
          {
            name: "Food Products",
            keywords: ["food", "packaged food", "snack", "meat", "dairy", "bakery"],
          },
          {
            name: "Beverages",
            keywords: ["beverage", "drink", "bottler", "brewery"],
          },
        ],
      },
      {
        name: "Household & Personal Products",
        keywords: ["household", "personal care", "cleaning"],
        subIndustries: [
          {
            name: "Household Products",
            keywords: ["household", "cleaning", "home care"],
          },
          {
            name: "Personal Products",
            keywords: ["personal care", "cosmetics", "beauty"],
          },
        ],
      },
    ],
  },
  {
    name: "Financials",
    keywords: [
      "financial",
      "bank",
      "insurance",
      "asset management",
      "investment",
      "lending",
      "mortgage",
      "credit",
      "payments",
      "fintech",
      "capital markets",
    ],
    industryGroups: [
      {
        name: "Financial Services",
        keywords: ["financial services", "lending", "payments", "fintech"],
        subIndustries: [
          {
            name: "Consumer Finance",
            keywords: ["consumer finance", "lending", "credit", "personal loan"],
          },
          {
            name: "Financial Technology",
            keywords: ["fintech", "payments", "payment processing", "digital payments"],
          },
        ],
      },
      {
        name: "Insurance",
        keywords: ["insurance", "underwriting", "claims"],
        subIndustries: [
          {
            name: "Insurance",
            keywords: ["insurance", "insurer", "reinsurance", "underwriting"],
          },
          {
            name: "Insurance Brokers",
            keywords: ["insurance broker", "insurance agency", "benefits"],
          },
        ],
      },
    ],
  },
  {
    name: "Communication Services",
    keywords: [
      "media",
      "entertainment",
      "telecom",
      "telecommunications",
      "advertising",
      "marketing",
      "broadcasting",
      "publishing",
      "streaming",
      "social media",
      "content",
    ],
    industryGroups: [
      {
        name: "Media & Entertainment",
        keywords: ["media", "entertainment", "content", "streaming"],
        subIndustries: [
          {
            name: "Media",
            keywords: ["media", "publishing", "broadcasting", "news"],
          },
          {
            name: "Entertainment",
            keywords: ["entertainment", "streaming", "film", "music", "video"],
          },
          {
            name: "Interactive Media",
            keywords: ["social media", "digital media", "interactive", "online media"],
          },
        ],
      },
      {
        name: "Telecommunication Services",
        keywords: ["telecom", "telecommunications", "wireless", "broadband"],
        subIndustries: [
          {
            name: "Diversified Telecommunication",
            keywords: ["telecom", "telecommunications", "carrier", "network"],
          },
          {
            name: "Wireless Telecommunication",
            keywords: ["wireless", "mobile", "cellular"],
          },
        ],
      },
    ],
  },
  {
    name: "Energy",
    keywords: [
      "oil",
      "gas",
      "energy",
      "petroleum",
      "drilling",
      "pipeline",
      "refinery",
      "oilfield",
      "upstream",
      "midstream",
      "downstream",
    ],
    industryGroups: [
      {
        name: "Energy",
        keywords: ["oil", "gas", "energy", "petroleum"],
        subIndustries: [
          {
            name: "Oil & Gas Exploration",
            keywords: ["exploration", "production", "upstream", "drilling"],
          },
          {
            name: "Oil & Gas Equipment",
            keywords: ["oilfield", "equipment", "services", "drilling services"],
          },
          {
            name: "Oil & Gas Storage",
            keywords: ["pipeline", "midstream", "storage", "transportation"],
          },
        ],
      },
    ],
  },
  {
    name: "Materials",
    keywords: [
      "chemical",
      "materials",
      "metal",
      "mining",
      "paper",
      "packaging",
      "container",
      "steel",
      "aluminum",
      "plastic",
    ],
    industryGroups: [
      {
        name: "Materials",
        keywords: ["chemical", "materials", "metal", "mining"],
        subIndustries: [
          {
            name: "Chemicals",
            keywords: ["chemical", "specialty chemicals", "commodity chemicals"],
          },
          {
            name: "Metals & Mining",
            keywords: ["metal", "mining", "steel", "aluminum", "copper"],
          },
          {
            name: "Containers & Packaging",
            keywords: ["packaging", "container", "paper", "box", "carton"],
          },
        ],
      },
    ],
  },
  {
    name: "Real Estate",
    keywords: [
      "real estate",
      "property",
      "reit",
      "commercial real estate",
      "residential",
      "rental",
      "leasing",
      "development",
    ],
    industryGroups: [
      {
        name: "Real Estate",
        keywords: ["real estate", "property", "reit"],
        subIndustries: [
          {
            name: "Real Estate Management",
            keywords: ["property management", "real estate services", "brokerage", "facilities"],
          },
          {
            name: "Real Estate Development",
            keywords: ["development", "construction", "developer"],
          },
        ],
      },
    ],
  },
  {
    name: "Utilities",
    keywords: [
      "utility",
      "electric",
      "water",
      "gas utility",
      "power",
      "renewable",
      "solar",
      "wind",
      "generation",
    ],
    industryGroups: [
      {
        name: "Utilities",
        keywords: ["utility", "electric", "water", "power"],
        subIndustries: [
          {
            name: "Electric Utilities",
            keywords: ["electric", "power", "electricity", "grid"],
          },
          {
            name: "Gas Utilities",
            keywords: ["gas utility", "natural gas", "distribution"],
          },
          {
            name: "Water Utilities",
            keywords: ["water", "wastewater", "water treatment"],
          },
          {
            name: "Renewable Electricity",
            keywords: ["renewable", "solar", "wind", "clean energy"],
          },
        ],
      },
    ],
  },
];

// Flat lookup for quick keyword matching
export function getAllKeywords(): Map<string, { sector: string; industryGroup?: string }> {
  const keywordMap = new Map<string, { sector: string; industryGroup?: string }>();

  for (const sector of GICS_SECTORS) {
    // Sector-level keywords
    for (const keyword of sector.keywords) {
      keywordMap.set(keyword.toLowerCase(), { sector: sector.name });
    }

    // Industry group keywords
    for (const group of sector.industryGroups) {
      for (const keyword of group.keywords) {
        keywordMap.set(keyword.toLowerCase(), {
          sector: sector.name,
          industryGroup: group.name,
        });
      }

      // Sub-industry keywords
      for (const subIndustry of group.subIndustries) {
        for (const keyword of subIndustry.keywords) {
          keywordMap.set(keyword.toLowerCase(), {
            sector: sector.name,
            industryGroup: group.name,
          });
        }
      }
    }
  }

  return keywordMap;
}
