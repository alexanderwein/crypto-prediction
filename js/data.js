/* ============================================================ CRYPTO PREDICTION — MARKET DATA ENGINE File: js/data.js ============================================================ */

window.CryptoData = (() => { "use strict";

const CONFIG = window.CryptoConfig;

if (!CONFIG) { throw new Error("CryptoConfig must load before data.js"); }

const cache = new Map();

// ---------------------------------------------------------- // GENERAL HELPERS // ----------------------------------------------------------

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function cacheGet(key, ttl) { const item = cache.get(key);

if (!item) return null;

if (Date.now() - item.time > ttl) {
  cache.delete(key);
  return null;
}

return item.value;


}

function cacheSet(key, value) { cache.set(key, { value, time: Date.now() });

while (cache.size > CONFIG.CACHE.maxHistoricalEntries) {
  cache.delete(cache.keys().next().value);
}

return value;


}

async function fetchJSON(url, options = {}) { const controller = new AbortController();

const timeout = setTimeout(
  () => controller.abort(),
  CONFIG.APP.requestTimeout
);

try {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(
      `API error ${response.status}: ${response.statusText}`
    );
  }

  return await response.json();

} finally {
  clearTimeout(timeout);
}


}

function normalizeNumber(value) { const number = Number(value);

return Number.isFinite(number) ? number : 0;


}

// ---------------------------------------------------------- // TOP 50 CRYPTOCURRENCIES // ----------------------------------------------------------

async function getTopCoins(forceRefresh = false) { const key = "top-coins";

if (!forceRefresh) {
  const cached = cacheGet(
    key,
    CONFIG.CACHE.marketDataTTL
  );

  if (cached) return cached;
}

const params = new URLSearchParams({
  vs_currency: CONFIG.APP.currency.toLowerCase(),
  order: CONFIG.MARKET.sortBy,
  per_page: String(CONFIG.APP.maxCoins),
  page: "1",
  sparkline: "true",
  price_change_percentage: "1h,24h,7d,30d"
});

const url =
  CONFIG.API.coingecko.base +
  CONFIG.API.coingecko.markets +
  "?" +
  params.toString();

const raw = await fetchJSON(url);

const coins = raw.map((coin, index) => ({
  rank: coin.market_cap_rank || index + 1,
  id: coin.id,
  symbol: coin.symbol.toUpperCase(),
  name: coin.name,
  image: coin.image,

  price: normalizeNumber(coin.current_price),

  marketCap: normalizeNumber(coin.market_cap),

  volume: normalizeNumber(coin.total_volume),

  high24h: normalizeNumber(coin.high_24h),

  low24h: normalizeNumber(coin.low_24h),

  change1h: normalizeNumber(
    coin.price_change_percentage_1h_in_currency
  ),

  change24h: normalizeNumber(
    coin.price_change_percentage_24h
  ),

  change7d: normalizeNumber(
    coin.price_change_percentage_7d_in_currency
  ),

  change30d: normalizeNumber(
    coin.price_change_percentage_30d_in_currency
  ),

  circulatingSupply: normalizeNumber(
    coin.circulating_supply
  ),

  totalSupply: normalizeNumber(
    coin.total_supply
  ),

  sparkline: coin.sparkline_in_7d?.price || [],

  lastUpdated: coin.last_updated
}));

return cacheSet(key, coins);


}

// ---------------------------------------------------------- // BINANCE SYMBOL RESOLUTION // ----------------------------------------------------------

const BINANCE_SYMBOLS = { bitcoin: "BTCUSDT", ethereum: "ETHUSDT", binancecoin: "BNBUSDT", ripple: "XRPUSDT", solana: "SOLUSDT", dogecoin: "DOGEUSDT", cardano: "ADAUSDT", tron: "TRXUSDT", avalanche: "AVAXUSDT", chainlink: "LINKUSDT", polkadot: "DOTUSDT", litecoin: "LTCUSDT", bitcoin-cash: "BCHUSDT", stellar: "XLMUSDT", sui: "SUIUSDT", toncoin: "TONUSDT", uniswap: "UNIUSDT", near: "NEARUSDT", aptos: "APTUSDT", internet-computer: "ICPUSDT" };

function getBinanceSymbol(coinId, symbol) { return BINANCE_SYMBOLS[coinId] || ${String(symbol).toUpperCase()}USDT; }

// ---------------------------------------------------------- // BINANCE INTERVAL MAPPING // ----------------------------------------------------------

function getBinanceInterval(timeframe) { const mapping = { "1D": "1h", "3D": "1h", "1W": "4h", "1M": "4h", "3M": "1d", "6M": "1d", "1Y": "1d", "2Y": "1d", "5Y": "1d", "MAX": "1d" };

return mapping[timeframe] || "1d";


}

function getRequestedDays(timeframe) { const item = CONFIG.TIMEFRAMES.find( entry => entry.id === timeframe );

return item?.days ?? 30;


}

// ---------------------------------------------------------- // BINANCE HISTORICAL CANDLES // ----------------------------------------------------------

async function getBinanceHistory( coinId, symbol, timeframe ) { const binanceSymbol = getBinanceSymbol( coinId, symbol );

const interval = getBinanceInterval(timeframe);

const days = getRequestedDays(timeframe);

const limit = Math.min(
  1000,
  days === "max" ? 1000 :
    Math.ceil(days * 24 / (
      interval === "1h" ? 1 :
      interval === "4h" ? 4 : 24
    ))
);

const params = new URLSearchParams({
  symbol: binanceSymbol,
  interval,
  limit: String(limit)
});

const url =
  CONFIG.API.binance.base +
  CONFIG.API.binance.klines +
  "?" +
  params.toString();

const raw = await fetchJSON(url);

return raw.map(candle => ({
  time: Math.floor(candle[0] / 1000),
  open: Number(candle[1]),
  high: Number(candle[2]),
  low: Number(candle[3]),
  close: Number(candle[4]),
  volume: Number(candle[5])
})).filter(candle =>
  Number.isFinite(candle.close) &&
  candle.close > 0
);


}

// ---------------------------------------------------------- // COINGECKO HISTORICAL DATA // ----------------------------------------------------------

async function getCoinGeckoHistory( coinId, timeframe ) { const days = getRequestedDays(timeframe);

const params = new URLSearchParams({
  vs_currency: CONFIG.APP.currency.toLowerCase(),
  days: String(days),
  interval: days === 1 || days === 3 ? "hourly" : "daily",
  precision: "full"
});

const url =
  CONFIG.API.coingecko.base +
  CONFIG.API.coingecko.chart(coinId) +
  "?" +
  params.toString();

const raw = await fetchJSON(url);

const volumes = new Map(
  (raw.total_volumes || []).map(item => [
    Math.floor(item[0] / 1000),
    normalizeNumber(item[1])
  ])
);

const prices = raw.prices || [];

const marketCaps = new Map(
  (raw.market_caps || []).map(item => [
    Math.floor(item[0] / 1000),
    normalizeNumber(item[1])
  ])
);

const candles = [];

for (let i = 0; i < prices.length; i++) {
  const timestamp = prices[i][0];
  const close = normalizeNumber(prices[i][1]);

  if (close <= 0) continue;

  const previous = candles[candles.length - 1];

  const time = Math.floor(timestamp / 1000);

  const open = previous
    ? previous.close
    : close;

  candles.push({
    time,
    open,
    high: Math.max(open, close),
    low: Math.min(open, close),
    close,
    volume: volumes.get(time) || 0,
    marketCap: marketCaps.get(time) || 0
  });
}

return candles;


}

// ---------------------------------------------------------- // UNIFIED HISTORICAL DATA ACCESS // ----------------------------------------------------------

async function getHistory( coinId, symbol, timeframe = "1M", forceRefresh = false ) { const key = history-${coinId}-${timeframe};

if (!forceRefresh) {
  const cached = cacheGet(
    key,
    CONFIG.CACHE.historicalDataTTL
  );

  if (cached) return cached;
}

let candles = [];

// Binance provides true exchange OHLCV candles.
// CoinGecko provides a broader historical fallback.

try {
  candles = await getBinanceHistory(
    coinId,
    symbol,
    timeframe
  );

} catch (error) {
  console.warn(
    "Binance unavailable. Using CoinGecko:",
    error.message
  );
}

if (!candles.length) {
  candles = await getCoinGeckoHistory(
    coinId,
    timeframe
  );
}

if (!candles.length) {
  throw new Error(
    `No historical data available for ${coinId}`
  );
}

candles.sort((a, b) => a.time - b.time);

return cacheSet(key, candles);


}

// ---------------------------------------------------------- // BINANCE LIVE PRICE // ----------------------------------------------------------

async function getLivePrice(symbol) { const binanceSymbol = String(symbol).toUpperCase() + "USDT";

const params = new URLSearchParams({
  symbol: binanceSymbol
});

const url =
  CONFIG.API.binance.base +
  CONFIG.API.binance.ticker +
  "?" +
  params.toString();

const result = await fetchJSON(url);

return {
  symbol: result.symbol,
  price: normalizeNumber(result.lastPrice),
  change24h: normalizeNumber(
    result.priceChangePercent
  ),
  high24h: normalizeNumber(result.highPrice),
  low24h: normalizeNumber(result.lowPrice),
  volume: normalizeNumber(result.volume),
  quoteVolume: normalizeNumber(result.quoteVolume),
  timestamp: Date.now()
};


}

// ---------------------------------------------------------- // MARKET OVERVIEW // ----------------------------------------------------------

async function getMarketOverview() { const url = CONFIG.API.coingecko.base + "/global";

const result = await fetchJSON(url);

const data = result.data;

return {
  totalMarketCap:
    data.total_market_cap?.usd || 0,

  totalVolume:
    data.total_volume?.usd || 0,

  marketCapChange24h:
    data.market_cap_change_percentage_24h_usd || 0,

  btcDominance:
    data.market_cap_percentage?.btc || 0,

  ethDominance:
    data.market_cap_percentage?.eth || 0,

  activeCryptocurrencies:
    data.active_cryptocurrencies || 0,

  markets:
    data.markets || 0
};


}

// ---------------------------------------------------------- // CACHE MANAGEMENT // ----------------------------------------------------------

function clearCache() { cache.clear(); }

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ getTopCoins, getHistory, getLivePrice, getMarketOverview, getBinanceSymbol, clearCache, fetchJSON });

})();
