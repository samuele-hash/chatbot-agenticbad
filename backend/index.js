import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import express from "express";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import { textToSpeechGoogle, transcribeWithGoogle } from "./googleSpeech.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(fileUpload());

[path.join(__dirname, "audios"), path.join(__dirname, "uploads"), path.join(__dirname, "pdfs")].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(express.static(path.join(__dirname, "dist")));
app.use('/audios', express.static(path.join(__dirname, "audios")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post('/upload-pdf', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No files were uploaded.");
  }
  const file = req.files.file;
  const uploadPath = path.join(__dirname, "pdfs", file.name);
  try {
    await file.mv(uploadPath);
    res.send({ message: "File uploaded successfully", filename: file.name });
  } catch (err) {
    res.status(500).send(err);
  }
});

const textToSpeech = async (fileName, textInput) => {
  try {
    console.log(`Generazione audio (Google TTS)...`);
    await textToSpeechGoogle(fileName, textInput);
  } catch (error) {
    console.error("Errore sintesi vocale:", error.response?.data || error.message);
    throw error;
  }
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    console.log("Creazione conversazione...");
    const conversationResponse = await axios.post(
      `${process.env.PUPAO_API_URL}/chat-bots/${process.env.PUPAO_BOT_ID}/conversations`,
      {
        title: "Conversation with Avatar",
        data: {},
        source: "INTEGRATION"
      },
      {
        headers: {
          "Api-Key": process.env.PUPAO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const conversationId = conversationResponse.data.id;
    const conversationToken = conversationResponse.data.token;
    console.log(`Conversazione creata: ${conversationId}`);
    console.log(`Invio messaggio: "${userMessage}"`);
    const chatResponse = await axios.post(
      `${process.env.PUPAO_API_URL}/chat-bots/${process.env.PUPAO_BOT_ID}/conversations/${conversationId}/queries?sse=false`,
      {
        request: userMessage
      },
      {
        headers: {
          "Api-Key": process.env.PUPAO_API_KEY,
          "Conversation-Token": conversationToken,
          "Content-Type": "application/json"
        }
      }
    );

    let messages = [];
    const botData = chatResponse.data[process.env.PUPAO_BOT_ID] || {};
    const botResponse = botData.message || "";

    if (botResponse) {
      messages = [{
        text: botResponse,
        facialExpression: "smile",
        animation: "idle"
      }];
    }

    const processAudioTasks = messages.map(async (message, i) => {
      const fileName = `audios/message_${i}.mp3`;
      await textToSpeech(fileName, message.text);
      message.audioUrl = `${process.env.VITE_API_URL || "http://localhost:10000"}/audios/message_${i}.mp3`;
      message.lipsync = await readJsonTranscript(path.join(__dirname, "audios", "message_o.json"));
    });
    await Promise.all(processAudioTasks);
    res.send({ messages });
  } catch (error) {
    console.error("Errore API chat:", error.message);
    if (error.response?.data) {
      console.error("Dettagli:", error.response.data);
    }
    if (!res.headersSent) {
      res.status(500).send({ response: "Errore nel chatbot. Riprova più tardi." });
    }
  }
});

const readJsonTranscript = async (file) => {
  try {
    if (!fs.existsSync(file)) {
      console.warn(`File JSON non trovato: ${file}`);
      return null;
    }
    const data = await fsPromises.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Errore lettura JSON: ${file}`, error);
    return null;
  }
};

const audioFileToBase64 = async (file) => {
  try {
    if (!fs.existsSync(file)) return null;
    const data = await fsPromises.readFile(file);
    return data.toString("base64");
  } catch (error) {
    console.error(`Errore conversione base64: ${error}`);
    return null;
  }
};

app.post("/transcribe", async (req, res) => {
  if (!req.files || !req.files.audio) {
    return res.status(400).json({ error: "Nessun file audio caricato" });
  }
  const audioFile = req.files.audio;
  const filePath = path.join(__dirname, "uploads", audioFile.name);
  try {
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"));
    }
    await audioFile.mv(filePath);
    console.log("Audio ricevuto:", filePath);
    const text = await transcribeWithGoogle(filePath);
    console.log("Trascrizione completata");
    res.json({ text });
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Errore trascrizione:", error);
    res.status(500).json({ error: "Errore nella trascrizione" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
