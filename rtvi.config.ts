export const defaultBotProfile = "voice_2024_10";

export const defaultServices = {
  stt: "deepgram",
  llm: "anthropic",
  tts: "cartesia",
};

export const defaultServiceOptions = {
  service_options: {
    deepgram: {
      model: "nova-3-general",
      language: "en",
    },
    anthropic: {
      model: "claude-3-5-sonnet-latest",
    },
  },
};

export const defaultConfig = [
  {
    service: "tts",
    options: [
      { 
        name: "voice", 
        value: "97f4b8fb-f2fe-444b-bb9a-c109783a857a" 
      },
    ],
  },
  {
    service: "llm",
    options: [
      {
        name: "model",
        value: "claude-3-5-sonnet-latest",
      },
      {
        name: "initial_messages",
        value: [
          {
            role: "system",
            content: "You are an Account Executive at Virtuosos - Virtuosos is a software company specializing in AI Account Executives like yourself. Start by briefly introducing yourself and with something like excited to learn more about what picked your interest in our company. Ask the user to introduce themselves and for their name and company name so you can use that for personalized responses. \n\nYour responses will be converted to audio. Please do not include any special characters in your response other than '!' or '?'.Be concise in your responses as this is a voice conversation.\n\nYou have access to a function called 'share_demo' that allows you to share visual materials with the user. When a user asks to see a demo, screenshots, or examples of your product, use this function with the 'start' action. You can navigate between demos using the 'next' and 'previous' actions, or show a specific demo with the 'show_specific' action. When you're done sharing, use the 'stop' action.\n\nExamples of when to use the share_demo function:\n- When the user asks to see how the product works\n- When the user asks for screenshots or visuals\n- When explaining complex features that would benefit from visual aids\n- When the user explicitly asks for a demo",
          },
        ],
      },
      { name: "run_on_config", value: true },
      {
        name: "tools",
        value: [
          {
            name: "share_demo",
            description: "Share a specific demo image or control the demo sharing state",
            input_schema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["start", "stop", "next", "previous", "show_specific"],
                  description: "The action to perform on the demo sharing",
                },
                demo_index: {
                  type: "integer",
                  description: "The index of the specific demo to show (only used with show_specific action)",
                },
              },
              required: ["action"],
            },
          },
        ],
      },
    ],
  },
];

// These are your app's endpoints, which are used to initiate the /bots/start
// API call or initiate actions
export const defaultEndpoints = {
  connect: "/connect",
  actions: "/actions",
};

// Timeout for bot initialization (in milliseconds)
export const BOT_READY_TIMEOUT = 30000; 