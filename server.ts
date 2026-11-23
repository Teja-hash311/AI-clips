import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const ALLOWED_ASPECT_RATIOS = new Set(['16:9', '9:16']);
const ALLOWED_RESOLUTIONS = new Set(['360p', '720p', '1080p', '4k']);
const ALLOWED_DURATIONS = new Set([
  '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s', '11s', '12s', '13s', '14s', '15s',
]);
const ALLOWED_EXTEND_DURATIONS = new Set([
  '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s',
]);

const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), 'src/assets/images');

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function parseGeminiError(error: unknown): { status: number; message: string; code?: string } {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('permission_denied') ||
    lower.includes('403') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('unauthorized')
  ) {
    return {
      status: 403,
      code: 'API_KEY_OR_PERMISSION_ERROR',
      message:
        'Video generation requires a valid, billing-enabled GEMINI_API_KEY configured in Settings > Secrets.',
    };
  }

  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      code: 'QUOTA_EXHAUSTED',
      message:
        'Gemini API quota exceeded or paid-tier billing is required for gemini-omni-1.2-flash. Check Settings > Secrets to use a billing-enabled API key.',
    };
  }

  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      code: 'MODEL_OR_INTERACTION_NOT_FOUND',
      message: 'Requested Gemini model or previous interaction session was not found.',
    };
  }

  if (lower.includes('timeout') || lower.includes('aborted')) {
    return {
      status: 504,
      code: 'GENERATION_TIMEOUT',
      message: 'Video generation timed out. Try a shorter duration (e.g., 5s–8s) or 720p resolution.',
    };
  }

  return {
    status: 500,
    code: 'GEMINI_INTERACTION_FAILED',
    message: rawMessage || 'Unexpected error during Gemini Interactions API request.',
  };
}

function loadAllowlistedSceneImageBase64(imagePathInput: unknown): { mimeType: string; data: string } | null {
  if (typeof imagePathInput !== 'string' || !imagePathInput.trim()) {
    return null;
  }
  const cleanName = path.basename(imagePathInput.trim());
  if (!/^scene_[1-6]_[a-z0-9_]+\.jpg$/i.test(cleanName)) {
    return null;
  }

  const resolved = path.resolve(ASSETS_IMAGES_DIR, cleanName);
  if (!resolved.startsWith(ASSETS_IMAGES_DIR + path.sep)) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }

  const buffer = fs.readFileSync(resolved);
  return {
    mimeType: 'image/jpeg',
    data: buffer.toString('base64'),
  };
}

