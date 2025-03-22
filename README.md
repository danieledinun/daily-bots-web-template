# Daily Bots Web Template

This is a template for creating a web-based voice bot using Daily.co and Pipecat AI.

## Demo Sharing Feature

This template includes a demo sharing feature that allows the agent to share visual materials during a call with a user. This is useful for product demos, presentations, and educational content.

### How it works

1. The agent can start and stop sharing demo materials during a conversation
2. When demo sharing is active, the agent can navigate through different demo images
3. The agent will reference the visual materials in its responses to enhance the conversation
4. The LLM is informed about which demo is being shown and can tailor its responses accordingly

### Bot-Initiated Demo Sharing

The bot can proactively control the demo sharing using function calling. This allows the bot to:

1. Start sharing demos when appropriate during the conversation
2. Navigate to the next or previous demo
3. Show a specific demo by index
4. Stop sharing demos when no longer needed

The bot uses the `share_demo` function with the following parameters:
- `action`: One of "start", "stop", "next", "previous", or "show_specific"
- `demo_index`: (Optional) The index of the specific demo to show (only used with "show_specific" action)

### Setting up demo materials

1. Place your demo images in the `public/demos` directory
2. Update the `demos` array in `app/App.tsx` with information about each demo:
   ```typescript
   const [demos, setDemos] = useState<DemoInfo[]>([
     {
       url: "/demos/your-image.png",
       name: "Demo Name",
       description: "Description of what this demo shows"
     },
     // Add more demos as needed
   ]);
   ```

### Using the demo sharing feature

During a conversation:
1. Click "Start Sharing Demos" to begin sharing visual materials
2. Use the "Previous Demo" and "Next Demo" buttons to navigate through your demos
3. The agent will be informed about which demo is being shown and can reference it in responses
4. Click "Stop Sharing Demos" when you're done sharing
5. Alternatively, let the bot control the demo sharing based on the conversation context

## Using the Demo Sharing Feature

### How to Start a Demo

There are two ways to start a demo:

1. **Ask the Bot**: Simply ask the bot to show you a demo with phrases like:
   - "Can you show me a demo of your product?"
   - "I'd like to see some screenshots"
   - "Show me how your product works"

2. **Use the UI Controls**: Once you're connected to the bot, you'll see demo sharing controls at the bottom of the screen:
   - Click "Start Sharing Demos" to begin sharing
   - Use "Previous Demo" and "Next Demo" buttons to navigate between demos
   - Click "Stop Sharing Demos" to end the demo

### Troubleshooting

If the bot doesn't respond to your request to show a demo:

1. Check the browser console (F12) for any error messages
2. Make sure you're connected to the bot (you should see "Connected!" message)
3. Try using more explicit language like "Please use the share_demo function to show me a demo"
4. Use the manual UI controls as a fallback

## Getting Started

1. Clone this repository
2. Copy `.env.example` to `.env.local` and add your API keys
3. Install dependencies: `yarn install`
4. Run the development server: `yarn dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `DAILY_BOTS_API_KEY`: Your Daily Bots API key
- `DAILY_BOTS_DEFAULT_BOT_ID`: The default bot ID to use when none is provided (defaults to "default")