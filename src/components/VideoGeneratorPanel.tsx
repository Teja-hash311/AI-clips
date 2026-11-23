import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Download,
  Film,
  Loader2,
  Play,
  Plus,
  Wand2,
} from 'lucide-react';
import type { GeneratedClip, SceneSpec } from '../data/scenes';

interface VideoGeneratorPanelProps {
  scenes: SceneSpec[];
  selectedScene: SceneSpec;
  aspectRatio: '16:9' | '9:16';
  generatedClips: GeneratedClip[];
  onSelectScene: (scene: SceneSpec) => void;
  onSetAspectRatio: (ratio: '16:9' | '9:16') => void;
  onClipGenerated: (clip: GeneratedClip) => void;
  onWatchClip: (clip: GeneratedClip) => void;
}

const DURATIONS = ['5s', '8s', '10s', '13s', '14s', '15s'];
const EXTEND_DURATIONS = ['5s', '8s', '10s'];
const RESOLUTIONS = ['360p', '720p', '1080p', '4k'] as const;

export function VideoGeneratorPanel({
  scenes,
  selectedScene,
  aspectRatio,
  generatedClips,
  onSelectScene,
  onSetAspectRatio,
  onClipGenerated,
  onWatchClip,
}: VideoGeneratorPanelProps) {
  const [prompt, setPrompt] = useState(selectedScene.omniPrompt);
  const [duration, setDuration] = useState(selectedScene.recommendedClipDuration);
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>('720p');
  const [useReferenceFrame, setUseReferenceFrame] = useState(true);

  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extendingClipId, setExtendingClipId] = useState<string | null>(null);
  const [extendDuration, setExtendDuration] = useState('8s');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);

  useEffect(() => {
    setPrompt(selectedScene.omniPrompt);
    setDuration(selectedScene.recommendedClipDuration);
    setErrorMessage(null);
  }, [selectedScene]);

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: { hasApiKey?: boolean }) => {
        if (active) {
          setHasServerKey(Boolean(data.hasApiKey));
        }
      })
      .catch(() => {
        if (active) setHasServerKey(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) return;
    setIsRefining(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/prompts/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          sceneTitle: `${selectedScene.number}. ${selectedScene.title}`,
          overlayText: selectedScene.overlayHeadline,
          aspectRatio,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine prompt.');
      }
      if (data.refinedPrompt) {
        setPrompt(data.refinedPrompt);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to refine prompt.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please enter a video prompt before generating.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
          resolution,
          referenceImagePath: useReferenceFrame ? selectedScene.imagePath : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Video generation failed.');
      }

      const videoUrl = data.videoDataUrl || data.videoUri;
      if (!videoUrl) {
        throw new Error('Server did not return a playable video URL.');
      }

      const newClip: GeneratedClip = {
        id: `${selectedScene.id}-${Date.now()}`,
        sceneId: selectedScene.id,
        sceneTitle: `${selectedScene.number}. ${selectedScene.title}`,
        interactionId: data.interactionId,
        videoUrl,
        mimeType: data.mimeType || 'video/mp4',
        aspectRatio: data.aspectRatio || aspectRatio,
        duration: data.duration || duration,
        resolution: data.resolution || resolution,
        prompt: prompt.trim(),
        createdAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      onClipGenerated(newClip);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unexpected error while generating video.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtendClip = async (clip: GeneratedClip) => {
    setExtendingClipId(clip.id);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/videos/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousInteractionId: clip.interactionId,
          duration: extendDuration,
          prompt:
            'Continue this scene seamlessly with smooth camera movement, maintaining the dark obsidian environment and cobalt blue holographic lighting.',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Video extension failed.');
      }

      const videoUrl = data.videoDataUrl || data.videoUri;
      if (!videoUrl) {
        throw new Error('Server did not return an extended video URL.');
      }

      const extendedClip: GeneratedClip = {
        id: `${clip.sceneId}-ext-${Date.now()}`,
        sceneId: clip.sceneId,
        sceneTitle: `${clip.sceneTitle} (Extended)`,
        interactionId: data.interactionId,
        parentInteractionId: clip.interactionId,
        videoUrl,
        mimeType: data.mimeType || 'video/mp4',
        aspectRatio: clip.aspectRatio,
        duration: data.duration || extendDuration,
        resolution: clip.resolution,
        prompt: `Extended from ${clip.sceneTitle}`,
        createdAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      onClipGenerated(extendedClip);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unexpected error while extending video.'
      );
    } finally {
      setExtendingClipId(null);
    }
  };

  return (
    <section id="generator" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white [text-wrap:balance]">
            Omni Flash Video Generator
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Generate real 16:9 or 9:16 video clips for any scene using <span className="font-mono text-blue-300">gemini-omni-1.2-flash</span> via the Gemini Interactions API, or extend generated clips in multi-turn continuity.
          </p>
        </div>

        {hasServerKey === false && (
          <div className="text-xs text-amber-300 font-medium">
            Billing-enabled GEMINI_API_KEY required in Settings &gt; Secrets
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generation Form */}
        <div className="lg:col-span-7 rounded-xl bg-[#0E131F] border border-white/10 p-6 space-y-5">
          {/* Scene Switcher */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Target Explainer Scene
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {scenes.map((scene) => {
                const active = scene.id === selectedScene.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => onSelectScene(scene)}
                    className={`min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-medium border transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#07090F] border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <span className="font-mono text-blue-400 mr-1.5">{scene.number}</span>
                    {scene.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Editor */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <label htmlFor="omni-prompt" className="text-xs font-medium text-slate-300">
                Director Video Prompt
              </label>
              <button
                type="button"
                onClick={handleRefinePrompt}
                disabled={isRefining || isGenerating}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#07090F] hover:bg-slate-900 border border-white/10 text-xs font-medium text-blue-300 transition-colors disabled:opacity-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Refine with Gemini
                  </>
                )}
              </button>
            </div>
            <textarea
              id="omni-prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-lg bg-[#07090F] border border-white/15 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
              placeholder="Describe camera movement, lighting, holographic UI elements, and on-screen text..."
            />
          </div>

          {/* Format Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Aspect Ratio
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#07090F] border border-white/10">
                <button
                  type="button"
                  onClick={() => onSetAspectRatio('16:9')}
                  className={`min-h-[38px] rounded text-xs font-mono font-medium transition-colors ${
                    aspectRatio === '16:9'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  16:9
                </button>
                <button
                  type="button"
                  onClick={() => onSetAspectRatio('9:16')}
                  className={`min-h-[38px] rounded text-xs font-mono font-medium transition-colors ${
                    aspectRatio === '9:16'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  9:16
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="clip-duration" className="block text-xs font-medium text-slate-300 mb-2">
                Clip Duration
              </label>
              <select
                id="clip-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full min-h-[46px] rounded-lg bg-[#07090F] border border-white/15 px-3 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="clip-resolution" className="block text-xs font-medium text-slate-300 mb-2">
                Resolution
              </label>
              <select
                id="clip-resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as (typeof RESOLUTIONS)[number])}
                className="w-full min-h-[46px] rounded-lg bg-[#07090F] border border-white/15 px-3 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {RESOLUTIONS.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Concept Frame Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#07090F] border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={useReferenceFrame}
              onChange={(e) => setUseReferenceFrame(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-blue-600"
            />
            <span className="text-sm text-slate-300 leading-relaxed">
              Animate from Scene {selectedScene.number} concept frame (image-to-video reference)
            </span>
          </label>

          {/* Error Display */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 rounded-lg bg-red-950/50 border border-red-500/40 text-sm text-red-200"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-red-100">Video generation notice</div>
                <p className="leading-relaxed text-red-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              Model: gemini-omni-1.2-flash · Format: MP4
            </div>
            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isGenerating}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rendering Scene {selectedScene.number}...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  Generate Scene {selectedScene.number} Video
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Clips Library & Multi-turn Extension */}
        <div className="lg:col-span-5 rounded-xl bg-[#0E131F] border border-white/10 p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-white">
              Rendered Clips
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {generatedClips.length} {generatedClips.length === 1 ? 'clip' : 'clips'}
            </span>
          </div>

          {isGenerating && (
            <div className="rounded-lg bg-[#07090F] border border-blue-500/30 p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm font-medium text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Generating {aspectRatio} · {duration} clip...</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Omni Flash video synthesis runs synchronously and usually completes in 30–90 seconds.
              </p>
            </div>
          )}

          {generatedClips.length === 0 ? (
            <div className="rounded-lg bg-[#07090F] border border-white/10 p-6 text-center space-y-3">
              <Film className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-medium text-slate-200">
                No rendered clips in this session yet
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Select any of the 6 storyboard chapters on the left and click Generate to synthesize an MP4 clip with Gemini Omni Flash.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedClips.map((clip) => (
                <div
                  key={clip.id}
                  className="rounded-lg bg-[#07090F] border border-white/10 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {clip.sceneTitle}
                      </div>
                      <div className="mt-1 text-xs font-mono tabular-nums text-slate-400">
                        {clip.aspectRatio} · {clip.duration} · {clip.resolution} · {clip.createdAt}
                      </div>
                    </div>
                  </div>

                  <video
                    src={clip.videoUrl}
                    controls
                    playsInline
                    className="w-full rounded-md bg-black aspect-video object-contain border border-white/10"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onWatchClip(clip)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Open in Theater
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExtendClip(clip)}
                      disabled={extendingClipId === clip.id || isGenerating}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-medium text-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {extendingClipId === clip.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Extending...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Extend +{extendDuration}
                        </>
                      )}
                    </button>

                    <a
                      href={clip.videoUrl}
                      download={`ai-chatbot-${clip.sceneId}.mp4`}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0E131F] hover:bg-slate-900 border border-white/10 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      MP4
                    </a>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs text-slate-400">
                <label htmlFor="extend-duration">Extension increment</label>
                <select
                  id="extend-duration"
                  value={extendDuration}
                  onChange={(e) => setExtendDuration(e.target.value)}
                  className="rounded bg-[#07090F] border border-white/15 px-2.5 py-1.5 font-mono text-slate-200"
                >
                  {EXTEND_DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      +{d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
