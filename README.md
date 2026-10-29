# My Personal Tutor

A browser-based study workspace with Socratic and Personal Assistant modes,
local lecture indexing, contextual tutoring, interactive visual study aids, and
document exports.

The chat composer includes a Create document menu for downloading the latest
response, the full conversation, or an AI-generated study guide as a formatted
DOCX file. Documents are rendered locally with headings, colored accents,
tables, citations, and static flowchart representations of generated concept
diagrams.

Lecture PDFs are parsed in the browser with PDF.js. Each page is chunked and
indexed with a local TF-IDF vectorizer; questions use cosine similarity to
retrieve the most relevant chunks before calling the tutor. Scanned PDFs
without selectable text require OCR and are rejected with an explicit message.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file from the included template:

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and replace `your_openrouter_api_key_here` with your own
   [OpenRouter API key](https://openrouter.ai/keys). You can optionally change
   `VITE_OPENROUTER_MODEL`; the default model is
   `nvidia/nemotron-3.5-lightning:free`.

3. Run the app:

   ```bash
   npm run dev
   ```

Without a key, the app keeps local fallback responses so the UI can still be
previewed. With a key, messages are requested from OpenRouter in the browser.
This project is intended to be run locally by each user with their own key.
Do not commit `.env.local` or publish a real API key.

### Environment files and security

- `.env.example` is safe to commit and is included as the setup template.
- `.env.local` is ignored by Git and should contain only your local key.
- Every user should create their own `.env.local`; never share or reuse keys.
- Because this is a client-side app, a user's own key is available to their
  local browser session while the app runs. Do not use this configuration for
  a public hosted deployment without moving OpenRouter requests behind a
  server-side proxy.

If a key is ever exposed, revoke it immediately in OpenRouter and create a
replacement.

## Available commands

```bash
npm run dev    # Start the local Vite development server
npm run build  # Create a production build
npm run lint   # Run TypeScript checks
```

## Developer note

I made this project after running out of my Claude credits and not wanting to pay for more. I decided to use OpenRouter's free models instead and tried to build a feature that lets me generate Word documents, similar to how Claude does it.

Unfortunately, I was dumb enough to not notice that OpenRouter has daily limits too.

For the next version, I'll be using a local LLM instead so I don't have to worry about running out of credits or hitting API limits.

Stay tuned! (and i will still be working on this project too)

## Local conversation persistence

Chat conversations and the selected interaction mode are saved automatically
in the browser's IndexedDB database. Conversations appear in the sidebar with
titles based on their first user message; selecting one restores it so you can
continue where you left off. The New Session action starts a new conversation
without deleting previous sessions.

The app also migrates the earlier single-conversation storage record when it
finds one. Stopping the local Vite server does not remove saved conversations.

Browser site-data clearing, private browsing sessions, or changing the app
origin (for example, switching ports or changing `localhost` to
`127.0.0.1`) can make the saved conversation unavailable.
