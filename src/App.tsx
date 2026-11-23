import { useEffect, useRef, useState } from 'react';
import { Check, Copy, FileDown } from 'lucide-react';
import {
  EXPLAINER_SCENES,
  FULL_60S_DIRECTOR_SCRIPT,
  type GeneratedClip,
  type SceneSpec,
} from './data/scenes';
import { TheaterPreview } from './components/TheaterPreview';
import { StoryboardGrid } from './components/StoryboardGrid';
import { VideoGeneratorPanel } from './components/VideoGeneratorPanel';

export default function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [theaterMode, setTheaterMode] = useState<'interactive' | 'generated'>('interactive');
  const [selectedScene, setSelectedScene] = useState<SceneSpec>(EXPLAINER_SCENES[0]);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [activeClip, setActiveClip] = useState<GeneratedClip | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || theaterMode !== 'interactive') {
      lastTickRef.current = null;
      return;
    }

    let frameId = 0;
    const tick = (now: number) => {
      if (lastTickRef.current !== null) {
        const dt = (now - lastTickRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= 60) {
            setIsPlaying(false);
            return 60;
          }
          return next;
        });
      }
      lastTickRef.current = now;
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
      lastTickRef.current = null;
    };
  }, [isPlaying, theaterMode]);

  const handleTogglePlay = () => {
    if (currentTime >= 60) {
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (timeSec: number) => {
    setCurrentTime(Math.max(0, Math.min(60, timeSec)));
    setTheaterMode('interactive');
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setTheaterMode('interactive');
    setIsPlaying(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectForPreview = (scene: SceneSpec) => {
    setSelectedScene(scene);
    setTheaterMode('interactive');
    setCurrentTime(scene.startSec);
    setIsPlaying(true);
    scrollToSection('theater');
  };

  const handleSelectForGeneration = (scene: SceneSpec) => {
    setSelectedScene(scene);
    scrollToSection('generator');
  };

  const handleClipGenerated = (clip: GeneratedClip) => {
    setGeneratedClips((prev) => [clip, ...prev]);
    setActiveClip(clip);
    setTheaterMode('generated');
    setIsPlaying(false);
  };

  const handleWatchClip = (clip: GeneratedClip) => {
    setActiveClip(clip);
    setAspectRatio(clip.aspectRatio);
    setTheaterMode('generated');
    setIsPlaying(false);
    scrollToSection('theater');
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(FULL_60S_DIRECTOR_SCRIPT);
      setCopiedScript(true);
      window.setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // Fallback ignored if clipboard permissions restricted
    }
  };

  const handleDownloadStoryboardJson = () => {
    const payload = JSON.stringify(
      {
        project: 'AI Personal Chatbot — 60-Second Explainer Video',
        aspectRatiosSupported: ['16:9', '9:16'],
        totalDurationSeconds: 60,
        scenes: EXPLAINER_SCENES,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-personal-chatbot-60s-storyboard.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#07090F] text-slate-100 flex flex-col">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#07090F]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#theater"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Aethera Studio
          </a>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
          >
            <a
              href="#theater"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Theater
            </a>
            <a
              href="#storyboard"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Storyboard
            </a>
            <a
              href="#generator"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Generator
            </a>
            <a
              href="#brief"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Brief
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('generator')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Generate Video
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-10 sm:py-12 space-y-16">
        {/* Hero Proposition + Dominant 16:9 Theater Anchor */}
        <div className="space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono tabular-nums text-blue-400">
              AI Personal Chatbot · 60-Second Launch Film · 16:9 &amp; 9:16
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08] [text-wrap:balance]">
              Your AI. Your Assistant. Your Intelligence.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Preview the complete 60-second cinematic explainer sequence across all six scenes, then synthesize real MP4 video clips with Gemini Omni Flash.
            </p>
          </div>

          <TheaterPreview
            scenes={EXPLAINER_SCENES}
            currentTime={currentTime}
            isPlaying={isPlaying}
            aspectRatio={aspectRatio}
            activeClip={activeClip}
            theaterMode={theaterMode}
            onSetTheaterMode={setTheaterMode}
            onSetAspectRatio={setAspectRatio}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onRestart={handleRestart}
            onGenerateCurrentScene={handleSelectForGeneration}
          />
        </div>

        {/* 6-Scene Production Storyboard */}
        <StoryboardGrid
          scenes={EXPLAINER_SCENES}
          selectedSceneId={selectedScene.id}
          onSelectForPreview={handleSelectForPreview}
          onSelectForGeneration={handleSelectForGeneration}
        />

        {/* Gemini Omni Flash Generator */}
        <VideoGeneratorPanel
          scenes={EXPLAINER_SCENES}
          selectedScene={selectedScene}
          aspectRatio={aspectRatio}
          generatedClips={generatedClips}
          onSelectScene={setSelectedScene}
          onSetAspectRatio={setAspectRatio}
          onClipGenerated={handleClipGenerated}
          onWatchClip={handleWatchClip}
        />

        {/* Director Script & Export Section */}
        <section
          id="brief"
          className="rounded-xl bg-[#0E131F] border border-white/10 p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
                Complete 60-Second Director Script
              </h2>
              <p className="mt-1.5 text-sm text-slate-300">
                Built to make everyday life smarter — export the full scene-by-scene production specification or copy the director prompt sheet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCopyScript}
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#07090F] hover:bg-slate-900 border border-white/10 text-sm font-medium text-slate-200 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-4 h-4 text-blue-400" />
                    Copied Script
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Full Script
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadStoryboardJson}
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <FileDown className="w-4 h-4" />
                Export Storyboard JSON
              </button>
            </div>
          </div>

          <pre className="rounded-lg bg-[#07090F] border border-white/10 p-5 text-xs sm:text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {FULL_60S_DIRECTOR_SCRIPT}
          </pre>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>AI Personal Chatbot — 60-Second Explainer Video Studio</div>
          <div>Built to make everyday life smarter.</div>
        </div>
      </footer>
    </div>
  );
}
