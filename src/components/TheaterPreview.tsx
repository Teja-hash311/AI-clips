import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Film,
  Download,
  Sparkles,
} from 'lucide-react';
import type { GeneratedClip, SceneSpec } from '../data/scenes';
import { ambientScore } from '../utils/ambientScore';

interface TheaterPreviewProps {
  scenes: SceneSpec[];
  currentTime: number;
  isPlaying: boolean;
  aspectRatio: '16:9' | '9:16';
  activeClip: GeneratedClip | null;
  theaterMode: 'interactive' | 'generated';
  onSetTheaterMode: (mode: 'interactive' | 'generated') => void;
  onSetAspectRatio: (ratio: '16:9' | '9:16') => void;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onRestart: () => void;
  onGenerateCurrentScene: (scene: SceneSpec) => void;
}

function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.min(60, seconds));
  const whole = Math.floor(clamped);
  const tenths = Math.floor((clamped - whole) * 10);
  const secs = String(whole).padStart(2, '0');
  return `00:${secs}.${tenths}`;
}

export function TheaterPreview({
  scenes,
  currentTime,
  isPlaying,
  aspectRatio,
  activeClip,
  theaterMode,
  onSetTheaterMode,
  onSetAspectRatio,
  onTogglePlay,
  onSeek,
  onRestart,
  onGenerateCurrentScene,
}: TheaterPreviewProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const activeScene =
    scenes.find((s) => currentTime >= s.startSec && currentTime < s.endSec) ??
    scenes[scenes.length - 1];

  const sceneElapsed = Math.max(0, currentTime - activeScene.startSec);
  const sceneProgress = Math.min(1, sceneElapsed / activeScene.durationSec);

  useEffect(() => {
    if (theaterMode === 'interactive' && isPlaying && audioEnabled) {
      ambientScore.start();
    } else {
      ambientScore.stop();
    }
    return () => {
      ambientScore.stop();
    };
  }, [theaterMode, isPlaying, audioEnabled]);

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  // Scene 3 typing progression
  const chatQuery = activeScene.chatDemo?.userQuery ?? '';
  const chatReply = activeScene.chatDemo?.aiResponse ?? '';
  const typedChars =
    activeScene.id === 'scene-3'
      ? Math.min(chatQuery.length, Math.floor(Math.max(0, sceneElapsed - 0.8) * 28))
      : 0;
  const showReply = activeScene.id === 'scene-3' && sceneElapsed > 4.2;

  // Scene 4 active feature index
  const featureCount = activeScene.highlights?.length ?? 0;
  const activeFeatureIndex =
    featureCount > 0
      ? Math.min(featureCount - 1, Math.floor(sceneProgress * featureCount))
      : 0;

  return (
    <section id="theater" aria-label="60-second cinematic theater preview" className="w-full">
      {/* Workspace Mode & Framing Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 p-1 rounded-lg bg-[#0E131F] border border-white/10">
          <button
            type="button"
            onClick={() => onSetTheaterMode('interactive')}
            className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              theaterMode === 'interactive'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            60s Interactive Preview
          </button>
          <button
            type="button"
            onClick={() => onSetTheaterMode('generated')}
            disabled={!activeClip}
            className={`min-h-[40px] px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-45 disabled:cursor-not-allowed ${
              theaterMode === 'generated'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {activeClip ? `Rendered Clip (${activeClip.sceneTitle})` : 'Rendered Clip (None Yet)'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E131F] border border-white/10">
            <button
              type="button"
              onClick={() => onSetAspectRatio('16:9')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                aspectRatio === '16:9'
                  ? 'bg-slate-800 text-white border border-white/15'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              16:9 Widescreen
            </button>
            <button
              type="button"
              onClick={() => onSetAspectRatio('9:16')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                aspectRatio === '9:16'
                  ? 'bg-slate-800 text-white border border-white/15'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              9:16 Portrait
            </button>
          </div>
        </div>
      </div>

      {/* Main Theater Viewport */}
      <div className="rounded-xl bg-[#0B0F19] border border-white/10 p-4 sm:p-6">
        <div className="flex justify-center">
          <div
            className={`relative overflow-hidden rounded-lg bg-[#05070C] border border-white/10 shadow-[0_0_80px_-24px_rgba(37,99,235,0.45)] transition-all duration-300 ${
              aspectRatio === '16:9'
                ? 'w-full aspect-video'
                : 'w-full max-w-[380px] aspect-[9/16]'
            }`}
          >
            {theaterMode === 'generated' && activeClip ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  key={activeClip.id}
                  src={activeClip.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <>
                {/* Background Concept Frame Layer with smooth compositor motion */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScene.id}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{
                      opacity: 1,
                      scale: isPlaying ? 1.0 + sceneProgress * 0.05 : 1.01,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    {!brokenImages[activeScene.id] ? (
                      <img
                        src={activeScene.imagePath}
                        alt={`${activeScene.title} concept frame`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [activeScene.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#070B16] via-[#0D1935] to-[#07090F] flex items-center justify-center">
                        <Film className="w-12 h-12 text-blue-400/60" />
                      </div>
                    )}
                    {/* Measured contrast scrim */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#05070C]/90 via-[#05070C]/45 to-[#05070C]/35"
                      aria-hidden="true"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Top Scene Metadata Strip (Unboxed, Zero Pills) */}
                <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between gap-4 z-10 text-xs font-mono text-slate-200 tabular-nums">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-blue-400 font-semibold">
                      Scene {activeScene.number}
                    </span>
                    <span aria-hidden="true" className="text-slate-500">
                      ·
                    </span>
                    <span className="truncate">{activeScene.title}</span>
                  </div>
                  <div className="shrink-0 text-slate-300">
                    {activeScene.timecodeLabel}
                  </div>
                </div>

                {/* Scene-Specific Interactive Overlays */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 z-10">
                  {activeScene.id === 'scene-3' && activeScene.chatDemo && (
                    <div className="mb-6 max-w-xl rounded-lg bg-[#070B16]/85 backdrop-blur-md border border-blue-500/30 p-4 space-y-3">
                      <div className="text-xs font-mono text-blue-300">
                        User Input
                      </div>
                      <p className="text-sm sm:text-base text-white font-medium min-h-[1.5rem]">
                        {chatQuery.slice(0, typedChars)}
                        {typedChars < chatQuery.length && (
                          <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-middle" />
                        )}
                      </p>
                      {showReply && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className="pt-2.5 border-t border-white/10"
                        >
                          <div className="text-xs font-mono text-slate-400 mb-1">
                            AI Assistant Response
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {chatReply}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeScene.id === 'scene-4' && activeScene.highlights && (
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                      {activeScene.highlights.map((item, idx) => {
                        const isHighlighted = idx === activeFeatureIndex;
                        return (
                          <div
                            key={item}
                            className={`px-3.5 py-2.5 rounded-md border text-xs sm:text-sm transition-colors ${
                              isHighlighted
                                ? 'bg-blue-600/25 border-blue-400/60 text-white font-medium'
                                : 'bg-[#070B16]/75 border-white/10 text-slate-300'
                            }`}
                          >
                            {item}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <motion.div
                    key={`${activeScene.id}-text`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-3xl"
                  >
                    <h2
                      className={`font-display font-semibold tracking-tight text-white [text-wrap:balance] ${
                        aspectRatio === '9:16'
                          ? 'text-xl sm:text-2xl leading-snug'
                          : 'text-2xl sm:text-4xl lg:text-[2.6rem] leading-[1.12]'
                      }`}
                    >
                      {activeScene.overlayHeadline}
                    </h2>
                    {activeScene.overlaySubline && (
                      <p className="mt-2.5 text-base sm:text-xl text-blue-300 font-medium">
                        {activeScene.overlaySubline}
                      </p>
                    )}
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {activeScene.visualDirection}
                    </p>
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transport Controls & 60s Chapter Scrubber */}
        {theaterMode === 'interactive' ? (
          <div className="mt-5 space-y-3">
            {/* Scrubber Track with 6 Scene Markers */}
            <div className="relative">
              <div className="grid grid-cols-6 gap-1 mb-2">
                {scenes.map((scene) => {
                  const isCurrent = activeScene.id === scene.id;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => onSeek(scene.startSec)}
                      className={`min-h-[36px] px-2 py-1.5 rounded text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500/60 text-white'
                          : 'bg-[#07090F] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11px] font-mono tabular-nums text-blue-400 truncate">
                        {scene.number} · {scene.durationSec}s
                      </div>
                      <div className="text-xs font-medium truncate">
                        {scene.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              <input
                type="range"
                min={0}
                max={60}
                step={0.1}
                value={currentTime}
                aria-label="Timeline position in seconds"
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play 60s Preview
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onRestart}
                  className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#07090F] hover:bg-slate-900 border border-white/10 text-slate-200 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>

                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#07090F] hover:bg-slate-900 border border-white/10 text-slate-200 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {audioEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      Ambient Score On
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      Ambient Score Off
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-mono tabular-nums text-slate-300">
                  {formatTimecode(currentTime)} / 01:00.0
                </span>

                <button
                  type="button"
                  onClick={() => onGenerateCurrentScene(activeScene)}
                  className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Render Scene {activeScene.number} with Omni Flash
                </button>
              </div>
            </div>
          </div>
        ) : (
          activeClip && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
              <div className="text-sm text-slate-300 flex flex-wrap items-center gap-2 font-mono tabular-nums">
                <span className="text-white font-sans font-medium">
                  {activeClip.sceneTitle}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>{activeClip.aspectRatio}</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>{activeClip.duration}</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>{activeClip.resolution}</span>
              </div>

              <a
                href={activeClip.videoUrl}
                download={`ai-chatbot-${activeClip.sceneId}-${activeClip.aspectRatio.replace(':', 'x')}.mp4`}
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Download className="w-4 h-4" />
                Download MP4
              </a>
            </div>
          )
        )}
      </div>
    </section>
  );
}
