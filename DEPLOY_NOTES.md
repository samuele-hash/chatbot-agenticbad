# Note deploy e configurazione

## File da caricare manualmente (NON in Git)

- **File `.env`**: caricare le variabili **solo su Render** (Environment), non committare `.env` (contiene segreti).
- **3 file audio** (backend): caricarli **nella repository online** del backend, nelle cartelle giuste (es. `audios/` e i file lipsync/audio richiesti dal backend).

---

## Locale vs Online

| | Locale | Online (Render) |
|---|--------|-----------------|
| **Frontend** | Porta assegnata (es. vite default) | **Link di Render** (es. www.agenticbad.com o xxx.onrender.com) |
| **Backend** | Porta assegnata (es. 10000) | **Porta che dà Render** (`process.env.PORT` – già gestita nel codice) |
| **VITE_API_URL** (frontend) | `http://localhost:10000` | URL del **Web Service** backend su Render |

---

## Web Service (backend) su Render

Verificare come nel **service originale** (es. Mainplayer-chatbot):

- **Variabili d'ambiente**: stesse chiavi e valori (OPENAI_API_KEY, PUPAO_*, VITE_API_URL = URL del backend).
- **Impostazioni**: Root Directory, Build Command, Start Command uguali all’originale.
- **Key / Root / Comandi**: confrontare con il service che funziona e allineare.

---

## Build e push

1. **Frontend**: `npm run build` → push su repo frontend (es. samuele-hash/chatbot-agenticbad).
2. **Backend**: push su repo backend (es. samuele-hash/chatbot-agenticbert).
3. Dopo ogni modifica a **VITE_API_URL** sul frontend: **nuovo deploy** (le variabili Vite sono incluse solo al build).
