import React, { useState, useMemo } from "react";
import { 
  ChevronDown, ChevronUp, Download, Eye, Calendar, Tag, FileDown, 
  ExternalLink, Search, ArrowUpDown, ChevronRight, CheckCircle2, AlertCircle 
} from "lucide-react";
import { GitHubRelease, GitHubAsset } from "../types";
import { formatBytes } from "../utils/metrics";
import { motion, AnimatePresence } from "motion/react";

interface ReleaseTableProps {
  releases: GitHubRelease[];
}

type SortField = "date" | "downloads";
type SortOrder = "asc" | "desc";

export default function ReleaseTable({ releases }: ReleaseTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedReleaseId, setExpandedReleaseId] = useState<number | null>(null);

  // Toggle sorting fields
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Toggle rows dropdown
  const toggleExpandRelease = (id: number) => {
    setExpandedReleaseId(expandedReleaseId === id ? null : id);
  };

  // Calculate total download count for a given release
  const getReleaseDownloads = (release: GitHubRelease): number => {
    return release.assets.reduce((sum, asset) => sum + asset.download_count, 0);
  };

  // Filter and sort releases
  const processedReleases = useMemo(() => {
    let result = [...releases];

    // Filter by tag or release name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) => 
          r.tag_name.toLowerCase().includes(q) || 
          (r.name && r.name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.published_at).getTime();
        const dateB = new Date(b.published_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        const dlA = getReleaseDownloads(a);
        const dlB = getReleaseDownloads(b);
        return sortOrder === "asc" ? dlA - dlB : dlB - dlA;
      }
    });

    return result;
  }, [releases, searchQuery, sortField, sortOrder]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Search & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-sky-400" />
            Detailed Release Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full inventory of fetched release binaries, packages, and tags.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="release-search-input"
            type="text"
            placeholder="Search tags or version names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-650 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans font-medium"
          />
        </div>
      </div>

      {/* Sorting Header Bars */}
      <div className="flex items-center gap-4 bg-slate-950 p-2.5 rounded-xl text-xs font-semibold text-slate-500 mb-3 border border-slate-850/60">
        <span className="flex-1 pl-4">RELEASES</span>
        
        <button
          id="sort-by-date"
          onClick={() => handleSort("date")}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors py-1 px-3 rounded-md hover:bg-slate-800"
        >
          Publish Date
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          id="sort-by-downloads"
          onClick={() => handleSort("downloads")}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors py-1 px-3 rounded-md hover:bg-slate-800 mr-4"
        >
          Download Volume
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Release Inventory List */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {processedReleases.map((release) => {
            const isExpanded = expandedReleaseId === release.id;
            const releaseDownloads = getReleaseDownloads(release);
            const publishDate = new Date(release.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

             return (
              <motion.div
                key={release.id}
                layoutId={`release-row-${release.id}`}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded 
                    ? "border-sky-500/25 bg-sky-500/5 shadow-xs" 
                    : "border-slate-850 bg-slate-950/45 hover:border-slate-800"
                }`}
              >
                {/* Release Main Row Header */}
                <div
                  id={`release-row-header-${release.tag_name}`}
                  onClick={() => toggleExpandRelease(release.id)}
                  className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <span className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white truncate font-sans">
                          {release.tag_name}
                        </span>
                        {release.prerelease && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 font-mono">
                            Pre-release
                          </span>
                        )}
                        {!release.prerelease && !release.draft && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                            Stable
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs truncate mt-1 max-w-[200px] sm:max-w-md font-medium">
                        {release.name || "No release title"}
                      </p>
                    </div>
                  </div>

                  {/* Date & Global Counts */}
                  <div className="flex items-center gap-8 md:gap-14 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 justify-end font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-550" />
                        {publishDate}
                      </span>
                    </div>

                    <div className="text-right pr-2">
                      <span className="text-sm font-bold text-sky-400 font-mono flex items-center gap-2 justify-end">
                        <Download className="w-4 h-4 text-sky-400/80" />
                        {new Intl.NumberFormat().format(releaseDownloads)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans font-semibold">
                        {release.assets.length} file assets
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Binary Assets list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-850 bg-slate-900/20"
                    >
                      <div className="p-5 md:p-6 space-y-4">
                        {/* Changelog Overview block */}
                        {release.body && (
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-3xs">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-2 font-mono">
                              Changelog
                            </span>
                            <div className="text-xs text-slate-300 max-h-[140px] overflow-y-auto font-sans leading-relaxed break-words whitespace-pre-wrap">
                              {release.body}
                            </div>
                          </div>
                        )}

                        {/* List of compiled binaries */}
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-2.5 font-mono">
                            Distributables & Source Packages
                          </span>
                          
                          {release.assets.length > 0 ? (
                            <div className="space-y-2">
                              {release.assets.map((asset) => (
                                <div
                                  key={asset.id}
                                  className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs transition-colors"
                                >
                                  <div className="min-w-0 flex-1 flex items-start gap-3">
                                    <div className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shrink-0 mt-0.5">
                                      <FileDown className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-xs font-bold text-slate-200 block truncate font-mono">
                                        {asset.name}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                        Size: {formatBytes(asset.size)} &bull; Type: {asset.content_type}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-900">
                                    {/* Download Indicator count */}
                                    <div className="text-right sm:pr-2">
                                      <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 justify-end">
                                        <Download className="w-3.5 h-3.5 text-slate-550" />
                                        {new Intl.NumberFormat().format(asset.download_count)}
                                      </span>
                                      <span className="text-[9px] text-slate-550 font-sans font-semibold">
                                        downloads
                                      </span>
                                    </div>

                                    {/* Action button */}
                                    <a
                                      id={`asset-download-link-${asset.id}`}
                                      href={asset.browser_download_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-sky-400 hover:text-slate-950 bg-sky-500/10 hover:bg-sky-500 px-3 py-1.5 rounded-lg transition-all border border-sky-500/20"
                                      title="Download asset directly"
                                    >
                                      <span>Retrieve</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-950 rounded-xl border border-dashed border-slate-850 text-center text-xs text-slate-500 font-medium">
                              No binary assets uploaded as release packages.
                            </div>
                          )}
                        </div>

                        {/* Release Original External Link */}
                        <div className="flex justify-end pt-1">
                          <a
                            id={`external-release-link-${release.id}`}
                            href={release.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold font-mono"
                          >
                            <span>View Release Tag on GitHub</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {processedReleases.length === 0 && (
          <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-850 font-mono">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-450 font-semibold text-sm">No releases match your search query</p>
            <p className="text-slate-550 text-xs mt-1">
              Try adjusting the filters or verifying the repository contains releases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
