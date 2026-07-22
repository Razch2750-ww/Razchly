import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Eye, EyeOff, Settings, RotateCcw, Plus, Minus, 
  TrendingUp, TrendingDown, Trash2, Edit3, Move,
  Info, Sparkles, Sliders
} from "lucide-react";
import { Candle, generateHistoricalData, calculateDynamicIndicators } from "../utils/indicators";

interface TradingViewChartProps {
  selectedSymbol: string;
  currentPrice: number;
  displayCurrency: "USD" | "IDR";
  usdToIdrRate: number;
  formatCurrencyVal: (amount: number, originalCurrency?: "USD" | "IDR") => string;
}

export default function TradingViewChart({
  selectedSymbol,
  currentPrice,
  displayCurrency,
  usdToIdrRate,
  formatCurrencyVal
}: TradingViewChartProps) {
  // Chart states
  const [timeframe, setTimeframe] = useState<"15M" | "1H" | "4H" | "1D">("15M");
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  
  // Indicators toggles
  const [showSma, setShowSma] = useState(true);
  const [showBb, setShowBb] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Interaction / Viewport state
  const [visibleCount, setVisibleCount] = useState(60); // Zoom level (number of visible candles)
  const [scrollOffset, setScrollOffset] = useState(0); // Panning offset from the latest candle
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);

  // Custom drawings (Horizontal support/resistance lines)
  const [supportLines, setSupportLines] = useState<number[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // SVG container measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(width, 300), height: 350 });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch / Generate raw historical data based on timeframe
  const rawCandles = useMemo(() => {
    // Determine days needed to generate
    let days = 3;
    if (timeframe === "1H") days = 10;
    if (timeframe === "4H") days = 40;
    if (timeframe === "1D") days = 150;

    const data = generateHistoricalData(selectedSymbol, days);
    
    // Add indicators
    calculateDynamicIndicators(data);

    // Inject live price into the very last candle
    if (data.length > 0 && currentPrice > 0) {
      const last = data[data.length - 1];
      last.close = currentPrice;
      if (currentPrice > last.high) last.high = currentPrice;
      if (currentPrice < last.low) last.low = currentPrice;
    }

    return data;
  }, [selectedSymbol, timeframe, currentPrice]);

  // Generate deterministic mock signals (Buy when oversold / touches lower BB, Sell when overbought / touches upper BB)
  const signals = useMemo(() => {
    const list: { index: number; type: "BUY" | "SELL"; price: number; reason: string }[] = [];
    if (rawCandles.length < 25) return list;

    for (let i = 20; i < rawCandles.length; i++) {
      const c = rawCandles[i];
      const prev = rawCandles[i - 1];

      // Buy Signal condition
      if (c.rsi && c.rsi < 30 && prev.rsi && prev.rsi >= 30) {
        list.push({ index: i, type: "BUY", price: c.low, reason: "RSI Oversold Recovery" });
      } else if (c.bbLower && c.close <= c.bbLower && prev.close > prev.bbLower) {
        list.push({ index: i, type: "BUY", price: c.low, reason: "Bollinger Band Lower Touch" });
      }
      // Sell Signal condition
      else if (c.rsi && c.rsi > 70 && prev.rsi && prev.rsi <= 70) {
        list.push({ index: i, type: "SELL", price: c.high, reason: "RSI Overbought Pullback" });
      } else if (c.bbUpper && c.close >= c.bbUpper && prev.close < prev.bbUpper) {
        list.push({ index: i, type: "SELL", price: c.high, reason: "Bollinger Band Upper Break" });
      }
    }

    // Limit signals density to avoid clutter (minimum gap of 5 candles)
    const filtered: typeof list = [];
    let lastSignalIndex = -10;
    for (const sig of list) {
      if (sig.index - lastSignalIndex >= 8) {
        filtered.push(sig);
        lastSignalIndex = sig.index;
      }
    }

    return filtered;
  }, [rawCandles]);

  // Viewport calculation based on zoom (visibleCount) and scroll (scrollOffset)
  const chartData = useMemo(() => {
    const total = rawCandles.length;
    const end = Math.max(total - scrollOffset, visibleCount);
    const start = Math.max(end - visibleCount, 0);
    return rawCandles.slice(start, end);
  }, [rawCandles, visibleCount, scrollOffset]);

  // Get index of the visible subset relative to rawCandles
  const rawDataBounds = useMemo(() => {
    const total = rawCandles.length;
    const end = Math.max(total - scrollOffset, visibleCount);
    const start = Math.max(end - visibleCount, 0);
    return { start, end };
  }, [rawCandles, visibleCount, scrollOffset]);

  // Find price bounds of current viewport to scale Y-axis
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 };
    
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    chartData.forEach((c) => {
      // Base candles
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;

      // Include visible indicators in scaling to keep them on screen
      if (showBb) {
        if (c.bbLower && c.bbLower < min) min = c.bbLower;
        if (c.bbUpper && c.bbUpper > max) max = c.bbUpper;
      }
      if (showSma) {
        if (c.sma20 && c.sma20 < min) min = c.sma20;
        if (c.sma20 && c.sma20 > max) max = c.sma20;
      }
    });

    // Add padding (5%)
    const diff = max - min;
    const padding = diff * 0.05 || 10;
    return { 
      minPrice: Math.max(0, min - padding), 
      maxPrice: max + padding,
      maxVolume: maxVol || 1
    };
  }, [chartData, showBb, showSma]);

  // Drag-to-pan implementation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawingMode) return; // Do not pan when clicking to draw a line
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const svgEl = e.currentTarget as SVGElement;
    const rect = svgEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Crosshair index calculation
    const usableWidth = dimensions.width - 65; // Right margin for Y-Axis
    const candleWidth = usableWidth / chartData.length;
    const index = Math.floor(x / candleWidth);

    if (index >= 0 && index < chartData.length) {
      setHoverIndex(index);
      setHoveredCandle(chartData[index]);
    } else {
      setHoverIndex(null);
      setHoveredCandle(null);
    }
    setMouseY(y);

    if (isDragging) {
      const deltaX = e.clientX - dragStart;
      const stepWidth = usableWidth / visibleCount;
      const candlesShifted = Math.round(deltaX / stepWidth);

      if (candlesShifted !== 0) {
        const newOffset = Math.max(0, Math.min(rawCandles.length - visibleCount, scrollOffset + candlesShifted));
        setScrollOffset(newOffset);
        setDragStart(e.clientX);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverIndex(null);
    setHoveredCandle(null);
    setMouseY(null);
  };

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;

    // Calculate Y-axis coordinate to price
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Main chart viewport bounds
    const mainHeight = dimensions.height - (showRsi ? 100 : 40);
    const topMargin = 20;
    const usableHeight = mainHeight - topMargin - 20;

    if (y >= topMargin && y <= mainHeight - 20) {
      const relativeY = (y - topMargin) / usableHeight;
      const price = maxPrice - (relativeY * (maxPrice - minPrice));
      setSupportLines(prev => [...prev, price]);
      setIsDrawingMode(false); // Turn off drawing mode after click
    }
  };

  // Zoom handlers
  const zoomIn = () => {
    setVisibleCount((prev) => Math.max(15, prev - 10));
  };

  const zoomOut = () => {
    setVisibleCount((prev) => Math.min(180, prev + 10));
  };

  const resetZoom = () => {
    setVisibleCount(60);
    setScrollOffset(0);
    setSupportLines([]);
  };

  // Dimensions & Coordinates
  const rightMargin = 65;
  const usableWidth = dimensions.width - rightMargin;
  const mainHeight = dimensions.height - (showRsi ? 100 : 40);
  const rsiHeight = 60;
  const topMargin = 20;
  const mainUsableHeight = mainHeight - topMargin - 20;

  // Convert Price to Y coordinate on main chart
  const getPriceY = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return mainHeight - 20 - ratio * mainUsableHeight;
  };

  // Convert RSI value to Y coordinate on RSI sub-chart
  const getRsiY = (val: number) => {
    const subTop = mainHeight + 15;
    const ratio = (val - 0) / (100 - 0); // RSI is 0-100
    return subTop + rsiHeight - (ratio * rsiHeight);
  };

  // Convert index to X coordinate
  const getCandleX = (idx: number) => {
    const candleWidth = usableWidth / chartData.length;
    return idx * candleWidth + (candleWidth / 2);
  };

  const candleWidth = usableWidth / chartData.length;

  // Render SVG Path helper for line charts
  const getLinePath = (key: keyof Candle | ((c: Candle) => number | undefined)) => {
    let path = "";
    chartData.forEach((c, i) => {
      const val = typeof key === "function" ? key(c) : (c[key] as number | undefined);
      if (val !== undefined && !isNaN(val)) {
        const x = getCandleX(i);
        const y = getPriceY(val);
        if (i === 0) path += `M ${x} ${y}`;
        else path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  // SVG Area path helper
  const getAreaPath = () => {
    if (chartData.length === 0) return "";
    let path = getLinePath("close");
    if (!path) return "";
    
    const startX = getCandleX(0);
    const endX = getCandleX(chartData.length - 1);
    const baseY = getPriceY(minPrice);
    path += ` L ${endX} ${baseY} L ${startX} ${baseY} Z`;
    return path;
  };

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm space-y-4" id="tradingview-simulator-container">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-app-accent1/10 rounded-xl flex items-center justify-center text-app-accent1">
            <TrendingUp className="w-4 h-4 animate-pulse-slow" />
          </div>
          <div>
            <h3 className="font-semibold text-app-text-bright text-xs sm:text-sm flex items-center gap-1.5">
              <span>Simulator Market Live & Chart Kustom</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/15 px-1.5 py-0.5 rounded">
                TradingView v2.1
              </span>
            </h3>
            <p className="text-[10px] text-app-text/50">Sesuaikan indikator teknikal & analisa tren visual secara interaktif</p>
          </div>
        </div>

        {/* Customization Options */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Timeframe */}
          <div className="flex bg-app-bg rounded-lg border border-app-border p-0.5" id="tv-timeframes">
            {(["15M", "1H", "4H", "1D"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-md font-mono text-[10px] font-semibold cursor-pointer transition-colors ${
                  timeframe === tf 
                    ? "bg-app-accent1 text-app-bg shadow" 
                    : "text-app-text/60 hover:text-app-text-bright"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Style */}
          <div className="flex bg-app-bg rounded-lg border border-app-border p-0.5" id="tv-chart-styles">
            <button
              onClick={() => setChartType("candlestick")}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                chartType === "candlestick"
                  ? "bg-app-accent2 text-app-bg font-semibold shadow"
                  : "text-app-text/60 hover:text-app-text-bright"
              }`}
            >
              Lilin (Candle)
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                chartType === "line"
                  ? "bg-app-accent2 text-app-bg font-semibold shadow"
                  : "text-app-text/60 hover:text-app-text-bright"
              }`}
            >
              Garis
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                chartType === "area"
                  ? "bg-app-accent2 text-app-bg font-semibold shadow"
                  : "text-app-text/60 hover:text-app-text-bright"
              }`}
            >
              Area
            </button>
          </div>

          {/* Draw support line */}
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold ${
              isDrawingMode
                ? "bg-amber-500/10 border-amber-500/50 text-amber-300 animate-pulse"
                : "bg-app-bg border-app-border text-app-text/60 hover:text-amber-400"
            }`}
            title="Klik disini, lalu klik pada grafik untuk menempatkan garis support/resistance"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isDrawingMode ? "Klik di Chart" : "+ S/R Garis"}
          </button>

          {/* Zoom controls */}
          <div className="flex bg-app-bg rounded-lg border border-app-border p-0.5">
            <button onClick={zoomIn} className="p-1 text-app-text/60 hover:text-app-text-bright cursor-pointer" title="Perbesar">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={zoomOut} className="p-1 text-app-text/60 hover:text-app-text-bright cursor-pointer" title="Perkecil">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button onClick={resetZoom} className="p-1 text-app-text/60 hover:text-app-text-bright cursor-pointer" title="Reset Chart">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="flex flex-wrap items-center gap-2 bg-app-bg/50 p-2 rounded-xl border border-app-border text-[10px]">
        <span className="text-app-text/50 font-semibold uppercase tracking-wider mr-1.5">IND_OVERLAYS:</span>
        <button
          onClick={() => setShowSma(!showSma)}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1 cursor-pointer font-medium transition-all ${
            showSma ? "bg-purple-500/15 border-purple-500/30 text-purple-300" : "bg-transparent border-app-border text-app-text/50"
          }`}
        >
          <Sliders className="w-3 h-3" />
          SMA (20)
        </button>
        <button
          onClick={() => setShowBb(!showBb)}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1 cursor-pointer font-medium transition-all ${
            showBb ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300" : "bg-transparent border-app-border text-app-text/50"
          }`}
        >
          <Sliders className="w-3 h-3" />
          Bollinger Bands
        </button>
        <button
          onClick={() => setShowRsi(!showRsi)}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1 cursor-pointer font-medium transition-all ${
            showRsi ? "bg-pink-500/15 border-pink-500/30 text-pink-300" : "bg-transparent border-app-border text-app-text/50"
          }`}
        >
          <Eye className="w-3 h-3" />
          RSI (14)
        </button>
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1 cursor-pointer font-medium transition-all ${
            showVolume ? "bg-teal-500/15 border-teal-500/30 text-teal-300" : "bg-transparent border-app-border text-app-text/50"
          }`}
        >
          <Eye className="w-3 h-3" />
          Volume
        </button>
        <button
          onClick={() => setShowSignals(!showSignals)}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1 cursor-pointer font-medium transition-all ${
            showSignals ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-transparent border-app-border text-app-text/50"
          }`}
        >
          <Sparkles className="w-3 h-3 animate-pulse-slow" />
          Sinyal Beli/Jual
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-2 py-1 rounded-md border text-[9px] cursor-pointer font-mono transition-all ml-auto ${
            showGrid ? "border-app-border text-app-text/60" : "border-app-border text-app-text/30"
          }`}
        >
          GRID: {showGrid ? "ON" : "OFF"}
        </button>
      </div>

      {/* Floating Status Display */}
      <div className="flex flex-wrap items-center justify-between text-[11px] bg-app-bg/30 px-3 py-2 rounded-xl border border-app-border font-mono gap-y-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {hoveredCandle ? (
            <>
              <span className="text-app-text/50">T: <span className="text-app-text-bright font-semibold">{hoveredCandle.time.split(" ")[1] || hoveredCandle.time}</span></span>
              <span>O: <span className={hoveredCandle.close >= hoveredCandle.open ? "text-app-success" : "text-app-danger"}>{formatCurrencyVal(hoveredCandle.open, selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI") ? "IDR" : "USD")}</span></span>
              <span>H: <span className={hoveredCandle.close >= hoveredCandle.open ? "text-app-success" : "text-app-danger"}>{formatCurrencyVal(hoveredCandle.high, selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI") ? "IDR" : "USD")}</span></span>
              <span>L: <span className={hoveredCandle.close >= hoveredCandle.open ? "text-app-success" : "text-app-danger"}>{formatCurrencyVal(hoveredCandle.low, selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI") ? "IDR" : "USD")}</span></span>
              <span>C: <span className={hoveredCandle.close >= hoveredCandle.open ? "text-app-success" : "text-app-danger"}>{formatCurrencyVal(hoveredCandle.close, selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI") ? "IDR" : "USD")}</span></span>
              {showVolume && <span>V: <span className="text-teal-400">{hoveredCandle.volume.toLocaleString()}</span></span>}
            </>
          ) : (
            <>
              <span className="text-app-text/50 flex items-center gap-1"><Info className="w-3.5 h-3.5 text-app-accent1" /> Geser kursor di atas grafik untuk memantau data candle OHLCV secara presisi</span>
            </>
          )}
        </div>
        
        {hoveredCandle && (
          <div className="flex gap-2">
            {showSma && hoveredCandle.sma20 && (
              <span className="text-purple-300 text-[10px]">SMA(20): {formatCurrencyVal(hoveredCandle.sma20, selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI") ? "IDR" : "USD")}</span>
            )}
            {showBb && hoveredCandle.bbUpper && (
              <span className="text-cyan-300 text-[10px]">BB(20,2): {formatCurrencyVal(hoveredCandle.bbLower || 0)} - {formatCurrencyVal(hoveredCandle.bbUpper)}</span>
            )}
            {showRsi && hoveredCandle.rsi && (
              <span className="text-pink-300 text-[10px]">RSI(14): {hoveredCandle.rsi}</span>
            )}
          </div>
        )}
      </div>

      {/* Main SVG Graphic Display Area */}
      <div 
        ref={containerRef} 
        className="w-full relative select-none cursor-crosshair bg-app-bg rounded-xl border border-app-border overflow-hidden"
        style={{ height: `${dimensions.height}px` }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleChartClick}
          className="w-full h-full block"
        >
          {/* 1. Grid Background lines */}
          {showGrid && (
            <g opacity={0.15}>
              {/* Horizontal Grid Lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                const y = topMargin + ratio * mainUsableHeight;
                return (
                  <line 
                    key={`h-grid-${i}`}
                    x1={0} 
                    y1={y} 
                    x2={usableWidth} 
                    y2={y} 
                    stroke="var(--text-color)" 
                    strokeWidth={1} 
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Vertical Grid Lines */}
              {chartData.map((_, i) => {
                if (i % 8 !== 0) return null;
                const x = getCandleX(i);
                return (
                  <line 
                    key={`v-grid-${i}`}
                    x1={x} 
                    y1={0} 
                    x2={x} 
                    y2={dimensions.height} 
                    stroke="var(--text-color)" 
                    strokeWidth={1} 
                    strokeDasharray="3 3"
                  />
                );
              })}
            </g>
          )}

          {/* 2. Technical Overlay: Bollinger Bands Area & lines */}
          {showBb && (
            <g opacity={0.85}>
              {/* Draw bands area fill */}
              <path
                d={(() => {
                  let upperPath = "";
                  let lowerPath = "";
                  chartData.forEach((c, i) => {
                    if (c.bbUpper && c.bbLower) {
                      const x = getCandleX(i);
                      const yUp = getPriceY(c.bbUpper);
                      const yLow = getPriceY(c.bbLower);
                      if (i === 0) {
                        upperPath += `M ${x} ${yUp}`;
                        lowerPath += `M ${x} ${yLow}`;
                      } else {
                        upperPath += ` L ${x} ${yUp}`;
                        lowerPath += ` L ${x} ${yLow}`;
                      }
                    }
                  });
                  if (!upperPath || !lowerPath) return "";
                  // Reverse lower path to close the polygon
                  const reversedLower = lowerPath.split(" ").reverse().join(" ");
                  return `${upperPath} L ${reversedLower.replace("M", "L")} Z`;
                })()}
                fill="rgba(6, 182, 212, 0.04)"
              />
              {/* Upper band */}
              <path d={getLinePath("bbUpper")} stroke="#22d3ee" strokeWidth={1.2} fill="none" strokeDasharray="3 1" />
              {/* Middle band */}
              <path d={getLinePath("bbMiddle")} stroke="#0891b2" strokeWidth={1} fill="none" opacity={0.6} />
              {/* Lower band */}
              <path d={getLinePath("bbLower")} stroke="#22d3ee" strokeWidth={1.2} fill="none" strokeDasharray="3 1" />
            </g>
          )}

          {/* 3. Technical Overlay: SMA Line */}
          {showSma && (
            <path
              d={getLinePath("sma20")}
              stroke="#a855f7"
              strokeWidth={1.8}
              fill="none"
              opacity={0.9}
            />
          )}

          {/* 4. Chart drawing styles */}
          {chartType === "area" && (
            <g>
              <path d={getAreaPath()} fill="url(#areaGrad)" opacity={0.15} />
              <path d={getLinePath("close")} stroke="var(--accent1-color)" strokeWidth={2} fill="none" />
            </g>
          )}

          {chartType === "line" && (
            <path d={getLinePath("close")} stroke="var(--accent1-color)" strokeWidth={2} fill="none" />
          )}

          {chartType === "candlestick" && (
            <g shapeRendering="crispEdges">
              {chartData.map((c, i) => {
                const isBullish = c.close >= c.open;
                const color = isBullish ? "var(--success-color)" : "var(--danger-color)";
                
                const x = getCandleX(i);
                const oY = getPriceY(c.open);
                const cY = getPriceY(c.close);
                const hY = getPriceY(c.high);
                const lY = getPriceY(c.low);

                const widthPct = Math.max(2, candleWidth - 2);

                return (
                  <g key={`candle-${i}`}>
                    {/* Shadow / Wick */}
                    <line x1={x} y1={hY} x2={x} y2={lY} stroke={color} strokeWidth={1.2} />
                    {/* Candle Body */}
                    <rect
                      x={x - widthPct / 2}
                      y={Math.min(oY, cY)}
                      width={widthPct}
                      height={Math.max(1.5, Math.abs(oY - cY))}
                      fill={isBullish ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)"}
                      stroke={color}
                      strokeWidth={0.5}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* 5. Volume Bars overlaid at bottom of main chart */}
          {showVolume && (
            <g opacity={0.15} shapeRendering="crispEdges">
              {chartData.map((c, i) => {
                const isBullish = c.close >= c.open;
                const color = isBullish ? "var(--success-color)" : "var(--danger-color)";
                
                const x = getCandleX(i);
                const widthPct = Math.max(1.5, candleWidth - 2);
                
                const ratio = c.volume / maxVolume;
                const height = ratio * 50; // max 50px height
                const y = mainHeight - 20 - height;

                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - widthPct / 2}
                    y={y}
                    width={widthPct}
                    height={height}
                    fill={color}
                  />
                );
              })}
            </g>
          )}

          {/* 6. Buy / Sell Sinyal Markers overlayed */}
          {showSignals && (
            <g>
              {signals.map((sig, i) => {
                // Check if this signal is currently visible in viewport
                if (sig.index < rawDataBounds.start || sig.index >= rawDataBounds.end) return null;
                const visibleIdx = sig.index - rawDataBounds.start;
                const x = getCandleX(visibleIdx);
                
                const isBuy = sig.type === "BUY";
                const y = getPriceY(sig.price) + (isBuy ? 15 : -15);

                return (
                  <g key={`sig-${i}`} className="cursor-pointer">
                    <title>{`${sig.type} SIGNAL: ${sig.reason}`}</title>
                    {/* Animated Ripple ring */}
                    <circle cx={x} cy={y} r={6} fill="none" stroke={isBuy ? "var(--success-color)" : "var(--danger-color)"} strokeWidth={1} opacity={0.6}>
                      <animate attributeName="r" values="3;9;3" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    
                    {/* Indicator Triangle Shape */}
                    <path
                      d={isBuy ? `M ${x} ${y-3} L ${x-5} ${y+5} L ${x+5} ${y+5} Z` : `M ${x} ${y+3} L ${x-5} ${y-5} L ${x+5} ${y-5} Z`}
                      fill={isBuy ? "var(--success-color)" : "var(--danger-color)"}
                    />

                    {/* Simple badge label above/below */}
                    <rect
                      x={x - 18}
                      y={isBuy ? y + 8 : y - 20}
                      width={36}
                      height={12}
                      rx={2}
                      fill={isBuy ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                      stroke={isBuy ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}
                      strokeWidth={0.5}
                    />
                    <text
                      x={x}
                      y={isBuy ? y + 17 : y - 11}
                      fill={isBuy ? "rgba(16, 185, 129, 1)" : "rgba(239, 68, 68, 1)"}
                      fontSize={7.5}
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {isBuy ? "BUY" : "SELL"}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 7. Live Horizontal Price Indicator Line */}
          {currentPrice > 0 && (
            <g>
              <line
                x1={0}
                y1={getPriceY(currentPrice)}
                x2={usableWidth}
                y2={getPriceY(currentPrice)}
                stroke="var(--accent1-color)"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.8}
              />
              {/* Badge on Y-axis */}
              <rect
                x={usableWidth + 2}
                y={getPriceY(currentPrice) - 8}
                width={rightMargin - 4}
                height={16}
                rx={3}
                fill="var(--accent1-color)"
              />
              <text
                x={usableWidth + rightMargin/2}
                y={getPriceY(currentPrice) + 3}
                fill="var(--card-bg)"
                fontSize={8.5}
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI") ? (
                  displayCurrency === "IDR" ? (currentPrice).toLocaleString("id-ID", {maximumFractionDigits: 0}) : (currentPrice / usdToIdrRate).toLocaleString("en-US", {maximumFractionDigits: 1})
                ) : (
                  displayCurrency === "IDR" ? (currentPrice * usdToIdrRate).toLocaleString("id-ID", {maximumFractionDigits: 0}) : currentPrice.toLocaleString()
                )}
              </text>
            </g>
          )}

          {/* 8. User Custom S/R Lines */}
          {supportLines.map((price, i) => (
            <g key={`sr-${i}`}>
              <line
                x1={0}
                y1={getPriceY(price)}
                x2={usableWidth}
                y2={getPriceY(price)}
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.8}
              />
              {/* Label badge */}
              <rect
                x={usableWidth + 2}
                y={getPriceY(price) - 8}
                width={rightMargin - 4}
                height={16}
                rx={3}
                fill="#f59e0b"
                opacity={0.9}
              />
              <text
                x={usableWidth + rightMargin/2}
                y={getPriceY(price) + 3}
                fill="#000"
                fontSize={8}
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                S/R {i+1}
              </text>
              {/* Hover delete button on the line */}
              <circle
                cx={20}
                cy={getPriceY(price)}
                r={6}
                fill="rgba(239, 68, 68, 0.9)"
                className="cursor-pointer hover:scale-125 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setSupportLines(prev => prev.filter((_, idx) => idx !== i));
                }}
              >
                <title>Hapus Garis S/R ini</title>
              </circle>
              <text x={20} y={getPriceY(price) + 2.5} fill="#fff" fontSize={8} textAnchor="middle" pointerEvents="none">×</text>
            </g>
          ))}

          {/* 9. RSI Sub-chart underneath */}
          {showRsi && (
            <g>
              {/* Boundary divider line */}
              <line
                x1={0}
                y1={mainHeight + 10}
                x2={usableWidth}
                y2={mainHeight + 10}
                stroke="var(--border-color)"
                strokeWidth={1}
              />

              {/* RSI Sub-chart label */}
              <text
                x={5}
                y={mainHeight + 25}
                fill="var(--text-color)"
                fontSize={8.5}
                fontWeight="bold"
                opacity={0.4}
              >
                RSI (14)
              </text>

              {/* Oversold boundary 30 */}
              <line
                x1={0}
                y1={getRsiY(30)}
                x2={usableWidth}
                y2={getRsiY(30)}
                stroke="#ef4444"
                strokeWidth={0.8}
                strokeDasharray="4 4"
                opacity={0.4}
              />
              <text x={usableWidth + 4} y={getRsiY(30) + 3} fill="#ef4444" fontSize={7.5} fontFamily="monospace" opacity={0.5}>30</text>

              {/* Mid boundary 50 */}
              <line
                x1={0}
                y1={getRsiY(50)}
                x2={usableWidth}
                y2={getRsiY(50)}
                stroke="var(--text-color)"
                strokeWidth={0.5}
                strokeDasharray="2 2"
                opacity={0.2}
              />

              {/* Overbought boundary 70 */}
              <line
                x1={0}
                y1={getRsiY(70)}
                x2={usableWidth}
                y2={getRsiY(70)}
                stroke="#10b981"
                strokeWidth={0.8}
                strokeDasharray="4 4"
                opacity={0.4}
              />
              <text x={usableWidth + 4} y={getRsiY(70) + 3} fill="#10b981" fontSize={7.5} fontFamily="monospace" opacity={0.5}>70</text>

              {/* RSI Line path */}
              <path
                d={(() => {
                  let path = "";
                  chartData.forEach((c, i) => {
                    if (c.rsi) {
                      const x = getCandleX(i);
                      const y = getRsiY(c.rsi);
                      if (i === 0) path += `M ${x} ${y}`;
                      else path += ` L ${x} ${y}`;
                    }
                  });
                  return path;
                })()}
                stroke="#ec4899"
                strokeWidth={1.4}
                fill="none"
              />
            </g>
          )}

          {/* 10. Interactive crosshair hover display lines */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < chartData.length && (
            <g opacity={0.7} pointerEvents="none">
              {/* Vertical Crosshair Line */}
              <line
                x1={getCandleX(hoverIndex)}
                y1={0}
                x2={getCandleX(hoverIndex)}
                y2={dimensions.height}
                stroke="var(--accent2-color)"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              {/* Horizontal Crosshair Line */}
              {mouseY !== null && mouseY >= 0 && mouseY <= mainHeight && (
                <line
                  x1={0}
                  y1={mouseY}
                  x2={usableWidth}
                  y2={mouseY}
                  stroke="var(--accent2-color)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              )}
            </g>
          )}

          {/* 11. Y-axis Price Labels (Static) */}
          <g fontSize={8} fontFamily="monospace" opacity={0.6} fill="var(--text-color)">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const price = minPrice + ratio * (maxPrice - minPrice);
              const y = getPriceY(price);
              
              let formatted = "";
              if (selectedSymbol.includes("IDX") || selectedSymbol.includes("BBCA") || selectedSymbol.includes("BBRI")) {
                formatted = displayCurrency === "IDR" 
                  ? `Rp ${(price).toLocaleString("id-ID", {maximumFractionDigits: 0})}` 
                  : `$${(price / usdToIdrRate).toLocaleString("en-US", {maximumFractionDigits: 1})}`;
              } else {
                formatted = displayCurrency === "IDR" 
                  ? `Rp ${(price * usdToIdrRate).toLocaleString("id-ID", {maximumFractionDigits: 0})}` 
                  : `$${(price).toLocaleString("en-US", {minimumFractionDigits: price < 1 ? 4 : 0, maximumFractionDigits: price < 1 ? 4 : 0})}`;
              }

              return (
                <text key={`price-axis-${ratio}`} x={usableWidth + 4} y={y + 3}>
                  {formatted}
                </text>
              );
            })}
          </g>

          {/* Linear gradient definition for Area chart */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent1-color)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--accent1-color)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
        </svg>

        {/* Drag/S&R Instruction Overlay */}
        <div className="absolute bottom-2 left-3 bg-app-bg/80 border border-app-border px-2 py-1 rounded text-[9px] font-mono text-app-text/60 pointer-events-none">
          {isDrawingMode ? (
            <span className="text-amber-300 font-semibold">MODE GAMBAR AKTIF: Klik di chart untuk menggambar garis horizontal</span>
          ) : (
            <span>Klik & seret grafik ke kiri/kanan untuk menggeser history pasar</span>
          )}
        </div>
      </div>
    </div>
  );
}
