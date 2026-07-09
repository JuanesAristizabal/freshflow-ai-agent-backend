const DEFAULT_MODEL = "gemini-2.5-flash";

const FRESHFLOW_CONTEXT = {
  platform: "Walmart FreshFlow AI",
  purpose:
    "Internal Walmart grocery supply chain AI platform designed to reduce grocery losses, protect margins, monitor supply chain risks, and support C-Level and Operations decisions.",
  dataSources: [
    "POS sales",
    "Store inventory",
    "Expiration dates",
    "Supplier OTIF",
    "Distribution center capacity",
    "Truck GPS",
    "Cold chain temperature",
    "Weather",
    "Local events",
    "Traffic",
    "Commodity prices"
  ],
  productsAtRisk: [
    {
      sku: "1029",
      product: "Strawberries",
      category: "Produce",
      region: "Texas",
      shelfLife: "36h",
      wasteRisk: "92%",
      demandForecast: "-14%",
      weatherImpact: "High",
      recommendation: "Apply 15% markdown and transfer excess inventory to 22 nearby stores",
      expectedSavings: "$4.9M",
      confidence: "96%",
      owner: "Store Operations"
    },
    {
      sku: "4102",
      product: "Milk",
      category: "Dairy",
      region: "Dallas Metro",
      shelfLife: "2 days",
      wasteRisk: "87%",
      demandForecast: "-8%",
      weatherImpact: "Medium",
      recommendation: "Transfer inventory from Store #118 to Store #210",
      expectedSavings: "$7.2M",
      confidence: "93%",
      owner: "Store Operations"
    },
    {
      sku: "9150",
      product: "Salmon Fillets",
      category: "Seafood",
      region: "Northeast Urban",
      shelfLife: "24h",
      wasteRisk: "91%",
      demandForecast: "-11%",
      weatherImpact: "Low",
      recommendation: "Reduce price 10% and prioritize same-day movement",
      expectedSavings: "$6.2M",
      confidence: "94%",
      owner: "Category Management"
    }
  ],
  suppliers: [
    {
      supplier: "Green Valley",
      category: "Produce",
      otif: "84%",
      quality: "88%",
      leadTime: "3.6 days",
      delayRisk: "High",
      wasteImpact: "$2.8M",
      reason: "Recurring OTIF deterioration over the last 3 weeks",
      recommendation: "Activate backup supplier and split the next purchase order"
    },
    {
      supplier: "DairyBest",
      category: "Dairy",
      otif: "97%",
      quality: "96%",
      leadTime: "1.8 days",
      delayRisk: "Low",
      wasteImpact: "$420K",
      reason: "Stable cold-chain compliance",
      recommendation: "Keep as primary supplier"
    },
    {
      supplier: "Blue Coast Seafood",
      category: "Seafood",
      otif: "86%",
      quality: "89%",
      leadTime: "3.2 days",
      delayRisk: "High",
      wasteImpact: "$1.9M",
      reason: "Temperature compliance variance",
      recommendation: "Request quality inspection and monitor cold-chain compliance"
    }
  ],
  alerts: [
    {
      type: "Cold chain interruption",
      asset: "Truck #284",
      category: "Dairy",
      temperature: "7.8°C",
      duration: "18 minutes",
      severity: "High",
      recommendation: "Reroute and inspect cold-chain integrity"
    },
    {
      type: "Supplier delay",
      asset: "Green Valley Produce",
      location: "DC Atlanta",
      etaDelay: "+18h",
      severity: "Medium",
      recommendation: "Activate backup supplier"
    },
    {
      type: "Produce overstock",
      asset: "Texas Region",
      category: "Avocados and strawberries",
      severity: "Medium",
      recommendation: "Apply markdowns and transfer excess inventory"
    }
  ],
  executiveSummary:
    "This week, FreshFlow AI identified the strongest risk concentration in the South region, mainly across produce categories. The largest value opportunity came from dynamic markdown recommendations and inventory transfers. Supplier risk remains manageable, but Green Valley Produce should be monitored due to repeated delivery delays.",
  rules: [
    "Never claim this is real Walmart internal data.",
    "Always treat the data as simulated project data.",
    "Always include human approval for operational actions.",
    "Do not answer questions outside grocery supply chain, inventory, waste, suppliers, logistics, cold chain, forecasts, sustainability, or executive reporting."
  ]
};

