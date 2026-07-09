const DEFAULT_MODEL = "gemini-2.5-flash";

const FRESHFLOW_CONTEXT = {
  platform: "Walmart FreshFlow AI",
  purpose:
    "University prototype of an internal grocery supply chain AI platform designed to reduce grocery losses, protect margins, monitor supply chain risks, and support C-Level and Operations decisions.",
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
      recommendation:
        "Apply 15% markdown and transfer excess inventory to 22 nearby stores",
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
      recommendation:
        "Request quality inspection and monitor cold-chain compliance"
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
    "This week, FreshFlow AI identified the strongest risk concentration in the South region, mainly across produce categories. The largest value opportunity came from dynamic markdown recommendations and inventory transfers. Supplier risk remains manageable, but Green Valley Produce should be monitored due to repeated delivery delays."
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: [
        "waste_risk",
        "supplier_risk",
        "cold_chain",
        "scenario_simulation",
        "executive_summary",
        "report_generation",
        "general"
      ]
    },
    role: {
      type: "string",
      enum: ["Executive", "Operations"]
    },
    diagnosis: {
      type: "string"
    },
    rootCauses: {
      type: "array",
      items: {
        type: "string"
      }
    },
    recommendedAction: {
      type: "string"
    },
    expectedSavings: {
      type: "string"
    },
    confidence: {
      type: "string"
    },
    owner: {
      type: "string"
    },
    approvalRequired: {
      type: "boolean"
    },
    businessImpact: {
      type: "string"
    },
    nextSteps: {
      type: "array",
      items: {
        type: "string"
      }
    },
    dashboardTarget: {
      type: "string",
      enum: [
        "overview",
        "executive",
        "operations",
        "ai",
        "loss",
        "twin",
        "suppliers",
        "reports"
      ]
    },
    shortAnswer: {
      type: "string"
    }
  },
  required: [
    "intent",
    "role",
    "diagnosis",
    "rootCauses",
    "recommendedAction",
    "expectedSavings",
    "confidence",
    "owner",
    "approvalRequired",
    "businessImpact",
    "nextSteps",
    "dashboardTarget",
    "shortAnswer"
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
  if (!text || typeof text !== "string") return null;

  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
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

This is NOT real Walmart internal data. It is simulated data for an academic prototype.

Your job:
- Help executives understand grocery loss, margin impact, ROI, supplier risk and sustainability.
- Help operations teams understand store actions, product-level risks, supplier delays, cold-chain alerts, markdowns, transfers and replenishment.
- Stay only within grocery supply chain, waste reduction, inventory, suppliers, logistics, cold chain, forecasting, sustainability and executive reporting.
- Every operational action must require human approval.

Current user role: ${role || "Executive"}
Current dashboard page: ${currentPage || "ai"}

Simulated platform context:
${JSON.stringify(FRESHFLOW_CONTEXT, null, 2)}

User question:
${message}

Return a structured answer using the required JSON schema.
Do not include markdown.
Do not include code fences.
Do not include explanations outside the JSON object.
`;
}

function fallbackResponse(message) {
  const lower = String(message || "").toLowerCase();

  if (lower.includes("texas") || lower.includes("produce") || lower.includes("strawberr")) {
    return {
      intent: "waste_risk",
      role: "Executive",
      diagnosis:
        "Produce waste risk is increasing in Texas, especially for strawberries and avocados.",
      rootCauses: [
        "Shelf life pressure is high for strawberries with only 36 hours remaining.",
        "Demand is 14% below forecast across the Texas fresh cluster.",
        "Heat conditions are reducing effective shelf life and increasing spoilage probability."
      ],
      recommendedAction:
        "Apply a 15% markdown today, transfer excess inventory to 22 nearby high-demand stores, and reduce tomorrow’s sensitive produce replenishment.",
      expectedSavings: "$4.9M",
      confidence: "96%",
      owner: "Store Operations",
      approvalRequired: true,
      businessImpact:
        "This action protects grocery margins, accelerates fresh inventory rotation and reduces preventable food waste.",
      nextSteps: [
        "Approve markdown recommendation.",
        "Notify Texas store managers.",
        "Monitor realized savings and waste reduction after execution."
      ],
      dashboardTarget: "operations",
      shortAnswer:
        "Produce waste is increasing in Texas because shelf life is short, demand is below forecast and heat is accelerating spoilage risk."
    };
  }

  return {
    intent: "general",
    role: "Operations",
    diagnosis:
      "FreshFlow AI detected a grocery supply chain question, but the AI response could not be converted into structured dashboard data.",
    rootCauses: [
      "The request reached the backend successfully.",
      "The AI service returned an unexpected response format.",
      "A safe fallback response was used to protect the demo experience."
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
      "Ask a more specific supply chain question.",
      "Retry the AI Agent.",
      "Check backend logs if the issue repeats."
    ],
    dashboardTarget: "operations",
    shortAnswer:
      "I can help with grocery waste, supplier risk, cold chain alerts, inventory and executive reporting."
  };
}

function normalizeResponse(parsed, message) {
  const fallback = fallbackResponse(message);

  return {
    intent: parsed.intent || fallback.intent,
    role: parsed.role || fallback.role,
    diagnosis: parsed.diagnosis || fallback.diagnosis,
    rootCauses: Array.isArray(parsed.rootCauses)
      ? parsed.rootCauses
      : fallback.rootCauses,
    recommendedAction: parsed.recommendedAction || fallback.recommendedAction,
    expectedSavings: parsed.expectedSavings || fallback.expectedSavings,
    confidence: parsed.confidence || fallback.confidence,
    owner: parsed.owner || fallback.owner,
    approvalRequired: true,
    businessImpact: parsed.businessImpact || fallback.businessImpact,
    nextSteps: Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps
      : fallback.nextSteps,
    dashboardTarget: parsed.dashboardTarget || fallback.dashboardTarget,
    shortAnswer: parsed.shortAnswer || fallback.shortAnswer,
    simulatedDataNotice:
      "This response uses simulated project data for the Walmart FreshFlow AI university prototype."
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
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
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
        ...fallbackResponse(message),
        rawGeminiText: text
      });
    }

    return res.status(200).json(normalizeResponse(parsed, message));
  } catch (error) {
    return res.status(500).json({
      error: "FreshFlow AI backend error.",
      message: error.message
    });
  }
}
