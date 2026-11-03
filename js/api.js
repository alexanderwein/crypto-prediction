
/**
 * CRYPTO PREDICTION PRO
 * File: js/api.js
 * Version: 1.0.0
 *
 * Market data provider:
 * CoinGecko public API
 * Binance public API (supplementary)
 */

import { APP_CONFIG, getIntervalConfig } from "./config.js";

const CG = APP_CONFIG.api.coingecko;
const BN = APP_CONFIG.api.binance;

// --------------------------------------------------
// CACHE MANAGEMENT
// --------------------------------------------------

const cache = new Map();

const CACHE_DURATION = {
  markets: 30000,
  history: 60000,
  details: 120000,
  ticker: 15000
};

function getCached(key) {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.duration) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCached(key, data, duration) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration
  });

  return data;
}

export function clearCache() {
  cache.clear();
}

// --------------------------------------------------
// HTTP REQUEST ENGINE
// --------------------------------------------------

async function request(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || CG.timeout
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...options.headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `API error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Market data request timed out.");
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}

// --------------------------------------------------
// COINGECKO URL BUILDER
// --------------------------------------------------

function cgUrl(endpoint, params = {}) {
  const url = new URL(CG.baseUrl + endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

// --------------------------------------------------
// TOP 50 CRYPTOCURRENCIES
// --------------------------------------------------

export async function getTopCoins(forceRefresh = false) {
  const key = "top_coins";

  if (!forceRefresh) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const url = cgUrl(CG.markets, {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: APP_CONFIG.market.coinLimit,
    page: 1,
    sparkline: true,
    price_change_percentage: "1h,24h,7d,30d"
  });

  const data = await request(url);

  const normalized = data.map(normalizeCoin);

  return setCached(
    key,
    normalized,
    CACHE_DURATION.markets
  );
}

// --------------------------------------------------
// COIN NORMALIZATION
// --------------------------------------------------

export function normalizeCoin(coin) {
  return {
    id: coin.id,
    symbol: String(coin.symbol || "").toUpperCase(),
    name: coin.name,

    image: coin.image || null,

    price: Number(coin.current_price) || 0,

    marketCap: Number(coin.market_cap) || 0,

    marketCapRank: coin.market_cap_rank || null,

    volume24h: Number(coin.total_volume) || 0,

    high24h: Number(coin.high_24h) || 0,

    low24h: Number(coin.low_24h) || 0,

    change1h: Number(
      coin.price_change_percentage_1h_in_currency
    ) || 0,

    change24h: Number(
      coin.price_change_percentage_24h
    ) || 0,

    change7d: Number(
      coin.price_change_percentage_7d_in_currency
    ) || 0,

    change30d: Number(
      coin.price_change_percentage_30d_in_currency
    ) || 0,

    circulatingSupply:
      Number(coin.circulating_supply) || 0,

    totalSupply:
      coin.total_supply === null
        ? null
        : Number(coin.total_supply) || 0,

    maxSupply:
      coin.max_supply === null
        ? null
        : Number(coin.max_supply) || 0,

    ath: Number(coin.ath) || 0,

    athChange: Number(coin.ath_change_percentage) || 0,

    sparkline: coin.sparkline_in_7d?.price || [],

    lastUpdated: coin.last_updated || null
  };
}

// --------------------------------------------------
// SINGLE COIN DETAILS
// --------------------------------------------------

export async function getCoinDetails(
  coinId,
  forceRefresh = false
) {
  const key = `details_${coinId}`;

  if (!forceRefresh) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const url = cgUrl(
    CG.coinDetails.replace("{id}", encodeURIComponent(coinId)),
    {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: true
    }
  );

  const data = await request(url);

  return setCached(
    key,
    data,
    CACHE_DURATION.details
  );
}

// --------------------------------------------------
// HISTORICAL MARKET DATA
// --------------------------------------------------

export async function getMarketHistory(
  coinId,
  interval = APP_CONFIG.chart.defaultInterval,
  forceRefresh = false
) {
  const intervalConfig = getIntervalConfig(interval);

  const key = `history_${coinId}_${interval}`;

  if (!forceRefresh) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const params = {
    vs_currency: "usd",
    interval: "daily"
  };

  if (intervalConfig.days === "max") {
    params.days = "max";
    delete params.interval;
  } else {
    params.days = intervalConfig.days;
  }

  const url = cgUrl(
    CG.history.replace(
      "{id}",
      encodeURIComponent(coinId)
    ),
    params
  );

  const data = await request(url);

  const history = normalizeHistory(data);

  return setCached(
    key,
    history,
    CACHE_DURATION.history
  );
}

// --------------------------------------------------
// HISTORY NORMALIZATION
// --------------------------------------------------

export function normalizeHistory(data) {
  const prices = data.prices || [];
  const volumes = data.total_volumes || [];
  const marketCaps = data.market_caps || [];

  const volumeMap = new Map(
    volumes.map(item => [item[0], item[1]])
  );

  const capMap = new Map(
    marketCaps.map(item => [item[0], item[1]])
  );

  return prices.map(([timestamp, price]) => ({
    time: Math.floor(timestamp / 1000),

    timestamp,

    price: Number(price),

    volume: Number(
      volumeMap.get(timestamp) || 0
    ),

    marketCap: Number(
      capMap.get(timestamp) || 0
    )
  })).filter(item =>
    Number.isFinite(item.time) &&
    Number.isFinite(item.price) &&
    item.price > 0
  );
}

// --------------------------------------------------
// BINANCE SYMBOL MAPPING
// --------------------------------------------------

export function toBinanceSymbol(symbol) {
  return `${String(symbol).toUpperCase()}USDT`;
}

// --------------------------------------------------
// BINANCE 24-HOUR TICKER
// --------------------------------------------------

export async function getBinanceTicker(
  symbol,
  forceRefresh = false
) {
  if (!BN.enabled) return null;

  const pair = toBinanceSymbol(symbol);
  const key = `binance_${pair}`;

  if (!forceRefresh) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  try {
    const url = BN.baseUrl + BN.ticker +
      "?symbol=" + encodeURIComponent(pair);

    const data = await request(url, {
      timeout: 10000
    });

    const normalized = {
      symbol: data.symbol,

      price: Number(data.lastPrice),

      change24h: Number(
        data.priceChangePercent
      ),

      high24h: Number(data.highPrice),

      low24h: Number(data.lowPrice),

      volume24h: Number(data.quoteVolume),

      trades: Number(data.count),

      timestamp: data.closeTime
    };

    return setCached(
      key,
      normalized,
      CACHE_DURATION.ticker
    );

  } catch (error) {
    console.warn(
      `[Binance] Ticker unavailable for ${pair}:`,
      error.message
    );

    return null;
  }
}

// --------------------------------------------------
// BINANCE HISTORICAL CANDLES
// --------------------------------------------------

export async function getBinanceCandles(
  symbol,
  interval = "1d",
  limit = 1000
) {
  if (!BN.enabled) return [];

  const pair = toBinanceSymbol(symbol);

  const allowedIntervals = [
    "1m", "5m", "15m", "30m",
    "1h", "4h", "1d", "1w", "1M"
  ];

  if (!allowedIntervals.includes(interval)) {
    throw new Error("Unsupported Binance interval.");
  }

  const url = BN.baseUrl + BN.klines +
    `?symbol=${encodeURIComponent(pair)}` +
    `&interval=${interval}` +
    `&limit=${Math.min(Math.max(limit, 1), 1000)}`;

  try {
    const data = await request(url, {
      timeout: 10000
    });

    return data.map(candle => ({
      time: Math.floor(candle[0] / 1000),

      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),

      volume: Number(candle[5]),

      closeTime: candle[6],

      quoteVolume: Number(candle[7]),

      trades: Number(candle[8])
    }));

  } catch (error) {
    console.warn(
      `[Binance] Candles unavailable for ${pair}:`,
      error.message
    );

    return [];
  }
}

// --------------------------------------------------
// LIVE MARKET SNAPSHOT
// --------------------------------------------------

export async function getMarketSnapshot() {
  const coins = await getTopCoins();

  const totalMarketCap = coins.reduce(
    (sum, coin) => sum + coin.marketCap,
    0
  );

  const totalVolume = coins.reduce(
    (sum, coin) => sum + coin.volume24h,
    0
  );

  const gainers = [...coins]
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 5);

  const losers = [...coins]
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, 5);

  const bullish = coins.filter(
    coin => coin.change24h > 0
  ).length;

  const bearish = coins.filter(
    coin => coin.change24h < 0
  ).length;

  return {
    coins,

    totalMarketCap,

    totalVolume,

    gainers,

    losers,

    bullish,

    bearish,

    neutral: coins.length - bullish - bearish,

    timestamp: Date.now()
  };
}

// --------------------------------------------------
// API HEALTH CHECK
// --------------------------------------------------

export async function checkApiStatus() {
  try {
    const url = cgUrl(CG.markets, {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 1,
      page: 1
    });

    await request(url, {
      timeout: 10000
    });

    return {
      provider: "CoinGecko",
      status: "online",
      timestamp: Date.now()
    };

  } catch (error) {
    return {
      provider: "CoinGecko",
      status: "offline",
      error: error.message,
      timestamp: Date.now()
    };
  }
}

// --------------------------------------------------
// UTILITY: FORMAT NUMBERS
// --------------------------------------------------

export function formatPrice(value) {
  if (!Number.isFinite(Number(value))) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits:
      value < 1 ? 6 : 2
  }).format(value);
}

export function formatCompact(value) {
  if (!Number.isFinite(Number(value))) return "—";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercentage(value) {
  if (!Number.isFinite(Number(value))) return "—";

  const sign = value > 0 ? "+" : "";

  return `${sign}${Number(value).toFixed(2)}%`;
}
