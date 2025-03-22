"use client";

import { useEffect, useState } from "react";
import { RTVIClient } from "@pipecat-ai/client-js";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { RTVIClientAudio, RTVIClientProvider } from "@pipecat-ai/client-react";
import { 
  defaultServices, 
  defaultConfig, 
  defaultEndpoints,
  BOT_READY_TIMEOUT 
} from "../rtvi.config";

import App from "./App";

export default function Home() {
  const [voiceClient, setVoiceClient] = useState<RTVIClient | null>(null);

  useEffect(() => {
    if (voiceClient) {
      return;
    }

    const newVoiceClient = new RTVIClient({
      transport: new DailyTransport(),
      params: {
        baseUrl: `/api`,
        requestData: {
          services: defaultServices,
          config: defaultConfig,
        },
        endpoints: defaultEndpoints,
      },
      enableMic: true,
      enableCam: true,
      timeout: BOT_READY_TIMEOUT,
    });

    setVoiceClient(newVoiceClient);
  }, [voiceClient]);

  return (
    <RTVIClientProvider client={voiceClient!}>
      <>
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <div className="flex flex-col gap-4 items-center">
            <h1 className="text-4xl font-bold">My Daily Bot</h1>
            <App />
          </div>
        </main>
        <RTVIClientAudio />
      </>
    </RTVIClientProvider>
  );
}
