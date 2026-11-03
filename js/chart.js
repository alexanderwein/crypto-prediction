/* ============================================================ CRYPTO PREDICTION — INTERACTIVE CHART ENGINE File: js/chart.js

Dependency: TradingView Lightweight Charts v4.2.2 ============================================================ */

window.CryptoChart = (() => { "use strict";

const instances = new Map();

const COLORS = { background: "#0b1220", text: "#a7b2c4", grid: "#1c283a", bullish: "#16c784", bearish: "#ea3943", blue: "#3861fb", purple: "#a78bfa", yellow: "#f0b90b", orange: "#f59e0b" };

// ---------------------------------------------------------- // VALIDATION // ----------------------------------------------------------

function validateLibrary() { if (!window.LightweightCharts) { throw new Error( "TradingView Lightweight Charts library is missing" ); } }

function validCandles(candles) { if (!Array.isArray(candles)) return [];

return candles
  .map(candle => ({
    time: candle.time,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close)
  }))
  .filter(c =>
    c.time !== undefined &&
    Number.isFinite(c.open) &&
    Number.isFinite(c.high) &&
    Number.isFinite(c.low) &&
    Number.isFinite(c.close)
  )
  .sort((a, b) => a.time - b.time);


}

// ---------------------------------------------------------- // CHART CREATION // ----------------------------------------------------------

function create(containerId, options = {}) { validateLibrary();

const container = document.getElementById(containerId);

if (!container) {
  throw new Error(
    `Chart container not found: ${containerId}`
  );
}

destroy(containerId);

const chart = LightweightCharts.createChart(
  container,
  {
    width: container.clientWidth,
    height: options.height || 480,

    layout: {
      background: {
        color: COLORS.background
      },
      textColor: COLORS.text,
      fontFamily: "Inter, Arial, sans-serif"
    },

    grid: {
      vertLines: {
        color: COLORS.grid
      },
      horzLines: {
        color: COLORS.grid
      }
    },

    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,

      vertLine: {
        color: "#94a3b8",
        width: 1,
        style: LightweightCharts.LineStyle.Dashed,
        labelBackgroundColor: COLORS.blue
      },

      horzLine: {
        color: "#94a3b8",
        width: 1,
        style: LightweightCharts.LineStyle.Dashed,
        labelBackgroundColor: COLORS.blue
      }
    },

    rightPriceScale: {
      borderColor: COLORS.grid,
      scaleMargins: {
        top: 0.10,
        bottom: 0.15
      }
    },

    timeScale: {
      borderColor: COLORS.grid,
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 8,
      barSpacing: 8,
      minBarSpacing: 2
    },

    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false
    },

    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: true
    },

    localization: {
      locale: "en-US"
    },

    ...options.chartOptions
  }
);

const instance = {
  chart,
  container,
  candleSeries: null,
  volumeSeries: null,
  indicators: new Map(),
  panels: {},
  observers: []
};

instances.set(containerId, instance);

// Responsive resizing.
if (typeof ResizeObserver !== "undefined") {
  const observer = new ResizeObserver(entries => {
    const entry = entries[0];

    if (!entry) return;

    chart.applyOptions({
      width: Math.floor(entry.contentRect.width)
    });
  });

  observer.observe(container);

  instance.observers.push(observer);
}

return instance;


}

// ---------------------------------------------------------- // MAIN CANDLESTICK SERIES // ----------------------------------------------------------

function addCandles(containerId, candles) { const instance = instances.get(containerId);

if (!instance) {
  throw new Error("Chart has not been initialized");
}

const data = validCandles(candles);

const series = instance.chart.addCandlestickSeries({
  upColor: COLORS.bullish,
  downColor: COLORS.bearish,

  borderUpColor: COLORS.bullish,
  borderDownColor: COLORS.bearish,

  wickUpColor: COLORS.bullish,
  wickDownColor: COLORS.bearish,

  priceLineVisible: true,
  lastValueVisible: true
});

series.setData(data);

instance.candleSeries = series;

instance.chart.timeScale().fitContent();

return series;


}

// ---------------------------------------------------------- // VOLUME HISTOGRAM // ----------------------------------------------------------

