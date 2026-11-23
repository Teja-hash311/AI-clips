import { useState } from 'react';
import { Film, Play, Sparkles } from 'lucide-react';
import type { SceneSpec } from '../data/scenes';

interface StoryboardGridProps {
  scenes: SceneSpec[];
  selectedSceneId: string;
  onSelectForPreview: (scene: SceneSpec) => void;
  onSelectForGeneration: (scene: SceneSpec) => void;
}

export function StoryboardGrid({
  scenes,
  selectedSceneId,
  onSelectForPreview,
  onSelectForGeneration,
}: StoryboardGridProps) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  return (
    <section id="storyboard" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white [text-wrap:balance]">
            60-Second Production Storyboard
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Six timed chapters paced from the late-night student bottleneck to the final holographic reveal. Select any chapter to jump the preview or render its video clip.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
          6 Scenes · 01:00 Total Runtime · 16:9 / 9:16
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => {
          const isSelected = scene.id === selectedSceneId;
          return (
            <article
              key={scene.id}
              className={`group flex flex-col justify-between rounded-xl bg-[#0E131F] border transition-colors ${
                isSelected
                  ? 'border-blue-500/70'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div>
                {/* 16:9 Concept Frame */}
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-[#07090F] border-b border-white/10">
                  {!brokenImages[scene.id] ? (
                    <img
                      src={scene.imagePath}
                      alt={`${scene.number}. ${scene.title}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [scene.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0A1022] to-[#07090F] flex items-center justify-center">
                      <Film className="w-8 h-8 text-blue-400/60" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#0E131F]/80 via-transparent to-transparent"
                    aria-hidden="true"
                  />
                </div>

                {/* Card Copy */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
                    <span className="text-blue-400 font-semibold">{scene.timecodeLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{scene.durationSec}s</span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-white">
                    {scene.number}. {scene.title}
                  </h3>

                  <p className="text-sm text-slate-200 font-medium leading-snug">
                    “{scene.overlayHeadline}”
                  </p>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {scene.visualDirection}
                  </p>

                  {scene.highlights && (
                    <ul className="pt-1 space-y-1 text-xs text-slate-300 border-t border-white/10">
                      {scene.highlights.map((point) => (
                        <li key={point} className="leading-relaxed">
                          – {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectForPreview(scene)}
                  className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#07090F] hover:bg-slate-900 border border-white/10 text-slate-200 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Play className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onSelectForGeneration(scene)}
                  className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Video
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
