'use client';
import SimliFaceStream from "@/components/SimliFaceStream/SimliFaceStream";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export default function Home() {

  const [playing, setPlaying] = useState(false);

  const sentenceToSay = useRef("Hello from a realistic voice.");

  const simliFaceStreamRef = useRef<any>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [minimumChunkSizeState, setMinimumChunkSizeState] = useState(6);

  const StartAudioToVideoSession = async (isJPG: Boolean, syncAudio: Boolean, infiniteLoop: Boolean = true) => {
    
    const metadata = {
      faceId: process.env.NEXT_PUBLIC_CHARACTER_FACE_ID,
      isJPG: isJPG,
      apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY,
      syncAudio: syncAudio,
    };
  
    const response = await fetch(
      'https://api.simli.ai/startAudioToVideoSession',
      {
        method: 'POST',
        body: JSON.stringify(metadata),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  
    return response.json();
  };

  const fetchGeneratedText = async (inputText: string) => {
    const response = await fetch('http://localhost:8888/api/generate-text', {
      method: 'POST',
      body: JSON.stringify({ text: inputText }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data.text;
  };

  const handleStart = async () => {
    try {
      const generatedText = await fetchGeneratedText(sentenceToSay.current);
      console.log("Generated Text:", generatedText);

      StartAudioToVideoSession(true, true).then((response) => {
        console.log("Session Token:", response);
        setSessionToken(response.session_token);
        const ws = new WebSocket("ws://localhost:9000/audio");
        ws.onopen = () => {
          console.log("Connected to audio websocket");
          ws.send(generatedText);
        };
  
        ws.onmessage = (event) => {
          if (simliFaceStreamRef.current) {
            simliFaceStreamRef.current.sendAudioDataToLipsync(event.data);
          }
        };
        ws.onclose = () => {
          console.log("Audio websocket closed");
        }
        setPlaying(true);
      });
    } catch (error) {
      console.log("Error websocket", error);  
    }
  }

  const handlePause = () => {
    setPlaying(false);
  };

  const handleResume = () => {
    setPlaying(true);
  };

  const handleMinimumChunkSizeChange = (event: any) => {
    setPlaying(false);
    setMinimumChunkSizeState(parseInt(event.target.value));
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 font-mono">
        <>
        {
          sessionToken === "" ? ( 
            <div></div>
          ) : (
            <SimliFaceStream ref={simliFaceStreamRef} start={playing} sessionToken={sessionToken} minimumChunkSize={minimumChunkSizeState} />
          )
        }
          
          <br />
          {/* Input for sentence to play */}
          <input
            type="text"
            onChange={(e) => { 
              console.log(e.target.value);
              sentenceToSay.current = e.target.value;
             } }
            className="border border-gray-300 rounded-lg p-2 w-[300px] m-2 text-black font-mono"
            placeholder="Enter a sentence to play" 
          />
          <button
            className={
              "hover:opacity-75 text-white font-bold py-2 w-[300px] px-4 rounded" +
              (playing ? " bg-red-500" : " bg-green-500")
            }
            onClick={() => {
              playing ? handlePause() : handleStart();
            }}
          >
            {playing ? "Stop" : "Play"}
          </button>
          <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex"></div>
        </>
      {/* )} */}

    </main>
  );
}
