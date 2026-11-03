
/*
 * CRYPTO PREDICTION PRO
 * File: js/config.js
 * Version: 1.0.0
 *
 * Global application configuration.
 * GitHub Pages compatible.
 */

export const APP_CONFIG = {

    name: "Crypto Prediction Pro",
    version: "1.0.0",

    mode: "paper",
    theme: "dark",

    debug: false,

    // =====================================
    // MARKET CONFIGURATION
    // =====================================

    market: {

        maxCoins: 50,

        currency: "usd",

        quoteCurrency: "USDT",

        defaultCoin: "bitcoin",

        refreshInterval: 60000,

        priceRefreshInterval: 30000,

        marketRefreshInterval: 120000,

        topCoinsSort: "market_cap_desc",

        includeSparkline: true,

        pricePrecision: 8

    },

    // =====================================
    // API CONFIGURATION
    // =====================================

    api: {

        coingecko: {

            baseUrl: "https://api.coingecko.com/api/v3",

            coinsEndpoint: "/coins/markets",

            historyEndpoint: "/coins",

            timeout: 15000

        },

        binance: {

            baseUrl: "https://api.binance.com/api/v3",

            klinesEndpoint: "/klines",

            tickerEndpoint: "/ticker/24hr",

            exchangeInfoEndpoint: "/exchangeInfo",

            timeout: 15000

        },

        cacheDuration: 30000,

        maxRetries: 3,

        retryDelay: 2000

    },

    // =====================================
    // TOP 50 MARKET CONFIGURATION
    // =====================================

    coinLimit: 50,

    // =====================================
    // CHART CONFIGURATION
    // =====================================

    charts: {

        library: "lightweight-charts",

        defaultInterval: "1d",

        defaultChartType: "candlestick",

        showCrosshair: true,

        showVolume: true,

        showGrid: true,

        showPriceLine: true,

        showTimeScale: true,

        autoResize: true,

        chartHeight: 520,

        // Available chart periods.
        // MAX means maximum history available
        // from the selected data provider.

        intervals: {

            "1d": {
                label: "1D",
                days: 1,
                binanceInterval: "1h",
                limit: 24
            },

            "7d": {
                label: "7D",
                days: 7,
                binanceInterval: "4h",
                limit: 42
            },

            "1m": {
                label: "1M",
                days: 30,
                binanceInterval: "1d",
                limit: 30
            },

            "3m": {
                label: "3M",
                days: 90,
                binanceInterval: "1d",
                limit: 90
            },

            "6m": {
                label: "6M",
                days: 180,
                binanceInterval: "1d",
                limit: 180
            },

            "1y": {
                label: "1Y",
                days: 365,
                binanceInterval: "1d",
                limit: 365
            },

            "3y": {
                label: "3Y",
                days: 1095,
                binanceInterval: "1w",
                limit: 156
            },

            "5y": {
                label: "5Y",
                days: 1825,
                binanceInterval: "1w",
                limit: 260
            },

            "max": {
                label: "MAX",
                days: Infinity,
                binanceInterval: "1M",
                limit: 1000
            }

        }

    },

    // =====================================
    // TECHNICAL INDICATORS
    // =====================================

    indicators: {

        enabledByDefault: true,

        trend: {

            sma: [20, 50, 100, 200],

            ema: [9, 12, 21, 50, 100, 200],

            parabolicSAR: true,

            ichimoku: true

        },

        momentum: {

            rsi: [7, 14, 21],

            macd: {

                fast: 12,

                slow: 26,

                signal: 9

            },

            stochastic: {

                period: 14,

                smoothK: 3,

                smoothD: 3

            },

            stochasticRSI: true

        },

        volatility: {

            bollingerBands: {

                period: 20,

                standardDeviation: 2

            },

            atr: 14,

            keltnerChannels: true

        },

        strength: {

            adx: 14,

            dmi: true

        },

        volume: {

            obv: true,

            vwap: true,

            volumeSMA: 20

        },

        priceLevels: {

            fibonacci: true,

            pivotPoints: true,

            supportResistance: true

        }

    },

    // =====================================
    // PREDICTION ENGINE
    // =====================================

    prediction: {

        enabled: true,

        model: "advanced-technical-analysis",

        minimumConfidence: 55,

        weights: {

            trend: 30,

            momentum: 25,

            volume: 15,

            volatility: 10,

            supportResistance: 10,

            multiTimeframe: 10

        },

        thresholds: {

            strongBuy: 70,

            buy: 30,

            hold: -29,

            sell: -30,

            strongSell: -70

        },

        useMultipleTimeframes: true,

        timeframes: [

            "1d",

            "7d",

            "1m"

        ],

        calculateTrendStrength: true,

        calculateRiskReward: true,

        calculateSupportResistance: true,

        calculateEntryZones: true,

        calculateStopLoss: true,

        calculateTakeProfit: true

    },

    // =====================================
    // PAPER TRADING
    // =====================================

    paperTrading: {

        enabled: true,

        initialBalance: 10000,

        currency: "USDT",

        defaultTradeAmount: 500,

        maxPositionPercentage: 20,

        commission: 0.001,

        slippage: 0.0005,

        allowShortSelling: false,

        persistPortfolio: true,

        storageKey: "crypto_prediction_portfolio",

        tradeHistoryKey: "crypto_prediction_trades"

    },

    // =====================================
    // DASHBOARD CONFIGURATION
    // =====================================

    dashboard: {

        showMarketOverview: true,

        showTopCoins: true,

        showPredictionSignals: true,

        showPortfolio: true,

        showMarketSentiment: true,

        showTechnicalIndicators: true,

        showVolumeAnalysis: true,

        showWatchlist: true,

        defaultSort: "market_cap",

        itemsPerPage: 50

    },

    // =====================================
    // INTERFACE COLORS
    // =====================================

    colors: {

        background: "#0B1120",

        surface: "#111B2E",

        surfaceSecondary: "#17243A",

        border: "#26354B",

        text: "#E8EEF7",

        textSecondary: "#91A0B5",

        primary: "#3B82F6",

        bullish: "#22C997",

        bearish: "#EF5350",

        neutral: "#F5B942",

        chartGrid: "#26354B",

        chartCrosshair: "#A5B4C8",

        chartBackground: "#0B1120"

    },

    // =====================================
    // APPLICATION BEHAVIOR
    // =====================================

    behavior: {

        autoRefresh: true,

        autoUpdateCharts: true,

        rememberSelectedCoin: true,

        rememberChartInterval: true,

        showLoadingIndicators: true,

        showNotifications: true,

        handleNetworkErrors: true

    }

};


