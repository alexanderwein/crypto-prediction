/* ============================================================ CRYPTO PREDICTION — TECHNICAL INDICATORS ENGINE File: js/indicators.js ============================================================ */

window.CryptoIndicators = (() => { "use strict";

const EPS = 1e-12;

// ---------------------------------------------------------- // DATA HELPERS // ----------------------------------------------------------

function values(data, field = "close") { return data.map(x => Number(x[field]) || 0); }

function average(array) { return array.length ? array.reduce((a, b) => a + b, 0) / array.length : 0; }

function standardDeviation(array) { if (!array.length) return 0;

const mean = average(array);

return Math.sqrt(
  average(array.map(x => (x - mean) ** 2))
);


}

function highest(array, period) { const result = [];

for (let i = 0; i < array.length; i++) {
  const start = Math.max(0, i - period + 1);

  result.push(
    Math.max(...array.slice(start, i + 1))
  );
}

return result;


}

function lowest(array, period) { const result = [];

for (let i = 0; i < array.length; i++) {
  const start = Math.max(0, i - period + 1);

  result.push(
    Math.min(...array.slice(start, i + 1))
  );
}

return result;


}

function rollingMean(array, period) { return array.map((_, i) => { if (i + 1 < period) return null;

  return average(array.slice(i - period + 1, i + 1));
});


}

// ---------------------------------------------------------- // SIMPLE MOVING AVERAGE // ----------------------------------------------------------

function sma(array, period = 20) { return rollingMean(array, period); }

// ---------------------------------------------------------- // EXPONENTIAL MOVING AVERAGE // ----------------------------------------------------------

function ema(array, period = 20) { const result = [];

const multiplier = 2 / (period + 1);

let previous = null;

array.forEach((value, i) => {
  if (i + 1 < period) {
    result.push(null);
    return;
  }

  if (previous === null) {
    previous = average(array.slice(0, period));
  } else {
    previous =
      (value - previous) * multiplier + previous;
  }

  result.push(previous);
});

return result;


}

// ---------------------------------------------------------- // WEIGHTED MOVING AVERAGE // ----------------------------------------------------------

function wma(array, period = 20) { return array.map((_, i) => { if (i + 1 < period) return null;

  let weighted = 0;
  let denominator = 0;

  for (let j = 0; j < period; j++) {
    const weight = j + 1;
    weighted += array[i - period + 1 + j] * weight;
    denominator += weight;
  }

  return weighted / denominator;
});


}

// ---------------------------------------------------------- // RELATIVE STRENGTH INDEX // ----------------------------------------------------------

function rsi(array, period = 14) { const result = Array(array.length).fill(null);

if (array.length <= period) return result;

let gains = 0;
let losses = 0;

for (let i = 1; i <= period; i++) {
  const change = array[i] - array[i - 1];

  gains += Math.max(change, 0);
  losses += Math.max(-change, 0);
}

let avgGain = gains / period;
let avgLoss = losses / period;

function calculate() {
  if (avgLoss === 0) {
    return avgGain === 0 ? 50 : 100;
  }

  const rs = avgGain / avgLoss;

  return 100 - 100 / (1 + rs);
}

result[period] = calculate();

for (let i = period + 1; i < array.length; i++) {
  const change = array[i] - array[i - 1];

  avgGain =
    (avgGain * (period - 1) + Math.max(change, 0)) /
    period;

  avgLoss =
    (avgLoss * (period - 1) + Math.max(-change, 0)) /
    period;

  result[i] = calculate();
}

return result;


}

// ---------------------------------------------------------- // MACD // ----------------------------------------------------------

function macd(array, fast = 12, slow = 26, signal = 9) { const fastEMA = ema(array, fast); const slowEMA = ema(array, slow);

const line = array.map((_, i) =>
  fastEMA[i] !== null && slowEMA[i] !== null
    ? fastEMA[i] - slowEMA[i]
    : null
);

const valid = line.map(x => x ?? 0);
const signalLine = ema(valid, signal);

const histogram = line.map((value, i) =>
  value !== null && signalLine[i] !== null
    ? value - signalLine[i]
    : null
);

return {
  line,
  signal: signalLine.map((v, i) =>
    line[i] === null ? null : v
  ),
  histogram
};


}

// ---------------------------------------------------------- // BOLLINGER BANDS // ----------------------------------------------------------

function bollinger(array, period = 20, deviation = 2) { const middle = sma(array, period);

const upper = [];
const lower = [];

array.forEach((_, i) => {
  if (i + 1 < period) {
    upper.push(null);
    lower.push(null);
    return;
  }

  const sample = array.slice(i - period + 1, i + 1);

  const sd = standardDeviation(sample);

  upper.push(middle[i] + sd * deviation);
  lower.push(middle[i] - sd * deviation);
});

return {
  upper,
  middle,
  lower
};


}

// ---------------------------------------------------------- // TRUE RANGE // ----------------------------------------------------------

function trueRange(data) { return data.map((candle, i) => { if (i === 0) { return candle.high - candle.low; }

  const previous = data[i - 1].close;

  return Math.max(
    candle.high - candle.low,
    Math.abs(candle.high - previous),
    Math.abs(candle.low - previous)
  );
});


}

// ---------------------------------------------------------- // AVERAGE TRUE RANGE // ----------------------------------------------------------

function atr(data, period = 14) { const tr = trueRange(data); const result = Array(data.length).fill(null);

if (data.length < period) return result;

let current = average(tr.slice(0, period));

result[period - 1] = current;

for (let i = period; i < tr.length; i++) {
  current =
    (current * (period - 1) + tr[i]) / period;

  result[i] = current;
}

return result;


}

// ---------------------------------------------------------- // STOCHASTIC OSCILLATOR // ----------------------------------------------------------

function stochastic(data, period = 14, smoothK = 3, smoothD = 3) { const highs = values(data, "high"); const lows = values(data, "low"); const closes = values(data);

const rawK = closes.map((close, i) => {
  if (i + 1 < period) return null;

  const high = Math.max(
    ...highs.slice(i - period + 1, i + 1)
  );

  const low = Math.min(
    ...lows.slice(i - period + 1, i + 1)
  );

  return high === low
    ? 50
    : ((close - low) / (high - low)) * 100;
});

const k = rawK.map((_, i) => {
  if (i + 1 < smoothK) return null;

  const sample = rawK.slice(i - smoothK + 1, i + 1);

  if (sample.some(x => x === null)) return null;

  return average(sample);
});

const validK = k.map(x => x ?? 0);

const d = sma(validK, smoothD).map((v, i) =>
  k[i] === null ? null : v
);

return { k, d };


}

// ---------------------------------------------------------- // STOCHASTIC RSI // ----------------------------------------------------------

function stochasticRSI(array, period = 14, smoothK = 3, smoothD = 3) { const rsiValues = rsi(array, period);

const raw = rsiValues.map((value, i) => {
  if (value === null || i + 1 < period) return null;

  const sample = rsiValues.slice(
    i - period + 1,
    i + 1
  );

  if (sample.some(x => x === null)) return null;

  const high = Math.max(...sample);
  const low = Math.min(...sample);

  return high === low
    ? 50
    : ((value - low) / (high - low)) * 100;
});

const k = raw.map((_, i) => {
  if (i + 1 < smoothK) return null;

  const sample = raw.slice(i - smoothK + 1, i + 1);

  return sample.some(x => x === null)
    ? null
    : average(sample);
});

const valid = k.map(x => x ?? 0);

const d = sma(valid, smoothD).map((v, i) =>
  k[i] === null ? null : v
);

return { k, d };


}

// ---------------------------------------------------------- // ADX AND DIRECTIONAL INDICATORS // ----------------------------------------------------------

function adx(data, period = 14) { const length = data.length;

const plusDI = Array(length).fill(null);
const minusDI = Array(length).fill(null);
const adxLine = Array(length).fill(null);

const tr = trueRange(data);

const plusDM = Array(length).fill(0);
const minusDM = Array(length).fill(0);

for (let i = 1; i < length; i++) {
  const up = data[i].high - data[i - 1].high;
  const down = data[i - 1].low - data[i].low;

  plusDM[i] = up > down && up > 0 ? up : 0;
  minusDM[i] = down > up && down > 0 ? down : 0;
}

if (length < period * 2 + 1) {
  return { adx: adxLine, plusDI, minusDI };
}

let smoothTR = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
let smoothPlus = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
let smoothMinus = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);

const dx = Array(length).fill(null);

for (let i = period; i < length; i++) {
  if (i > period) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlus = smoothPlus - smoothPlus / period + plusDM[i];
    smoothMinus = smoothMinus - smoothMinus / period + minusDM[i];
  }

  plusDI[i] = smoothTR
    ? 100 * smoothPlus / smoothTR
    : 0;

  minusDI[i] = smoothTR
    ? 100 * smoothMinus / smoothTR
    : 0;

  const sum = plusDI[i] + minusDI[i];

  dx[i] = sum
    ? 100 * Math.abs(plusDI[i] - minusDI[i]) / sum
    : 0;
}

const firstADX = period * 2 - 1;

if (length > firstADX) {
  let current = average(
    dx.slice(period, firstADX + 1)
  );

  adxLine[firstADX] = current;

  for (let i = firstADX + 1; i < length; i++) {
    current =
      (current * (period - 1) + dx[i]) / period;

    adxLine[i] = current;
  }
}

return {
  adx: adxLine,
  plusDI,
  minusDI
};


}

