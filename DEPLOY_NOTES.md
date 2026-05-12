# Note deploy backend

## File da caricare nella repo (cartelle giuste)

- **`.env`**: NON committare. Usare **Environment Variables** su Render (stesse chiavi del `.env.example`).
- **File audio / lipsync**: nella cartella **`audios/`** (es. `audios/message_o.json` e altri richiesti dal codice).

## Locale vs Online

| | Locale | Online (Render) |
|---|--------|-----------------|
| **Porta** | `10000` (o quella scelta) | **PORT** assegnata da Render (`process.env.PORT` in `index.js`) |
| **VITE_API_URL** | `http://localhost:10000` | URL pubblico del Web Service backend |

## Web Service su Render

Allineare al service che già funziona:

- **Environment**: `GOOGLE_CLOUD_API_KEY`, `GOOGLE_TTS_*`, `GOOGLE_STT_LANGUAGE_CODE`, `PUPAO_API_URL`, `PUPAO_BOT_ID`, `PUPAO_API_KEY`, `VITE_API_URL`
- **Root Directory**, **Build Command**, **Start Command**

## Build e push

1. **Backend**: push su questa repo; su Render, deploy dal branch corretto.
2. Dopo modifiche a **VITE_API_URL** sul frontend: **nuovo build** del frontend (le env Vite sono bake-time).
