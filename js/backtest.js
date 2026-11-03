/* ============================================================ CRYPTO PREDICTION — HISTORICAL BACKTEST ENGINE File: js/backtest.js ============================================================ */

window.CryptoBacktest = (() => { "use strict";

const IND = window.CryptoIndicators; const SIGNALS = window.CryptoSignals;

if (!IND || !SIGNALS) { throw new Error("Indicators and signals must load first"); }

// ---------------------------------------------------------- // DEFAULT SETTINGS // ----------------------------------------------------------

const DEFAULTS = { initialCapital: 10000, positionPercent: 10, feePercent: 0.1, slippagePercent: 0.05, minimumCandles: 250, warmupCandles: 200, evaluationHorizon: 5, minimumSignalScore: 60 };

// ---------------------------------------------------------- // HELPERS // ----------------------------------------------------------

function round(value, decimals = 2) { const factor = 10 ** decimals;

return Math.round(value * factor) / factor;


}

function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }

function maximumDrawdown(equityCurve) { let peak = -Infinity; let maximum = 0;

equityCurve.forEach(point => {
  peak = Math.max(peak, point.equity);

  if (peak > 0) {
    const drawdown =
      (peak - point.equity) / peak;

    maximum = Math.max(maximum, drawdown);
  }
});

return maximum * 100;


}

// ---------------------------------------------------------- // SIGNAL DIRECTION // ----------------------------------------------------------

function getDirection(signal) { if (signal.direction === "BUY") return 1; if (signal.direction === "SELL") return -1;

return 0;


}

// ---------------------------------------------------------- // SIMULATED TRADE // ----------------------------------------------------------

function simulateTrade( candles, entryIndex, direction, settings ) { const entryCandle = candles[entryIndex];

const entryPrice =
  entryCandle.close *
  (1 + settings.slippagePercent / 100 * direction);

const horizon = settings.evaluationHorizon;

const exitIndex = Math.min(
  entryIndex + horizon,
  candles.length - 1
);

const exitCandle = candles[exitIndex];

const exitPrice =
  exitCandle.close *
  (1 - settings.slippagePercent / 100 * direction);

if (entryPrice <= 0) return null;

const rawReturn =
  direction *
  (exitPrice - entryPrice) /
  entryPrice;

const fee = settings.feePercent / 100;

const netReturn =
  rawReturn - 2 * fee;

return {
  direction: direction > 0 ? "LONG" : "SHORT",
  entryTime: entryCandle.time,
  exitTime: exitCandle.time,
  entryPrice,
  exitPrice,
  rawReturn: rawReturn * 100,
  netReturn: netReturn * 100,
  duration: exitIndex - entryIndex,
  result: netReturn > 0 ? "WIN" :
    netReturn < 0 ? "LOSS" : "BREAKEVEN"
};


}

// ---------------------------------------------------------- // EQUITY CURVE // ----------------------------------------------------------

function buildEquityCurve(trades, initialCapital) { let equity = initialCapital;

const curve = [{
  time: trades.length
    ? trades[0].entryTime
    : 0,
  equity
}];

trades.forEach(trade => {
  equity *= 1 + trade.netReturn / 100;

  curve.push({
    time: trade.exitTime,
    equity
  });
});

return curve;


}

// ---------------------------------------------------------- // PERFORMANCE STATISTICS // ----------------------------------------------------------

function calculateStatistics(trades, initialCapital) { const wins = trades.filter( trade => trade.netReturn > 0 );

const losses = trades.filter(
  trade => trade.netReturn < 0
);

const grossProfit = wins.reduce(
  (sum, trade) => sum + trade.netReturn,
  0
);

const grossLoss = Math.abs(
  losses.reduce(
    (sum, trade) => sum + trade.netReturn,
    0
  )
);

const equityCurve = buildEquityCurve(
  trades,
  initialCapital
);

const finalEquity = equityCurve.length
  ? equityCurve[equityCurve.length - 1].equity
  : initialCapital;

const profitFactor = grossLoss > 0
  ? grossProfit / grossLoss
  : grossProfit > 0
    ? Infinity
    : 0;

const returns = trades.map(
  trade => trade.netReturn
);

const averageWin = mean(
  wins.map(trade => trade.netReturn)
);

const averageLoss = mean(
  losses.map(trade => trade.netReturn)
);

return {
  totalTrades: trades.length,

  winningTrades: wins.length,

  losingTrades: losses.length,

  breakevenTrades: trades.length -
    wins.length -
    losses.length,

  winRate: trades.length
    ? round(wins.length / trades.length * 100)
    : 0,

  totalReturn: round(
    (finalEquity / initialCapital - 1) * 100
  ),

  initialCapital,

  finalEquity: round(finalEquity),

  netProfit: round(finalEquity - initialCapital),

  profitFactor: Number.isFinite(profitFactor)
    ? round(profitFactor, 2)
    : "Infinite",

  maximumDrawdown: round(
    maximumDrawdown(equityCurve)
  ),

  averageTradeReturn: round(mean(returns), 3),

  averageWin: round(averageWin, 3),

  averageLoss: round(averageLoss, 3),

  bestTrade: trades.length
    ? round(Math.max(...returns), 3)
    : 0,

  worstTrade: trades.length
    ? round(Math.min(...returns), 3)
    : 0,

  equityCurve
};


}

// ---------------------------------------------------------- // HISTORICAL SIGNAL GENERATION // ----------------------------------------------------------

function generateHistoricalSignals( candles, settings ) { const trades = [];

const warmup = Math.max(
  settings.warmupCandles,
  50
);

const horizon = settings.evaluationHorizon;

// Only candles already available at the entry point
// are supplied to the indicator engine.

for (
  let i = warmup;
  i < candles.length - horizon;
  i++
) {
  const historicalData = candles.slice(0, i + 1);

  let signal;

  try {
    signal = SIGNALS.generate(
      historicalData,
      null,
      null
    );
  } catch (error) {
    continue;
  }

  if (
    signal.score < settings.minimumSignalScore &&
    signal.score > 100 - settings.minimumSignalScore
  ) {
    continue;
  }

  const direction = getDirection(signal);

  if (!direction) continue;

  const trade = simulateTrade(
    candles,
    i,
    direction,
    settings
  );

  if (trade) trades.push(trade);
}

return trades;


}

// ---------------------------------------------------------- // MAIN BACKTEST // ----------------------------------------------------------

function run(candles, options = {}) { if ( !Array.isArray(candles) || candles.length < DEFAULTS.minimumCandles ) { throw new Error( At least ${DEFAULTS.minimumCandles} candles are required ); }

const settings = {
  ...DEFAULTS,
  ...options
};

if (
  settings.evaluationHorizon < 1 ||
  settings.warmupCandles < 1 ||
  settings.initialCapital <= 0
) {
  throw new Error("Invalid backtest settings");
}

const trades = generateHistoricalSignals(
  candles,
  settings
);

const statistics = calculateStatistics(
  trades,
  settings.initialCapital
);

return {
  settings,
  statistics,
  trades,
  generatedAt: new Date().toISOString(),

  disclaimer:
    "Historical simulation does not guarantee future results."
};


}

// ---------------------------------------------------------- // BUY AND HOLD COMPARISON // ----------------------------------------------------------

function buyAndHold(candles, initialCapital = 10000) { if (!candles || candles.length < 2) { throw new Error("Insufficient historical data"); }

const first = candles[0].close;
const last = candles[candles.length - 1].close;

if (first <= 0) {
  throw new Error("Invalid starting price");
}

const result = (last / first - 1) * 100;

return {
  initialCapital,
  finalEquity: round(
    initialCapital * (1 + result / 100)
  ),
  totalReturn: round(result)
};


}

// ---------------------------------------------------------- // STRATEGY COMPARISON // ----------------------------------------------------------

function compareStrategies(candles) { const configurations = [ { name: "Conservative", minimumSignalScore: 75, evaluationHorizon: 5 }, { name: "Balanced", minimumSignalScore: 60, evaluationHorizon: 5 }, { name: "Aggressive", minimumSignalScore: 55, evaluationHorizon: 3 } ];

const results = configurations.map(config => ({
  name: config.name,
  ...run(candles, config).statistics
}));

return {
  strategies: results,
  buyAndHold: buyAndHold(candles)
};


}

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ DEFAULTS, simulateTrade, calculateStatistics, generateHistoricalSignals, run, buyAndHold, compareStrategies });

})();
