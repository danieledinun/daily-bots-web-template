import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  TransportState,
  RTVIError,
  RTVIEvent,
  LLMHelper,
  FunctionCallParams
} from "@pipecat-ai/client-js";
import { useRTVIClient, useRTVIClientEvent } from "@pipecat-ai/client-react";

// Declare global variable for tracking function call handling
declare global {
  interface Window {
    isHandlingFunctionCall?: boolean;
  }
}

type MessageType = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  final: boolean;
};

// Demo information type
type DemoInfo = {
  url: string;
  name: string;
  description: string;
};

const App: React.FC = () => {
  const voiceClient = useRTVIClient();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<TransportState>("disconnected");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Demo sharing state
  const [isDemoSharing, setIsDemoSharing] = useState(false);
  const [demos, setDemos] = useState<DemoInfo[]>([
    {
      url: "/demos/Screenshot.png",
      name: "Product Overview",
      description: "This is an overview of our product's main features."
    },
    {
      url: "/demos/Screenshot.png",
      name: "User Dashboard",
      description: "This shows the user dashboard with analytics and controls."
    },
    {
      url: "/demos/Screenshot.png",
      name: "Technical Architecture",
      description: "This diagram explains our product's technical architecture."
    },
  ]);
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  
  // Function call polling state
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reference to the LLM helper
  const llmHelperRef = useRef<LLMHelper | null>(null);
  
  // Handle bot transcript
  useRTVIClientEvent(
    RTVIEvent.BotTranscript,
    useCallback((data: any) => {
      // Only process transcripts if the room is ready
      if (!roomReady) return;
      
      const transcriptId = `bot-${Date.now()}`;
      const existingMessageIndex = messages.findIndex(
        (m) => m.id === transcriptId && m.sender === "bot"
      );
      
      if (existingMessageIndex >= 0) {
        // Update existing message
        setMessages((prev) => {
          const updated = [...prev];
          updated[existingMessageIndex] = {
            ...updated[existingMessageIndex],
            text: data.text,
            final: true,
          };
          return updated;
        });
      } else {
        // Add new message
        setMessages((prev) => [
          ...prev,
          {
            id: transcriptId,
            text: data.text,
            sender: "bot",
            timestamp: new Date(),
            final: true,
          },
        ]);
      }
    }, [messages, roomReady])
  );

  // Handle user transcript
  useRTVIClientEvent(
    RTVIEvent.UserTranscript,
    useCallback((data: any) => {
      // Only process transcripts if the room is ready
      if (!roomReady) return;
      
      const transcriptId = `user-${Date.now()}`;
      const existingMessageIndex = messages.findIndex(
        (m) => m.id === transcriptId && m.sender === "user"
      );
      
      if (existingMessageIndex >= 0) {
        // Update existing message
        setMessages((prev) => {
          const updated = [...prev];
          updated[existingMessageIndex] = {
            ...updated[existingMessageIndex],
            text: data.text,
            final: true,
          };
          return updated;
        });
      } else {
        // Add new message
        setMessages((prev) => [
          ...prev,
          {
            id: transcriptId,
            text: data.text,
            sender: "user",
            timestamp: new Date(),
            final: true,
          },
        ]);
      }
    }, [messages, roomReady])
  );

  // Handle transport state changes
  useRTVIClientEvent(
    RTVIEvent.TransportStateChanged,
    (newState: TransportState) => {
      setState(newState);
      if (newState === "ready" as TransportState) {
        // When connected, we'll start our delay sequence
        // but we don't set isConnecting to false yet
      } else if (newState !== "ready" as TransportState) {
        setRoomReady(false);
        setIsConnecting(false);
      }
    }
  );

  // Handle listening state changes
  useRTVIClientEvent(
    "microphone_active" as any, // Use the string value directly as RTVIEvent.MicrophoneActive may not exist
    (listening: boolean) => {
      setIsListening(listening);
    }
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // Focus on name input when it appears
  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameInput]);

  // Function to send a greeting action to the bot
  const sendGreetingAction = useCallback(async () => {
    if (!voiceClient) return;
    
    try {
      await fetch("/api/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "greeting",
          data: {
            userName: userName
          }
        }),
      });
    } catch (e) {
      console.error("Failed to send greeting action:", e);
    }
  }, [voiceClient, userName]);

  // Function to send a demo action to the bot
  const sendDemoAction = useCallback(async (action: string, data: Record<string, any> = {}) => {
    if (!voiceClient) return;
    
    try {
      await fetch("/api/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "demo",
          data: {
            demoAction: action,
            ...data
          }
        }),
      });
    } catch (e) {
      console.error(`Failed to send ${action} action:`, e);
    }
  }, [voiceClient]);

  // Function to toggle demo sharing
  const toggleDemoSharing = useCallback(async () => {
    const newSharingState = !isDemoSharing;
    console.log(`toggleDemoSharing called, changing state from ${isDemoSharing} to ${newSharingState}`);
    
    // Set the state immediately
    setIsDemoSharing(newSharingState);
    
    console.log(`State set to ${newSharingState}, but component state may not be updated yet due to React's asynchronous state updates`);
    
    // For testing: Manually add a function call - ONLY when triggered manually, not from a function call
    // This prevents infinite loops of function calls
    if (newSharingState && !window.isHandlingFunctionCall) {
      console.log("Manually adding a function call for testing");
      try {
        const response = await fetch("/api/function-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "function_call",
            data: {
              name: "share_demo",
              arguments: {
                action: "start",
                demo_index: 0
              }
            }
          }),
        });
        
        if (response.ok) {
          console.log("Manual function call added successfully");
        } else {
          console.error("Failed to add manual function call");
        }
      } catch (e) {
        console.error("Error adding manual function call:", e);
      }
    }
    
    // Send appropriate action to the bot
    if (newSharingState) {
      console.log("Sending START demo action to bot");
      await sendDemoAction("start", {
        message: "I've started sharing demo materials. I'll be showing you some screenshots and diagrams to help explain our product."
      });
      
      // Also send info about the current demo
      console.log(`Sending CHANGE demo action for demo index ${currentDemoIndex}`);
      await sendDemoAction("change", {
        demoIndex: currentDemoIndex,
        demoName: demos[currentDemoIndex]?.name || 'Product screenshot',
        description: demos[currentDemoIndex]?.description || ''
      });
    } else {
      console.log("Sending STOP demo action to bot");
      await sendDemoAction("stop", {
        message: "I've stopped sharing demo materials. Let's continue our conversation."
      });
    }
    
    console.log(`toggleDemoSharing completed, isDemoSharing should now be ${newSharingState}`);
    
    // Force a re-render to ensure the UI updates
    setTimeout(() => {
      console.log("Forcing UI update after state change");
      setMessages(prev => [...prev]); // This is a hack to force a re-render
    }, 100);
    
    return newSharingState; // Return the new state for easier chaining
  }, [isDemoSharing, sendDemoAction, currentDemoIndex, demos]);

  // Function to share a specific demo image
  const shareDemo = useCallback(async (demoIndex: number) => {
    if (demoIndex < 0 || demoIndex >= demos.length) return;
    
    setCurrentDemoIndex(demoIndex);
    
    // If not already sharing, start sharing
    if (!isDemoSharing) {
      setIsDemoSharing(true);
      await sendDemoAction("start", {
        message: "I've started sharing demo materials. I'll be showing you some screenshots and diagrams to help explain our product."
      });
    }
    
    // Send info about the current demo
    await sendDemoAction("change", {
      demoIndex: demoIndex,
      demoName: demos[demoIndex].name,
      description: demos[demoIndex].description
    });
    
    // Add a message to indicate which demo is being shared
    setMessages(prev => [
      ...prev,
      {
        id: `system-demo-${Date.now()}`,
        text: `Agent is sharing demo: ${demos[demoIndex].name}`,
        sender: "bot",
        timestamp: new Date(),
        final: true,
      }
    ]);
    
  }, [isDemoSharing, demos, sendDemoAction]);

  // Function to navigate to the next demo
  const nextDemo = useCallback(() => {
    const nextIndex = (currentDemoIndex + 1) % demos.length;
    shareDemo(nextIndex);
  }, [currentDemoIndex, demos.length, shareDemo]);

  // Function to navigate to the previous demo
  const prevDemo = useCallback(() => {
    const prevIndex = (currentDemoIndex - 1 + demos.length) % demos.length;
    shareDemo(prevIndex);
  }, [currentDemoIndex, demos.length, shareDemo]);

  // Function to start the name input process
  function startNameInput() {
    setShowNameInput(true);
  }

  // Function to handle name submission
  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (userName.trim()) {
      setShowNameInput(false);
      connect();
    }
  }

  // Function to handle bot-initiated demo sharing
  const handleBotDemoAction = useCallback(async (action: string, demoIndex?: number) => {
    console.log(`Bot initiated demo action: ${action}, index: ${demoIndex}`);
    console.log(`Current demo sharing state: ${isDemoSharing}`);
    console.log(`Current demos array:`, demos);
    
    switch (action) {
      case 'start':
        console.log('Handling START action');
        if (!isDemoSharing) {
          console.log('Demo sharing was OFF, turning it ON');
          await toggleDemoSharing();
          console.log('After toggleDemoSharing, isDemoSharing =', isDemoSharing);
        } else {
          console.log('Demo sharing was already ON');
        }
        break;
        
      case 'stop':
        console.log('Handling STOP action');
        if (isDemoSharing) {
          console.log('Demo sharing was ON, turning it OFF');
          await toggleDemoSharing();
        } else {
          console.log('Demo sharing was already OFF');
        }
        break;
        
      case 'next':
        if (isDemoSharing) {
          nextDemo();
        } else {
          // If not sharing, start sharing and then go to next
          await toggleDemoSharing();
          nextDemo();
        }
        break;
        
      case 'previous':
        if (isDemoSharing) {
          prevDemo();
        } else {
          // If not sharing, start sharing and then go to previous
          await toggleDemoSharing();
          prevDemo();
        }
        break;
        
      case 'show_specific':
        if (typeof demoIndex === 'number' && demoIndex >= 0 && demoIndex < demos.length) {
          if (!isDemoSharing) {
            // If not sharing, start sharing first
            await toggleDemoSharing();
          }
          // Then show the specific demo
          await shareDemo(demoIndex);
        }
        break;
        
      default:
        console.error(`Unknown demo action: ${action}`);
    }
  }, [isDemoSharing, toggleDemoSharing, nextDemo, prevDemo, shareDemo, demos.length]);
  
  // Poll for function calls from the bot
  const pollForFunctionCalls = useCallback(async () => {
    if (!voiceClient || !roomReady) {
      console.log("Skipping poll - voiceClient or roomReady not available", { 
        voiceClientExists: !!voiceClient, 
        roomReady 
      });
      return;
    }
    
    console.log("Polling for function calls...");
    
    try {
      const response = await fetch("/api/function-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "poll"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Poll response:", data);
        
        // If we got a function call, log it but don't handle it directly
        // The LLMHelper.handleFunctionCall will handle it properly
        if (data.success && data.has_function_call) {
          const functionCall = data.data;
          console.log("Received function call via polling:", functionCall);
          
          // Add a message to the chat to indicate what's happening
          setMessages(prev => [
            ...prev,
            {
              id: `system-function-poll-${Date.now()}`,
              text: `Received function call via polling: ${functionCall.function_name}`,
              sender: "bot",
              timestamp: new Date(),
              final: true,
            }
          ]);
          
          // Note: We don't need to handle the function call here anymore
          // The LLMHelper.handleFunctionCall will handle it properly
        }
      }
    } catch (e) {
      console.error("Error polling for function calls:", e);
    }
  }, [voiceClient, roomReady, setMessages]);
  
  // Start/stop polling when room is ready/not ready
  useEffect(() => {
    if (roomReady && !isPolling) {
      setIsPolling(true);
      console.log("Starting polling for function calls");
      
      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(pollForFunctionCalls, 2000);
    } else if (!roomReady && isPolling) {
      setIsPolling(false);
      console.log("Stopping polling for function calls");
      
      // Clear the interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [roomReady, isPolling, pollForFunctionCalls]);

  async function connect() {
    if (!voiceClient) return;

    try {
      setError(null);
      setIsConnecting(true);
      setRoomReady(false);
      
      // Add a welcome message
      setMessages([
        {
          id: `system-${Date.now()}`,
          text: "Connecting to the bot, please wait...",
          sender: "bot",
          timestamp: new Date(),
          final: true,
        }
      ]);
      
      // Connect to the bot
      await voiceClient.connect();
      
      // Register the LLM helper and function call handler
      console.log("Registering LLM helper and function call handler");
      const llmHelper = voiceClient.registerHelper(
        "llm",
        new LLMHelper({
          callbacks: {},
        })
      ) as LLMHelper;
      
      // Store the helper in a ref for later use
      llmHelperRef.current = llmHelper;
      
      // Register the function call handler
      llmHelper.handleFunctionCall(async (fn: FunctionCallParams) => {
        console.log("Function call received from bot:", fn);
        
        if (fn.functionName === "share_demo") {
          const args = fn.arguments as any;
          console.log("Share demo function call with args:", args);
          
          // Add a message to the chat to indicate what's happening
          setMessages(prev => [
            ...prev,
            {
              id: `system-function-${Date.now()}`,
              text: `Bot requested to ${args.action} demo sharing (demo #${args.demo_index !== undefined ? args.demo_index + 1 : '?'})`,
              sender: "bot",
              timestamp: new Date(),
              final: true,
            }
          ]);
          
          // Set the global flag to prevent infinite loops
          window.isHandlingFunctionCall = true;
          
          try {
            // Direct handling based on action type
            console.log("Directly handling function call...");
            
            if (args.action === 'start' && !isDemoSharing) {
              console.log("Directly calling toggleDemoSharing for START action");
              await toggleDemoSharing();
              
              // If a specific demo index was provided, show that demo
              if (typeof args.demo_index === 'number' && args.demo_index !== currentDemoIndex) {
                console.log(`Setting current demo to index ${args.demo_index}`);
                setCurrentDemoIndex(args.demo_index);
              }
            } else if (args.action === 'stop' && isDemoSharing) {
              console.log("Directly calling toggleDemoSharing for STOP action");
              await toggleDemoSharing();
            } else if (args.action === 'next') {
              console.log("Directly calling nextDemo");
              if (!isDemoSharing) {
                await toggleDemoSharing();
              }
              nextDemo();
            } else if (args.action === 'previous') {
              console.log("Directly calling prevDemo");
              if (!isDemoSharing) {
                await toggleDemoSharing();
              }
              prevDemo();
            } else if (args.action === 'show_specific' && typeof args.demo_index === 'number') {
              console.log(`Directly showing specific demo at index ${args.demo_index}`);
              if (!isDemoSharing) {
                await toggleDemoSharing();
              }
              setCurrentDemoIndex(args.demo_index);
            }
            
            console.log("Function call handling completed, current sharing state:", isDemoSharing);
            
            // Return a result to the bot
            return {
              success: true,
              current_state: isDemoSharing ? "sharing" : "not_sharing",
              current_demo: isDemoSharing ? currentDemoIndex : null
            };
          } finally {
            // Reset the global flag
            window.isHandlingFunctionCall = false;
          }
        }
        
        // Return null if we don't recognize the function
        return null;
      });
      
      // Add a 5-second delay to ensure the room is fully ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Now the room is ready
      setRoomReady(true);
      setIsConnecting(false);
      
      // Update the welcome message
      setMessages(prev => {
        if (prev.length > 0 && prev[0].id.startsWith('system-')) {
          return [
            {
              ...prev[0],
              text: `Connected! The bot will greet you, ${userName}.`,
            },
            ...prev.slice(1)
          ];
        }
        return prev;
      });
      
      // Send a greeting action to the bot
      await sendGreetingAction();
      
    } catch (e) {
      setError((e as RTVIError).message || "Unknown error occurred");
      voiceClient.disconnect();
      setIsConnecting(false);
      setRoomReady(false);
    }
  }

  async function disconnect() {
    if (!voiceClient) return;

    await voiceClient.disconnect();
    setMessages([]);
    setIsConnecting(false);
    setRoomReady(false);
  }

  // Render name input form
  if (showNameInput) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Enter Your Name</h2>
        <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNameInput(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              disabled={!userName.trim()}
            >
              Join Call
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Add UI elements for demo sharing controls
  const renderDemoSharingControls = () => {
    if (!roomReady) return null;
    
    return (
      <div className="demo-sharing-controls mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Demo Sharing Controls</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleDemoSharing}
            className={`px-4 py-2 ${isDemoSharing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded`}
          >
            {isDemoSharing ? 'Stop Sharing Demos' : 'Start Sharing Demos'}
          </button>
          
          {isDemoSharing && (
            <div className="demo-controls flex gap-2 ml-4">
              <button
                onClick={prevDemo}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Previous Demo
              </button>
              <button
                onClick={nextDemo}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Next Demo
              </button>
            </div>
          )}
        </div>
        
        {isDemoSharing && (
          <div className="demo-preview mt-4">
            <p className="text-sm text-gray-600 mb-1">
              Current Demo: {currentDemoIndex + 1} / {demos.length} - {demos[currentDemoIndex].name}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {demos[currentDemoIndex].description}
            </p>
            <div className="demo-image-container border border-gray-300 p-2 rounded">
              <div className="mb-2 text-xs text-gray-500">
                Image URL: {demos[currentDemoIndex].url}
              </div>
              <img 
                src={demos[currentDemoIndex].url} 
                alt={demos[currentDemoIndex].name} 
                className="max-w-full h-auto"
                onLoad={(e) => {
                  console.log(`Image loaded successfully: ${demos[currentDemoIndex].url}`);
                  const img = e.target as HTMLImageElement;
                  console.log(`Image dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
                }}
                onError={(e) => {
                  console.error(`Failed to load demo image: ${demos[currentDemoIndex].url}`);
                  // Replace the image with a fallback message
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const container = target.parentElement;
                  if (container) {
                    const fallback = document.createElement('div');
                    fallback.className = 'p-4 bg-gray-100 text-center';
                    fallback.innerHTML = `<p class="text-gray-600">Image failed to load: ${demos[currentDemoIndex].url}</p><p class="text-sm text-gray-500 mt-2">Please check that the file exists and is accessible</p>`;
                    container.appendChild(fallback);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      {error && (
        <div className="text-red-500 font-bold p-3 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => state === "disconnected" ? startNameInput() : disconnect()}
          disabled={isConnecting}
          className={`px-5 py-2 rounded-full font-medium ${
            isConnecting 
              ? "bg-gray-400 cursor-not-allowed" 
              : state === "disconnected"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-red-500 text-white hover:bg-red-600"
          } transition-colors`}
        >
          {isConnecting 
            ? "Connecting..." 
            : state === "disconnected" 
              ? "Start Conversation" 
              : "End Conversation"}
        </button>

        {/* Add test buttons for demo sharing */}
        {roomReady && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log("Manual test button clicked - Direct toggle");
                toggleDemoSharing();
              }}
              className="px-5 py-2 rounded-full font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Toggle Demo
            </button>
            
            <button
              onClick={async () => {
                console.log("Manual test button clicked - Via function call");
                try {
                  // Add a function call
                  const response = await fetch("/api/function-call", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      type: "function_call",
                      data: {
                        name: "share_demo",
                        arguments: {
                          action: "start",
                          demo_index: 0
                        }
                      }
                    }),
                  });
                  
                  if (response.ok) {
                    console.log("Manual function call added successfully");
                    // Immediately poll for it
                    pollForFunctionCalls();
                  } else {
                    console.error("Failed to add manual function call");
                  }
                } catch (e) {
                  console.error("Error adding manual function call:", e);
                }
              }}
              className="px-5 py-2 rounded-full font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            >
              Test Function Call
            </button>
          </div>
        )}

        <div className="text-sm">
          {userName && (
            <span className="mr-3 font-medium">
              User: {userName}
            </span>
          )}
          Status: <span className="font-semibold">
            {isConnecting 
              ? "connecting" 
              : roomReady && state === "ready" 
                ? "ready" 
                : state}
          </span>
          {state === "ready" && roomReady && (
            <span className="ml-2">
              {isListening ? (
                <span className="inline-flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Listening
                </span>
              ) : (
                <span className="text-gray-500">Not listening</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div 
        id="chat-container"
        className="mt-4 border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto flex flex-col gap-3 bg-gray-50"
      >
        {messages.length === 0 && state === "disconnected" && (
          <div className="text-center text-gray-500 my-auto">
            Click "Start Conversation" to begin talking with the bot
          </div>
        )}
        
        {messages.length === 0 && state === "ready" && (
          <div className="text-center text-gray-500 my-auto">
            Start speaking to interact with the bot
          </div>
        )}
        
        {messages.map((message, index) => (
          <div 
            key={`${message.id}-${index}`}
            className={`p-3 rounded-lg max-w-[80%] ${
              message.sender === "user" 
                ? "bg-blue-100 self-end" 
                : "bg-white border border-gray-200 self-start"
            } ${!message.final ? "opacity-70" : ""}`}
          >
            <div className="text-sm font-semibold mb-1">
              {message.sender === "user" ? userName || "You" : "Bot"}
              {!message.final && <span className="ml-2 text-xs text-gray-500">(typing...)</span>}
            </div>
            <div>{message.text}</div>
          </div>
        ))}
      </div>

      {state === "ready" && roomReady && (
        <div className="text-center text-sm text-gray-500">
          {isListening ? "Speak now - I'm listening" : "Waiting for bot response..."}
        </div>
      )}
      
      {state === "ready" && !roomReady && (
        <div className="text-center text-sm text-gray-500">
          Preparing the conversation...
        </div>
      )}

      {/* Add demo sharing controls */}
      {renderDemoSharingControls()}
    </div>
  );
};

export default App;