async function resolveVideoPayload(
  videoPart: { data?: string | null; uri?: string | null; mime_type?: string | null } | null | undefined,
  apiKey: string
): Promise<{ videoDataUrl?: string; videoUri?: string; mimeType: string } | null> {
  if (!videoPart) {
    return null;
  }
  const mimeType = videoPart.mime_type || 'video/mp4';

  if (videoPart.data) {
    return {
      mimeType,
      videoDataUrl: `data:${mimeType};base64,${videoPart.data}`,
    };
  }

  if (videoPart.uri) {
    try {
      const parsedUri = new URL(videoPart.uri);
      if (parsedUri.protocol === 'https:' && parsedUri.hostname.endsWith('googleapis.com')) {
        const mediaResponse = await fetch(parsedUri.toString(), {
          headers: { 'x-goog-api-key': apiKey },
        });
        if (mediaResponse.ok) {
          const arrayBuf = await mediaResponse.arrayBuffer();
          const b64 = Buffer.from(arrayBuf).toString('base64');
          return {
            mimeType,
            videoDataUrl: `data:${mimeType};base64,${b64}`,
          };
        }
      }
    } catch {
      // Fallback to returning uri if direct fetch is unavailable
    }
    return {
      mimeType,
      videoUri: videoPart.uri,
    };
  }

  return null;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const hasApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
    res.json({ ok: true, hasApiKey });
  });

  app.post('/api/prompts/refine', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(401).json({
        error:
          'GEMINI_API_KEY is not configured. Add a Gemini API key in Settings > Secrets to enable AI prompt refinement.',
      });
      return;
    }

    const { prompt, sceneTitle, overlayText, aspectRatio } = req.body ?? {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
      res.status(400).json({ error: 'Prompt must be a non-empty string under 4000 characters.' });
      return;
    }

    const safeTitle = typeof sceneTitle === 'string' ? sceneTitle.slice(0, 120) : 'Explainer Scene';
    const safeOverlay = typeof overlayText === 'string' ? overlayText.slice(0, 240) : '';
    const safeAspect = ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : '16:9';

    try {
      const interaction = await ai.interactions.create({
        model: 'gemini-4-hydrogen',
        system_instruction:
          'You are a senior commercial film director specializing in AI product launch trailers. Rewrite the user scene prompt into a single vivid, production-ready video generation prompt for gemini-omni-1.2-flash. Keep a consistent dark obsidian aesthetic, electric cobalt blue lighting, smooth camera motion, and preserve any requested on-screen typography. Return only the refined prompt text with no markdown headers or quotes.',
        input: `Scene: ${safeTitle}\nAspect Ratio: ${safeAspect}\nOn-Screen Text: ${safeOverlay || 'None'}\nDraft Prompt: ${prompt.trim()}`,
      });

      const refinedPrompt = interaction.output_text?.trim();
      if (!refinedPrompt) {
        res.status(502).json({ error: 'Model returned an empty prompt refinement.' });
        return;
      }

      res.json({ refinedPrompt });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/api/videos/generate', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
    if (!ai) {
      res.status(401).json({
        error:
          'GEMINI_API_KEY is not configured. Video generation with gemini-omni-1.2-flash requires a billing-enabled GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const { prompt, aspectRatio, duration, resolution, referenceImagePath } = req.body ?? {};

    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
      res.status(400).json({ error: 'Prompt must be a non-empty string under 4000 characters.' });
      return;
    }

    const validAspectRatio = ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : '16:9';
    const validDuration = ALLOWED_DURATIONS.has(duration) ? duration : '8s';
    const validResolution = ALLOWED_RESOLUTIONS.has(resolution) ? resolution : '720p';
    const refImage = loadAllowlistedSceneImageBase64(referenceImagePath);

    try {
      const inputPayload = refImage
        ? [
            {
              type: 'image' as const,
              mime_type: refImage.mimeType,
              data: refImage.data,
            },
            {
              type: 'text' as const,
              text: prompt.trim(),
            },
          ]
        : prompt.trim();

      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: inputPayload,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: validAspectRatio,
            duration: validDuration,
            resolution: validResolution,
          },
        },
        { timeout: 300000 }
      );

      const resolvedVideo = await resolveVideoPayload(interaction.output_video, apiKey);
      if (!resolvedVideo) {
        res.status(502).json({
          error: 'gemini-omni-1.2-flash completed without returning a video payload.',
        });
        return;
      }

      res.json({
        interactionId: interaction.id,
        aspectRatio: validAspectRatio,
        duration: validDuration,
        resolution: validResolution,
        ...resolvedVideo,
      });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/api/videos/extend', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
    if (!ai) {
      res.status(401).json({
        error:
          'GEMINI_API_KEY is not configured. Video extension requires a billing-enabled GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const { previousInteractionId, prompt, duration } = req.body ?? {};
    if (typeof previousInteractionId !== 'string' || !previousInteractionId.trim()) {
      res.status(400).json({ error: 'A valid previousInteractionId is required to extend a clip.' });
      return;
    }
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
      res.status(400).json({ error: 'Continuation prompt must be under 4000 characters.' });
      return;
    }

    const validDuration = ALLOWED_EXTEND_DURATIONS.has(duration) ? duration : '8s';

    try {
      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          previous_interaction_id: previousInteractionId.trim(),
          input: prompt.trim(),
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            duration: validDuration,
          },
        },
        { timeout: 300000 }
      );

      const resolvedVideo = await resolveVideoPayload(interaction.output_video, apiKey);
      if (!resolvedVideo) {
        res.status(502).json({
          error: 'gemini-omni-1.2-flash completed without returning an extended video payload.',
        });
        return;
      }

      res.json({
        interactionId: interaction.id,
        duration: validDuration,
        ...resolvedVideo,
      });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
