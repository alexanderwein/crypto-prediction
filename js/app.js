/* ============================================================ CRYPTO PREDICTION — MAIN APPLICATION File: js/app.js ============================================================ */

window.CryptoApp = (() => { "use strict";

const CONFIG = window.CryptoConfig; const API = window.CryptoAPI; const IND = window.CryptoIndicators; const FORECAST = window.CryptoForecast; const SIGNALS = window.CryptoSignals; const BACKTEST = window.CryptoBacktest; const CHART = window.CryptoChart;

if ( !CONFIG || !API || !IND || !FORECAST || !SIGNALS || !BACKTEST || !CHART ) { throw new Error( "One or more application modules are missing" ); }

// ---------------------------------------------------------- // APPLICATION STATE // ----------------------------------------------------------

const state = { coins: [], selectedCoin: null,

timeframe: "1D",
chartMode: "candles",

candles: [],
indicators: null,
forecast: null,
signal: null,
backtest: null,

loading: false,
error: null,

lastUpdated: null,

refreshTimer: null,

marketTimer: null,

chartInitialized: false,

activeIndicators: {
  sma20: true,
  ema50: true,
  bollinger: false,
  volume: true,
  rsi: true,
  macd: true
}


};

// ---------------------------------------------------------- // DOM HELPERS // ----------------------------------------------------------

function element(id) { return document.getElementById(id); }

function setText(id, value) { const el = element(id);

if (el) el.textContent = value;


}

function setHTML(id, html) { const el = element(id);

if (el) el.innerHTML = html;


}

function show(id) { const el = element(id);

if (el) el.hidden = false;


}

function hide(id) { const el = element(id);

if (el) el.hidden = true;


}

function formatPrice(value) { if (!Number.isFinite(Number(value))) return "--";

return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: Number(value) < 1 ? 6 : 2
}).format(value);


}

function formatPercent(value) { if (!Number.isFinite(Number(value))) return "--";

return `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`;


}

function formatCompact(value) { return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(Number(value) || 0); }

function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "'" })[char]); }

// ---------------------------------------------------------- // STATUS // ----------------------------------------------------------

function setStatus(message, type = "info") { const status = element("app-status");

if (!status) return;

status.textContent = message;
status.dataset.type = type;


}

function setLoading(value) { state.loading = value;

const loader = element("loading-indicator");

if (loader) {
  loader.hidden = !value;
}


}

// ---------------------------------------------------------- // MARKET DATA // ----------------------------------------------------------

async function loadMarket() { try { const markets = await API.getTopMarkets(50);

  if (!Array.isArray(markets)) {
    throw new Error("Invalid market response");
  }

  state.coins = markets;

  renderMarketTable();

  renderCoinSelector();

  setText(
    "market-updated",
    new Date().toLocaleTimeString()
  );

  if (!state.selectedCoin && markets.length) {
    await selectCoin(markets[0].symbol);
  }

  return markets;

} catch (error) {
  console.error("Market loading error:", error);

  setStatus(
    "Unable to load market data. Please try again.",
    "error"
  );

  throw error;
}


}

// ---------------------------------------------------------- // MARKET TABLE // ----------------------------------------------------------

function renderMarketTable() { const table = element("market-table-body");

if (!table) return;

table.replaceChildren();

state.coins.forEach((coin, index) => {
  const row = document.createElement("tr");

  const change = Number(coin.price_change_percentage_24h) || 0;

  row.innerHTML = `
    <td>${index + 1}</td>

    <td>
      <div class="coin-cell">
        <img
          src="${escapeHTML(coin.image || "")}"
          alt=""
          loading="lazy"
          width="25"
          height="25"
        >

        <span>${escapeHTML(coin.name)}</span>

        <small>${escapeHTML(coin.symbol.toUpperCase())}</small>
      </div>
    </td>

    <td>${formatPrice(coin.current_price)}</td>

    <td class="${change >= 0 ? "positive" : "negative"}">
      ${formatPercent(change)}
    </td>

    <td>${formatCompact(coin.total_volume)}</td>

    <td>${formatCompact(coin.market_cap)}</td>

    <td>
      <button
        class="coin-open-btn"
        data-symbol="${escapeHTML(coin.symbol)}"
      >
        Analyze
      </button>
    </td>
  `;

  table.appendChild(row);
});


}

// ---------------------------------------------------------- // COIN SELECTOR // ----------------------------------------------------------

function renderCoinSelector() { const selector = element("coin-selector");

if (!selector) return;

selector.replaceChildren();

state.coins.forEach(coin => {
  const option = document.createElement("option");

  option.value = coin.symbol;
  option.textContent =
    `${coin.symbol.toUpperCase()} — ${coin.name}`;

  selector.appendChild(option);
});

if (state.selectedCoin) {
  selector.value = state.selectedCoin.symbol;
}


}