// ---------------------------------------------------------- // COMMODITY CHANNEL INDEX // ----------------------------------------------------------

function cci(data, period = 20) { const typical = data.map(c => (c.high + c.low + c.close) / 3 );

return typical.map((_, i) => {
  if (i + 1 < period) return null;

  const sample = typical.slice(
    i - period + 1,
    i + 1
  );

  const mean = average(sample);

  const deviation = average(
    sample.map(x => Math.abs(x - mean))
  );

  return deviation < EPS
    ? 0
    : (typical[i] - mean) / (0.015 * deviation);
});


}

// ---------------------------------------------------------- // WILLIAMS %R // ----------------------------------------------------------

function williamsR(data, period = 14) { const highs = values(data, "high"); const lows = values(data, "low"); const closes = values(data);

return closes.map((close, i) => {
  if (i + 1 < period) return null;

  const high = Math.max(
    ...highs.slice(i - period + 1, i + 1)
  );

  const low = Math.min(
    ...lows.slice(i - period + 1, i + 1)
  );

  return high === low
    ? -50
    : ((high - close) / (high - low)) * -100;
});


}

// ---------------------------------------------------------- // ON BALANCE VOLUME // ----------------------------------------------------------

function obv(data) { const result = [];

let current = 0;

data.forEach((candle, i) => {
  if (i > 0) {
    if (candle.close > data[i - 1].close) {
      current += candle.volume;
    } else if (candle.close < data[i - 1].close) {
      current -= candle.volume;
    }
  }

  result.push(current);
});

return result;


}

