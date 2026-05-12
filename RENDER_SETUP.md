# Configurazione Render - agenticbad.com

## Schema
- **Frontend** (Static Site) → https://www.agenticbad.com
- **Backend** (Web Service) → es. https://chatbot-agenticbad-api.onrender.com

Il frontend chiama `/chat` e `/transcribe` sul **BACKEND**, non su agenticbad.com.

---

## 1. FRONTEND (Static Site su Render)

### Impostazioni Build
| Campo | Valore |
|-------|--------|
| Root Directory | *(vuoto)* |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

### Variabili d'ambiente (Environment)
| Chiave | Valore |
|--------|--------|
| `VITE_API_URL` | **URL del BACKEND** (es. `https://chatbot-agenticbad-api.onrender.com`) |

⚠️ **IMPORTANTE:** `VITE_API_URL` deve puntare all'URL del tuo **Backend Web Service** su Render, NON a agenticbad.com.

### Custom Domain
- Aggiungi `www.agenticbad.com`

---

## 2. BACKEND (Web Service su Render)

### Impostazioni
| Campo | Valore |
|-------|--------|
| Root Directory | *(vuoto)* oppure cartella root del backend |
| Build Command | `npm install` |
| Start Command | `npm start` |

### Variabili d'ambiente (Environment)
| Chiave | Valore |
|--------|--------|
| `OPENAI_API_KEY` | La tua chiave OpenAI |
| `PUPAO_API_URL` | URL API Pupao |
| `PUPAO_BOT_ID` | ID del bot Pupao |
| `PUPAO_API_KEY` | Chiave API Pupao |
| `VITE_API_URL` | **URL del backend stesso** (es. `https://chatbot-agenticbad-api.onrender.com`) |

`VITE_API_URL` sul backend serve per generare gli URL degli audio (es. `{VITE_API_URL}/audios/message_0.mp3`).

### CORS
Il backend usa `cors()` senza restrizioni. Se servisse limitare l'origine:
```js
app.use(cors({ origin: 'https://www.agenticbad.com' }));
```

---

## 3. File da caricare nella repository BACKEND

### Cartella `audios/`
Includi nella repo del backend:
- `audios/message_o.json` (file lipsync)

### NON mettere in Git
- `.env` (contiene segreti) – usa le Environment Variables su Render
- `node_modules/`

---

## 4. Riepilogo: cosa va dove

| Ambiente | Frontend VITE_API_URL | Backend PORT | Backend VITE_API_URL |
|----------|------------------------|--------------|----------------------|
| **Locale** | `http://localhost:10000` | `10000` | `http://localhost:10000` |
| **Render** | `https://TUO-BACKEND.onrender.com` | assegnato da Render | `https://TUO-BACKEND.onrender.com` |

---

## 5. Verifica

1. Backend deployato → visita `https://TUO-BACKEND.onrender.com` → dovresti vedere "Hello World!"
2. Frontend: in Environment imposta `VITE_API_URL` = URL backend
3. Fai **Manual Deploy** del frontend per applicare la variabile
4. Apri https://www.agenticbad.com → scrivi e invia → l'avatar dovrebbe rispondere