// =====================================
// SUPPORTED COIN SYMBOLS
// =====================================

// The actual top 50 list is retrieved
// dynamically from CoinGecko.
// This list provides initial watchlist
// preferences, not a fixed ranking.

export const DEFAULT_WATCHLIST = [

    "BTC",
    "ETH",
    "USDT",
    "BNB",
    "XRP",
    "SOL",
    "USDC",
    "TRX",
    "DOGE",
    "ADA",
    "BCH",
    "LINK",
    "AVAX",
    "XLM",
    "TON",
    "SHIB",
    "DOT",
    "SUI",
    "LTC",
    "HBAR",
    "UNI",
    "NEAR",
    "APT",
    "AAVE",
    "ETC"

];


// =====================================
// APPLICATION CONSTANTS
// =====================================

export const CONSTANTS = {

    SIGNALS: {

        STRONG_BUY: "STRONG BUY",

        BUY: "BUY",

        HOLD: "HOLD",

        SELL: "SELL",

        STRONG_SELL: "STRONG SELL"

    },

    TIMEFRAMES: [

        "1d",
        "7d",
        "1m",
        "3m",
        "6m",
        "1y",
        "3y",
        "5y",
        "max"

    ],

    CHART_TYPES: [

        "candlestick",
        "line",
        "area",
        "bar"

    ],

    DEFAULT_TIMEOUT: 15000,

    MAX_API_RETRIES: 3

};


// =====================================
// HELPER: GET INTERVAL CONFIGURATION
// =====================================

export function getIntervalConfig(interval) {

    return APP_CONFIG.charts.intervals[interval]
        || APP_CONFIG.charts.intervals["1d"];

}


// =====================================
// HELPER: FORMAT SIGNAL
// =====================================

export function getSignal(score) {

    const thresholds = APP_CONFIG.prediction.thresholds;

    if (score >= thresholds.strongBuy) {

        return CONSTANTS.SIGNALS.STRONG_BUY;

    }

    if (score >= thresholds.buy) {

        return CONSTANTS.SIGNALS.BUY;

    }

    if (score <= thresholds.strongSell) {

        return CONSTANTS.SIGNALS.STRONG_SELL;

    }

    if (score <= thresholds.sell) {

        return CONSTANTS.SIGNALS.SELL;

    }

    return CONSTANTS.SIGNALS.HOLD;

}


// =====================================
// HELPER: FORMAT PRICE
// =====================================

export function formatPrice(price) {

    if (!Number.isFinite(Number(price))) {

        return "--";

    }

    return new Intl.NumberFormat("en-US", {

        style: "currency",

        currency: APP_CONFIG.market.currency.toUpperCase(),

        maximumFractionDigits:
            Number(price) < 1 ? 6 : 2

    }).format(price);

}


// =====================================
// HELPER: FORMAT PERCENTAGE
// =====================================

export function formatPercentage(value) {

    if (!Number.isFinite(Number(value))) {

        return "--";

    }

    const number = Number(value);

    return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;

}


// =====================================
// HELPER: VALIDATE PREDICTION SCORE
// =====================================

export function validatePredictionScore(score) {

    return Number.isFinite(score)
        && score >= -100
        && score <= 100;

}
