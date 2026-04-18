

## Goal

Layer AI throughout Little Explorer to transform it from a static toddler-tap app into an adaptive, parent-aware, content-rich experience. AI is invoked via Lovable AI Gateway (Gemini + GPT-5 family) through edge functions — never from the client.

## Where AI Adds Real Value

```text
┌─────────────────────────────────────────────────────────────┐
│  TODDLER-FACING (in-world)                                  │
│  1. Adaptive narration  → friendly spoken cues per tap      │
│  2. Generated content   → endless animals, letters, scenes  │
│  3. Smart difficulty    → adjusts to engagement signals     │
├─────────────────────────────────────────────────────────────┤
│  PARENT-FACING (dashboard)                                  │
│  4. Weekly insights     → plain-English progress summary    │
│  5. Recommendations     → which worlds to encourage         │
│  6. Parent chat         → "How is my child doing?" Q&A      │
├─────────────────────────────────────────────────────────────┤
│  CREATOR-FACING (assets)                                    │
│  7. Image generation    → fresh animal/scene illustrations  │
│  8. Voice variety       → richer TTS via ElevenLabs (opt)   │
└─────────────────────────────────────────────────────────────┘
```

## Phased Plan

### Phase 1 — Foundation (edge functions + infra)
- Add `supabase/functions/ai-narrate` — short, age-appropriate spoken phrases (e.g., "Look! A purple star!"). Streams text; client speaks via Web Speech API.
- Add `supabase/functions/ai-insights` — non-streaming, returns structured JSON via tool calling: `{ summary, strengths[], suggestions[], favoriteWorld }`.
- Add `supabase/functions/ai-parent-chat` — streaming chat for the parent dashboard with full conversation history.
- Add `supabase/functions/ai-generate-image` — uses `google/gemini-3.1-flash-image-preview` for new world content (animals, letters, shapes). Stores results in a new `ai_assets` storage bucket.
- All functions: CORS, Zod validation, 429/402 surfacing, default model `google/gemini-3-flash-preview`.

### Phase 2 — Toddler experience upgrades
- **Adaptive narration**: when a child taps in AlphabetWorld/AnimalWorld/NumberWorld, occasionally fetch a short AI phrase (debounced, cached per-item) and speak it. Falls back to current static labels offline.
- **Endless content**: AnimalWorld and AlphabetWorld pull from a growing pool of AI-generated illustrations (cached in storage) instead of fixed emoji set.
- **Smart difficulty**: a lightweight client heuristic (taps/min, time-on-world from `useProgress`) sends a summary to `ai-insights` once per session to suggest next world; surfaces as a soft "Try this next" pulse on the home tile.

### Phase 3 — Parent dashboard upgrades
- **Weekly Insights card** in `ParentDashboard.tsx`: calls `ai-insights` with aggregated `interaction_events` + `useProgress` snapshot. Renders summary, top strengths, 2–3 suggestions. Markdown-rendered.
- **Ask-a-Question chat**: collapsible panel using streaming SSE pattern from the AI gateway docs. System prompt grounds the model in the child's actual stats. Conversation persisted in a new `parent_conversations` + `parent_messages` table with RLS scoped to `auth.uid()`.
- **Recommendation chips**: which worlds to enable/disable based on engagement.

### Phase 4 — Polish & safety
- Content safety: system prompts constrain output to toddler-safe vocabulary; max length per phrase.
- Rate-limit guard: client backoff + toast on 429; "Add credits" CTA on 402.
- Offline-first: every AI feature has a static fallback so the app still works with no network.
- Parent gate already required to reach dashboard AI features — keep that gate in front of chat.

## Database Changes

```text
parent_conversations (id, session_id, title, created_at, updated_at)
parent_messages      (id, conversation_id, role, content, created_at)
ai_asset_cache       (id, world, prompt_hash, storage_path, created_at)
```
- RLS: all scoped via `session_id → app_sessions.user_id = auth.uid()`.
- New storage bucket `ai-assets` (public-read, authenticated-write).

## Models & Cost Posture

| Use case | Model | Why |
|---|---|---|
| Narration phrases | `google/gemini-3-flash-preview` | Cheap, fast, plenty good |
| Parent insights (structured) | `google/gemini-2.5-flash` | Reliable tool-calling |
| Parent chat | `google/gemini-3-flash-preview` streaming | Low latency |
| Image generation | `google/gemini-3.1-flash-image-preview` | Fast Nano Banana 2 |
| Heavy reasoning fallback | `openai/gpt-5-mini` | If Gemini struggles |

## Files to Create / Edit

**Create**
- `supabase/functions/ai-narrate/index.ts`
- `supabase/functions/ai-insights/index.ts`
- `supabase/functions/ai-parent-chat/index.ts`
- `supabase/functions/ai-generate-image/index.ts`
- `src/hooks/useAINarration.ts`
- `src/hooks/useAIInsights.ts`
- `src/components/parent/InsightsCard.tsx`
- `src/components/parent/ParentChat.tsx`
- `src/components/parent/RecommendationChips.tsx`
- Migration: `parent_conversations`, `parent_messages`, `ai_asset_cache` + RLS

**Edit**
- `src/components/ParentDashboard.tsx` — mount Insights, Chat, Recommendations
- `src/components/worlds/AlphabetWorld.tsx`, `AnimalWorld.tsx`, `NumberWorld.tsx` — opt-in adaptive narration
- `src/pages/Index.tsx` — pass progress snapshot to insights hook
- `package.json` — add `react-markdown` for chat rendering

## Rollout Order (recommended single-message scope: Phase 1 + 3)

Start with Phase 1 (edge functions + DB) and Phase 3 (Parent Dashboard AI). This is the highest-leverage, lowest-risk slice — parents see immediate value, no changes to the toddler-facing worlds yet. Phases 2 and 4 follow in subsequent prompts.