// ---------------------------------------------------------- // VWAP // ----------------------------------------------------------

function vwap(data) { let cumulativePV = 0; let cumulativeVolume = 0;

return data.map(candle => {
  const typical =
    (candle.high + candle.low + candle.close) / 3;

  cumulativePV += typical * candle.volume;
  cumulativeVolume += candle.volume;

  return cumulativeVolume
    ? cumulativePV / cumulativeVolume
    : typical;
});


}

// ---------------------------------------------------------- // MONEY FLOW INDEX // ----------------------------------------------------------

function mfi(data, period = 14) { const typical = data.map(c => (c.high + c.low + c.close) / 3 );

const positive = Array(data.length).fill(0);
const negative = Array(data.length).fill(0);

for (let i = 1; i < data.length; i++) {
  const flow = typical[i] * data[i].volume;

  if (typical[i] > typical[i - 1]) {
    positive[i] = flow;
  } else if (typical[i] < typical[i - 1]) {
    negative[i] = flow;
  }
}

return data.map((_, i) => {
  if (i < period) return null;

  const pos = positive.slice(i - period + 1, i + 1)
    .reduce((a, b) => a + b, 0);

  const neg = negative.slice(i - period + 1, i + 1)
    .reduce((a, b) => a + b, 0);

  if (neg === 0) return pos === 0 ? 50 : 100;

  return 100 - 100 / (1 + pos / neg);
});


}

