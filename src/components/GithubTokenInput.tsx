import React, { useState, useEffect } from "react";
import { KeyRound, ShieldAlert, CheckCircle, Info, Eye, EyeOff } from "lucide-react";

interface GithubTokenInputProps {
  onTokenChange: (token: string) => void;
}

const STORAGE_TOKEN_KEY = "github_release_tracker_pat";

export default function GithubTokenInput({ onTokenChange }: GithubTokenInputProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (saved) {
      setToken(saved);
      onTokenChange(saved);
      setIsValidated(true);
    }
  }, []);

  const saveToken = async (value: string) => {
    const trimmed = value.trim();
    setToken(trimmed);
    setErrorMsg("");

    if (!trimmed) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      onTokenChange("");
      setIsValidated(false);
      return;
    }

    setIsChecking(true);
    try {
      // Validate token with a quick ping
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${trimmed}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (res.ok) {
        localStorage.setItem(STORAGE_TOKEN_KEY, trimmed);
        onTokenChange(trimmed);
        setIsValidated(true);
      } else {
        setErrorMsg("Invalid token. Please check and try again.");
        setIsValidated(false);
      }
    } catch (e) {
      setErrorMsg("Network error validating token.");
      setIsValidated(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setToken("");
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    onTokenChange("");
    setIsValidated(false);
    setErrorMsg("");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 mt-0.5">
            <KeyRound className="w-5 h-5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              GitHub API Auth (Optional)
              {isValidated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-sans">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-450 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-sans">
                  <ShieldAlert className="w-3 h-3" />
                  Rate-Limited (60/hr)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-450 mt-1 mr-4">
              Add a Personal Access Token (PAT) to bypass strict GitHub client IP rate limits. 
              The token is stored fully client-side and only used to request GitHub.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              id="github-token-input"
              type={showToken ? "text" : "password"}
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              disabled={isChecking}
              onChange={(e) => saveToken(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            <button
              id="toggle-token-visibility"
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {token && (
            <button
              id="clear-token-btn"
              onClick={handleClear}
              className="px-3 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 font-semibold rounded-xl text-xs transition-all active:scale-95 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isChecking && (
        <p className="text-xs text-sky-400 mt-2 flex items-center gap-1.5 font-sans font-medium">
          <span className="w-3 h-3 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
          Validating GitHub API Token...
        </p>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-450 mt-2 font-sans font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
