# Render: un solo Web Service (frontend + backend)

Con **un solo** Web Service che usa la repo completa (root = frontend, `backend/` = API):

## Impostazioni Render

| Campo | Valore |
|-------|--------|
| **Root Directory** | *(lascia VUOTO)* |
| **Build Command** | `npm install && npm run build && cp -r dist backend/dist && cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |

## Cosa fa

1. **Build**: dalla root installa il frontend, fa `npm run build` (crea `dist/`), copia `dist` in `backend/dist`, installa le dipendenze del backend.
2. **Start**: avvia il server Node dalla cartella `backend/`. Il backend serve:
   - **/** → frontend (file da `backend/dist`, incluso `index.html`)
   - **/chat**, **/transcribe**, **/audios** → API

## Variabili d'ambiente (Environment)

Impostale sul Web Service (non servono due servizi):

- `OPENAI_API_KEY`
- `PUPAO_API_URL`
- `PUPAO_BOT_ID`
- `PUPAO_API_KEY`
- `VITE_API_URL` = **URL del servizio** (es. `https://www.agenticbad.com`) per gli URL degli audio
