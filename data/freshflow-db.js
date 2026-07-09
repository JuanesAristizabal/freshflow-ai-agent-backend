export const FRESHFLOW_DB = {
  products: [
    {
      sku: "1029",
      product: "Strawberries",
      category: "Produce",
      region: "Texas",
      storeCluster: "Texas Fresh Cluster",
      shelfLife: "36h",
      wasteRisk: "92%",
      demandForecast: "-14%",
      salesVelocity: "Low",
      weatherImpact: "High",
      inventoryStatus: "Overstock",
      recommendation: "Apply 15% markdown and transfer excess inventory to 22 nearby stores",
      expectedSavings: "$4.9M",
      confidence: "96%",
      owner: "Store Operations"
    },
    {
      sku: "7330",
      product: "Avocados",
      category: "Produce",
      region: "Texas",
      storeCluster: "Austin North",
      shelfLife: "3 days",
      wasteRisk: "76%",
      demandForecast: "-9%",
      salesVelocity: "Medium",
      weatherImpact: "High",
      inventoryStatus: "Overstock",
      recommendation: "Bundle promotion and reduce next replenishment order",
      expectedSavings: "$3.6M",
      confidence: "89%",
      owner: "Category Management"
    },
    {
      sku: "4102",
      product: "Milk",
      category: "Dairy",
      region: "Dallas Metro",
      storeCluster: "Dallas Metro",
      shelfLife: "2 days",
      wasteRisk: "87%",
      demandForecast: "-8%",
      salesVelocity: "Medium",
      weatherImpact: "Medium",
      inventoryStatus: "Excess inventory",
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
      storeCluster: "Northeast Urban",
      shelfLife: "24h",
      wasteRisk: "91%",
      demandForecast: "-11%",
      salesVelocity: "Low",
      weatherImpact: "Low",
      inventoryStatus: "Short shelf life",
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
      riskReason: "Recurring OTIF deterioration over the last 3 weeks",
      recommendation: "Activate backup supplier and split the next purchase order",
      owner: "Procurement"
    },
    {
      supplier: "DairyBest",
      category: "Dairy",
      otif: "97%",
      quality: "96%",
      leadTime: "1.8 days",
      delayRisk: "Low",
      wasteImpact: "$420K",
      riskReason: "Stable cold-chain compliance",
      recommendation: "Keep as primary supplier",
      owner: "Procurement"
    },
    {
      supplier: "Blue Coast Seafood",
      category: "Seafood",
      otif: "86%",
      quality: "89%",
      leadTime: "3.2 days",
      delayRisk: "High",
      wasteImpact: "$1.9M",
      riskReason: "Temperature compliance variance",
      recommendation: "Request quality inspection and monitor cold-chain compliance",
      owner: "Procurement"
    }
  ],

  logistics: [
    {
      asset: "Truck #284",
      category: "Dairy",
      region: "Texas",
      temperature: "7.8°C",
      threshold: "4°C",
      duration: "18 minutes",
      etaDelay: "+32 minutes",
      severity: "High",
      risk: "Cold-chain deviation",
      recommendation: "Reroute truck, inspect shipment and prioritize receiving dock",
      expectedSavings: "$1.1M",
      confidence: "95%",
      owner: "Logistics"
    },
    {
      asset: "Truck #411",
      category: "Produce",
      region: "Florida",
      temperature: "3.1°C",
      threshold: "4°C",
      duration: "0 minutes",
      etaDelay: "+12 minutes",
      severity: "Low",
      risk: "Traffic delay",
      recommendation: "Monitor ETA and keep current route",
      expectedSavings: "$240K",
      confidence: "88%",
      owner: "Logistics"
    }
  ],

  regions: [
    {
      region: "Texas",
      riskLevel: "High",
      mainRisk: "Produce overstock and heat-related spoilage",
      storesNeedingAction: 184,
      topProducts: ["Strawberries", "Avocados", "Spinach"],
      recommendedAction: "Apply dynamic markdowns and transfer inventory",
      expectedSavings: "$4.9M"
    },
    {
      region: "Florida",
      riskLevel: "Medium",
      mainRisk: "Dairy transfer pressure and weather-driven demand shifts",
      storesNeedingAction: 96,
      topProducts: ["Milk", "Yogurt", "Chicken Breast"],
      recommendedAction: "Transfer inventory to high-demand stores",
      expectedSavings: "$3.2M"
    }
  ],

  reports: [
    {
      report: "Weekly Grocery Loss Report",
      audience: "COO / Regional Operations",
      status: "Ready",
      lastGenerated: "Today, 8:30 AM",
      summary: "Waste risk is concentrated in Texas produce and Dallas dairy inventory.",
      recommendation: "Approve markdowns, transfers and supplier rerouting."
    },
    {
      report: "Supplier Risk Report",
      audience: "Procurement / Supply Planning",
      status: "Ready",
      lastGenerated: "Today, 9:00 AM",
      summary: "Green Valley and Blue Coast Seafood show the highest operational risk.",
      recommendation: "Activate backup suppliers and monitor quality compliance."
    }
  ]
};

export function retrieveFreshflowContext(message) {
  const query = String(message || "").toLowerCase();

  const selected = {
    products: [],
    suppliers: [],
    logistics: [],
    regions: [],
    reports: []
  };

  const includesAny = (words) => words.some((word) => query.includes(word));

  if (includesAny(["strawberry", "strawberries", "produce", "texas", "waste", "spoilage", "avocado", "avocados"])) {
    selected.products.push(
      ...FRESHFLOW_DB.products.filter((item) =>
        ["Strawberries", "Avocados", "Spinach"].includes(item.product) ||
        item.region === "Texas"
      )
    );

    selected.regions.push(
      ...FRESHFLOW_DB.regions.filter((item) => item.region === "Texas")
    );
  }

  if (includesAny(["milk", "dairy", "yogurt"])) {
    selected.products.push(
      ...FRESHFLOW_DB.products.filter((item) => item.category === "Dairy")
    );
  }

  if (includesAny(["salmon", "seafood", "fish"])) {
    selected.products.push(
      ...FRESHFLOW_DB.products.filter((item) => item.category === "Seafood")
    );
  }

  if (includesAny(["supplier", "green valley", "procurement", "otif", "vendor", "delay"])) {
    selected.suppliers.push(...FRESHFLOW_DB.suppliers);
  }

  if (includesAny(["truck", "logistics", "route", "cold chain", "temperature", "eta", "shipment"])) {
    selected.logistics.push(...FRESHFLOW_DB.logistics);
  }

  if (includesAny(["report", "summary", "executive", "coo", "cfo"])) {
    selected.reports.push(...FRESHFLOW_DB.reports);
  }

  if (
    selected.products.length === 0 &&
    selected.suppliers.length === 0 &&
    selected.logistics.length === 0 &&
    selected.regions.length === 0 &&
    selected.reports.length === 0
  ) {
    selected.products = FRESHFLOW_DB.products.slice(0, 2);
    selected.suppliers = FRESHFLOW_DB.suppliers.slice(0, 1);
    selected.logistics = FRESHFLOW_DB.logistics.slice(0, 1);
    selected.regions = FRESHFLOW_DB.regions.slice(0, 1);
  }

  return selected;
}
