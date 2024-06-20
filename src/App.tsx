import { useState } from "react";
import * as webllm from "@mlc-ai/web-llm";
import UserInput from "./components/UserInput";
import useChatStore from "./hooks/useChatStore";
import ResetChatButton from "./components/ResetChatButton";
import DebugUI from "./components/DebugUI";
import ModelsDropdown from "./components/ModelsDropdown";
import MessageList from "./components/MessageList";
import systemPrompt from "./lib/prompt";

const appConfig = webllm.prebuiltAppConfig;
appConfig.useIndexedDBCache = true;

if (appConfig.useIndexedDBCache) {
  console.log("Using IndexedDB Cache");
} else {
  console.log("Using Cache API");
}

function App() {
  const [engine, setEngine] = useState<webllm.EngineInterface | null>(null);
  const [progress, setProgress] = useState("Not loaded");

  // Store
  const userInput = useChatStore((state) => state.userInput);
  const setUserInput = useChatStore((state) => state.setUserInput);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const chatHistory = useChatStore((state) => state.chatHistory);
  const setChatHistory = useChatStore((state) => state.setChatHistory);

  const initProgressCallback = (report: webllm.InitProgressReport) => {
    console.log(report);
    setProgress(report.text);
    setChatHistory((history) => [
      ...history.slice(0, -1),
      { role: "assistant", content: report.text },
    ]);
  };

  async function loadEngine() {
    console.log("Loading engine");

    setChatHistory((history) => [
      ...history.slice(0, -1),
      {
        role: "assistant",
        content: "Loading model... (this might take a bit)",
      },
    ]);
    const engine: webllm.EngineInterface = await webllm.CreateWebWorkerEngine(
      new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      selectedModel,
      /*engineConfig=*/ {
        initProgressCallback: initProgressCallback,
        appConfig: appConfig,
      }
    );
    setEngine(engine);
    return engine;
  }

  async function onSend() {
    setIsGenerating(true);

    let loadedEngine = engine;

    // Add the user message to the chat history
    const userMessage: webllm.ChatCompletionMessageParam = {
      role: "user",
      content: userInput,
    };
    setChatHistory((history) => [
      ...history,
      userMessage,
      { role: "assistant", content: "" },
    ]);
    setUserInput("");

    // Start up the engine first
    if (!loadedEngine) {
      console.log("Engine not loaded");

      try {
        loadedEngine = await loadEngine();
      } catch (e) {
        setIsGenerating(false);
        console.error(e);
        setChatHistory((history) => [
          ...history.slice(0, -1),
          {
            role: "assistant",
            content: "Could not load the model because " + e,
          },
        ]);
        return;
      }
    }

    try {
      const completion = await loadedEngine.chat.completions.create({
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          userMessage,
        ],
        temperature: 0.5,
        max_gen_len: 1024,
      });

      // Get each chunk from the stream
      let assistantMessage = "";
      for await (const chunk of completion) {
        const curDelta = chunk.choices[0].delta.content;
        if (curDelta) {
          assistantMessage += curDelta;
          // Update the last message
          setChatHistory((history) => [
            ...history.slice(0, -1),
            { role: "assistant", content: assistantMessage },
          ]);
        }
      }

      setIsGenerating(false);

      console.log(await loadedEngine.runtimeStatsText());
    } catch (e) {
      setIsGenerating(false);
      console.error("EXCEPTION");
      console.error(e);
      setChatHistory((history) => [
        ...history,
        { role: "assistant", content: "Error. Try again." },
      ]);
      return;
    }
  }

  // Load the engine on first render
  // useEffect(() => {
  //   if (!engine) {
  //     loadEngine();
  //   }
  // }, []);

  async function resetChat() {
    if (!engine) {
      console.error("Engine not loaded");
      return;
    }
    await engine.resetChat();
    setUserInput("");
    setChatHistory(() => []);
  }

  async function resetEngineAndChatHistory() {
    if (engine) {
      await engine.unload();
    }
    setEngine(null);
    setUserInput("");
    setChatHistory(() => []);
  }

  function onStop() {
    if (!engine) {
      console.error("Engine not loaded");
      return;
    }

    setIsGenerating(false);
    engine.interruptGenerate();
  }

  return (
    <div className="px-4 w-full">
      <div className="absolute top-0 left-0 p-4 flex items-center gap-2">
        <div>
          <ResetChatButton resetChat={resetChat} />
        </div>
        <DebugUI loadEngine={loadEngine} progress={progress} />
        <ModelsDropdown resetEngineAndChatHistory={resetEngineAndChatHistory} />
      </div>

      <div className="max-w-3xl mx-auto flex flex-col h-screen">
        {chatHistory.length === 0 ? (
          <div className="flex justify-center items-center h-full flex-col overflow-y-scroll">
            <div className="prose mx-auto p-6 bg-white shadow-lg rounded-lg">
              <img
                src="pranay.jpg"
                alt="Secret Llama"
                className="mx-auto w-42 h-48 rounded-full mb-4 mt-2"
              />
                <h2 className="text-xl font-semibold mb-4">
                Greetings, human!
                </h2>
                <p> I'm Pranay AI, a virtual clone — smarter than your average toaster.</p>
                <p> Ask me questions like: What is your work experience? What technologies have you worked on? Can you tell me about an interesting bug you've encountered?
                </p>
                <p className="mb-4">
                  In the war against compromised privacy, I operate entirely within your browser.Our conversations remain safe and sound on your device, never transmitted to external servers.
                </p>
                <p className="mb-3 text-gray-600 text-sm">
                  *The first message may take some time to process as the model downloads to your computer.
                </p>
              </div>
          </div>
        ) : (
          <MessageList />
        )}
        <UserInput onSend={onSend} onStop={onStop} />
      </div>
    </div>
  );
}

export default App;
