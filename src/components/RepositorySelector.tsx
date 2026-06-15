import React, { useState, useEffect } from "react";
import { Search, History, Star, HelpCircle, Archive, Trash2 } from "lucide-react";
import { TrackedRepository } from "../types";
import { parseOwnerRepo } from "../utils/metrics";
import { motion, AnimatePresence } from "motion/react";

interface RepositorySelectorProps {
  currentRepo: TrackedRepository | null;
  onSelectRepo: (owner: string, repo: string) => void;
  isLoading: boolean;
  error: string | null;
}

const POPULAR_TEMPLATES = [
  { owner: "lucide-react", repo: "lucide", label: "Lucide Icons" },
  { owner: "tauri-apps", repo: "tauri", label: "Tauri Apps" },
  { owner: "bevyengine", repo: "bevy", label: "Bevy Engine" },
  { owner: "electron", repo: "electron", label: "Electron" },
  { owner: "prometheus", repo: "prometheus", label: "Prometheus" },
];

const LOCAL_TRACKED_KEY = "github_release_tracker_tracked_repos";

export default function RepositorySelector({
  currentRepo,
  onSelectRepo,
  isLoading,
  error,
}: RepositorySelectorProps) {
  const [searchInput, setSearchInput] = useState("");
  const [trackedRepos, setTrackedRepos] = useState<TrackedRepository[]>([]);

  // Load tracked repositories from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_TRACKED_KEY);
    if (stored) {
      try {
        const parsed: TrackedRepository[] = JSON.parse(stored);
        // Cleanse existing items just in case they have dirty/stale values
        const sanitized = parsed.map((item: any) => ({
          ...item,
          owner: item.owner.trim(),
          repo: item.repo.trim().replace(/\.git$/i, ""),
        }));
        setTrackedRepos(sanitized);
        localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(sanitized));
      } catch (e) {
        console.error("Error parsing tracked repos", e);
      }
    } else {
      // Default initial tracked repository to show on load
      const initial: TrackedRepository[] = [
        { owner: "lucide-react", repo: "lucide", addedAt: new Date().toISOString() }
      ];
      setTrackedRepos(initial);
      localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(initial));
    }
  }, []);

  // Sync trackedRepos array with localstorage
  const saveTrackedRepos = (repos: TrackedRepository[]) => {
    setTrackedRepos(repos);
    localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(repos));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = parseOwnerRepo(searchInput);
    if (!result) return;

    const { owner, repo } = result;
    
    // Add to local list if not already there
    const exists = trackedRepos.some(
      (r) => r.owner.toLowerCase() === owner.toLowerCase() && r.repo.toLowerCase() === repo.toLowerCase()
    );

    if (!exists) {
      const newRepo: TrackedRepository = {
        owner,
        repo,
        addedAt: new Date().toISOString(),
      };
      saveTrackedRepos([newRepo, ...trackedRepos]);
    }

    onSelectRepo(owner, repo);
    setSearchInput("");
  };

  const handleSelectTemplate = (owner: string, repo: string) => {
    const exists = trackedRepos.some(
      (r) => r.owner.toLowerCase() === owner.toLowerCase() && r.repo.toLowerCase() === repo.toLowerCase()
    );

    if (!exists) {
      const newRepo: TrackedRepository = {
        owner,
        repo,
        addedAt: new Date().toISOString(),
      };
      saveTrackedRepos([newRepo, ...trackedRepos]);
    }

    onSelectRepo(owner, repo);
  };

  const handleDeleteTracked = (owner: string, repo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = trackedRepos.filter(
      (r) => !(r.owner.toLowerCase() === owner.toLowerCase() && r.repo.toLowerCase() === repo.toLowerCase())
    );
    saveTrackedRepos(filtered);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
        <Search className="w-5 h-5 text-sky-400" />
        Select Repository to Track
      </h2>
      <p className="text-slate-450 text-xs mb-6">
        Enter any public GitHub owner/repository or select from recommended templates.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 text-xs font-mono select-none">
              github.com/
            </span>
            <input
              id="repo-search-input"
              type="text"
              placeholder="owner/repository (e.g. facebook/react)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-[5.4rem] pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
            />
          </div>
          <button
            id="track-btn"
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="px-5 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-950 disabled:border disabled:border-slate-850 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-[0.98]"
          >
            {isLoading ? "Fetching..." : "Track Repo"}
          </button>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-450 text-xs mt-3 flex items-center gap-1.5 font-mono"
          >
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            {error}
          </motion.p>
        )}
      </form>

      {/* Popular Templates */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Recommended Projects
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TEMPLATES.map((tpl) => {
            const isSelected =
              currentRepo &&
              currentRepo.owner.toLowerCase() === tpl.owner.toLowerCase() &&
              currentRepo.repo.toLowerCase() === tpl.repo.toLowerCase();

            return (
              <button
                key={`${tpl.owner}/${tpl.repo}`}
                onClick={() => handleSelectTemplate(tpl.owner, tpl.repo)}
                type="button"
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all duration-155 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-xs"
                    : "bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-slate-200"
                }`}
              >
                <code className="text-[10px] bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-sky-450 font-mono font-semibold">
                  {tpl.owner}
                </code>
                <span>/ {tpl.repo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tracked List */}
      {trackedRepos.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
            <History className="w-3.5 h-3.5" />
            Recently Tracked
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[170px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {trackedRepos.map((item) => {
                const isSelected =
                  currentRepo &&
                  currentRepo.owner.toLowerCase() === item.owner.toLowerCase() &&
                  currentRepo.repo.toLowerCase() === item.repo.toLowerCase();

                return (
                  <motion.div
                    key={`${item.owner}/${item.repo}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => onSelectRepo(item.owner, item.repo)}
                    className={`group cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-slate-950 border-slate-800/80 shadow-2xs"
                        : "bg-slate-950/40 hover:bg-slate-950 border-slate-850 hover:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                       <span className="text-xs font-semibold text-slate-200 truncate font-sans">
                        {item.owner}/{item.repo}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Delete action */}
                    <button
                      id={`delete-tracked-${item.owner}-${item.repo}`}
                      onClick={(e) => handleDeleteTracked(item.owner, item.repo, e)}
                      className="text-slate-500 hover:text-rose-450 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 animate-in fade-in"
                      title="Stop tracking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
