
/*
 * CRYPTO PREDICTION
 * File: js/config.js
 * Version: 1.0.0
 *
 * Central configuration for the trading dashboard.
 * Browser-only application. No installation required.
 */

export const APP_CONFIG = {

    // --------------------------------------------------
    // APPLICATION
    // --------------------------------------------------

    name: "Crypto Prediction",
    version: "1.0.0",
    description: "Advanced Cryptocurrency Market Intelligence",

    currency: "USD",
    locale: "en-US",
    timezone: "UTC",

    theme: "dark",

    debug: false,


    // --------------------------------------------------
    // MARKET DATA PROVIDERS
    // --------------------------------------------------

    API: {

        coingecko: {
            baseUrl: "https://api.coingecko.com/api/v3",

            markets: "/coins/markets",

            coinList: "/coins/list",

            marketChart: "/coins/{id}/market_chart",

            coinDetails: "/coins/{id}",

            global: "/global",

            currency: "usd",

            defaultDays: 1
        },

        binance: {
            baseUrl: "https://api.binance.com/api/v3",

            klines: "/klines",

            ticker: "/ticker/24hr",

            exchangeInfo: "/exchangeInfo",

            enabled: true
        },

        refresh: {
            market: 60000,
            prices: 15000,
            chart: 30000,
            signals: 60000
        },

        timeout: 15000,

        retryAttempts: 3,

        retryDelay: 2000
    },


    // --------------------------------------------------
    // TOP 50 CRYPTOCURRENCY SCANNER
    // --------------------------------------------------

    MARKET: {

        limit: 50,

        order: "market_cap_desc",

        currency: "usd",

        includeSparkline: true,

        priceChangePeriods: [
            "1h",
            "24h",
            "7d",
            "30d",
            "1y"
        ],

        coins: [

            "bitcoin",
            "ethereum",
            "tether",
            "binancecoin",
            "ripple",
            "usd-coin",
            "solana",
            "tron",
            "dogecoin",
            "cardano",

            "bitcoin-cash",
            "chainlink",
            "stellar",
            "sui",
            "avalanche-2",
            "shiba-inu",
            "toncoin",
            "hedera-hashgraph",
            "litecoin",
            "polkadot",

            "uniswap",
            "monero",
            "bitcoin-cash",
            "near",
            "aptos",
            "ethereum-classic",
            "internet-computer",
            "filecoin",
            "cosmos",
            "arbitrum",

            "aave",
            "bittensor",
            "render-token",
            "optimism",
            "mantle",
            "vechain",
            "maker",
            "injective-protocol",
            "the-graph",
            "algorand",

            "fantom",
            "theta-token",
            "axie-infinity",
            "decentraland",
            "flow",
            "eos",
            "tezos",
            "quant-network",
            "immutable-x",
            "celestia"
        ],

        // The scanner will use live market-cap ranking.
        // This list is a fallback universe, not a guaranteed
        // representation of the current top 50.
        useLiveRanking: true
    },


    // --------------------------------------------------
    // CHART CONFIGURATION
    // --------------------------------------------------

    CHART: {

        library: "LightweightCharts",

        theme: "dark",

        background: "#0B0E14",

        textColor: "#D1D4DC",

        gridColor: "#1E2530",

        upColor: "#16C784",

        downColor: "#EA3943",

        wickUpColor: "#16C784",

        wickDownColor: "#EA3943",

        crosshair: {
            enabled: true,
            mode: "normal",
            verticalLineColor: "#758696",
            horizontalLineColor: "#758696",
            labelBackground: "#263238"
        },

        candles: {
            enabled: true,
            borderVisible: false,
            wickVisible: true
        },

        volume: {
            enabled: true,
            height: 0.18
        },

        autoResize: true,

        rightPriceScale: true,

        timeScale: true,

        grid: true,

        animations: false
    },


    // --------------------------------------------------
    // TIME RANGE SELECTORS
    // --------------------------------------------------

    TIME_RANGES: [

        {
            label: "1D",
            days: 1,
            interval: "5m"
        },

        {
            label: "7D",
            days: 7,
            interval: "15m"
        },

        {
            label: "1M",
            days: 30,
            interval: "1h"
        },

        {
            label: "3M",
            days: 90,
            interval: "4h"
        },

        {
            label: "6M",
            days: 180,
            interval: "4h"
        },

        {
            label: "1Y",
            days: 365,
            interval: "1d"
        },

        {
            label: "MAX",
            days: "max",
            interval: "1d"
        }

    ],


    // --------------------------------------------------
    // TECHNICAL INDICATORS
    // --------------------------------------------------

    INDICATORS: {

        movingAverages: {
            sma: [20, 50, 100, 200],
            ema: [9, 12, 21, 26, 50, 200]
        },

        momentum: {

            rsi: {
                periods: [7, 14, 21],
                overbought: 70,
                oversold: 30
            },

            macd: {
                fast: 12,
                slow: 26,
                signal: 9
            },

            stochasticRSI: {
                rsiPeriod: 14,
                stochasticPeriod: 14,
                smoothK: 3,
                smoothD: 3
            },

            cci: {
                period: 20
            },

            williamsR: {
                period: 14
            }
        },

        volatility: {

            bollinger: {
                period: 20,
                standardDeviation: 2
            },

            atr: {
                period: 14
            },

            keltner: {
                period: 20,
                multiplier: 2
            },

            donchian: {
                period: 20
            }
        },

        trend: {

            adx: {
                period: 14,
                strongTrend: 25
            },

            ichimoku: {
                conversion: 9,
                base: 26,
                spanB: 52,
                displacement: 26
            },

            parabolicSAR: {
                step: 0.02,
                maximum: 0.2
            }
        },

        volume: {

            obv: true,

            vwap: true,

            volumeOscillator: {
                shortPeriod: 5,
                longPeriod: 20
            }
        },

        supportResistance: {

            fibonacci: [
                0,
                0.236,
                0.382,
                0.5,
                0.618,
                0.786,
                1
            ],

            pivotPoints: true,

            lookback: 100
        }
    },


    // --------------------------------------------------
    // TRADING SIGNAL ENGINE
    // --------------------------------------------------

    SIGNALS: {

        enabled: true,

        categories: [
            "STRONG BUY",
            "BUY",
            "HOLD",
            "SELL",
            "STRONG SELL"
        ],

        thresholds: {

            strongBuy: 75,

            buy: 60,

            hold: 40,

            sell: 25,

            strongSell: 24
        },

        // Indicator contribution weights.
        // Total weight = 100.

        weights: {

            trend: 30,

            momentum: 25,

            volatility: 10,

            volume: 15,

            supportResistance: 10,

            multiTimeframe: 10
        },

        confirmation: {

            minimumIndicators: 3,

            requireTrendConfirmation: true,

            requireVolumeConfirmation: false,

            avoidOverboughtEntries: true,

            avoidOversoldExits: true
        },

        confidence: {

            minimum: 50,

            high: 75,

            veryHigh: 90
        }
    },


    // --------------------------------------------------
    // MULTI-TIMEFRAME ANALYSIS
    // --------------------------------------------------

    MULTI_TIMEFRAME: {

        enabled: true,

        periods: [

            "15m",
            "1h",
            "4h",
            "1d",
            "1w"
        ],

        primary: "4h",

        trendConfirmation: [
            "1h",
            "4h",
            "1d"
        ]
    },


    // --------------------------------------------------
    // FORECASTING
    // --------------------------------------------------

    FORECAST: {

        enabled: true,

        horizons: [

            {
                label: "SHORT TERM",
                days: 7
            },

            {
                label: "MEDIUM TERM",
                days: 30
            },

            {
                label: "LONG TERM",
                days: 90
            }

        ],

        displayProbability: true,

        displayConfidence: true,

        displaySupportResistance: true,

        backtesting: true,

        minimumHistoricalSamples: 100
    },


    // --------------------------------------------------
    // RISK MANAGEMENT
    // --------------------------------------------------

    RISK: {

        enabled: true,

        defaultRiskPercent: 1,

        maximumRiskPercent: 2,

        stopLoss: true,

        takeProfit: true,

        riskRewardRatio: 2,

        showPositionSizing: true,

        paperTradingOnly: true
    },


    // --------------------------------------------------
    // PORTFOLIO AND WATCHLIST
    // --------------------------------------------------

    PORTFOLIO: {

        enabled: true,

        mode: "simulation",

        initialBalance: 10000,

        currency: "USD",

        storageKey: "crypto_prediction_portfolio",

        watchlistKey: "crypto_prediction_watchlist",

        saveTransactions: true
    },


    // --------------------------------------------------
    // USER INTERFACE
    // --------------------------------------------------

    UI: {

        defaultPage: "dashboard",

        pages: [

            "dashboard",
            "markets",
            "analysis",
            "signals",
            "forecast",
            "portfolio",
            "settings"

        ],

        defaultCoin: "bitcoin",

        defaultChartRange: "1D",

        showMarketOverview: true,

        showTopMovers: true,

        showSignalPanel: true,

        showTechnicalIndicators: true,

        showVolume: true,

        showWatchlist: true,

        mobileResponsive: true
    }

};


