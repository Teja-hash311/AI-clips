export interface SceneSpec {
  id: string;
  number: string;
  title: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  recommendedClipDuration: string;
  timecodeLabel: string;
  overlayHeadline: string;
  overlaySubline?: string;
  visualDirection: string;
  omniPrompt: string;
  imagePath: string;
  highlights?: string[];
  chatDemo?: {
    userQuery: string;
    aiResponse: string;
  };
}

export interface GeneratedClip {
  id: string;
  sceneId: string;
  sceneTitle: string;
  interactionId: string;
  videoUrl: string;
  mimeType: string;
  aspectRatio: '16:9' | '9:16';
  duration: string;
  resolution: string;
  prompt: string;
  createdAt: string;
  parentInteractionId?: string;
}

export const EXPLAINER_SCENES: SceneSpec[] = [
  {
    id: 'scene-1',
    number: '01',
    title: 'The Problem',
    startSec: 0,
    endSec: 8,
    durationSec: 8,
    recommendedClipDuration: '8s',
    timecodeLabel: '00:00 – 00:08',
    overlayHeadline: 'What if you had an AI assistant available 24/7?',
    visualDirection:
      'A late-night student juggling overflowing tabs, schedules, and unanswered questions inside a moody digital workspace with fast architectural cuts.',
    omniPrompt:
      'Cinematic dark futuristic tech commercial, 4K quality. A focused university student at a sleek dark desk surrounded by fast-moving holographic calendars, scattered documents, and glowing blue question prompts. Smooth push-in camera motion, cool electric cobalt blue lighting, crisp on-screen kinetic text reading "What if you had an AI assistant available 24/7?", seamless transition.',
    imagePath: '/src/assets/images/scene_1_problem_1795426519443.jpg',
  },
  {
    id: 'scene-2',
    number: '02',
    title: 'Introducing My Project',
    startSec: 8,
    endSec: 18,
    durationSec: 10,
    recommendedClipDuration: '10s',
    timecodeLabel: '00:08 – 00:18',
    overlayHeadline: 'Introducing My AI Personal Chatbot.',
    visualDirection:
      'Reveal a futuristic AI chatbot interface awakening with concentric cobalt blue holographic rings and crisp glassmorphic depth.',
    omniPrompt:
      'Sleek product launch reveal in a deep obsidian studio. A futuristic 3D holographic AI personal chatbot interface awakens in mid-air with glowing sapphire blue concentric rings, crisp glass planes, and volumetric light. Smooth orbital camera arc, clean modern title typography "Introducing My AI Personal Chatbot." appearing cleanly.',
    imagePath: '/src/assets/images/scene_2_awakening_1795426519900.jpg',
  },
  {
    id: 'scene-3',
    number: '03',
    title: 'How It Works',
    startSec: 18,
    endSec: 32,
    durationSec: 14,
    recommendedClipDuration: '14s',
    timecodeLabel: '00:18 – 00:32',
    overlayHeadline: 'Natural conversation, instant understanding.',
    visualDirection:
      'Close-up typing into the chatbot as luminous neural pathways, floating data streams, and responsive dialogue bubbles synthesize instant answers.',
    omniPrompt:
      'Cinematic close-up of hands typing a question on a sleek dark laptop as an AI personal chatbot interface illuminates with cobalt blue neural network pathways, floating light data particles, and instant smooth chat response bubbles. Shallow depth of field, ultra-clean motion graphics, dark futuristic startup aesthetic.',
    imagePath: '/src/assets/images/scene_3_neural_chat_1795426520399.jpg',
    chatDemo: {
      userQuery: 'Summarize my quantum computing lecture notes and build a 3-day study plan.',
      aiResponse:
        'Done. Key concepts distilled into 4 modules with a spaced-repetition schedule synced to your calendar.',
    },
  },
  {
    id: 'scene-4',
    number: '04',
    title: 'Key Features',
    startSec: 32,
    endSec: 45,
    durationSec: 13,
    recommendedClipDuration: '13s',
    timecodeLabel: '00:32 – 00:45',
    overlayHeadline: 'Built for everyday clarity and speed.',
    visualDirection:
      'Dynamic multi-panel 3D UI showcase cycling through conversation, instant answers, productivity scheduling, learning tools, and effortless usability.',
    omniPrompt:
      'High-speed Apple-keynote style 3D holographic UI showcase in dark obsidian space with electric blue rim lighting. Smoothly glides across clean modular panels demonstrating smart AI conversations, instant answers, personal productivity timelines, study assistance, and a minimalist user-friendly interface.',
    imagePath: '/src/assets/images/scene_4_key_features_1795426519535.jpg',
    highlights: [
      'Smart AI-powered conversations',
      'Instant answers and assistance',
      'Personal productivity support',
      'Help with learning, ideas, and everyday tasks',
      'Simple, user-friendly interface',
    ],
  },
  {
    id: 'scene-5',
    number: '05',
    title: 'The Vision',
    startSec: 45,
    endSec: 55,
    durationSec: 10,
    recommendedClipDuration: '10s',
    timecodeLabel: '00:45 – 00:55',
    overlayHeadline: 'Work smarter. Learn faster. Save time.',
    visualDirection:
      'The chatbot evolves into a calm personal digital companion helping students and creators focus deeply in a modern architectural space.',
    omniPrompt:
      'Inspiring editorial wide shot inside a sleek dusk-lit architectural study space. A student works calmly and effortlessly while a subtle glowing blue holographic AI personal companion floats beside their screen organizing ideas and timelines. Warm-cool cinematic contrast, smooth dolly motion.',
    imagePath: '/src/assets/images/scene_5_vision_1795426521590.jpg',
  },
  {
    id: 'scene-6',
    number: '06',
    title: 'Final Reveal',
    startSec: 55,
    endSec: 60,
    durationSec: 5,
    recommendedClipDuration: '5s',
    timecodeLabel: '00:55 – 01:00',
    overlayHeadline: 'Your AI. Your Assistant. Your Intelligence.',
    overlaySubline: 'Built to make everyday life smarter.',
    visualDirection:
      'Heroic final frame of the AI Personal Chatbot core hovering above an obsidian floor under dramatic cobalt blue rim lighting.',
    omniPrompt:
      'Powerful startup product launch finale on a matte obsidian reflective stage with dramatic cobalt blue neon rim lighting. A sculptural 3D holographic AI chatbot core hovers centered as clean white typography fades in: "Your AI. Your Assistant. Your Intelligence." followed by "Built to make everyday life smarter." 4K commercial finish.',
    imagePath: '/src/assets/images/scene_6_final_reveal_1795426520245.jpg',
  },
];

export const FULL_60S_DIRECTOR_SCRIPT = EXPLAINER_SCENES.map(
  (scene) =>
    `Scene ${scene.number} (${scene.timecodeLabel}) – ${scene.title}\nVisual: ${scene.visualDirection}\nOn-Screen Text: "${scene.overlayHeadline}"${
      scene.overlaySubline ? ` / "${scene.overlaySubline}"` : ''
    }\nOmni Flash Prompt: ${scene.omniPrompt}`
).join('\n\n');
