'use client';

import { useState, useEffect } from 'react';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/ITZV0LT/Keysaver/releases/latest';

export default function DownloadSection() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(GITHUB_RELEASES_API)
      .then(r => r.json())
      .then(data => {
        if (data && data.assets) {
          const apk = data.assets.find(a => a.name.endsWith('.apk'));
          if (apk) {
            setRelease({
              version: data.tag_name,
              downloadUrl: apk.browser_download_url,
              size: (apk.size / 1024 / 1024).toFixed(1),
              publishedAt: new Date(data.published_at).toLocaleDateString(),
            });
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-48 h-14 bg-slate-700/50 rounded-xl animate-pulse" />
        <p className="text-slate-500 text-sm">Checking for latest release...</p>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="flex flex-col items-center gap-4">
        <a
          href="https://github.com/ITZV0LT/Keysaver/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="glow-btn inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
        >
          <AndroidIcon />
          Download APK
        </a>
        <p className="text-slate-400 text-sm">View all releases on GitHub</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <a
        href={release.downloadUrl}
        className="glow-btn inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
        download
      >
        <AndroidIcon />
        Download APK
      </a>
      <div className="flex items-center gap-4 text-slate-400 text-sm">
        <span className="flex items-center gap-1">
          <span className="text-green-400">✓</span>
          {release.version}
        </span>
        <span>•</span>
        <span>{release.size} MB</span>
        <span>•</span>
        <span>Released {release.publishedAt}</span>
      </div>
      <p className="text-slate-500 text-xs">Android 7.0+ required</p>
    </div>
  );
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.523 15.34l1.65-2.855a.333.333 0 00-.575-.333l-1.67 2.891A10.28 10.28 0 0112 14.166a10.28 10.28 0 01-4.928 1.246L5.402 12.52a.333.333 0 00-.576.333l1.65 2.856C3.53 17.01 1.688 19.483 1.5 22.5h21c-.188-3.017-2.03-5.49-4.977-7.16zM8.5 20a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zM15.5 9a3.5 3.5 0 11-7 0V6.5a3.5 3.5 0 017 0V9zm-1.5 0V6.5a2 2 0 10-4 0V9a2 2 0 004 0zm2-7l1.5-1.5M6.5 2L8 3.5" />
    </svg>
  );
}
