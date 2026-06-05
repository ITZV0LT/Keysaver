import DownloadSection from './components/DownloadSection';

const FEATURES = [
  {
    icon: '📷',
    title: 'Photo Capture',
    desc: 'Use your phone camera or choose from your photo library to scan any key.',
  },
  {
    icon: '🤖',
    title: 'AI Analysis',
    desc: 'Claude Vision AI identifies the key type, keyway profile, and bitting code.',
  },
  {
    icon: '📊',
    title: 'Bitting Code',
    desc: 'Get the precise cut sequence with a visual bitting chart for each key.',
  },
  {
    icon: '💾',
    title: 'Local Storage',
    desc: 'All keys stored privately on your device — no cloud account needed.',
  },
  {
    icon: '🔍',
    title: 'Search & Filter',
    desc: 'Quickly find any key by name, type, keyway, or bitting code.',
  },
  {
    icon: '🔒',
    title: 'Your Keys Only',
    desc: 'Designed for managing keys you own. All data stays on your device.',
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Download & Install', desc: 'Download the APK below and install on your Android device.' },
  { step: '2', title: 'Photograph a Key', desc: 'Lay your key flat on a light surface and take a clear side-profile photo.' },
  { step: '3', title: 'AI Identifies It', desc: 'Claude Vision analyzes the key type, keyway profile, and bitting pattern.' },
  { step: '4', title: 'Save & Organize', desc: 'Name your key, add notes, and it\'s saved to your personal collection.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗝️</span>
            <span className="text-xl font-bold text-white">KeySaver</span>
          </div>
          <a
            href="https://github.com/ITZV0LT/Keysaver"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="float-anim inline-block text-8xl mb-6">🗝️</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            KeySaver
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4 leading-relaxed">
            AI-powered key identification for Android
          </p>
          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Photograph any key. Claude Vision AI instantly identifies the key type, keyway profile,
            and bitting code. Save and organize all your keys privately on your device.
          </p>
          <DownloadSection />
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-colors"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install instructions */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Installation Guide</h2>
          <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 space-y-4">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="text-white font-medium">Download the APK</p>
                <p className="text-slate-400 text-sm mt-1">Tap the download button above to save the APK file to your device.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="text-white font-medium">Enable Unknown Sources</p>
                <p className="text-slate-400 text-sm mt-1">Go to Settings → Security → Install unknown apps, then allow your browser or file manager to install APKs.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="text-white font-medium">Install the APK</p>
                <p className="text-slate-400 text-sm mt-1">Open the downloaded file and follow the installation prompts.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold">4</span>
              <div>
                <p className="text-white font-medium">Open KeySaver & Start Scanning</p>
                <p className="text-slate-400 text-sm mt-1">Launch the app, tap Scan, and photograph your first key.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-6 py-8 border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5">
            <p className="text-amber-300 text-sm font-semibold mb-1">⚠️ Important Notice</p>
            <p className="text-amber-200/70 text-sm leading-relaxed">
              KeySaver is intended for managing your own keys only. Bitting analysis accuracy
              depends on image quality and angle — always verify with a licensed locksmith for
              critical security applications. Use responsibly and only on keys you own.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-800 text-center">
        <p className="text-slate-500 text-sm">
          KeySaver by{' '}
          <a href="https://github.com/ITZV0LT" className="text-slate-400 hover:text-white transition-colors">
            ITZV0LT
          </a>
          {' · '}
          <a href="https://github.com/ITZV0LT/Keysaver" className="text-slate-400 hover:text-white transition-colors">
            Open Source on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
