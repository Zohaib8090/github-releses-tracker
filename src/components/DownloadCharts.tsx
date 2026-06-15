import React, { useState, useMemo, useRef, useEffect } from "react";
import { LineChart, BarChart4, TrendingUp, Sparkles, Filter, Info } from "lucide-react";
import { RepositoryHistory, GitHubRelease } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface DownloadChartsProps {
  history: RepositoryHistory;
  releases: GitHubRelease[];
}

type ChartTab = "trend" | "comparison";

export default function DownloadCharts({ history, releases }: DownloadChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>("trend");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverBarItem, setHoverBarItem] = useState<string | null>(null);
  const [limitTags, setLimitTags] = useState<number>(10); // Show top 10 releases by default
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG parameters
  const svgWidth = 1000;
  const svgHeight = 350;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // 1. Data Processing for Line CHART (Historical Trend)
  // Accumulate total download counts for each snapshot in history
  const trendData = useMemo(() => {
    if (!history.snapshots || history.snapshots.length === 0) return [];
    
    return history.snapshots.map((snap) => {
      const dateObj = new Date(snap.timestamp);
      // Format as Month Day, Yr
      const dateLabel = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
      const dateFull = dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const totalDownloads = snap.releases.reduce((sum, r) => sum + r.total_downloads, 0);

      return {
        dateLabel,
        dateFull,
        value: totalDownloads,
        releases: snap.releases,
      };
    });
  }, [history]);

  // Max value for line chart scaling
  const maxTrendValue = useMemo(() => {
    if (trendData.length === 0) return 0;
    const maxVal = Math.max(...trendData.map((d) => d.value));
    return maxVal === 0 ? 100 : Math.ceil(maxVal * 1.15); // Add padding
  }, [trendData]);

  // 2. Data Processing for Bar CHART (Release Comparison)
  const barData = useMemo(() => {
    // Process top releases
    const unsorted = releases.map((release) => {
      const downloads = release.assets.reduce((sum, a) => sum + a.download_count, 0);
      return {
        tag: release.tag_name,
        downloads,
      };
    });

    // Sort by downloads desc, limit to selected count
    return unsorted
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limitTags);
  }, [releases, limitTags]);

  const maxBarValue = useMemo(() => {
    if (barData.length === 0) return 0;
    const maxVal = Math.max(...barData.map((d) => d.downloads));
    return maxVal === 0 ? 100 : Math.ceil(maxVal * 1.12);
  }, [barData]);

  // 3. Helper to build coordinates for historical curve
  const linePoints = useMemo(() => {
    if (trendData.length === 0 || maxTrendValue === 0) return "";
    
    return trendData
      .map((d, i) => {
        const x = paddingLeft + (i / (trendData.length - 1)) * plotWidth;
        const y = svgHeight - paddingBottom - (d.value / maxTrendValue) * plotHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trendData, maxTrendValue, plotWidth, plotHeight]);

  // Under-line gradient area points
  const areaPoints = useMemo(() => {
    if (trendData.length === 0 || maxTrendValue === 0) return "";
    const points = linePoints;
    const startX = paddingLeft;
    const endX = paddingLeft + plotWidth;
    const bottomY = svgHeight - paddingBottom;
    return `${startX},${bottomY} ${points} ${endX},${bottomY}`;
  }, [linePoints, trendData]);

  // Format Helper for Large Numbers
  const formatCompactNum = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
  };

  const formatWithCommas = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Tracking mouse movement to draw nice interactive tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (trendData.length === 0 || !containerRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - bounds.left;
    const svgRelativeX = (relativeX / bounds.width) * svgWidth;

    // Map back to the closest index
    const relativePlotX = svgRelativeX - paddingLeft;
    const indexFraction = relativePlotX / plotWidth;
    let index = Math.round(indexFraction * (trendData.length - 1));

    if (index < 0) index = 0;
    if (index >= trendData.length) index = trendData.length - 1;

    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const currentHoverItem = hoverIndex !== null ? trendData[hoverIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
      {/* Header and Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-sans">
            <TrendingUp className="w-5 h-5 text-sky-400 animate-pulse" />
            Download Performance Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize distribution and cumulative historical growth velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl self-start sm:self-auto border border-slate-850">
          <button
            id="chart-tab-trend"
            onClick={() => setActiveTab("trend")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "trend"
                ? "bg-slate-900 text-sky-400 shadow-2xs font-bold border border-slate-800"
                : "text-slate-550 hover:text-slate-300"
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            Historical Growth
          </button>
          <button
            id="chart-tab-compare"
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "comparison"
                ? "bg-slate-900 text-sky-400 shadow-2xs font-bold border border-slate-800"
                : "text-slate-550 hover:text-slate-300"
            }`}
          >
            <BarChart4 className="w-3.5 h-3.5" />
            Compare Releases
          </button>
        </div>
      </div>

      {/* Main charting frame */}
      <div className="relative flex-1" ref={containerRef}>
        {activeTab === "trend" ? (
          <div>
            {trendData.length > 0 ? (
              <div className="relative">
                {/* SVG Line Graph */}
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    {/* Shadow Area Gradient */}
                    <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.00" />
                    </linearGradient>
                    {/* Stroke Gradient */}
                    <linearGradient id="trendStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#7dd3fc" />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = paddingTop + ratio * plotHeight;
                    const val = maxTrendValue * (1 - ratio);
                    return (
                      <g key={ratio} className="opacity-40">
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={svgWidth - paddingRight}
                          y2={y}
                          stroke="#1e293b"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="font-mono text-[10px] font-semibold fill-slate-500"
                        >
                          {formatCompactNum(Math.round(val))}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis Date Labels */}
                  {trendData.map((d, i) => {
                    // Draw roughly 4-5 labels to avoid crowding
                    const step = Math.ceil(trendData.length / 5);
                    if (i % step !== 0 && i !== trendData.length - 1) return null;

                    const x = paddingLeft + (i / (trendData.length - 1)) * plotWidth;
                    return (
                      <g key={i}>
                        <text
                          x={x}
                          y={svgHeight - paddingBottom + 18}
                          textAnchor="middle"
                          className="font-mono text-[10px] font-semibold fill-slate-500"
                        >
                          {d.dateLabel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Fill under Line */}
                  {areaPoints && (
                    <polygon points={areaPoints} fill="url(#trendAreaGrad)" className="transition-all duration-300" />
                  )}

                  {/* Smooth Line */}
                  {linePoints && (
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="url(#trendStrokeGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Hover Guideline & Data node */}
                  {hoverIndex !== null && (
                    <g>
                      {/* Vertical line line */}
                      <line
                        x1={paddingLeft + (hoverIndex / (trendData.length - 1)) * plotWidth}
                        y1={paddingTop}
                        x2={paddingLeft + (hoverIndex / (trendData.length - 1)) * plotWidth}
                        y2={svgHeight - paddingBottom}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      {/* Highlight circle node */}
                      <circle
                        cx={paddingLeft + (hoverIndex / (trendData.length - 1)) * plotWidth}
                        cy={svgHeight - paddingBottom - (trendData[hoverIndex].value / maxTrendValue) * plotHeight}
                        r="5"
                        fill="#0ea5e9"
                        stroke="#0f172a"
                        strokeWidth="2"
                        className="shadow-sm"
                      />
                    </g>
                  )}
                </svg>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 block" />
                    <span className="text-xs font-semibold text-slate-500 font-sans">
                      Cumulative Release Download Curve
                    </span>
                  </div>
                </div>

                {/* Line Chart Hover Tooltip (Floating overlay or side panel for extreme mobile safety) */}
                <AnimatePresence>
                  {currentHoverItem && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-0 right-0 bg-slate-950/95 text-white p-4 rounded-xl shadow-lg border border-slate-800 backdrop-blur-xs min-w-[200px] text-xs pointer-events-none md:mr-10 md:mt-2"
                    >
                      <p className="text-slate-500 font-mono text-[10px] border-b border-slate-800 pb-1.5 flex justify-between items-center">
                        <span>DATA TIMELINE</span>
                        <span>{currentHoverItem.dateLabel}</span>
                      </p>
                      <div className="mt-2.5">
                        <span className="text-slate-400 font-sans font-medium block">Total Downloads</span>
                        <span className="text-lg font-bold font-mono text-sky-400">
                          {formatWithCommas(currentHoverItem.value)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-sky-400 uppercase font-bold tracking-widest block mb-1">
                          Releases Captured
                        </span>
                        <ul className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                          {currentHoverItem.releases.slice(0, 4).map((r, i) => (
                            <li key={i} className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-300 truncate max-w-[110px]">{r.tag_name}</span>
                              <span className="font-mono text-slate-500 font-medium">
                                {formatCompactNum(r.total_downloads)}
                              </span>
                            </li>
                          ))}
                          {currentHoverItem.releases.length > 4 && (
                            <li className="text-[9px] text-slate-600 italic">
                              + {currentHoverItem.releases.length - 4} other tags
                            </li>
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-[280px] bg-slate-950/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-850">
                <Info className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-slate-450 font-medium text-sm">No historical tracking data cached</p>
                <p className="text-slate-500 text-xs mt-1 max-w-sm">
                  Historical data points accumulate over time once you search and keep repo tracking active.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* BAR CHART: COMPARATIVE RELEASES */}
            {barData.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 font-mono">
                      <Filter className="w-3 h-3 text-slate-500" />
                      Show Limit:
                    </span>
                    <select
                      id="bar-limit-select"
                      value={limitTags}
                      onChange={(e) => setLimitTags(Number(e.target.value))}
                      className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-semibold focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    >
                      <option value={5}>Top 5 releases</option>
                      <option value={10}>Top 10 releases</option>
                      <option value={20}>Top 20 releases</option>
                      <option value={50}>Top 50 releases</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  {/* SVG Bar Chart */}
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto overflow-visible select-none"
                  >
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#006494" />
                      </linearGradient>
                      <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>

                    {/* Y Axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = paddingTop + ratio * plotHeight;
                      const val = maxBarValue * (1 - ratio);
                      return (
                        <g key={ratio} className="opacity-40">
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={svgWidth - paddingRight}
                            y2={y}
                            stroke="#1e293b"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="font-mono text-[10px] font-semibold fill-slate-500"
                          >
                            {formatCompactNum(Math.round(val))}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars Rendering */}
                    {barData.map((d, i) => {
                      const numBars = barData.length;
                      const totalBarSpacing = plotWidth / numBars;
                      const barWidth = Math.max(8, totalBarSpacing * 0.65);
                      const barX = paddingLeft + i * totalBarSpacing + (totalBarSpacing - barWidth) / 2;

                      const rawHeight = (d.downloads / maxBarValue) * plotHeight;
                      const barHeight = Math.max(2, rawHeight); // Ensure tiny values still draw a pixel line
                      const barY = svgHeight - paddingBottom - barHeight;

                      const isHovered = hoverBarItem === d.tag;

                      return (
                        <g
                          key={d.tag}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoverBarItem(d.tag)}
                          onMouseLeave={() => setHoverBarItem(null)}
                        >
                          {/* Main Bar Rectangle */}
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            rx={Math.min(4, barWidth / 3)}
                            fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                            className="transition-all duration-200"
                          />

                          {/* Hover Overlay Light Box */}
                          <rect
                            x={barX - (totalBarSpacing - barWidth) / 2}
                            y={paddingTop}
                            width={totalBarSpacing}
                            height={plotHeight}
                            fill="transparent"
                          />

                           {/* Top value badge label (shown when hovered or when few bars) */}
                          {(isHovered || numBars <= 8) && (
                            <text
                              x={barX + barWidth / 2}
                              y={barY - 8}
                              textAnchor="middle"
                              className={`font-mono text-[9px] font-bold ${
                                isHovered ? "fill-sky-400 scale-105" : "fill-slate-500"
                              }`}
                            >
                              {formatCompactNum(d.downloads)}
                            </text>
                          )}

                          {/* Tag Name Labels at X Axis */}
                          <text
                            x={barX + barWidth / 2}
                            y={svgHeight - paddingBottom + 16}
                            textAnchor="middle"
                            transform={`rotate(-25, ${barX + barWidth / 2}, ${svgHeight - paddingBottom + 16})`}
                            className={`font-mono text-[9px] font-semibold ${
                              isHovered ? "fill-sky-450 font-bold" : "fill-slate-500"
                            }`}
                          >
                            {d.tag}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                
                {/* Floating tooltip for Bar comparison */}
                <AnimatePresence>
                  {hoverBarItem && (
                    <div className="mt-4 p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-xs font-sans text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Active Tag: <strong className="text-white font-bold">{hoverBarItem}</strong></span>
                      </div>
                      <div className="font-mono">
                        <span>Downloads: </span>
                        <strong className="text-sky-450 font-bold">
                          {formatWithCommas(barData.find(b => b.tag === hoverBarItem)?.downloads || 0)}
                        </strong>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-[280px] bg-slate-950/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-850 font-mono">
                <Info className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-slate-450 font-semibold text-sm">No releases available for comparison</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
