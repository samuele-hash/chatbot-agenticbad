import { useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, message, cameraZoomed, setCameraZoomed} = useChat();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.wav");

        const apiUrl = import.meta.env.VITE_API_URL || "https://www.agenticbad.com";
        const response = await fetch(`${apiUrl}/transcribe`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        input.current.value = data.text;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("❌ Errore nell'accesso al microfono:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    const text = input.current.value;
    if (!loading && text.trim() !== "") {
      try {
        await chat(text);
        input.current.value = "";
      } catch (error) {
        console.error("❌ Errore durante l'invio del messaggio:", error);
      }
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed top-30 left-0 right-0 bottom-0 z-10 flex justify-between p-3 flex-col pointer-events-none">
      <div className="w-full flex flex-col items-end justify-center gap-3">
      <div className="fixed top-0 left-30 right-0 bottom-0 z-10 flex justify-between p-3 pointer-events-none">
      <div className="flex flex-col items-start gap-3">
       
      <button
            onClick={() => {
              const body = document.querySelector("body");
              if (body.classList.contains("greenScreen")) {
                body.classList.remove("greenScreen");
              } else {
                body.classList.add("greenScreen");
              }
            }}
              className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
       <button
            onClick={() => setCameraZoomed(!cameraZoomed)}
          className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
            {cameraZoomed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            )}
          </button>

  <button
    onClick={() => {
      window.open("https://www.youtube.com/watch?v=e7k1TwPCWDk", "_blank");
    }}
            className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3 5h13a2 2 0 0 1 2 2v3l4-3v10l-4-3v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
    </svg>
  </button>
  
  <button
    onClick={() => {
      window.open("https://linktr.ee/Pupau_Samuele", "_blank");
    }}
            className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2l3 5h-2v5h4l-5 5v5h-2v-5l-5-5h4V7H9l3-5z"/>
    </svg>
  </button>

  <button
    title="353 2117405"
    className="relative group pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
    <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
      353 2117405
    </span>
  </button>
  </div>
  </div>
        
          <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-3 pointer-events-none">
  <div className="flex flex-col items-start gap-3">
          <button
            onClick={() => {
  window.open("https://www.instagram.com/samtoryu_g/", "_blank");
}}
                  className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                d="M7.5 3h9a4.5 4.5 0 0 1 4.5 4.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm9.75 3.75h.008m-5.258 2.992a3 3 0 1 1-4.242 4.242 3 3 0 0 1 4.242-4.242Z"
              />
            </svg>
          </button>
          <button
            onClick={() => {
  window.open("https://drive.google.com/drive/folders/1Y0UBxBP_hW5hV32UcJ9J5V9oiDA0L7s9?usp=drive_link", "_blank");
}}
                  className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor" className="w-6 h-6">
            <rect x="6" y="2" width="52" height="60" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="4"/>
            <text x="32" y="42" textAnchor="middle" fontSize="24" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fill="currentColor">
              CV
            </text>
          </svg>

          </button>
          <button
            onClick={() => {
  window.open("https://www.linkedin.com/in/samuele-garofalo-6a728382", "_blank");
}}
                  className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
            </svg>
          </button>

          <button
            onClick={() => {
  window.open("https://drive.google.com/drive/folders/1djtE1qN3ht7iRXCsHlrTQxsSnVHI_kfp?usp=sharing", "_blank");
}}
                  className="pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M7.71 3L1.15 14.39 4.29 19.5 10.85 8.11 7.71 3zM13.15 8.11L6.59 19.5h11.12l3.14-5.11H13.15zM20.85 14.39L14.29 3H8.01l6.56 11.39h6.28z"/>
            </svg>
          </button>

          <button
            title="samuele@agenticbad.com"
            className="relative group pointer-events-auto bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              samuele@agenticbad.com
            </span>
          </button>

          </div>
          </div>


        
        

        <div className="flex items-center gap-1 pointer-events-auto max-w-screen-sm w-full mx-auto">
      
        
          
          <input
            className="w-full placeholder:text-black p-3 rounded-md bg-opacity-30 bg-white backdrop-blur-md"
            placeholder="Type or record a message..."
            ref={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button
          onClick={toggleRecording}
            className={`pointer-events-auto p-3 px-3 font-Anton rounded-md text-gray-800 ${
              isRecording ? "bg-red-500" : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          {isRecording ? "Stop" : "🎙️"}
        </button>
          <button
            disabled={loading || message}
            onClick={sendMessage}
              className={`bg-gray-200 hover:bg-gray-300 text-gray-800 p-3 px-3 font-Anton rounded-md ${
                loading || message ? "cursor-not-allowed opacity-30" : ""
              }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
