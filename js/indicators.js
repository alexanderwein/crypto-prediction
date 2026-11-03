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

function macd(array, fast = 12, slow = 26, signal =