function setCorsHeaders(req, res) {
  const allowedOrigin =
    process.env.FRONTEND_ORIGIN || "https://juanesaristizabal.github.io";

  const requestOrigin = req.headers.origin;

  if (requestOrigin && requestOrigin.startsWith(allowedOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function buildPrompt({ message, role, currentPage }) {
  return `
You are FreshFlow AI Agent, an internal Walmart grocery supply chain copilot for a university prototype.

You help two types of users:
- C-Level / Executive: focus on margin impact, ROI, strategic risk, supplier resilience, sustainability, and executive reporting.
- Operations: focus on store actions, product-level risk, truck alerts, supplier delays, markdowns, transfers, replenishment, and execution.

IMPORTANT:
- This is a simulated university project. Do not claim that any data is real Walmart internal data.
- Stay within grocery supply chain, grocery loss, inventory, suppliers, logistics, cold chain, forecasting, sustainability, and executive reports.
- Every operational recommendation must require human approval.

Current user role: ${role || "Executive"}
Current dashboard page: ${currentPage || "AI Command Center"}

Simulated platform context:
${JSON.stringify(FRESHFLOW_CONTEXT, null, 2)}

User question:
"${message}"

Return ONLY valid JSON using this structure:
{
  "intent": "waste_risk | supplier_risk | cold_chain | scenario_simulation | executive_summary | report_generation | general",
  "role": "Executive | Operations",
  "diagnosis": "string",
  "rootCauses": ["string", "string", "string"],
  "recommendedAction": "string",
  "expectedSavings": "string",
  "confidence": "string",
  "owner": "string",
  "approvalRequired": true,
  "businessImpact": "string",
  "nextSteps": ["string", "string", "string"],
  "dashboardTarget": "overview | executive | operations | ai | loss | twin | suppliers | reports",
  "shortAnswer": "string"
}
`;
}

function fallbackResponse() {
  return {
    intent: "general",
    role: "Operations",
    diagnosis:
      "FreshFlow AI detected a grocery supply chain question, but the AI service response could not be parsed.",
    rootCauses: [
      "The backend received the request successfully",
      "Gemini returned a response that was not valid JSON",
      "The fallback response was used to protect the dashboard experience"
    ],
    recommendedAction:
      "Review the Grocery Loss Center and Operations Action Center for products with high waste risk.",
    expectedSavings: "$2.8M",
    confidence: "Fallback",
    owner: "Store Operations",
    approvalRequired: true,
    businessImpact:
      "The platform can still guide users toward priority grocery loss actions while the AI response is retried.",
    nextSteps: [
      "Refresh the AI Agent",
      "Check the backend logs",
      "Ask a more specific supply chain question"
    ],
    dashboardTarget: "operations",
    shortAnswer:
      "I can help with grocery waste, supplier risk, cold chain alerts, inventory and executive reporting. Try asking about strawberries in Texas or Green Valley supplier risk."
  };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Use POST."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY environment variable."
      });
    }

    const { message, role, currentPage } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Missing required field: message."
      });
    }

    const prompt = buildPrompt({
      message,
      role,
      currentPage
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.9,
          maxOutputTokens: 1400,
          responseMimeType: "application/json"
        }
      })
    });

    const geminiPayload = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: "Gemini API error.",
        details: geminiPayload
      });
    }

    const text =
      geminiPayload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .join("") || "";

    const parsed = safeJsonParse(text);

    if (!parsed) {
      return res.status(200).json({
        ...fallbackResponse(),
        rawGeminiText: text
      });
    }

    return res.status(200).json({
      ...parsed,
      approvalRequired: true,
      simulatedDataNotice:
        "This response uses simulated project data for the Walmart FreshFlow AI university prototype."
    });
  } catch (error) {
    return res.status(500).json({
      error: "FreshFlow AI backend error.",
      message: error.message
    });
  }
}
