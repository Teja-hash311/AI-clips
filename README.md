# AI Personal Chatbot: 60-Second Explainer Video

> "Your AI. Your Assistant. Your Intelligence."

A 60-second explainer video concept for an **AI Personal Chatbot**: a 24/7 assistant that helps students and creators learn faster, plan better and save time. The whole project was built through **vibe coding**: describing what I wanted in plain language and iterating with AI until it looked right.

<!-- Add a screenshot or GIF here: ![Preview](docs/preview.gif) -->

---

## What this project is

A scene-by-scene storyboard and visual package for a short product-launch style video. It includes:

- A 6-scene storyboard with exact timecodes
- On-screen overlay headlines for every scene
- A cinematic AI video prompt for each scene (ready to paste into an AI video generator)
- A generated key image per scene
- A sample chatbot conversation used in the "How It Works" scene
- Support for **16:9** (YouTube, web) and **9:16** (Reels, Shorts, LinkedIn) formats

## Storyboard

| # | Scene | Time | Headline |
|---|-------|------|----------|
| 01 | The Problem | 00:00 – 00:08 | What if you had an AI assistant available 24/7? |
| 02 | Introducing My Project | 00:08 – 00:18 | Introducing My AI Personal Chatbot. |
| 03 | How It Works | 00:18 – 00:32 | Natural conversation, instant understanding. |
| 04 | Key Features | 00:32 – 00:45 | Built for everyday clarity and speed. |
| 05 | The Vision | 00:45 – 00:55 | Work smarter. Learn faster. Save time. |
| 06 | Final Reveal | 00:55 – 01:00 | Your AI. Your Assistant. Your Intelligence. |

**Total runtime:** 60 seconds

### Chatbot demo (Scene 03)

> **User:** Summarize my quantum computing lecture notes and build a 3-day study plan.
>
> **AI:** Done. Key concepts distilled into 4 modules with a spaced-repetition schedule synced to your calendar.

### Key features shown (Scene 04)

- Smart AI-powered conversations
- Instant answers and assistance
- Personal productivity support
- Help with learning, ideas and everyday tasks
- Simple, user-friendly interface

## Visual style

Cinematic dark-futuristic tech commercial: obsidian backgrounds, electric cobalt-blue rim lighting, glassmorphic holographic UI, smooth push-in and orbital camera moves, and clean white kinetic typography.

## Project structure

```
.
├── src/
│   └── assets/
│       └── images/          # Generated key image for each scene
├── ai-personal-chatbot-60s-storyboard.json   # Storyboard data (scenes, timing, prompts)
└── README.md
```


## Storyboard data format

Each scene in the JSON file has:

| Field | Description |
|-------|-------------|
| `number`, `title` | Scene order and name |
| `startSec`, `endSec`, `durationSec` | Timing within the 60-second cut |
| `overlayHeadline` | Text shown on screen |
| `visualDirection` | Plain-language description of the shot |
| `omniPrompt` | Full AI video generation prompt |
| `imagePath` | Key image for the scene |
| `chatDemo`, `highlights` | Extra content for Scene 03 and Scene 04 |

## Getting started

```bash
# 1. Clone the repo
git clone https://github.com/[YOUR-USERNAME]/[YOUR-REPO-NAME].git
cd [YOUR-REPO-NAME]

# 2. Install dependencies
[npm install]

# 3. Run locally
[npm run dev]
```


## How to make the video

1. Open the storyboard JSON and copy a scene's `omniPrompt`.
2. Paste it into your AI video generator, using the scene's `recommendedClipDuration`.
3. Use the scene's key image as a reference frame if your tool supports it.
4. Export each clip in **16:9** or **9:16**.
5. Join the six clips in order, add the `overlayHeadline` text and a voiceover or music track, and export a 60-second video.

## Built with

- **Vibe coding**: built by describing ideas in plain language and iterating with AI
- **TOOLS**: [AI studio, Claude, Cursor, React, Tailwind]
- AI-generated imagery and video prompts

## Roadmap

- [ ] Add the final rendered video to the repo
- [ ] Add subtitles and a voiceover track
- [ ] Export a 9:16 vertical cut for social media
- [ ] Turn the concept into a working chatbot


## Off Campus code

-SQTTRM

## Author

**[Charan]**
[LinkedIn]([https://www.linkedin.com/in/charan-teja-646390377/]) · [GitHub]([https://github.com/Teja-hash311/AI-clips/new/main?filename=README.md])
