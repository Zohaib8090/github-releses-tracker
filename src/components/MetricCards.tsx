import React from "react";
import { Download, Calendar, Layers, Activity, Award } from "lucide-react";
import { GitHubRelease } from "../types";
import { motion } from "motion/react";

interface MetricCardsProps {
  releases: GitHubRelease[];
}

export default function MetricCards({ releases }: MetricCardsProps) {
  // Calculations
  const totalReleases = releases.length;
  
  const totalDownloads = releases.reduce((total, release) => {
    return total + release.assets.reduce((sum, asset) => sum + asset.download_count, 0);
  }, 0);

  const averageDownloads = totalReleases > 0 ? Math.round(totalDownloads / totalReleases) : 0;

  // Latest release calculations
  const latestRelease = releases[0] || null;
  const latestDownloads = latestRelease
    ? latestRelease.assets.reduce((sum, asset) => sum + asset.download_count, 0)
    : 0;

  // Format big numbers
  const formatNum = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const cards = [
    {
      id: "metric-total-downloads",
      title: "Total Asset Downloads",
      value: formatNum(totalDownloads),
      icon: <Download className="w-5 h-5" />,
      color: "bg-sky-500/10 text-sky-400 border-sky-500/25",
      description: "Across all captured release versions",
    },
    {
      id: "metric-total-releases",
      title: "Releases Checked",
      value: totalReleases,
      icon: <Layers className="w-5 h-5" />,
      color: "bg-emerald-500/10 text-emerald-450 border-emerald-500/25",
      description: releases.filter((r) => r.prerelease).length > 0 
        ? `${releases.filter((r) => !r.prerelease).length} Stable, ${releases.filter((r) => r.prerelease).length} Pre`
        : "Stable production versions",
    },
    {
      id: "metric-latest-version",
      title: "Latest Release Downloads",
      value: formatNum(latestDownloads),
      icon: <Award className="w-5 h-5" />,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      description: latestRelease ? `${latestRelease.tag_name} (${new Date(latestRelease.published_at).toLocaleDateString()})` : "No releases found",
    },
    {
      id: "metric-average-downloads",
      title: "Average per Release",
      value: formatNum(averageDownloads),
      icon: <Activity className="w-5 h-5" />,
      color: "bg-pink-500/10 text-pink-400 border-pink-500/25",
      description: "Average distribution per version tag",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          id={card.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden"
        >
          {/* Accent light on hover */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                {card.title}
              </span>
              <span className="text-2xl font-bold text-white tracking-tight font-sans">
                {card.value}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border ${card.color} font-medium`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-850 pt-3">
            <span className="text-[10px] text-slate-400 font-mono">
              {card.description}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