// ---------------------------------------------------------- // SELECT COIN // ----------------------------------------------------------

async function selectCoin(symbol) { const coin = state.coins.find( c => c.symbol.toLowerCase() === symbol.toLowerCase() );

if (!coin) {
  setStatus("Cryptocurrency not found.", "error");
  return;
}

state.selectedCoin = coin;

state.candles = [];
state.indicators = null;
state.forecast = null;
state.signal = null;
state.backtest = null;

setText("coin-name", coin.name);
setText("coin-symbol", coin.symbol.toUpperCase());

setText("coin-price", formatPrice(coin.current_price));

setText(
  "coin-change",
  formatPercent(coin.price_change_percentage_24h)
);

renderCoinSelector();

await loadAnalysis();


}

// ---------------------------------------------------------- // TIMEFRAME CONFIGURATION // ----------------------------------------------------------

const TIMEFRAMES = { "1D": { interval: "hourly", days: 1 },

"7D": {
  interval: "hourly",
  days: 7
},

"1M": {
  interval: "hourly",
  days: 30
},

"3M": {
  interval: "daily",
  days: 90
},

"6M": {
  interval: "daily",
  days: 180
},

"1Y": {
  interval: "daily",
  days: 365
},

"MAX": {
  interval: "max",
  days: "max"
}


};

// ---------------------------------------------------------- // LOAD ANALYSIS // ----------------------------------------------------------

async function loadAnalysis() { if (!state.selectedCoin) return;

setLoading(true);

setStatus("Loading historical market data...");

try {
  const timeframe = TIMEFRAMES[state.timeframe];

  const candles = await API.getOHLC(
    state.selectedCoin.id,
    timeframe.days,
    timeframe.interval
  );

  if (!candles || candles.length < 50) {
    throw new Error(
      "Insufficient historical data for analysis"
    );
  }

  state.candles = candles;

  calculateAnalysis();

  renderAnalysis();

  renderChart();

  state.lastUpdated = new Date();

  setText(
    "analysis-updated",
    state.lastUpdated.toLocaleTimeString()
  );

  setStatus("Analysis updated successfully.", "success");

} catch (error) {
  console.error("Analysis error:", error);

  state.error = error.message;

  setStatus(
    "Analysis unavailable: " + error.message,
    "error"
  );

} finally {
  setLoading(false);
}


}

// ---------------------------------------------------------- // CALCULATE ALL ANALYSIS // ----------------------------------------------------------

function calculateAnalysis() { state.indicators = IND.calculateAll(state.candles);

state.forecast = FORECAST.forecast(
  state.candles,
  "1D"
);

state.signal = SIGNALS.generate(
  state.candles,
  state.forecast,
  {
    change24h:
      state.selectedCoin.price_change_percentage_24h
  }
);


}

// ---------------------------------------------------------- // RENDER ANALYSIS // ----------------------------------------------------------

function renderAnalysis() { renderSignal();

renderForecast();

renderIndicators();

renderRisk();

renderTrendSummary();


}

// ---------------------------------------------------------- // TRADING SIGNAL // ----------------------------------------------------------

function renderSignal() { if (!state.signal) return;

const signal = state.signal;

setText("trading-signal", signal.signal);

setText("signal-score", `${signal.score}/100`);

const badge = element("trading-signal");

if (badge) {
  badge.dataset.signal = signal.signal
    .toLowerCase()
    .replace(/\s+/g, "-");
}

setText(
  "signal-description",
  signal.signal === "STRONG BUY"
    ? "Multiple indicators show bullish conditions."
    : signal.signal === "BUY"
      ? "Bullish conditions detected."
      : signal.signal === "SELL"
        ? "Bearish conditions detected."
        : signal.signal === "STRONG SELL"
          ? "Multiple indicators show bearish conditions."
          : "Indicators do not show a clear directional advantage."
);


}

// ---------------------------------------------------------- // FORECAST DISPLAY // ----------------------------------------------------------

function renderForecast() { if (!state.forecast) return;

const forecasts = state.forecast.forecasts;

forecasts.forEach(item => {
  const prefix = item.id.toLowerCase();

  setText(
    `${prefix}-price`,
    formatPrice(item.predictedPrice)
  );

  setText(
    `${prefix}-change`,
    formatPercent(item.changePercent)
  );

  setText(
    `${prefix}-confidence`,
    `${item.confidence}%`
  );

  setText(
    `${prefix}-direction`,
    item.direction
  );
});


}

// ---------------------------------------------------------- // INDICATOR DISPLAY // ----------------------------------------------------------

