/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
  Github, RefreshCw, Sparkles, TrendingUp, Download, Info, Check, 
  HelpCircle, ExternalLink, Calendar, Layers, Search 
} from "lucide-react";
import RepositorySelector from "./components/RepositorySelector";
import GithubTokenInput from "./components/GithubTokenInput";
import MetricCards from "./components/MetricCards";
import DownloadCharts from "./components/DownloadCharts";
import ReleaseTable from "./components/ReleaseTable";
import { GitHubRelease, TrackedRepository, RepositoryHistory } from "./types";
import { fetchGitHubReleases, getRepositoryHistory, recordLiveSnapshot } from "./utils/metrics";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentRepo, setCurrentRepo] = useState<TrackedRepository | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [history, setHistory] = useState<RepositoryHistory>({ owner: "", repo: "", snapshots: [] });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  
  // Auto-refresh configurations
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Core statistical fetch loop
  const handleFetchRepository = useCallback(async (owner: string, repo: string, tokenToUse?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const cleanOwner = owner.trim();
      const cleanRepo = repo.trim().replace(/\.git$/i, "");
      const activeToken = tokenToUse !== undefined ? tokenToUse : githubToken;
      const data = await fetchGitHubReleases(cleanOwner, cleanRepo, activeToken);
      
      setReleases(data);
      setLastFetched(new Date());

      // Update local storage history snapshot logic
      const updatedHistory = recordLiveSnapshot(cleanOwner, cleanRepo, data);
      setHistory(updatedHistory);

      // Update current repository state
      const totalDownloads = data.reduce((sum, r) => sum + r.assets.reduce((s, a) => s + a.download_count, 0), 0);
      setCurrentRepo({
        owner: cleanOwner,
        repo: cleanRepo,
        addedAt: new Date().toISOString(),
        lastFetchedAt: new Date().toISOString(),
        releasesCount: data.length,
        totalDownloads,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to query repository information.");
    } finally {
      setIsLoading(false);
    }
  }, [githubToken]);

  // Initial load: seed with a popular repository
  useEffect(() => {
    // We check if we have any recently tracked repositories in LocalStorage first.
    // If not, we fall back to lucide-react/lucide.
    const stored = localStorage.getItem("github_release_tracker_tracked_repos");
    let targetOwner = "lucide-react";
    let targetRepo = "lucide";

    if (stored) {
      try {
        const repos: TrackedRepository[] = JSON.parse(stored);
        if (repos.length > 0) {
          targetOwner = repos[0].owner.trim();
          targetRepo = repos[0].repo.trim().replace(/\.git$/i, "");
        }
      } catch (e) {
        console.error("Error reading stored tracked repos in init-loader", e);
      }
    }

    handleFetchRepository(targetOwner, targetRepo);
  }, [handleFetchRepository]);

  // Set up auto polling refresh loops
  useEffect(() => {
    if (!autoRefresh || !currentRepo) return;

    const interval = setInterval(() => {
      handleFetchRepository(currentRepo.owner, currentRepo.repo);
    }, 45000); // Poll every 45s if active

    return () => clearInterval(interval);
  }, [autoRefresh, currentRepo, handleFetchRepository]);

  const handleManualRefresh = () => {
    if (currentRepo) {
      handleFetchRepository(currentRepo.owner, currentRepo.repo);
    }
  };

  const handleSelectRepo = (owner: string, repo: string) => {
    handleFetchRepository(owner, repo);
  };

  const handleTokenChange = (token: string) => {
    setGithubToken(token);
    // If we have an active repository, re-fetch immediately using the new token configuration
    if (currentRepo) {
      handleFetchRepository(currentRepo.owner, currentRepo.repo, token);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans grid grid-cols-1 select-none">
      {/* Dynamic Ambient Blur Backgrounds */}
      <div className="absolute top-0 inset-x-0 h-[450px] bg-linear-to-b from-sky-500/5 to-transparent pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Custom Header Area */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-md flex items-center justify-center border border-slate-850">
              <Github className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                GitHub Release Tracker
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md font-mono">
                  Live Monitor
                </span>
              </h1>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">
                Real-time release asset download measurements and historical performance analysis.
              </p>
            </div>
          </div>

          {/* Timing & Refresh controls */}
          {currentRepo && (
            <div className="flex flex-wrap items-center gap-2">
              {lastFetched && (
                <span className="text-[11px] font-semibold text-slate-400 font-mono">
                  Last updated: {lastFetched.toLocaleTimeString()}
                </span>
              )}
              
              {/* Auto Refresh Toggle */}
              <button
                id="auto-refresh-toggle"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  autoRefresh
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                }`}
              >
                {autoRefresh ? "Auto refreshing (45s)" : "Auto refresh: off"}
              </button>

              <button
                id="manual-refresh-btn"
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="p-2 bg-slate-900 hover:bg-slate-850 text-sky-400 border border-slate-800 rounded-xl shadow-xs transition-all active:scale-95 disabled:bg-slate-900 disabled:text-slate-600"
                title="Refresh stats immediately"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </header>

        {/* Setup Config Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col justify-between gap-6 order-2 lg:order-1">
            {/* Token details and helper box */}
            <GithubTokenInput onTokenChange={handleTokenChange} />

            {/* Selected repository overview */}
            {currentRepo && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl text-sky-400">
                    <Layers className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Currently tracking
                    </span>
                    <a
                      id="tracked-repo-external-link"
                      href={`https://github.com/${currentRepo.owner}/${currentRepo.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-bold text-slate-200 hover:text-sky-450 tracking-tight mt-0.5 flex items-center gap-1.5 transition-colors"
                    >
                      {currentRepo.owner}/{currentRepo.repo}
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </a>
                  </div>
                </div>

                {lastFetched && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-slate-950 border border-slate-850 py-1.5 px-3 rounded-xl font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Releases: {releases.length}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-slate-950 border border-slate-850 py-1.5 px-3 rounded-xl font-mono">
                      <Download className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                      Total Downloads: {currentRepo.totalDownloads ? new Intl.NumberFormat().format(currentRepo.totalDownloads) : 0}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 order-1 lg:order-2">
            <RepositorySelector
              currentRepo={currentRepo}
              onSelectRepo={handleSelectRepo}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </section>

        {/* Global Stats Counter Cards */}
        {releases.length > 0 && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MetricCards releases={releases} />
            
            {/* Analytics Area */}
            <div className="grid grid-cols-1 gap-8">
              <DownloadCharts history={history} releases={releases} />
            </div>

            {/* Releases Table list */}
            <ReleaseTable releases={releases} />
          </section>
        )}

        {/* Empty placeholder */}
        {releases.length === 0 && !isLoading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto mt-12">
            <HelpCircle className="w-12 h-12 text-sky-400 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white tracking-tight">No Release Data Found</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              This repository contains no published GitHub Releases, or the GitHub API rate limit was hit. 
              Please verify the repository address or configure an API Token above to inspect metrics.
            </p>
          </div>
        )}

        {/* Loading placeholder */}
        {isLoading && releases.length === 0 && (
          <div className="h-[300px] flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold font-mono animate-pulse">
              Requesting assets registry from api.github.com...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

