# Aurum Agent AI Connection

This local MVP now has a real server-side OpenAI-compatible LLM adapter.

## Runtime Modes

- `live`: `LLM_API_KEY` or `DEEPSEEK_API_KEY` is configured, so `/api/answer` and `/api/author-mode/message` call the configured model.
- `mock`: no real key is configured, or the live model returns an invalid uncited answer. The app serves a local source-grounded fallback and includes `warning` in the API response.

Check status:

```bash
curl http://localhost:3000/api/ai/status
```

## Environment Variables

Use `.env.local` for local secrets:

```bash
LLM_BASE_URL="https://api.deepseek.com"
LLM_API_KEY="your-key"
LLM_MODEL="deepseek-chat"
```

`DEEPSEEK_API_KEY` is also accepted as an alias for `LLM_API_KEY`.

## Request Shape

The adapter calls:

```text
POST {LLM_BASE_URL}/chat/completions
Authorization: Bearer {LLM_API_KEY}
Content-Type: application/json
```

The body uses the OpenAI-compatible chat completions shape:

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.2,
  "stream": false
}
```

## Citation Guardrail

Live model output is accepted only when every paragraph includes a valid evidence marker such as `[^ev_1]`. If the model omits citations or invents unknown markers, the API falls back to the local cited answer and returns a `warning`.

## Security

The browser never receives API keys. All LLM calls happen in server route handlers through `src/lib/ai/chat-client.ts`.
