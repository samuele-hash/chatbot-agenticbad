# Note deploy backend

## File da caricare nella repo (cartelle giuste)

- **`.env`**: NON committare. Usare **Environment Variables** su Render (stesse chiavi del service originale).
- **3 file audio / lipsync**: caricarli nella repo nella cartella **`audios/`** (es. `audios/message_o.json` e altri file richiesti dal codice).

## Locale vs Online

| | Locale | Online (Render) |
|---|--------|-----------------|
| **Porta** | `10000` (o quella assegnata) | **Porta che dà Render** (`process.env.PORT` – già usata in `index.js`) |
| **VITE_API_URL** (per URL audio) | `http://localhost:10000` | URL pubblico del Web Service (es. https://www.agenticbad.com) |

## Web Service su Render

Allineare al **service originale** (Mainplayer-chatbot):

- **Root Directory**, **Build Command**, **Start Command**
- **Environment**: OPENAI_API_KEY, PUPAO_API_URL, PUPAO_BOT_ID, PUPAO_API_KEY, VITE_API_URL (URL del backend)
