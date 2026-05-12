import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import express from "express";
import fs from "fs";
import { promises as fsPromises } from "fs";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import pdf from "pdf-parse";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-",
});

const app = express();
const port = 10000;

// Definizione di __dirname per moduli ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(fileUpload());

// Servire i file statici del frontend e delle risorse audio
app.use(express.static(path.join(__dirname, "dist")));
app.use('/audios', express.static(path.join(__dirname, "audios")));

// Endpoint base
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 📄 Upload di PDF
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

// 🛠 Estrazione testo dai PDF
const extractTextFromPDFs = async () => {
  const pdfDir = path.resolve(__dirname, "./pdfs"); 
  console.log(`📂 Leggo i PDF dalla cartella: ${pdfDir}`);
  const files = await fsPromises.readdir(pdfDir);
  if (files.length === 0) return "Nessun file PDF caricato.";
  let combinedText = "";
  for (const file of files) {
    if (file.endsWith("pdf")) {
      try {
        const dataBuffer = await fsPromises.readFile(path.join(pdfDir, file));
        if (dataBuffer.length === 0) {
          console.warn(`⚠️ Il file ${file} è vuoto, saltato.`);
          continue;
        }
        const data = await pdf(dataBuffer);
        combinedText += data.text + "\n\n";
      } catch (error) {
        console.warn(`⚠️ Errore nella lettura del PDF ${file}:`, error.message);
      }
    }
  }
  return combinedText.slice(0, 4000) || "Nessun contenuto PDF disponibile.";
};

// 📢 Generazione Audio con Text-to-Speech (TTS)
const textToSpeech = async (fileName, textInput) => {
  try {
    console.log(`🗣️ Generazione audio per: "${textInput}"`);
    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        model: "tts-1",
        voice: "onyx",
        input: textInput,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );
    const writer = fs.createWriteStream(fileName);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("❌ Errore nella sintesi vocale:", error.response?.data || error.message);
    throw error;
  }
};

// 📩 Chatbot con Pupao
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    // 1️⃣ Crea conversazione su Pupao
    console.log("🔄 Creazione conversazione su Pupao...");
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
    console.log(`✅ Conversazione creata: ${conversationId}`);

    // 2️⃣ Invia messaggio a Pupao
    console.log(`🗨️ Invio messaggio a Pupao: "${userMessage}"`);
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
    const botResponse = chatResponse.data.response || chatResponse.data.message || "";
    console.log(`✅ Risposta da Pupao: "${botResponse}"`);

    if (botResponse) {
      messages = [{
        text: botResponse,
        facialExpression: "smile",
        animation: "idle"
      }];
    }

    // 🎤 Genera audio dalla risposta
    const processAudioTasks = messages.map(async (message, i) => {
      const fileName = `audios/message_${i}.mp3`;
      await textToSpeech(fileName, message.text);
      message.audioUrl = `${process.env.VITE_API_URL || "http://localhost:10000"}/audios/message_${i}.mp3`;
      message.lipsync = await readJsonTranscript("./audios/message_o.json");
    });
    await Promise.all(processAudioTasks);
    console.log("📩 Messaggi inviati al frontend:", JSON.stringify(messages, null, 2));
    res.send({ messages });
  } catch (error) {
    console.error("❌ Errore nella API Pupao:", error.message);
    if (error.response?.data) {
      console.error("   Dettagli errore:", error.response.data);
    }
    if (!res.headersSent) {
      res.status(500).send({ response: "Errore nel chatbot. Riprova più tardi." });
    }
  }
});

// 🎵 Funzioni utility per audio
const readJsonTranscript = async (file) => {
  try {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️ Il file JSON ${file} non esiste.`);
      return null;
    }
    const data = await fsPromises.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Errore nella lettura del file JSON: ${file}`, error);
    return null;
  }
};

const audioFileToBase64 = async (file) => {
  try {
    if (!fs.existsSync(file)) return null;
    const data = await fsPromises.readFile(file);
    return data.toString("base64");
  } catch (error) {
    console.error(`❌ Errore nella conversione base64: ${error}`);
    return null;
  }
};

// 🔥 Endpoint per trascrivere l'audio con Whisper API (solo trascrizione, senza TTS)
app.post("/transcribe", async (req, res) => {
  if (!req.files || !req.files.audio) {
    return res.status(400).json({ error: "Nessun file audio caricato" });
  }
  const audioFile = req.files.audio;
  const filePath = path.join(__dirname, "uploads", audioFile.name);
  try {
    // Assicurati che la cartella "uploads" esista
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"));
    }
    await audioFile.mv(filePath);
    console.log("🎙️ Audio ricevuto e salvato:", filePath);
    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(filePath),

    });
    console.log("📜 Trascrizione:", response.text);
    res.json({ text: response.text });
    // Rimuove il file dopo la trascrizione
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("❌ Errore nella trascrizione:", error);
    res.status(500).json({ error: "Errore nella trascrizione" });
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
