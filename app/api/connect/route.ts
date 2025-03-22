import { NextRequest, NextResponse } from "next/server";
import { 
  defaultBotProfile, 
  defaultServiceOptions,
  defaultConfig
} from "../../../rtvi.config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get your API key from environment variables
    const apiKey = process.env.DAILY_BOTS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 500 }
      );
    }

    console.log("Creating bot with config:", JSON.stringify(defaultConfig));

    // Make a request to the Daily API
    const response = await fetch("https://api.daily.co/v1/bots/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        bot_profile: defaultBotProfile,
        max_duration: 600,
        services: body.services || {
          stt: "deepgram",
          tts: "cartesia",
          llm: "anthropic",
        },
        service_options: defaultServiceOptions.service_options,
        api_keys: {},
        config: body.config || defaultConfig
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to create bot" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating bot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 