// ---------------------------------------------------------- // RATE OF CHANGE // ----------------------------------------------------------

function roc(array, period = 12) { return array.map((value, i) => { if (i < period) return null;

  const previous = array[i - period];

  return previous
    ? ((value - previous) / previous) * 100
    : null;
});


}

// ---------------------------------------------------------- // MOMENTUM // ----------------------------------------------------------

function momentum(array, period = 10) { return array.map((value, i) => i < period ? null : value - array[i - period] ); }

// ---------------------------------------------------------- // AVERAGE DIRECTIONAL PRICE / PARABOLIC SAR // ----------------------------------------------------------

function parabolicSAR(data, step = 0.02, maximum = 0.2) { const result = Array(data.length).fill(null);

if (data.length < 2) return result;

let bullish =
  data[1].close >= data[0].close;

let sar = bullish ? data[0].low : data[0].high;

let extreme = bullish ? data[1].high : data[1].low;

let acceleration = step;

result[0] = sar;

for (let i = 1; i < data.length; i++) {
  let next = sar + acceleration * (extreme - sar);

  if (bullish) {
    next = Math.min(next, data[i - 1].low);

    if (i > 1) {
      next = Math.min(next, data[i - 2].low);
    }

    if (data[i].low < next) {
      bullish = false;
      next = extreme;
      extreme = data[i].low;
      acceleration = step;
    } else if (data[i].high > extreme) {
      extreme = data[i].high;
      acceleration = Math.min(
        acceleration + step,
        maximum
      );
    }
  } else {
    next = Math.max(next, data[i - 1].high);

    if (i > 1) {
      next = Math.max(next, data[i - 2].high);
    }

    if (data[i].high > next) {
      bullish = true;
      next = extreme;
      extreme = data[i].high;
      acceleration = step;
    } else if (data[i].low < extreme) {
      extreme = data[i].low;
      acceleration = Math.min(
        acceleration + step,
        maximum
      );
    }
  }

  sar = next;
  result[i] = sar;
}

return result;


}

// ---------------------------------------------------------- // SUPERTREND // ----------------------------------------------------------

function supertrend(data, period = 10, multiplier = 3) { const atrValues = atr(data, period);

const upper = Array(data.length).fill(null);
const lower = Array(data.length).fill(null);
const trend = Array(data.length).fill(null);
const direction = Array(data.length).fill(0);

for (let i = 0; i < data.length; i++) {
  if (atrValues[i] === null) continue;

  const midpoint =
    (data[i].high + data[i].low) / 2;

  const basicUpper = midpoint + multiplier * atrValues[i];
  const basicLower = midpoint - multiplier * atrValues[i];

  upper[i] = i === 0 ||
    upper[i - 1] === null ||
    basicUpper < upper[i - 1] ||
    data[i - 1].close > upper[i - 1]
    ? basicUpper
    : upper[i - 1];

  lower[i] = i === 0 ||
    lower[i - 1] === null ||
    basicLower > lower[i - 1] ||
    data[i - 1].close < lower[i - 1]
    ? basicLower
    : lower[i - 1];

  const previousDirection = direction[i - 1] || 1;

  direction[i] =
    data[i].close > upper[i]
      ? 1
      : data[i].close < lower[i]
        ? -1
        : previousDirection;

  trend[i] = direction[i] === 1
    ? lower[i]
    : upper[i];
}

return { trend, direction, upper, lower };


}

// ---------------------------------------------------------- // ICHIMOKU CLOUD // ----------------------------------------------------------