function renderIndicators() { if (!state.indicators) return;

const indicators = state.indicators;

const values = {
  rsi: indicators.rsi?.at(-1),
  atr: indicators.atr?.at(-1),
  adx: indicators.adx?.adx?.at(-1),
  mfi: indicators.mfi?.at(-1),
  cci: indicators.cci?.at(-1)
};

Object.entries(values).forEach(([key, value]) => {
  setText(
    `indicator-${key}`,
    Number.isFinite(value)
      ? value.toFixed(2)
      : "--"
  );
});


}

// ---------------------------------------------------------- // RISK DISPLAY // ----------------------------------------------------------

function renderRisk() { if (!state.signal?.risk) { setText("risk-entry", "--"); setText("risk-stop", "--"); setText("risk-target", "--"); setText("risk-ratio", "--");

  return;
}

const risk = state.signal.risk;

setText("risk-entry", formatPrice(risk.entry));

setText("risk-stop", formatPrice(risk.stopLoss));

setText("risk-target", formatPrice(risk.takeProfit));

setText(
  "risk-ratio",
  `1:${risk.riskReward}`
);


}

// ---------------------------------------------------------- // TREND SUMMARY // ----------------------------------------------------------

function renderTrendSummary() { const groups = state.signal.groups;

const rows = [
  ["Trend", groups.trend],
  ["Momentum", groups.momentum],
  ["Moving averages", groups.movingAverages],
  ["Volume", groups.volume],
  ["Volatility", groups.volatility],
  ["Support / resistance", groups.supportResistance],
  ["Sentiment", groups.sentiment]
];

const container = element("trend-breakdown");

if (!container) return;

container.replaceChildren();

rows.forEach(([name, data]) => {
  const row = document.createElement("div");

  row.className = "indicator-row";

  row.innerHTML = `
    <span>${escapeHTML(name)}</span>
    <strong>${data.points}/100</strong>
  `;

  container.appendChild(row);
});


}

// ---------------------------------------------------------- // CHART RENDERING // ----------------------------------------------------------

function renderChart() { if (!state.candles.length) return;

const container = element("main-chart");

if (!container) return;

try {
  CHART.create("main-chart", {
    height: 480
  });

  CHART.addCandles(
    "main-chart",
    state.candles
  );

  if (state.activeIndicators.volume) {
    CHART.addVolume(
      "main-chart",
      state.candles
    );
  }

  if (state.activeIndicators.sma20) {
    CHART.addSMA(
      "main-chart",
      state.candles,
      20,
      "#f0b90b"
    );
  }

  if (state.activeIndicators.ema50) {
    CHART.addEMA(
      "main-chart",
      state.candles,
      50,
      "#3861fb"
    );
  }

  if (state.activeIndicators.bollinger) {
    CHART.addBollingerBands(
      "main-chart",
      state.candles
    );
  }

  if (state.activeIndicators.rsi) {
    CHART.createRSI(
      "main-chart",
      state.candles
    );
  }

  if (state.activeIndicators.macd) {
    CHART.createMACD(
      "main-chart",
      state.candles
    );
  }

  CHART.synchronizePanels("main-chart");

  CHART.subscribeCrosshair(
    "main-chart",
    updateCrosshair
  );

  state.chartInitialized = true;

} catch (error) {
  console.error("Chart rendering error:", error);

  setStatus(
    "Chart rendering failed: " + error.message,
    "error"
  );
}


}

// ---------------------------------------------------------- // CROSSHAIR DISPLAY // ----------------------------------------------------------

function updateCrosshair(data) { if (!data) { hide("chart-crosshair-info"); return; }

show("chart-crosshair-info");

setText(
  "crosshair-price",
  formatPrice(data.close)
);

setText(
  "crosshair-open",
  formatPrice(data.open)
);

setText(
  "crosshair-high",
  formatPrice(data.high)
);

setText(
  "crosshair-low",
  formatPrice(data.low)
);

setText(
  "crosshair-time",
  typeof data.time === "object"
    ? JSON.stringify(data.time)
    : new Date(data.time * 1000).toLocaleString()
);


}

// ---------------------------------------------------------- // TIMEFRAME SWITCHING // ----------------------------------------------------------

async function setTimeframe(timeframe) { if (!TIMEFRAMES[timeframe]) return;

state.timeframe = timeframe;

document.querySelectorAll("[data-timeframe]")
  .forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.timeframe === timeframe
    );
  });

await loadAnalysis();


}

// ---------------------------------------------------------- // INDICATOR TOGGLES // ----------------------------------------------------------

function toggleIndicator(name, enabled) { if (!(name in state.activeIndicators)) return;

state.activeIndicators[name] = enabled;

if (state.candles.length) {
  renderChart();
}


}

