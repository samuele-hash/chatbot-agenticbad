import { createContext, useContext, useEffect, useState } from "react";

// Locale: .env con VITE_API_URL=http://localhost:10000 | Online: Render Environment con URL backend
const backendUrl = import.meta.env.VITE_API_URL || "https://www.agenticbad.com";
// Debug: in console (F12) vedi quale URL usa il frontend per le API
if (typeof window !== "undefined") console.log("[Chat] Backend API URL:", backendUrl);

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  
  const chat = async (message) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
  
      const text = await response.text();
      if (!response.ok) {
        console.error("[Chat] Risposta non OK:", response.status, "Body:", text.slice(0, 300));
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("[Chat] La risposta non è JSON. URL:", `${backendUrl}/chat`, "Status:", response.status);
        console.error("[Chat] Inizio risposta ricevuta:", text.slice(0, 500));
        throw new Error("Il server ha restituito HTML invece di JSON. Verifica che l'URL sia il backend (Web Service), non il sito statico.");
      }
      const resp = Array.isArray(data.messages) ? data.messages : [];
      setMessages((messages) => [...messages, ...resp]);


    } catch (error) {
      console.error("Errore nella richiesta chat:", error);
      console.error("URL chiamato:", `${backendUrl}/chat`);
    } finally {
      setLoading(false);
    }
  };
  
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