function ichimoku(data, conversion = 9, base = 26, spanB = 52) { const highs = values(data, "high"); const lows = values(data, "low");

function midpoint(period) {
  return data.map((_, i) => {
    if (i + 1 < period) return null;

    const high = Math.max(
      ...highs.slice(i - period + 1, i + 1)
    );

    const low = Math.min(
      ...lows.slice(i - period + 1, i + 1)
    );

    return (high + low) / 2;
  });
}

const tenkan = midpoint(conversion);
const kijun = midpoint(base);

const senkouA = tenkan.map((value, i) =>
  value !== null && kijun[i] !== null
    ? (value + kijun[i]) / 2
    : null
);

const senkouB = midpoint(spanB);

const chikou = values(data);

return {
  tenkan,
  kijun,
  senkouA,
  senkouB,
  chikou
};


}

// ---------------------------------------------------------- // CHAIKIN MONEY FLOW // ----------------------------------------------------------

function cmf(data, period = 20) { const moneyFlow = data.map(c => { const range = c.high - c.low;

  const multiplier = range === 0
    ? 0
    : ((c.close - c.low) - (c.high - c.close)) / range;

  return multiplier * c.volume;
});

return data.map((_, i) => {
  if (i + 1 < period) return null;

  const flow = moneyFlow.slice(
    i - period + 1,
    i + 1
  ).reduce((a, b) => a + b, 0);

  const volume = data.slice(
    i - period + 1,
    i + 1
  ).reduce((a, b) => a + b.volume, 0);

  return volume ? flow / volume : 0;
});


}

// ---------------------------------------------------------- // ACCUMULATION / DISTRIBUTION // ----------------------------------------------------------

function accumulationDistribution(data) { let cumulative = 0;

return data.map(c => {
  const range = c.high - c.low;

  const multiplier = range === 0
    ? 0
    : ((c.close - c.low) - (c.high - c.close)) / range;

  cumulative += multiplier * c.volume;

  return cumulative;
});


}

// ---------------------------------------------------------- // VOLUME PRICE TREND // ----------------------------------------------------------

function vpt(data) { let cumulative = 0;

return data.map((c, i) => {
  if (i > 0 && data[i - 1].close !== 0) {
    cumulative +=
      c.volume *
      (c.close - data[i - 1].close) /
      data[i - 1].close;
  }

  return cumulative;
});


}

// ---------------------------------------------------------- // KELTNER CHANNELS // ----------------------------------------------------------

function keltner(data, period = 20, multiplier = 2) { const closes = values(data);

const middle = ema(closes, period);
const atrValues = atr(data, period);

return {
  middle,
  upper: middle.map((v, i) =>
    v === null || atrValues[i] === null
      ? null
      : v + multiplier * atrValues[i]
  ),
  lower: middle.map((v, i) =>
    v === null || atrValues[i] === null
      ? null
      : v - multiplier * atrValues[i]
  )
};


}

// ---------------------------------------------------------- // DONCHIAN CHANNELS // ----------------------------------------------------------

function donchian(data, period = 20) { const highs = values(data, "high"); const lows = values(data, "low");

const upper = highest(highs, period);
const lower = lowest(lows, period);

return {
  upper: upper.map((v, i) =>
    i + 1 < period ? null : v
  ),
  lower: lower.map((v, i) =>
    i + 1 < period ? null : v
  ),
  middle: upper.map((v, i) =>
    i + 1 < period ? null : (v + lower[i]) / 2
  )
};


}

// ---------------------------------------------------------- // PIVOT POINTS // ----------------------------------------------------------

function pivotPoints(data) { if (data.length < 2) return null;

const previous = data[data.length - 2];

const p = (
  previous.high +
  previous.low +
  previous.close
) / 3;

return {
  pivot: p,
  r1: 2 * p - previous.low,
  r2: p + previous.high - previous.low,
  r3: previous.high + 2 * (p - previous.low),
  s1: 2 * p - previous.high,
  s2: p - previous.high + previous.low,
  s3: previous.low - 2 * (previous.high - p)
};


}

