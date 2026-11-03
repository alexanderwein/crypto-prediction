
/**
 * CRYPTO PREDICTION PRO
 * File: js/config.js
 * Version: 1.0.0
 *
 * Strategy: BALANCED
 * Interface: DARK
 * Assets: TOP 50 cryptocurrencies
 * Hosting: GitHub Pages
 */

export const APP_CONFIG = {
  name: "Crypto Prediction Pro",
  version: "1.0.0",
  strategy: "balanced",
  theme: "dark",
  currency: "USD",

  market: {
    coinLimit: 50,
    sortBy: "market_cap_desc",
    refreshInterval: 30000,
    historyDays: "max",
    defaultCoin: "bitcoin",
    defaultSymbol: "BTC"
  },

  api: {
    coingecko: {
      baseUrl: "https://api.coingecko.com/api/v3",
      markets: "/coins/markets",
      history: "/coins/{id}/market_chart",
      coinDetails: "/coins/{id}",
      currency: "usd",
      timeout: 15000
    },

    binance: {
      baseUrl: "https://api.binance.com/api/v3",
      ticker: "/ticker/24hr",
      klines: "/klines",
      enabled: true
    }
  },

  chart: {
    defaultInterval: "1D",

    intervals: {
      "1D": {
        label: "1 Day",
        days: 1,
        granularity: "hourly"
      },
      "7D": {
        label: "7 Days",
        days: 7,
        granularity: "hourly"
      },
      "1M": {
        label: "1 Month",
        days: 30,
        granularity: "hourly"
      },
      "3M": {
        label: "3 Months",
        days: 90,
        granularity: "daily"
      },
      "6M": {
        label: "6 Months",
        days: 180,
        granularity: "daily"
      },
      "1Y": {
        label: "1 Year",
        days: 365,
        granularity: "daily"
      },
      "2Y": {
        label: "2 Years",
        days: 730,
        granularity: "daily"
      },
      "5Y": {
        label: "5 Years",
        days: 1825,
        granularity: "daily"
      },
      "MAX": {
        label: "Maximum",
        days: "max",
        granularity: "daily"
      }
    },

    appearance: {
      background: "#0B0E14",
      panel: "#121722",
      grid: "#202938",
      text: "#A7B1C2",
      bullish: "#00C087",
      bearish: "#F6465D",
      crosshair: "#75849B",
      candleUp: "#00C087",
      candleDown: "#F6465D",
      volumeUp: "rgba(0,192,135,0.35)",
      volumeDown: "rgba(246,70,93,0.35)"
    },

    crosshair: {
      enabled: true,
      mode: "normal",
      verticalLine: true,
      horizontalLine: true,
      showTooltip: true
    },

    indicatorsVisible: true,
    volumeVisible: true,
    autoScale: true
  },

  indicators: {
    sma: [20, 50, 100, 200],
    ema: [9, 12, 21, 50, 200],

    rsi: {
      period: 14,
      overbought: 70,
      oversold: 30
    },

    macd: {
      fast: 12,
      slow: 26,
      signal: 9
    },

    bollinger: {
      period: 20,
      standardDeviation: 2
    },

    stochastic: {
      period: 14,
      signal: 3,
      overbought: 80,
      oversold: 20
    },

    atr: {
      period: 14
    },

    adx: {
      period: 14,
      trendThreshold: 25
    },

    cci: {
      period: 20
    },

    williamsR: {
      period: 14
    },

    mfi: {
      period: 14
    },

    obv: {
      enabled: true
    },

    vwap: {
      enabled: true
    },

    parabolicSAR: {
      step: 0.02,
      maximum: 0.2
    },

    ichimoku: {
      conversion: 9,
      base: 26,
      spanB: 52,
      displacement: 26
    },

    fibonacci: {
      levels: [
        0,
        0.236,
        0.382,
        0.5,
        0.618,
        0.786,
        1
      ]
    },

    cmf: {
      period: 20
    },

    keltner: {
      emaPeriod: 20,
      atrPeriod: 10,
      multiplier: 2
    }
  },

  prediction: {
    strategy: "balanced",

    // Signal score ranges from -100 to +100.
    thresholds: {
      strongBuy: 65,
      buy: 25,
      hold: -24,
      sell: -64,
      strongSell: -65
    },

    // Relative weights of analytical categories.
    weights: {
      trend: 0.30,
      momentum: 0.25,
      volume: 0.15,
      volatility: 0.10,
      marketStructure: 0.10,
      multiTimeframe: 0.10
    },

    // Minimum available confirmations.
    minimumConfirmations: 3,

    requireVolumeConfirmation: false,

    timeframes: [
      "1D",
      "7D",
      "1M"
    ],

    displayConfidence: true,
    displayReasons: true,
    displayEntry: true,
    displayStopLoss: true,
    displayTakeProfit: true
  },

  risk: {
    // Analytical reference levels, not automated execution.
    riskRewardRatio: 2,
    stopLossATRMultiplier: 1.5,
    takeProfitATRMultiplier: 3,
    maxRiskPercent: 1,
    minimumRiskReward: 1.5
  },

  dashboard: {
    defaultView: "overview",
    showTopGainers: true,
    showTopLosers: true,
    showVolumeLeaders: true,
    showMarketSentiment: true,
    showTradingSignals: true,
    enableSearch: true,
    enableSorting: true,
    rowsPerPage: 50
  },

  ui: {
    theme: "dark",

    colors: {
      background: "#0B0E14",
      surface: "#121722",
      surfaceAlt: "#192230",
      border: "#273244",
      text: "#EAECEF",
      muted: "#848E9C",
      green: "#00C087",
      red: "#F6465D",
      yellow: "#F0B90B",
      blue: "#3861FB",
      purple: "#9B59B6"
    },

    animation: true,
    responsive: true,
    compactNumbers: true
  }
};

// Shared application constants.

export const SIGNALS = {
  STRONG_BUY: "STRONG BUY",
  BUY: "BUY",
  HOLD: "HOLD",
  SELL: "SELL",
  STRONG_SELL: "STRONG SELL"
};

export const MARKET_COLORS = {
  bullish: "#00C087",
  bearish: "#F6465D",
  neutral: "#848E9C"
};

export const STORAGE_KEYS = {
  selectedCoin: "cpp_selected_coin",
  selectedInterval: "cpp_chart_interval",
  watchlist: "cpp_watchlist",
  preferences: "cpp_preferences"
};

// Helper: retrieve a chart interval configuration.

export function getIntervalConfig(interval) {
  return (
    APP_CONFIG.chart.intervals[interval] ||
    APP_CONFIG.chart.intervals["1D"]
  );
}

// Helper: determine signal from a normalized score.

export function getSignal(score) {
  const t = APP_CONFIG.prediction.thresholds;

  if (score >= t.strongBuy) {
    return SIGNALS.STRONG_BUY;
  }

  if (score >= t.buy) {
    return SIGNALS.BUY;
  }

  if (score <= t.strongSell) {
    return SIGNALS.STRONG_SELL;
  }

  if (score <= t.sell) {
    return SIGNALS.SELL;
  }

  return SIGNALS.HOLD;
}

// Helper: validate prediction weights.

export function validateWeights(weights = APP_CONFIG.prediction.weights) {
  const total = Object.values(weights)
    .reduce((sum, value) => sum + value, 0);

  return Math.abs(total - 1) < 0.0001;
}

// Development diagnostics.

if (!validateWeights()) {
  console.error(
    "[Crypto Prediction Pro] Invalid prediction weights."
  );
}

console.info(
  `[${APP_CONFIG.name}] Configuration loaded.`
);