function addVolume(containerId, candles) { const instance = instances.get(containerId);

if (!instance) return null;

const volumeData = candles
  .filter(c =>
    c.time !== undefined &&
    Number.isFinite(Number(c.volume))
  )
  .map(c => ({
    time: c.time,
    value: Number(c.volume),

    color: c.close >= c.open
      ? "rgba(22,199,132,0.55)"
      : "rgba(234,57,67,0.55)"
  }));

const series = instance.chart.addHistogramSeries({
  priceFormat: {
    type: "volume"
  },

  priceScaleId: "volume",

  priceLineVisible: false,
  lastValueVisible: false
});

instance.chart.priceScale("volume").applyOptions({
  scaleMargins: {
    top: 0.82,
    bottom: 0
  }
});

series.setData(volumeData);

instance.volumeSeries = series;

return series;


}

// ---------------------------------------------------------- // INDICATOR OVERLAYS // ----------------------------------------------------------

function addLine( containerId, name, values, color, options = {} ) { const instance = instances.get(containerId);

if (!instance) return null;

const series = instance.chart.addLineSeries({
  color,
  lineWidth: options.lineWidth || 2,

  priceLineVisible: false,
  lastValueVisible: true,

  crosshairMarkerVisible: true,

  ...options
});

series.setData(
  values
    .filter(item =>
      item.time !== undefined &&
      Number.isFinite(item.value)
    )
    .map(item => ({
      time: item.time,
      value: item.value
    }))
);

instance.indicators.set(name, series);

return series;


}

function addSMA(containerId, candles, period, color) { const values = window.CryptoIndicators.SMA( candles.map(c => c.close), period );

return addLine(
  containerId,
  `SMA ${period}`,
  candles.map((c, i) => ({
    time: c.time,
    value: values[i]
  })),
  color
);


}

function addEMA(containerId, candles, period, color) { const values = window.CryptoIndicators.EMA( candles.map(c => c.close), period );

return addLine(
  containerId,
  `EMA ${period}`,
  candles.map((c, i) => ({
    time: c.time,
    value: values[i]
  })),
  color
);


}

function addBollingerBands(containerId, candles) { const closes = candles.map(c => c.close);

const bands = window.CryptoIndicators.BollingerBands(
  closes,
  20,
  2
);

addLine(
  containerId,
  "BB Upper",
  candles.map((c, i) => ({
    time: c.time,
    value: bands.upper[i]
  })),
  COLORS.purple,
  { lineWidth: 1 }
);

addLine(
  containerId,
  "BB Middle",
  candles.map((c, i) => ({
    time: c.time,
    value: bands.middle[i]
  })),
  COLORS.yellow,
  { lineWidth: 1 }
);

addLine(
  containerId,
  "BB Lower",
  candles.map((c, i) => ({
    time: c.time,
    value: bands.lower[i]
  })),
  COLORS.purple,
  { lineWidth: 1 }
);


}

// ---------------------------------------------------------- // RSI PANEL // ----------------------------------------------------------

function createRSI(containerId, candles) { const closes = candles.map(c => c.close);

const values = window.CryptoIndicators.RSI(
  closes,
  14
);

const panel = create(`${containerId}-rsi`, {
  height: 150,

  chartOptions: {
    rightPriceScale: {
      scaleMargins: {
        top: 0.10,
        bottom: 0.10
      }
    },

    timeScale: {
      visible: false
    }
  }
});

const series = panel.chart.addLineSeries({
  color: COLORS.purple,
  lineWidth: 2,
  priceLineVisible: false
});

series.setData(
  candles.map((c, i) => ({
    time: c.time,
    value: values[i]
  })).filter(x => Number.isFinite(x.value))
);

// RSI reference levels.
[30, 50, 70].forEach(level => {
  series.createPriceLine({
    price: level,
    color: level === 50
      ? COLORS.grid
      : COLORS.orange,
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title: String(level)
  });
});

instances.get(containerId).panels.rsi = panel;

return panel;


}

// ---------------------------------------------------------- // MACD PANEL // ----------------------------------------------------------

