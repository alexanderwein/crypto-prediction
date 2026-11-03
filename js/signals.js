/* ============================================================ CRYPTO PREDICTION — TRADING SIGNAL ENGINE File: js/signals.js ============================================================ */

window.CryptoSignals = (() => { "use strict";

const CONFIG = window.CryptoConfig; const IND = window.CryptoIndicators;

if (!CONFIG || !IND) { throw new Error("Configuration and indicators must load first"); }

// ---------------------------------------------------------- // HELPERS // ----------------------------------------------------------

function last(array) { if (!Array.isArray(array)) return null;

for (let i = array.length - 1; i >= 0; i--) {
  if (Number.isFinite(array[i])) return array[i];
}

return null;


}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function percentage(a, b) { if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) { return 0; }

return ((a - b) / Math.abs(b)) * 100;


}

// ---------------------------------------------------------- // TREND ANALYSIS // ----------------------------------------------------------

function analyzeTrend(price, indicators) { let score = 0; let signals = 0; const details = [];

const averages = [
  20, 50, 100, 200
];

for (const period of averages) {
  const value = last(indicators.sma?.[period]);

  if (value === null) continue;

  const bullish = price > value;

  score += bullish ? 1 : -1;
  signals++;

  details.push({
    name: `SMA ${period}`,
    direction: bullish ? "BULLISH" : "BEARISH"
  });
}

const supertrend = last(
  indicators.supertrend?.direction
);

if (supertrend !== null) {
  score += supertrend > 0 ? 1 : -1;
  signals++;
}

const adx = last(indicators.adx?.adx);
const plusDI = last(indicators.adx?.plusDI);
const minusDI = last(indicators.adx?.minusDI);

if (
  adx !== null &&
  plusDI !== null &&
  minusDI !== null &&
  adx >= 20
) {
  score += plusDI > minusDI ? 1 : -1;
  signals++;
}

const normalized = signals
  ? score / signals
  : 0;

return {
  score: normalized,
  points: Math.round((normalized + 1) * 50),
  details
};


}

// ---------------------------------------------------------- // MOMENTUM ANALYSIS // ----------------------------------------------------------

function analyzeMomentum(indicators) { let score = 0; let signals = 0; const details = [];

const rsi = last(indicators.rsi);

if (rsi !== null) {
  if (rsi > 55 && rsi < 75) score += 1;
  else if (rsi < 45 && rsi > 25) score -= 1;
  else if (rsi <= 25) score += 0.5;
  else if (rsi >= 75) score -= 0.5;

  signals++;

  details.push({
    name: "RSI",
    value: rsi,
    direction: rsi > 50 ? "BULLISH" : "BEARISH"
  });
}

const macd = indicators.macd;

const macdLine = last(macd?.line);
const signalLine = last(macd?.signal);
const histogram = last(macd?.histogram);

if (
  macdLine !== null &&
  signalLine !== null &&
  histogram !== null
) {
  score += macdLine > signalLine ? 1 : -1;
  signals++;
}

const stochastic = last(
  indicators.stochastic?.k
);

if (stochastic !== null) {
  if (stochastic < 20) score += 0.5;
  else if (stochastic > 80) score -= 0.5;
  else score += stochastic > 50 ? 0.5 : -0.5;

  signals++;
}

const cci = last(indicators.cci);

if (cci !== null) {
  score += cci > 0 ? 1 : -1;
  signals++;
}

const roc = last(indicators.roc);

if (roc !== null) {
  score += roc > 0 ? 1 : -1;
  signals++;
}

return {
  score: signals ? score / signals : 0,
  points: signals
    ? Math.round(((score / signals) + 1) * 50)
    : 50,
  details
};


}

// ---------------------------------------------------------- // MOVING AVERAGE ANALYSIS // ----------------------------------------------------------

function analyzeMovingAverages(price, indicators) { const periods = [9, 21, 50, 100, 200];

let score = 0;
let count = 0;

periods.forEach(period => {
  const value = last(indicators.ema?.[period]);

  if (value === null) return;

  score += price > value ? 1 : -1;
  count++;
});

const short = last(indicators.ema?.[9]);
const medium = last(indicators.ema?.[21]);
const long = last(indicators.ema?.[50]);

if (
  short !== null &&
  medium !== null &&
  long !== null
) {
  if (short > medium && medium > long) score += 1;
  else if (short < medium && medium < long) score -= 1;

  count++;
}

const normalized = count ? score / count : 0;

return {
  score: normalized,
  points: Math.round((normalized + 1) * 50)
};


}

// ---------------------------------------------------------- // VOLUME ANALYSIS // ----------------------------------------------------------

function analyzeVolume(indicators) { let score = 0; let count = 0;

const obv = indicators.obv;

if (obv && obv.length >= 10) {
  const recent = obv.slice(-10);

  score += recent[recent.length - 1] >
    recent[0] ? 1 : -1;

  count++;
}

const mfi = last(indicators.mfi);

if (mfi !== null) {
  score += mfi > 50 ? 1 : -1;
  count++;
}

const cmf = last(indicators.cmf);

if (cmf !== null) {
  score += cmf > 0 ? 1 : -1;
  count++;
}

const vpt = indicators.vpt;

if (vpt && vpt.length >= 10) {
  score += last(vpt) > vpt[vpt.length - 10] ? 1 : -1;
  count++;
}

const normalized = count ? score / count : 0;

return {
  score: normalized,
  points: Math.round((normalized + 1) * 50)
};


}

// ---------------------------------------------------------- // VOLATILITY ANALYSIS // ----------------------------------------------------------

function analyzeVolatility(price, indicators) { const atr = last(indicators.atr);

const bands = indicators.bollinger;

const upper = last(bands?.upper);
const lower = last(bands?.lower);
const middle = last(bands?.middle);

let score = 0;
let count = 0;

if (
  upper !== null &&
  lower !== null &&
  middle !== null
) {
  if (price > middle && price < upper) score += 1;
  else if (price < middle && price > lower) score -= 1;

  count++;
}

const atrPercent = atr !== null && price > 0
  ? (atr / price) * 100
  : null;

// High volatility is not inherently bullish or bearish.
// This group evaluates directional band positioning.

const normalized = count ? score / count : 0;

return {
  score: normalized,
  points: Math.round((normalized + 1) * 50),
  atr,
  atrPercent
};


}

// ---------------------------------------------------------- // SUPPORT AND RESISTANCE // ----------------------------------------------------------

function analyzeLevels(price, indicators) { const levels = indicators.supportResistance || {};

const supports = levels.support || [];
const resistances = levels.resistance || [];

const nearestSupport = supports
  .filter(x => x < price)
  .sort((a, b) => b - a)[0] ?? null;

const nearestResistance = resistances
  .filter(x => x > price)
  .sort((a, b) => a - b)[0] ?? null;

let score = 0;

if (nearestSupport !== null && nearestResistance !== null) {
  const distanceSupport = percentage(price, nearestSupport);
  const distanceResistance = percentage(nearestResistance, price);

  if (distanceSupport < distanceResistance) score = 1;
  else if (distanceResistance < distanceSupport) score = -1;
}

return {
  score,
  points: Math.round((score + 1) * 50),
  support: nearestSupport,
  resistance: nearestResistance
};


}

// ---------------------------------------------------------- // SENTIMENT ANALYSIS // ----------------------------------------------------------

function analyzeSentiment(marketData) { if (!marketData) { return { score: 0, points: 50, available: false }; }

const change = Number(marketData.change24h);

if (!Number.isFinite(change)) {
  return {
    score: 0,
    points: 50,
    available: false
  };
}

const normalized = clamp(change / 10, -1, 1);

return {
  score: normalized,
  points: Math.round((normalized + 1) * 50),
  available: true
};


}

// ---------------------------------------------------------- // WEIGHTED SCORE // ----------------------------------------------------------

function weightedScore(groups) { const weights = CONFIG.SIGNALS.weights;

const mapping = {
  trend: groups.trend,
  momentum: groups.momentum,
  movingAverages: groups.movingAverages,
  volume: groups.volume,
  volatility: groups.volatility,
  supportResistance: groups.supportResistance,
  sentiment: groups.sentiment
};

let total = 0;
let totalWeight = 0;

Object.entries(mapping).forEach(([key, group]) => {
  if (!group || !Number.isFinite(group.points)) return;

  const weight = weights[key] || 0;

  total += group.points * weight;
  totalWeight += weight;
});

return totalWeight
  ? Math.round(total / totalWeight)
  : 50;


}

// ---------------------------------------------------------- // SIGNAL CLASSIFICATION // ----------------------------------------------------------

function classify(score) { const thresholds = CONFIG.SIGNALS.thresholds;

if (score >= thresholds.strongBuy) return "STRONG BUY";
if (score >= thresholds.buy) return "BUY";
if (score >= thresholds.hold) return "HOLD";
if (score >= thresholds.sell) return "SELL";

return "STRONG SELL";


}

// ---------------------------------------------------------- // RISK MANAGEMENT // ----------------------------------------------------------

function calculateRisk(price, indicators, direction) { const atr = last(indicators.atr);

const volatility = atr || price * 0.02;

const multiplier =
  CONFIG.SIGNALS.riskManagement.atrStopMultiplier;

const stopDistance = volatility * multiplier;

const bullish = direction === "BUY";

const entry = price;

const stopLoss = bullish
  ? entry - stopDistance
  : entry + stopDistance;

const takeProfit = bullish
  ? entry + stopDistance *
    CONFIG.SIGNALS.riskManagement.defaultRiskReward
  : entry - stopDistance *
    CONFIG.SIGNALS.riskManagement.defaultRiskReward;

return {
  entry,
  stopLoss,
  takeProfit,
  riskReward:
    CONFIG.SIGNALS.riskManagement.defaultRiskReward,
  riskPercent: entry > 0
    ? Math.abs(entry - stopLoss) / entry * 100
    : 0,
  method: atr
    ? "ATR-based illustrative levels"
    : "Fallback volatility estimate"
};


}

// ---------------------------------------------------------- // MAIN SIGNAL GENERATOR // ----------------------------------------------------------

function generate(candles, forecastData = null, marketData = null) { if (!Array.isArray(candles) || candles.length < 50) { throw new Error("Insufficient candle history for signals"); }

const indicators = IND.calculateAll(candles);

const price = candles[candles.length - 1].close;

const groups = {
  trend: analyzeTrend(price, indicators),

  momentum: analyzeMomentum(indicators),

  movingAverages:
    analyzeMovingAverages(price, indicators),

  volume: analyzeVolume(indicators),

  volatility:
    analyzeVolatility(price, indicators),

  supportResistance:
    analyzeLevels(price, indicators),

  sentiment:
    analyzeSentiment(marketData)
};

// Remove unavailable sentiment from weighting rather
// than treating missing data as neutral evidence.

const score = weightedScore(groups);

const signal = classify(score);

const bullish = signal.includes("BUY");
const bearish = signal.includes("SELL");

const tradeDirection = bullish
  ? "BUY"
  : bearish
    ? "SELL"
    : "HOLD";

const risk = tradeDirection === "HOLD"
  ? null
  : calculateRisk(
      price,
      indicators,
      tradeDirection
    );

// Forecast agreement is displayed separately.
// It is not double-counted in the weighted score.

const forecastSummary = forecastData?.forecasts?.[0] || null;

let agreement = null;

if (forecastSummary) {
  agreement = {
    direction: forecastSummary.direction,
    changePercent: forecastSummary.changePercent,
    confidence: forecastSummary.confidence
  };
}

return {
  price,
  score,
  signal,
  direction: tradeDirection,

  groups,

  forecast: agreement,

  risk,

  timestamp: new Date().toISOString(),

  warning:
    "Analytical signal only. Not a guaranteed trading recommendation."
};


}

// ---------------------------------------------------------- // MULTI-TIMEFRAME CONFIRMATION // ----------------------------------------------------------

function compareTimeframes(results) { const available = Object.entries(results) .filter(([, result]) => result && Number.isFinite(result.score));

if (!available.length) {
  return {
    direction: "NEUTRAL",
    agreement: 0,
    timeframes: []
  };
}

const bullish = available.filter(
  ([, result]) => result.score >= 60
).length;

const bearish = available.filter(
  ([, result]) => result.score < 41
).length;

const neutral = available.length - bullish - bearish;

const direction = bullish > bearish
  ? "BULLISH"
  : bearish > bullish
    ? "BEARISH"
    : "NEUTRAL";

const agreement = Math.round(
  Math.max(bullish, bearish, neutral) /
  available.length * 100
);

return {
  direction,
  agreement,
  bullish,
  bearish,
  neutral,
  timeframes: available.map(([name, result]) => ({
    timeframe: name,
    score: result.score,
    signal: result.signal
  }))
};


}

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ analyzeTrend, analyzeMomentum, analyzeMovingAverages, analyzeVolume, analyzeVolatility, analyzeLevels, analyzeSentiment, weightedScore, classify, calculateRisk, generate, compareTimeframes });

})();