// ---------------------------------------------------------- // BACKTEST // ----------------------------------------------------------

function runBacktest() { if (!state.candles.length) { setStatus("Load historical data first.", "error"); return; }

try {
  state.backtest = BACKTEST.run(
    state.candles,
    {
      initialCapital: 10000,
      positionPercent: 10,
      evaluationHorizon: 5
    }
  );

  renderBacktest();

} catch (error) {
  console.error(error);

  setStatus(
    "Backtest failed: " + error.message,
    "error"
  );
}


}

function renderBacktest() { if (!state.backtest) return;

const stats = state.backtest.statistics;

const values = {
  "backtest-trades": stats.totalTrades,
  "backtest-winrate": `${stats.winRate}%`,
  "backtest-return": `${stats.totalReturn}%`,
  "backtest-drawdown": `${stats.maximumDrawdown}%`,
  "backtest-profit-factor": stats.profitFactor,
  "backtest-equity": formatPrice(stats.finalEquity)
};

Object.entries(values).forEach(([id, value]) => {
  setText(id, value);
});


}

// ---------------------------------------------------------- // MARKET SEARCH // ----------------------------------------------------------

function searchCoins(query) { const normalized = query.toLowerCase().trim();

const filtered = state.coins.filter(coin =>
  coin.name.toLowerCase().includes(normalized) ||
  coin.symbol.toLowerCase().includes(normalized)
);

renderFilteredMarket(filtered);


}

function renderFilteredMarket(coins) { const table = element("market-table-body");

if (!table) return;

table.replaceChildren();

coins.forEach(coin => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${coin.market_cap_rank || "--"}</td>

    <td>
      ${escapeHTML(coin.name)}
      <small>${escapeHTML(coin.symbol.toUpperCase())}</small>
    </td>

    <td>${formatPrice(coin.current_price)}</td>

    <td>${formatPercent(coin.price_change_percentage_24h)}</td>

    <td>${formatCompact(coin.total_volume)}</td>

    <td>${formatCompact(coin.market_cap)}</td>

    <td>
      <button
        class="coin-open-btn"
        data-symbol="${escapeHTML(coin.symbol)}"
      >
        Analyze
      </button>
    </td>
  `;

  table.appendChild(row);
});


}

// ---------------------------------------------------------- // EVENT LISTENERS // ----------------------------------------------------------

function bindEvents() { const selector = element("coin-selector");

if (selector) {
  selector.addEventListener("change", event => {
    selectCoin(event.target.value);
  });
}

const search = element("coin-search");

if (search) {
  search.addEventListener("input", event => {
    searchCoins(event.target.value);
  });
}

document.addEventListener("click", event => {
  const button = event.target.closest(
    ".coin-open-btn"
  );

  if (button) {
    selectCoin(button.dataset.symbol);
  }
});

document.querySelectorAll("[data-timeframe]")
  .forEach(button => {
    button.addEventListener("click", () => {
      setTimeframe(button.dataset.timeframe);
    });
  });

document.querySelectorAll("[data-indicator]")
  .forEach(input => {
    input.addEventListener("change", () => {
      toggleIndicator(
        input.dataset.indicator,
        input.checked
      );
    });
  });

const backtestButton = element("run-backtest");

if (backtestButton) {
  backtestButton.addEventListener(
    "click",
    runBacktest
  );
}

const refreshButton = element("refresh-data");

if (refreshButton) {
  refreshButton.addEventListener(
    "click",
    loadAnalysis
  );
}


}

// ---------------------------------------------------------- // AUTOMATIC REFRESH // ----------------------------------------------------------

function startRefresh() { stopRefresh();

state.refreshTimer = setInterval(() => {
  loadMarket().catch(console.error);
}, 60000);


}

function stopRefresh() { if (state.refreshTimer) { clearInterval(state.refreshTimer); state.refreshTimer = null; } }

// ---------------------------------------------------------- // INITIALIZE // ----------------------------------------------------------

async function init() { bindEvents();

setStatus("Initializing cryptocurrency dashboard...");

try {
  await loadMarket();

  startRefresh();

  setStatus(
    "Crypto Prediction is ready.",
    "success"
  );

} catch (error) {
  setStatus(
    "Initialization failed. Check your internet connection.",
    "error"
  );
}


}

// ---------------------------------------------------------- // CLEANUP // ----------------------------------------------------------

function destroy() { stopRefresh();

CHART.destroy("main-chart");


}

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ state, init, destroy, loadMarket, loadAnalysis, selectCoin, setTimeframe, toggleIndicator, runBacktest, searchCoins, formatPrice, formatPercent });

})();

// Start application after HTML has loaded. document.addEventListener("DOMContentLoaded", () => { window.CryptoApp.init(); });