function createMACD(containerId, candles) { const closes = candles.map(c => c.close);

const macd = window.CryptoIndicators.MACD(
  closes,
  12,
  26,
  9
);

const panel = create(`${containerId}-macd`, {
  height: 170,

  chartOptions: {
    timeScale: {
      visible: false
    }
  }
});

const macdLine = panel.chart.addLineSeries({
  color: COLORS.blue,
  lineWidth: 2
});

const signalLine = panel.chart.addLineSeries({
  color: COLORS.orange,
  lineWidth: 2
});

const histogram = panel.chart.addHistogramSeries({
  priceLineVisible: false
});

macdLine.setData(
  candles.map((c, i) => ({
    time: c.time,
    value: macd.line[i]
  })).filter(x => Number.isFinite(x.value))
);

signalLine.setData(
  candles.map((c, i) => ({
    time: c.time,
    value: macd.signal[i]
  })).filter(x => Number.isFinite(x.value))
);

histogram.setData(
  candles.map((c, i) => ({
    time: c.time,
    value: macd.histogram[i],

    color: macd.histogram[i] >= 0
      ? "rgba(22,199,132,0.65)"
      : "rgba(234,57,67,0.65)"
  })).filter(x => Number.isFinite(x.value))
);

instances.get(containerId).panels.macd = panel;

return panel;


}

// ---------------------------------------------------------- // CROSSHAIR SUBSCRIPTION // ----------------------------------------------------------

function subscribeCrosshair(containerId, callback) { const instance = instances.get(containerId);

if (!instance || !instance.candleSeries) return;

instance.chart.subscribeCrosshairMove(param => {
  if (
    !param ||
    !param.time ||
    !param.point ||
    param.point.x < 0 ||
    param.point.y < 0
  ) {
    callback(null);
    return;
  }

  const candle = param.seriesData.get(
    instance.candleSeries
  );

  if (!candle) {
    callback(null);
    return;
  }

  callback({
    time: param.time,

    price: candle.close,

    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,

    x: param.point.x,
    y: param.point.y
  });
});


}

// ---------------------------------------------------------- // SYNCHRONIZE PANELS // ----------------------------------------------------------

function synchronizePanels(containerId) { const instance = instances.get(containerId);

if (!instance) return;

const main = instance.chart;

Object.values(instance.panels).forEach(panel => {
  main.timeScale().subscribeVisibleLogicalRangeChange(range => {
    if (range) {
      panel.chart.timeScale().setVisibleLogicalRange(range);
    }
  });

  panel.chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    if (range) {
      main.timeScale().setVisibleLogicalRange(range);
    }
  });
});


}

// ---------------------------------------------------------- // TIMEFRAME UPDATE // ----------------------------------------------------------

function update(containerId, candles) { const instance = instances.get(containerId);

if (!instance || !instance.candleSeries) return;

const data = validCandles(candles);

instance.candleSeries.setData(data);

if (instance.volumeSeries) {
  instance.volumeSeries.setData(
    candles.map(c => ({
      time: c.time,
      value: Number(c.volume) || 0,

      color: c.close >= c.open
        ? "rgba(22,199,132,0.55)"
        : "rgba(234,57,67,0.55)"
    }))
  );
}

instance.chart.timeScale().fitContent();


}

// ---------------------------------------------------------- // INDICATOR VISIBILITY // ----------------------------------------------------------

function toggleIndicator(containerId, name, visible) { const instance = instances.get(containerId);

const series = instance?.indicators.get(name);

if (!series) return;

series.applyOptions({
  visible: Boolean(visible)
});


}

// ---------------------------------------------------------- // DESTROY // ----------------------------------------------------------

function destroy(containerId) { const instance = instances.get(containerId);

if (!instance) return;

instance.observers.forEach(observer => {
  observer.disconnect();
});

Object.values(instance.panels).forEach(panel => {
  panel.chart.remove();
});

instance.chart.remove();

instances.delete(containerId);


}

// ---------------------------------------------------------- // PUBLIC API // ----------------------------------------------------------

return Object.freeze({ create, addCandles, addVolume, addLine, addSMA, addEMA, addBollingerBands, createRSI, createMACD, subscribeCrosshair, synchronizePanels, update, toggleIndicator, destroy, COLORS });

})();
