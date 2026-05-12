import axios from "axios";
import { promises as fsPromises } from "fs";
import path from "path";

/**
 * Pulisce il testo per TTS: il motore Google legge letteralmente *, emoji, markdown ("asterisco", ecc.).
 */
export function sanitizeForSpeech(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.normalize("NFKC");
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  s = s.replace(/\*([^*\n]+)\*/g, "$1");
  s = s.replace(/__(.+?)__/g, "$1");
  s = s.replace(/_(.+?)_/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/^\s*[-*+•]\s+/gm, "");
  s = s.replace(/^\s*\d+\.\s+/gm, "");
  try {
    s = s.replace(/\p{Extended_Pictographic}/gu, " ");
  } catch {
    /* ambienti senza unicode props */
  }
  s = s.replace(/\[\d+\]/g, "");
  s = s.replace(/[*#~`|]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Testo sicuro per voce + UI; evita stringa vuota se restavano solo emoji */
export function plainTextForAvatar(raw) {
  const cleaned = sanitizeForSpeech(raw);
  if (cleaned.length > 0) return cleaned;
  try {
    const fallback = String(raw ?? "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    return fallback.length > 0 ? fallback : "Ok.";
  } catch {
    const fb = String(raw ?? "").replace(/\s+/g, " ").trim();
    return fb.length > 0 ? fb : "Ok.";
  }
}

/** Deduce encoding / sample rate per Speech-to-Text da nome file e magic bytes */
export function getRecognitionConfig(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
  }
  if (
    buffer.length >= 28 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  ) {
    const sampleRate = buffer.readUInt32LE(24);
    return {
      encoding: "LINEAR16",
      sampleRateHertz: sampleRate > 0 ? sampleRate : 48000,
    };
  }
  if (ext === ".wav") {
    return { encoding: "LINEAR16", sampleRateHertz: 48000 };
  }
  if (ext === ".webm") {
    return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
  }
  return { encoding: "WEBM_OPUS", sampleRateHertz: 48000 };
}

export async function textToSpeechGoogle(fileName, textInput, env = process.env) {
  const apiKey = env.GOOGLE_CLOUD_API_KEY || env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Manca GOOGLE_CLOUD_API_KEY (o GOOGLE_API_KEY) nel .env");
  }
  const languageCode = env.GOOGLE_TTS_LANGUAGE_CODE || "it-IT";
  const voiceName =
    env.GOOGLE_TTS_VOICE_NAME || `${languageCode}-Neural2-C`;

  const spokenText = plainTextForAvatar(textInput);

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
  const { data } = await axios.post(url, {
    input: { text: spokenText },
    voice: { languageCode, name: voiceName },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1,
    },
  });

  if (!data.audioContent) {
    throw new Error("TTS Google: risposta senza audioContent");
  }
  await fsPromises.writeFile(fileName, Buffer.from(data.audioContent, "base64"));
}

export async function transcribeWithGoogle(filePath, env = process.env) {
  const apiKey = env.GOOGLE_CLOUD_API_KEY || env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Manca GOOGLE_CLOUD_API_KEY (o GOOGLE_API_KEY) nel .env");
  }
  const buffer = await fsPromises.readFile(filePath);
  const base64Audio = buffer.toString("base64");
  const cfg = getRecognitionConfig(path.basename(filePath), buffer);
  const languageCode = env.GOOGLE_STT_LANGUAGE_CODE || "it-IT";

  const config = {
    encoding: cfg.encoding,
    languageCode,
    enableAutomaticPunctuation: true,
  };
  if (cfg.sampleRateHertz) {
    config.sampleRateHertz = cfg.sampleRateHertz;
  }

  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent(apiKey)}`;
  const { data } = await axios.post(url, {
    config,
    audio: { content: base64Audio },
  });

  const results = data.results || [];
  const text = results
    .map((r) => r.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(" ")
    .trim();

  return text;
}
