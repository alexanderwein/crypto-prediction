
/*
 * CRYPTO PREDICTION PRO
 * File: js/api.js
 * Version: 1.0.0
 *
 * Market data API integration.
 * CoinGecko + Binance public market APIs.
 */

import { APP_CONFIG, getIntervalConfig } from "./config.js";


// =====================================
// API CLIENT
// =====================================

class CryptoAPI {

    constructor() {

        this.cache = new Map();

        this.pendingRequests = new Map();

        this.requestTimeout = APP_CONFIG.api.coingecko.timeout;

    }


    // =================================
    // CACHE MANAGEMENT
    // =================================

    getCache(key) {

        const item = this.cache.get(key);

        if (!item) return null;

        if (Date.now() > item.expires) {

            this.cache.delete(key);

            return null;

        }

        return item.data;

    }


    setCache(key, data, duration = APP_CONFIG.api.cacheDuration) {

        this.cache.set(key, {

            data,

            expires: Date.now() + duration

        });

    }


    clearCache() {

        this.cache.clear();

    }


    // =================================
    // GENERIC FETCH WITH TIMEOUT
    // =================================

    async fetchJSON(url, options = {}) {

        const controller = new AbortController();

        const timeout = options.timeout || 15000;

        const timer = setTimeout(
            () => controller.abort(),
            timeout
        );

        try {

            const response = await fetch(url, {

                ...options,

                signal: controller.signal,

                headers: {

                    "Accept": "application/json",

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

            clearTimeout(timer);

        }

    }


    // =================================
    // RETRY MECHANISM
    // =================================

    async requestWithRetry(url, options = {}) {

        const maxRetries = APP_CONFIG.api.maxRetries;

        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {

            try {

                return await this.fetchJSON(url, options);

            } catch (error) {

                lastError = error;

                if (attempt === maxRetries) break;

                const delay =
                    APP_CONFIG.api.retryDelay * (attempt + 1);

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );

            }

        }

        throw lastError;

    }


    // =================================
    // REQUEST DEDUPLICATION
    // =================================

    async cachedRequest(key, url, duration) {

        const cached = this.getCache(key);

        if (cached !== null) {

            return cached;

        }

        if (this.pendingRequests.has(key)) {

            return this.pendingRequests.get(key);

        }

        const request = this.requestWithRetry(url)
            .then(data => {

                this.setCache(key, data, duration);

                return data;

            })
            .finally(() => {

                this.pendingRequests.delete(key);

            });

        this.pendingRequests.set(key, request);

        return request;

    }


    // =================================
    // COINGECKO: TOP 50 COINS
    // =================================

    async getTopCoins(limit = APP_CONFIG.market.maxCoins) {

        const params = new URLSearchParams({

            vs_currency: APP_CONFIG.market.currency,

            order: APP_CONFIG.market.topCoinsSort,

            per_page: Math.min(limit, 250),

            page: 1,

            sparkline: APP_CONFIG.market.includeSparkline,

            price_change_percentage: "1h,24h,7d,30d"

        });

        const url =
            APP_CONFIG.api.coingecko.baseUrl +
            APP_CONFIG.api.coingecko.coinsEndpoint +
            "?" + params.toString();

        const data = await this.cachedRequest(

            `top-coins-${limit}`,

            url,

            60000

        );

        return data.map(coin => ({

            id: coin.id,

            name: coin.name,

            symbol: coin.symbol.toUpperCase(),

            image: coin.image,

            price: coin.current_price,

            marketCap: coin.market_cap,

            marketCapRank: coin.market_cap_rank,

            volume24h: coin.total_volume,

            high24h: coin.high_24h,

            low24h: coin.low_24h,

            change1h: coin.price_change_percentage_1h_in_currency,

            change24h: coin.price_change_percentage_24h,

            change7d: coin.price_change_percentage_7d_in_currency,

            change30d: coin.price_change_percentage_30d_in_currency,

            circulatingSupply: coin.circulating_supply,

            totalSupply: coin.total_supply,

            maxSupply: coin.max_supply,

            sparkline: coin.sparkline_in_7d?.price || []

        }));

    }


    // =================================
    // COINGECKO: SINGLE COIN
    // =================================

    async getCoinDetails(coinId) {

        const url =
            `${APP_CONFIG.api.coingecko.baseUrl}/coins/${encodeURIComponent(coinId)}` +
            "?localization=false&tickers=false&market_data=true" +
            "&community_data=false&developer_data=false";

        return this.cachedRequest(

            `coin-details-${coinId}`,

            url,

            60000

        );

    }


    // =================================
    // COINGECKO: HISTORICAL MARKET DATA
    // =================================

    async getCoinHistory(coinId, days = 30) {

        const params = new URLSearchParams({

            vs_currency: APP_CONFIG.market.currency,

            days: String(days),

            interval: days <= 1 ? "hourly" : "daily"

        });

        const url =
            `${APP_CONFIG.api.coingecko.baseUrl}/coins/` +
            `${encodeURIComponent(coinId)}/market_chart?${params}`;

        return this.cachedRequest(

            `coin-history-${coinId}-${days}`,

            url,

            120000

        );

    }


    // =================================
    // BINANCE: TRADING SYMBOL
    // =================================

    getBinanceSymbol(symbol) {

        const normalized = String(symbol).toUpperCase();

        return normalized.endsWith("USDT")
            ? normalized
            : normalized + "USDT";

    }


    // =================================
    // BINANCE: CURRENT PRICE
    // =================================

    async getBinancePrice(symbol) {

        const pair = this.getBinanceSymbol(symbol);

        const params = new URLSearchParams({

            symbol: pair

        });

        const url =
            `${APP_CONFIG.api.binance.baseUrl}/ticker/price?${params}`;

        return this.cachedRequest(

            `binance-price-${pair}`,

            url,

            5000

        );

    }


    // =================================
    // BINANCE: 24H TICKER
    // =================================

    async getBinanceTicker(symbol) {

        const pair = this.getBinanceSymbol(symbol);

        const params = new URLSearchParams({

            symbol: pair

        });

        const url =
            `${APP_CONFIG.api.binance.baseUrl}/ticker/24hr?${params}`;

        return this.cachedRequest(

            `binance-ticker-${pair}`,

            url,

            10000

        );

    }


    // =================================
    // BINANCE: HISTORICAL CANDLES
    // =================================

    async getCandles(symbol, interval = "1d", limit = null) {

        const pair = this.getBinanceSymbol(symbol);

        const intervalConfig = getIntervalConfig(interval);

        const candleLimit = Math.min(

            limit || intervalConfig.limit,

            1000

        );

        const params = new URLSearchParams({

            symbol: pair,

            interval: intervalConfig.binanceInterval,

            limit: String(candleLimit)

        });

        const url =
            `${APP_CONFIG.api.binance.baseUrl}` +
            `${APP_CONFIG.api.binance.klinesEndpoint}?${params}`;

        const data = await this.cachedRequest(

            `candles-${pair}-${interval}-${candleLimit}`,

            url,

            30000

        );

        return data.map(candle => ({

            time: Math.floor(candle[0] / 1000),

            open: Number(candle[1]),

            high: Number(candle[2]),

            low: Number(candle[3]),

            close: Number(candle[4]),

            volume: Number(candle[5]),

            closeTime: Math.floor(candle[6] / 1000),

            quoteVolume: Number(candle[7]),

            trades: Number(candle[8])

        }));

    }


    // =================================
    // BINANCE: MAXIMUM AVAILABLE HISTORY
    // =================================

    async getMaximumCandles(symbol) {

        const pair = this.getBinanceSymbol(symbol);

        const url =
            `${APP_CONFIG.api.binance.baseUrl}` +
            `${APP_CONFIG.api.binance.klinesEndpoint}` +
            `?symbol=${encodeURIComponent(pair)}` +
            "&interval=1M&limit=1000";

        const data = await this.cachedRequest(

            `candles-max-${pair}`,

            url,

            300000

        );

        return data.map(candle => ({

            time: Math.floor(candle[0] / 1000),

            open: Number(candle[1]),

            high: Number(candle[2]),

            low: Number(candle[3]),

            close: Number(candle[4]),

            volume: Number(candle[5]),

            closeTime: Math.floor(candle[6] / 1000),

            quoteVolume: Number(candle[7]),

            trades: Number(candle[8])

        }));

    }


    // =================================
    // BINANCE: EXCHANGE SYMBOL CHECK
    // =================================

    async getExchangeInfo(symbol) {

        const pair = this.getBinanceSymbol(symbol);

        const url =
            `${APP_CONFIG.api.binance.baseUrl}` +
            `${APP_CONFIG.api.binance.exchangeInfoEndpoint}` +
            `?symbol=${encodeURIComponent(pair)}`;

        return this.cachedRequest(

            `exchange-info-${pair}`,

            url,

            300000

        );

    }


    // =================================
    // CHART HISTORY ROUTER
    // =================================

    async getChartData(symbol, interval = "1d", coinId = null) {

        try {

            if (interval === "max") {

                return await this.getMaximumCandles(symbol);

            }

            return await this.getCandles(symbol, interval);

        } catch (binanceError) {

            console.warn(

                `Binance history unavailable for ${symbol}.`,
                binanceError.message

            );

            if (!coinId) {

                throw binanceError;

            }

            const intervalConfig = getIntervalConfig(interval);

            const history = await this.getCoinHistory(

                coinId,

                intervalConfig.days

            );

            return this.convertCoinGeckoHistory(history);

        }

    }


    // =================================
    // CONVERT COINGECKO HISTORY
    // =================================

    convertCoinGeckoHistory(data) {

        if (!data?.prices?.length) {

            return [];

        }

        const volumes = new Map(

            (data.total_volumes || []).map(item => [

                Math.floor(item[0] / 1000),

                Number(item[1])

            ])

        );

        const marketCaps = new Map(

            (data.market_caps || []).map(item => [

                Math.floor(item[0] / 1000),

                Number(item[1])

            ])

        );

        return data.prices.map((item, index, array) => {

            const time = Math.floor(item[0] / 1000);

            const price = Number(item[1]);

            const previousPrice = index > 0
                ? Number(array[index - 1][1])
                : price;

            const nextPrice = index < array.length - 1
                ? Number(array[index + 1][1])
                : price;

            return {

                time,

                open: previousPrice,

                high: Math.max(previousPrice, price, nextPrice),

                low: Math.min(previousPrice, price, nextPrice),

                close: price,

                volume: volumes.get(time) || 0,

                marketCap: marketCaps.get(time) || 0

            };

        });

    }


    // =================================
    // MARKET STATUS
    // =================================

    async checkConnection() {

        try {

            const response = await fetch(

                `${APP_CONFIG.api.binance.baseUrl}/ping`,

                { method: "GET" }

            );

            return {

                connected: response.ok,

                provider: "Binance",

                timestamp: Date.now()

            };

        } catch (error) {

            return {

                connected: false,

                provider: "Binance",

                error: error.message,

                timestamp: Date.now()

            };

        }

    }

}


// =====================================
// SINGLETON INSTANCE
// =====================================

export const cryptoAPI = new CryptoAPI();


// =====================================
// PUBLIC API FUNCTIONS
// =====================================

export const getTopCoins = limit =>
    cryptoAPI.getTopCoins(limit);

export const getCoinDetails = id =>
    cryptoAPI.getCoinDetails(id);

export const getCoinHistory = (id, days) =>
    cryptoAPI.getCoinHistory(id, days);

export const getCandles = (symbol, interval, limit) =>
    cryptoAPI.getCandles(symbol, interval, limit);

export const getChartData = (symbol, interval, coinId) =>
    cryptoAPI.getChartData(symbol, interval, coinId);

export const getMaximumCandles = symbol =>
    cryptoAPI.getMaximumCandles(symbol);

export const getBinancePrice = symbol =>
    cryptoAPI.getBinancePrice(symbol);

export const getBinanceTicker = symbol =>
    cryptoAPI.getBinanceTicker(symbol);

export const checkAPIConnection = () =>
    cryptoAPI.checkConnection();