// ------------------------------------------------------
// SHARED CONFIGURATION EXPORTS
// ------------------------------------------------------

export const API_CONFIG = APP_CONFIG.API;

export const MARKET_CONFIG = APP_CONFIG.MARKET;

export const CHART_CONFIG = APP_CONFIG.CHART;

export const INDICATOR_CONFIG = APP_CONFIG.INDICATORS;

export const SIGNAL_CONFIG = APP_CONFIG.SIGNALS;

export const RISK_CONFIG = APP_CONFIG.RISK;

export const PORTFOLIO_CONFIG = APP_CONFIG.PORTFOLIO;


// ------------------------------------------------------
// HELPER: GET TIME RANGE CONFIGURATION
// ------------------------------------------------------

export function getTimeRange(label) {

    return APP_CONFIG.TIME_RANGES.find(
        range => range.label === label
    ) || APP_CONFIG.TIME_RANGES[0];

}


// ------------------------------------------------------
// HELPER: GET INDICATOR CONFIGURATION
// ------------------------------------------------------

export function getIndicatorConfig(category, name) {

    return APP_CONFIG.INDICATORS?.[category]?.[name] ?? null;

}


// ------------------------------------------------------
// HELPER: GET SIGNAL CATEGORY
// ------------------------------------------------------

export function getSignalCategory(score) {

    if (score >= 75) return "STRONG BUY";

    if (score >= 60) return "BUY";

    if (score > 40) return "HOLD";

    if (score >= 25) return "SELL";

    return "STRONG SELL";

}


// ------------------------------------------------------
// HELPER: FORMAT CURRENCY
// ------------------------------------------------------

export function formatPrice(value) {

    if (!Number.isFinite(Number(value))) {
        return "--";
    }

    return new Intl.NumberFormat(
        APP_CONFIG.locale,
        {
            style: "currency",
            currency: APP_CONFIG.currency,
            maximumFractionDigits: 8
        }
    ).format(value);

}


// ------------------------------------------------------
// HELPER: FORMAT PERCENTAGE
// ------------------------------------------------------

export function formatPercentage(value) {

    if (!Number.isFinite(Number(value))) {
        return "--";
    }

    const number = Number(value);

    return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;

}
