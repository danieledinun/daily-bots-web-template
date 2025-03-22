import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Actions endpoint received request:", body);
    
    // Get your API key from environment variables
    const apiKey = process.env.DAILY_BOTS_API_KEY;
    const defaultBotId = process.env.DAILY_BOTS_DEFAULT_BOT_ID || "default";
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 500 }
      );
    }

    // Use the provided botId or fall back to the default
    const botId = body.botId || defaultBotId;
    console.log(`Using bot ID: ${botId}`);

    // Special handling for greeting action
    if (body.action === "greeting") {
      console.log("Processing greeting action");
      // For greeting action, we'll send a specific message to the LLM
      body.data = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Hello! My name is ${body.data.userName}. I'm here to see a demo of your product.`
              }
            ]
          }
        ]
      };
      
      // We've removed the automatic function call trigger here
      // Now the bot will only share demos when explicitly asked by the user
    }

    // Special handling for demo actions
    if (body.action === "demo") {
      console.log(`Processing demo action: ${body.data.demoAction}`);
      // Handle different demo actions
      const demoAction = body.data.demoAction;
      
      // Handle function calls from the bot
      if (demoAction === "function_result") {
        console.log("Processing function result");
        const functionName = body.data.function_name;
        const functionArgs = body.data.arguments || {};
        console.log(`Function name: ${functionName}, arguments:`, functionArgs);
        
        // Handle share_demo function
        if (functionName === "share_demo") {
          console.log("Processing share_demo function");
          // Forward the function call to our function-call endpoint
          try {
            const functionCallResponse = await fetch(`${req.nextUrl.origin}/api/function-call`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "function_call",
                data: {
                  name: functionName,
                  arguments: functionArgs
                }
              }),
            });
            
            console.log("Function call forwarded, response status:", functionCallResponse.status);
            
            if (functionCallResponse.ok) {
              // Return success to the bot
              return NextResponse.json({
                success: true,
                result: {
                  message: `Successfully processed ${functionName} function call`
                }
              });
            } else {
              // If the function-call endpoint returned an error, return that error
              const errorData = await functionCallResponse.json();
              console.error("Function call endpoint returned error:", errorData);
              return NextResponse.json(
                { error: errorData.error || "Failed to process function call" },
                { status: functionCallResponse.status }
              );
            }
          } catch (error) {
            console.error("Error processing function call:", error);
            return NextResponse.json(
              { error: "Failed to process function call" },
              { status: 500 }
            );
          }
        }
        
        // Handle other function calls here
        // ...
        
        // Default response for unhandled function calls
        return NextResponse.json({
          success: true,
          result: {
            message: `Received function call: ${functionName}`
          }
        });
      }
      
      // If this is a "start" demo action, also trigger a function call
      if (demoAction === "start") {
        // We've removed the automatic function call trigger here
        // Now the bot will only share demos when explicitly asked by the user
        console.log("Demo start action received - no automatic function call");
      }
      
      // Prepare the message for the LLM based on the demo action
      let message = "";
      
      switch (demoAction) {
        case "start":
          message = "I'd like to see a demo of your product. Can you show me how it works?";
          break;
        case "next":
          message = "That's interesting. What else can you show me?";
          break;
        case "previous":
          message = "Can you go back to the previous feature?";
          break;
        case "restart":
          message = "Let's start the demo over from the beginning.";
          break;
        default:
          message = body.data.message || "Tell me more about your product.";
      }
      
      console.log(`Setting message for LLM: "${message}"`);
      
      // Set up the data for the LLM
      body.data = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: message
              }
            ]
          }
        ]
      };
    }

    // Instead of forwarding to Daily API, we'll handle the action locally
    // and return a success response
    console.log(`Handling action: ${body.action} for bot: ${botId}`);
    
    return NextResponse.json({
      success: true,
      message: `Action ${body.action} processed successfully`
    });
  } catch (error) {
    console.error("Error performing action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 