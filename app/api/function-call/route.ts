import { NextRequest, NextResponse } from "next/server";

// Store function calls that need to be processed by the client
const pendingFunctionCalls: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log("Function call endpoint received request:", body);
    
    // If this is a function call from the bot, store it for the client to poll
    if (body.type === "function_call") {
      const functionName = body.data?.name;
      const functionArgs = body.data?.arguments || {};
      
      console.log(`Storing function call: ${functionName}`, functionArgs);
      
      // Store the function call
      pendingFunctionCalls.push({
        function_name: functionName,
        arguments: functionArgs,
        timestamp: Date.now(),
      });
      
      console.log("Current pending function calls:", JSON.stringify(pendingFunctionCalls));
      
      // Return success
      return NextResponse.json({
        success: true,
        message: "Function call received"
      });
    }
    
    // If this is a poll request from the client, return any pending function calls
    if (body.type === "poll") {
      // If there are pending function calls, return the oldest one and remove it
      if (pendingFunctionCalls.length > 0) {
        const functionCall = pendingFunctionCalls.shift();
        
        console.log("Returning function call to client:", JSON.stringify(functionCall));
        
        return NextResponse.json({
          success: true,
          has_function_call: true,
          data: functionCall
        });
      }
      
      // If there are no pending function calls, return empty
      return NextResponse.json({
        success: true,
        has_function_call: false
      });
    }
    
    // If we don't recognize the request type, return an error
    return NextResponse.json(
      { error: `Unknown request type: ${body.type}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error handling function call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 