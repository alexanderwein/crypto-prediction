/* ============================================================ CRYPTO PREDICTION — CENTRAL CONFIGURATION File: js/config.js ============================================================ */

window.CryptoConfig = (() => { "use strict";

const APP = { name: "Crypto Prediction", version: "1.0.0", currency: "USD", locale: "en-US", defaultCoin: "bitcoin", maxCoins: 50, refreshInterval: 30000, requestTimeout: 15000 };

// ---------------------------------------------------------- // MARKET DATA PROVIDERS // ----------------------------------------------------------

const API = { coingecko: { base: "https://api.coingecko.com/api/v3", markets: "/coins/markets", chart: id => /coins/${encodeURIComponent(id)}/market_chart, timeout: 15000 },

binance: {
  base: "https://api.binance.com/api/v3",
  klines: "/klines",
  ticker: "/ticker/24hr"
}


};

// ---------------------------------------------------------- // HISTORICAL CHART INTERVALS // ----------------------------------------------------------

const TIMEFRAMES = [ { id: "1D", label: "1D", days: 1, granularity: "hourly" }, { id: "3D", label: "3D", days: 3, granularity: "hourly" }, { id: "1W", label: "1W", days: 7, granularity: "hourly" }, { id: "1M", label: "1M", days: 30, granularity: "daily" }, { id: "3M", label: "3M", days: 90, granularity: "daily" }, { id: "6M", label: "6M", days: 180, granularity: "daily" }, { id: "1Y", label: "1Y", days: 365, granularity: "daily" }, { id: "2Y", label: "2Y", days: 730, granularity: "daily" }, { id: "5Y", label: "5Y", days: 1825, granularity: "daily" }, { id: "MAX", label: "MAX", days: "max", granularity: "daily" } ];

// ---------------------------------------------------------- // DEFAULT INDICATOR SETTINGS // ----------------------------------------------------------

const INDICATORS = { sma: { enabled: true, periods: [20, 50, 100, 200] },

ema: {
  enabled: true,
  periods: [9, 12, 21, 26, 50, 100, 200]
},

rsi: {
  enabled: true,
  period: 14,
  overbought: 70,
  oversold: 30
},

macd: {
  enabled: true,
  fast: 12,
  slow: 26,
  signal: 9
},

bollinger: {
  enabled: true,
  period: 20,
  deviation: 2
},

stochastic: {
  enabled: true,
  period: 14,
  smoothK: 3,
  smoothD: 3
},

atr: {
  enabled: true,
  period: 14
},

adx: {
  enabled: true,
  period: 14
},

cci: {
  enabled: true,
  period: 20
},

williamsR: {
  enabled: true,
  period: 14
},

obv: {
  enabled: true
},

vwap: {
  enabled: true
},

mfi: {
  enabled: true,
  period: 14
},

supertrend: {
  enabled: true,
  period: 10,
  multiplier: 3
},

ichimoku: {
  enabled: true,
  conversion: 9,
  base: 26,
  spanB: 52
},

parabolicSAR: {
  enabled: true,
  step: 0.02,
  maximum: 0.2
},

roc: {
  enabled: true,
  period: 12
},

momentum: {
  enabled: true,
  period: 10
},

cmf: {
  enabled: true,
  period: 20
}


};

// ---------------------------------------------------------- // TRADING SIGNAL CONFIGURATION // ----------------------------------------------------------

const SIGNALS = { weights: { trend: 25, momentum: 20, movingAverages: 15, volume: 15, volatility: 10, supportResistance: 10, sentiment: 5 },

thresholds: {
  strongBuy: 75,
  buy: 60,
  hold: 41,
  sell: 26,
  strongSell: 0
},

minimumDataPoints: 200,

riskManagement: {
  defaultRiskReward: 2,
  atrStopMultiplier: 2,
  maximumRiskPercent: 2
}


};

// ---------------------------------------------------------- // FORECAST CONFIGURATION // ----------------------------------------------------------

const FORECAST = { horizons: [ { id: "24H", label: "24 Hours", hours: 24 }, { id: "7D", label: "7 Days", hours: 168 }, { id: "30D", label: "30 Days", hours: 720 } ],

models: {
  linearRegression: true,
  exponentialSmoothing: true,
  momentum: true,
  volatility: true,
  historicalPatterns: true
},

minimumSamples: 100,
confidenceLevels: [0.80, 0.95]


};

// ---------------------------------------------------------- // CHART CONFIGURATION // ----------------------------------------------------------

const CHART = { libraryURL: "https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js",

layout: {
  background: "#0B1220",
  textColor: "#C8D2E1",
  gridColor: "#1B2738"
},

colors: {
  bullish: "#16C784",
  bearish: "#EA3943",
  neutral: "#F0B90B",
  ema: "#F5A623",
  sma: "#4DA3FF",
  rsi: "#B084F5",
  macd: "#26A69A",
  volume: "#65758B",
  bollinger: "#9B87F5"
},

crosshair: {
  mode: 1,
  vertLine: {
    color: "#75849B",
    width: 1,
    style: 2,
    labelBackgroundColor: "#334155"
  },
  horzLine: {
    color: "#75849B",
    width: 1,
    style: 2,
    labelBackgroundColor: "#334155"
  }
},

rightPriceScale: {
  borderColor: "#263449"
},

timeScale: {
  borderColor: "#263449",
  timeVisible: true,
  secondsVisible: false
}


};

// ---------------------------------------------------------- // MARKET DISPLAY SETTINGS // ----------------------------------------------------------

const MARKET = { sortBy: "market_cap_desc", page: 1, perPage: 50,

sparkline: true,

priceChangePeriods: [
  "1h",
  "24h",
  "7d",
  "30d"
]


};

// ---------------------------------------------------------- // CACHE SETTINGS // ----------------------------------------------------------

const CACHE = { marketDataTTL: 30000, historicalDataTTL: 300000, maxHistoricalEntries: 100 };

// ---------------------------------------------------------- // APPLICATION EXPORTS // ----------------------------------------------------------

return Object.freeze({ APP, API, TIMEFRAMES, INDICATORS, SIGNALS, FORECAST, CHART, MARKET, CACHE });

})();