// ---------------------------------------------------------- // FIBONACCI RETRACEMENTS // ----------------------------------------------------------

function fibonacci(data, lookback = 100) { const sample = data.slice(-lookback);

if (!sample.length) return null;

const high = Math.max(...sample.map(c => c.high));
const low = Math.min(...sample.map(c => c.low));

const difference = high - low;

return {
  high,
  low,
  levels: {
    "0": high,
    "0.236": high - difference * 0.236,
    "0.382": high - difference * 0.382,
    "0.5": high - difference * 0.5,
    "0.618": high - difference * 0.618,
    "0.786": high - difference * 0.786,
    "1": low
  }
};


}

// ---------------------------------------------------------- // SUPPORT AND RESISTANCE // ----------------------------------------------------------

function supportResistance(data, lookback = 100) { const sample = data.slice(-lookback);

if (sample.length < 5) {
  return { support: [], resistance: [] };
}

const supports = [];
const resistances = [];

for (let i = 2; i < sample.length - 2; i++) {
  const current = sample[i];

  if (
    current.low < sample[i - 1].low &&
    current.low < sample[i - 2].low &&
    current.low < sample[i + 1].low &&
    current.low < sample[i + 2].low
  ) {
    supports.push(current.low);
  }

  if (
    current.high > sample[i - 1].high &&
    current.high > sample[i - 2].high &&
    current.high > sample[i + 1].high &&
    current.high > sample[i + 2].high
  ) {
    resistances.push(current.high);
  }
}

return {
  support: supports.slice(-10),
  resistance: resistances.slice(-10)
};


}

// ---------------------------------------------------------- // HISTORICAL VOLATILITY // ----------------------------------------------------------

function historicalVolatility(data, period = 20) { const closes = values(data);

const returns = closes.map((v, i) =>
  i === 0 || closes[i - 1] <= 0
    ? null
    : Math.log(v / closes[i - 1])
);

return returns.map((_, i) => {
  if (i < period) return null;

  const sample = returns.slice(
    i - period + 1,
    i + 1
  );

  if (sample.some(v => v === null)) return null;

  return standardDeviation(sample) * Math.sqrt(365) * 100;
});


}

// ---------------------------------------------------------- // ALL INDICATORS — SINGLE CALCULATION // ----------------------------------------------------------

function calculateAll(data) { if (!Array.isArray(data) || !data.length) { throw new Error("Valid candle data is required"); }

const closes = values(data);

const output = {
  sma: {},
  ema: {},
  rsi: rsi(closes, 14),
  macd: macd(closes),
  bollinger: bollinger(closes),
  stochastic: stochastic(data),
  stochasticRSI: stochasticRSI(closes),
  atr: atr(data),
  adx: adx(data),
  cci: cci(data),
  williamsR: williamsR(data),
  obv: obv(data),
  vwap: vwap(data),
  mfi: mfi(data),
  roc: roc(closes),
  momentum: momentum(closes),
  supertrend: supertrend(data),
  ichimoku: ichimoku(data),
  parabolicSAR: parabolicSAR(data),
  cmf: cmf(data),
  accumulationDistribution: accumulationDistribution(data),
  vpt: vpt(data),
  keltner: keltner(data),
  donchian: donchian(data),
  pivots: pivotPoints(data),
  fibonacci: fibonacci(data),
  supportResistance: supportResistance(data),
  historicalVolatility: historicalVolatility(data)
};

[20, 50, 100, 200].forEach(period => {
  output.sma[period] = sma(closes, period);
});

[9, 12, 21, 26, 50, 100, 200].forEach(period => {
  output.ema[period] = ema(closes, period);
});

return output;


}

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ sma, ema, wma, rsi, macd, bollinger, trueRange, atr, stochastic, stochasticRSI, adx, cci, williamsR, obv, vwap, mfi, roc, momentum, parabolicSAR, supertrend, ichimoku, cmf, accumulationDistribution, vpt, keltner, donchian, pivotPoints, fibonacci, supportResistance, historicalVolatility, calculateAll });

})();
