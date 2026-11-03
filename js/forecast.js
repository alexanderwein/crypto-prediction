/* ============================================================ CRYPTO PREDICTION — FORECASTING ENGINE File: js/forecast.js ============================================================ */

window.CryptoForecast = (() => { "use strict";

const EPS = 1e-12;

// ---------------------------------------------------------- // BASIC HELPERS // ----------------------------------------------------------

function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }

function standardDeviation(values) { if (values.length < 2) return 0;

const avg = mean(values);

return Math.sqrt(
  mean(values.map(x => (x - avg) ** 2))
);


}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function clean(value) { return Number.isFinite(value) ? value : null; }

// ---------------------------------------------------------- // LOGARITHMIC RETURNS // ----------------------------------------------------------

function getReturns(prices) { const result = [];

for (let i = 1; i < prices.length; i++) {
  if (prices[i - 1] <= 0 || prices[i] <= 0) {
    continue;
  }

  result.push(
    Math.log(prices[i] / prices[i - 1])
  );
}

return result;


}

// ---------------------------------------------------------- // LINEAR REGRESSION // ----------------------------------------------------------

function linearRegression(prices, horizon = 1) { const n = prices.length;

if (n < 10) {
  throw new Error("Insufficient data for regression");
}

const logs = prices.map(Math.log);

const xMean = (n - 1) / 2;
const yMean = mean(logs);

let numerator = 0;
let denominator = 0;

for (let i = 0; i < n; i++) {
  numerator += (i - xMean) * (logs[i] - yMean);
  denominator += (i - xMean) ** 2;
}

const slope = denominator
  ? numerator / denominator
  : 0;

const intercept = yMean - slope * xMean;

const predictedLog =
  intercept + slope * (n - 1 + horizon);

const predictedPrice = Math.exp(predictedLog);

const residuals = logs.map((value, i) =>
  value - (intercept + slope * i)
);

return {
  price: predictedPrice,
  slope,
  intercept,
  residualDeviation: standardDeviation(residuals),
  direction: slope > 0 ? "BULLISH" :
    slope < 0 ? "BEARISH" : "NEUTRAL"
};


}

// ---------------------------------------------------------- // EXPONENTIAL SMOOTHING // ----------------------------------------------------------

function exponentialSmoothing(prices, alpha = 0.3) { if (!prices.length) return null;

let smoothed = prices[0];

for (let i = 1; i < prices.length; i++) {
  smoothed =
    alpha * prices[i] +
    (1 - alpha) * smoothed;
}

return smoothed;


}

function doubleExponentialSmoothing( prices, alpha = 0.3, beta = 0.1, horizon = 1 ) { if (prices.length < 2) return null;

let level = prices[0];
let trend = prices[1] - prices[0];

for (let i = 1; i < prices.length; i++) {
  const previousLevel = level;

  level =
    alpha * prices[i] +
    (1 - alpha) * (level + trend);

  trend =
    beta * (level - previousLevel) +
    (1 - beta) * trend;
}

return level + horizon * trend;


}

// ---------------------------------------------------------- // MOMENTUM FORECAST // ----------------------------------------------------------

function momentumForecast(prices, period = 20) { if (prices.length < period + 1) return null;

const recent = prices.slice(-period);

const returns = getReturns(recent);

if (!returns.length) return null;

const avgReturn = mean(returns);

const lastPrice = prices[prices.length - 1];

return {
  averageReturn: avgReturn,
  shortTermPrice: lastPrice * Math.exp(avgReturn),
  direction: avgReturn > 0 ? "BULLISH" :
    avgReturn < 0 ? "BEARISH" : "NEUTRAL"
};


}

// ---------------------------------------------------------- // VOLATILITY ESTIMATION // ----------------------------------------------------------

function estimateVolatility(prices, period = 30) { const returns = getReturns(prices).slice(-period);

if (returns.length < 2) return 0;

return standardDeviation(returns);


}

// ---------------------------------------------------------- // HISTORICAL TREND STRENGTH // ----------------------------------------------------------

function trendStrength(prices, period = 30) { if (prices.length < period) return 0;

const recent = prices.slice(-period);

const regression = linearRegression(
  recent,
  0
);

const volatility = estimateVolatility(recent, period);

if (volatility < EPS) return 0;

return clamp(
  regression.slope / volatility,
  -3,
  3
);


}

// ---------------------------------------------------------- // MODEL COMBINATION // ----------------------------------------------------------

function ensembleForecast(prices, horizon = 1) { const regression = linearRegression( prices.slice(-Math.min(100, prices.length)), horizon );

const lastPrice = prices[prices.length - 1];

const smooth = doubleExponentialSmoothing(
  prices.slice(-Math.min(100, prices.length)),
  0.3,
  0.1,
  horizon
);

const momentum = momentumForecast(
  prices,
  Math.min(20, prices.length - 1)
);

const momentumPrice = momentum
  ? lastPrice * Math.exp(
      momentum.averageReturn * horizon
    )
  : lastPrice;

const models = [
  {
    name: "Regression",
    price: regression.price,
    weight: 0.40
  },
  {
    name: "Exponential smoothing",
    price: smooth,
    weight: 0.35
  },
  {
    name: "Momentum",
    price: momentumPrice,
    weight: 0.25
  }
];

const valid = models.filter(
  model => Number.isFinite(model.price) &&
    model.price > 0
);

const totalWeight = valid.reduce(
  (sum, model) => sum + model.weight,
  0
);

const forecastPrice = valid.reduce(
  (sum, model) =>
    sum + model.price * model.weight,
  0
) / totalWeight;

return {
  price: forecastPrice,
  models,
  regression,
  momentum,
  agreement: calculateAgreement(valid)
};


}

// ---------------------------------------------------------- // MODEL AGREEMENT // ----------------------------------------------------------

function calculateAgreement(models) { if (!models.length) return 0;

const bullish = models.filter(
  model => model.price > models[0].price * 0 +
    0
);

return bullish.length / models.length;


}

// ---------------------------------------------------------- // SCENARIO ANALYSIS // ----------------------------------------------------------

function scenarios( currentPrice, forecastPrice, volatility, horizon ) { const timeScale = Math.sqrt(Math.max(1, horizon));

const risk = volatility * timeScale;

const baseReturn =
  Math.log(forecastPrice / currentPrice);

const upper = currentPrice *
  Math.exp(baseReturn + 1.645 * risk);

const lower = currentPrice *
  Math.exp(baseReturn - 1.645 * risk);

return {
  bearish: lower,
  base: forecastPrice,
  bullish: upper
};


}

// ---------------------------------------------------------- // DIRECTION CLASSIFICATION // ----------------------------------------------------------

function classifyDirection(current, predicted) { const change = ((predicted - current) / current) * 100;

return {
  changePercent: change,
  direction: change > 0.5
    ? "BULLISH"
    : change < -0.5
      ? "BEARISH"
      : "NEUTRAL"
};


}

// ---------------------------------------------------------- // FORECAST CONFIDENCE // ----------------------------------------------------------

function confidenceScore( prices, models, volatility ) { const recent = prices.slice(-50);

if (recent.length < 20) return 0;

const returns = getReturns(recent);

const stability = 1 / (
  1 + standardDeviation(returns) * 100
);

const modelPrices = models
  .map(m => m.price)
  .filter(Number.isFinite);

const dispersion = modelPrices.length > 1
  ? standardDeviation(modelPrices) /
    Math.max(mean(modelPrices), EPS)
  : 1;

const agreement = 1 / (1 + dispersion * 20);

const dataQuality = Math.min(
  1,
  prices.length / 200
);

const volatilityPenalty = 1 / (
  1 + volatility * 20
);

return Math.round(
  clamp(
    100 *
    (
      0.30 * stability +
      0.30 * agreement +
      0.20 * dataQuality +
      0.20 * volatilityPenalty
    ),
    0,
    100
  )
);


}

// ---------------------------------------------------------- // MAIN FORECAST // ----------------------------------------------------------

function forecast(candles, timeframe = "1D") { if (!Array.isArray(candles) || candles.length < 100) { throw new Error( "At least 100 historical candles are required" ); }

const prices = candles
  .map(c => Number(c.close))
  .filter(p => Number.isFinite(p) && p > 0);

if (prices.length < 100) {
  throw new Error("Insufficient valid price history");
}

const currentPrice = prices[prices.length - 1];

const volatility = estimateVolatility(
  prices,
  Math.min(30, prices.length - 1)
);

const trend = trendStrength(
  prices,
  Math.min(30, prices.length)
);

// Forecast horizons are expressed in candles.
const horizonMap = {
  "1D": 1,
  "3D": 3,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365
};

const baseHorizon = horizonMap[timeframe] || 1;

const horizons = [
  {
    id: "24H",
    label: "24 Hours",
    steps: baseHorizon
  },
  {
    id: "7D",
    label: "7 Days",
    steps: baseHorizon * 7
  },
  {
    id: "30D",
    label: "30 Days",
    steps: baseHorizon * 30
  }
];

const results = horizons.map(item => {
  const ensemble = ensembleForecast(
    prices,
    item.steps
  );

  const direction = classifyDirection(
    currentPrice,
    ensemble.price
  );

  const range = scenarios(
    currentPrice,
    ensemble.price,
    volatility,
    item.steps
  );

  const confidence = confidenceScore(
    prices,
    ensemble.models,
    volatility
  );

  return {
    id: item.id,
    label: item.label,
    currentPrice,
    predictedPrice: clean(ensemble.price),
    changePercent: clean(direction.changePercent),
    direction: direction.direction,

    confidence,

    range: {
      lower: clean(range.bearish),
      central: clean(range.base),
      upper: clean(range.bullish)
    },

    models: ensemble.models,
    agreement: ensemble.agreement
  };
});

return {
  currentPrice,
  timeframe,
  trend,
  volatility,
  forecasts: results,
  generatedAt: new Date().toISOString(),
  disclaimer:
    "Statistical estimates, not guaranteed future prices."
};


}

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ mean, standardDeviation, getReturns, linearRegression, exponentialSmoothing, doubleExponentialSmoothing, momentumForecast, estimateVolatility, trendStrength, ensembleForecast, scenarios, confidenceScore, forecast });

})();
