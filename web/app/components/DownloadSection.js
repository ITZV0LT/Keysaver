'use client';

import { useState, useEffect } from 'react';

export default function DownloadSection() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/ITZV0LT/Keysaver/releases/latest')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.assets) {
          const apk = data.assets.find(a => a.name.endsWith('.apk'));
          if (apk) {
            setRelease({
              version: data.tag_name,
              downloadUrl: apk.browser_download_url,
              sizeMB: (apk.size / 1024 / 1024).toFixed(0),
              date: new Date(data.published_at).toLocaleDateString(),
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-56 h-14 bg-slate-700/50 rounded-xl animate-pulse" />
        <p className="text-slate-500 text-sm">Checking for latest release...</p>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-3 bg-slate-700/60 border border-slate-600 text-slate-400 font-semibold text-base px-8 py-4 rounded-xl cursor-not-allowed select-none">
          <AndroidIcon />
          Download Coming Soon
        </div>
        <p className="text-slate-400 text-sm">
          <a href="https://github.com/ITZV0LT/Keysaver/releases" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
            Watch releases on GitHub →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <a
        href={release.downloadUrl}
        download
        className="glow-btn inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
      >
        <AndroidIcon />
        Download APK
      </a>
      <div className="flex items-center gap-4 text-slate-400 text-sm">
        <span className="flex items-center gap-1 text-green-400 font-medium">✓ {release.version}</span>
        <span>·</span>
        <span>{release.sizeMB} MB</span>
        <span>·</span>
        <span>{release.date}</span>
      </div>
      <p className="text-slate-500 text-xs">Android 7.0+ required · Free</p>
    </div>
  );
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.523 15.34l1.65-2.855a.333.333 0 00-.575-.333l-1.67 2.891A10.28 10.28 0 0112 14.166a10.28 10.28 0 01-4.928 1.246L5.402 12.52a.333.333 0 00-.576.333l1.65 2.856C3.53 17.01 1.688 19.483 1.5 22.5h21c-.188-3.017-2.03-5.49-4.977-7.16zM8.5 20a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}
