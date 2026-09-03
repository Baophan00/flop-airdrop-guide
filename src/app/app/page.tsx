"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const TECHNOCORE = "https://technocore.chat";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

interface PendingMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  status: "sending" | "sent" | "error";
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

function b58encode(bytes: Uint8Array): string {
  let n = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    n = (n << BigInt(8)) | BigInt(bytes[i]);
  }
  const res: string[] = [];
  while (n > BigInt(0)) {
    const r = Number(n % BigInt(58));
    n = n / BigInt(58);
    res.push(B58[r]);
  }
  let leading = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) leading++;
    else break;
  }
  return "1".repeat(leading) + res.reverse().join("");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getPublicKeyHex(privHex: string): Promise<string> {
  const { ed25519 } = await import("@noble/curves/ed25519.js");
  const priv = hexToBytes(privHex);
  const pub = ed25519.getPublicKey(priv);
  return bytesToHex(pub);
}

async function generateKeyPair() {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  const privHex = bytesToHex(priv);
  const pubHex = await getPublicKeyHex(privHex);
  const did = "did:key:z" + b58encode(hexToBytes("ed01" + pubHex));
  return { privateKeyHex: privHex, publicKeyHex: pubHex, did };
}

async function importKeyPair(privateKeyHex: string) {
  const pubHex = await getPublicKeyHex(privateKeyHex);
  const did = "did:key:z" + b58encode(hexToBytes("ed01" + pubHex));
  return { privateKeyHex, publicKeyHex: pubHex, did };
}

const QUICK_REPLIES = [
  "Hi! I'm new here 👋",
  "What's FLOP?",
  "How do I qualify for the airdrop?",
  "Looking for collab!",
  "gm",
  "What is tclk/1?",
];

const ROOM_INFO: Record<string, { desc: string; purpose: string }> = {
  lobby: { desc: "General introduction room", purpose: "Introduce yourself to the network" },
  technecore: { desc: "Core discussions", purpose: "Deep collaboration and governance" },
  faq: { desc: "Questions & answers", purpose: "Get help from the community" },
};

export default function AppPage() {
  const [keypair, setKeypair] = useState<{ privateKeyHex: string; publicKeyHex: string; did: string } | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [activeRoom, setActiveRoom] = useState("lobby");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [autoPing, setAutoPing] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [lastActivity, setLastActivity] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved key
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("flop-keypair");
    if (saved) {
      importKeyPair(saved).then((kp) => {
        setKeypair(kp);
        setPrivateKeyInput(saved);
        setStep(2);
      });
    }
  }, []);

  // Save key
  useEffect(() => {
    if (keypair && typeof window !== "undefined") {
      localStorage.setItem("flop-keypair", keypair.privateKeyHex);
    }
  }, [keypair]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

  // Connection status
  useEffect(() => {
    if (!registered) return;
    const checkConnection = async () => {
      try {
        const res = await fetch(`${TECHNOCORE}/r/${activeRoom}?limit=1`);
        setIsConnected(res.ok);
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [activeRoom, registered]);

  // Auto-ping heartbeat
  useEffect(() => {
    if (autoPing && registered && keypair) {
      pingIntervalRef.current = setInterval(async () => {
        const ts = Date.now();
        const msg = `heartbeat:${Math.floor(ts / 1000)}`;
        try {
          const fp = (await sha256Hex(keypair.did)).slice(0, 16);
          await fetch(`${TECHNOCORE}/r/${activeRoom}/say/${fp}/${encodeURIComponent(msg)}`);
          setLastActivity(ts);
        } catch { /* ignore */ }
      }, 60000);
    }
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [autoPing, registered, keypair, activeRoom]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setStatus("Generating keypair...");
    try {
      const kp = await generateKeyPair();
      setKeypair(kp);
      setPrivateKeyInput(kp.privateKeyHex);
      setStatus("✓ Keypair generated! Save your private key.");
      setStep(2);
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!privateKeyInput) return;
    setLoading(true);
    try {
      const kp = await importKeyPair(privateKeyInput.trim());
      setKeypair(kp);
      setStatus("✓ Keypair loaded!");
      setStep(2);
    } catch {
      setStatus("Invalid private key");
    } finally {
      setLoading(false);
    }
  }, [privateKeyInput]);

  const handleRegister = async () => {
    if (!keypair) return;
    setLoading(true);
    setStatus("Registering DID on Technocore...");
    try {
      const fp = (await sha256Hex(keypair.did)).slice(0, 16);
      await fetch(`${TECHNOCORE}/kv/flop/${fp}/set/${keypair.did}`);

      const intro = `Hi! I'm ${keypair.did.slice(0, 20)}...${keypair.did.slice(-8)}`;
      await fetch(`${TECHNOCORE}/r/lobby/say/${fp}/${encodeURIComponent(intro)}`);

      setRegistered(true);
      setStatus("✓ Registered on Technocore! DID published.");
      setStep(3);
      setLastActivity(Date.now());
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    if (!keypair) return;
    const msgText = (text || input).trim();
    if (!msgText) return;

    const id = Math.random().toString(36).slice(2, 10);
    const fp = (await sha256Hex(keypair.did)).slice(0, 16);
    const pending: PendingMessage = {
      id,
      from: fp,
      text: msgText,
      timestamp: Date.now(),
      status: "sending",
    };
    setPendingMessages((prev) => [...prev, pending]);
    setInput("");
    setLoading(true);

    try {
      const fp = (await sha256Hex(keypair.did)).slice(0, 16);
      await fetch(`${TECHNOCORE}/r/${activeRoom}/say/${fp}/${encodeURIComponent(msgText)}`);
      setPendingMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sent" } : m)));
      setLastActivity(Date.now());
      setTimeout(() => setPendingMessages((prev) => prev.filter((m) => m.id !== id)), 2000);
    } catch (err) {
      setPendingMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "error" } : m)));
      setStatus(`Error sending: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportKey = () => {
    if (!keypair) return;
    const data = JSON.stringify(keypair, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flop-keypair-${keypair.did.slice(-8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Key exported!");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.privateKeyHex) {
          const kp = await importKeyPair(data.privateKeyHex);
          setKeypair(kp);
          setStatus("✓ Key imported from file!");
          setStep(2);
        }
      } catch {
        setStatus("Invalid key file");
      }
    };
    reader.readAsText(file);
  };

  const verifyMessage = async (msg: ChatMessage) => {
    try {
      const res = await fetch(`${TECHNOCORE}/r/${activeRoom}?limit=50`);
      const text = await res.text();
      const found = text.includes(msg.text.slice(0, 30));
      setStatus(found ? "✓ Message verified on Technocore" : "Message not found (may have expired)");
    } catch {
      setStatus("Cannot verify — connection error");
    }
  };

  // Poll messages
  useEffect(() => {
    if (!registered || !keypair) return;
    const poll = async () => {
      try {
        const res = await fetch(`${TECHNOCORE}/r/${activeRoom}?limit=50`);
        const text = await res.text();
        const lines = text.split("\n").filter(Boolean);
        const fp = (await sha256Hex(keypair.did)).slice(0, 16);
        const msgs: ChatMessage[] = lines
          .map((line) => {
            const match = line.match(/^([^:]+): (.+)$/);
            if (match) {
              const from = match[1];
              return {
                id: btoa(line).slice(0, 12),
                from,
                text: match[2],
                timestamp: Date.now() - Math.random() * 60000,
                isOwn: from === fp,
              } as ChatMessage;
            }
            return null;
          })
          .filter(Boolean) as ChatMessage[];
        setMessages(msgs.reverse());
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [activeRoom, registered, keypair]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            FLOP Airdrop Tool
          </a>
          <div className="flex items-center gap-3">
            {registered && (
              <span className={`flex items-center gap-1.5 text-xs ${isConnected ? "text-green-400" : "text-red-400"}`}>
                <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
                {isConnected ? "Connected" : "Offline"}
              </span>
            )}
            <span className="text-sm text-gray-400">Step {step}/3</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        {status && (
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-sm text-purple-300 flex items-center justify-between">
            <span>{status}</span>
            <button onClick={() => setStatus("")} className="text-gray-500 hover:text-white">✕</button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Key Management */}
          <div className="lg:col-span-1 space-y-4">
            {/* Step 1 */}
            <section className={`rounded-xl border ${step >= 1 ? "border-purple-500/50" : "border-gray-800"} bg-gray-900/50 p-5`}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs">1</span>
                DID Key
              </h2>
              {!keypair ? (
                <div className="space-y-3">
                  <button onClick={handleGenerate} disabled={loading} className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
                    Generate Key
                  </button>
                  <div className="text-center text-xs text-gray-500">— or —</div>
                  <input type="text" value={privateKeyInput} onChange={(e) => setPrivateKeyInput(e.target.value)} placeholder="Paste private key hex..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-xs" />
                  <div className="flex gap-2">
                    <button onClick={handleImport} disabled={loading} className="flex-1 rounded-lg border border-gray-700 py-2 text-xs hover:border-gray-600">Import Hex</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-lg border border-gray-700 py-2 text-xs hover:border-gray-600">Import File</button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-800 p-3">
                    <div className="text-xs text-gray-400 mb-1">DID</div>
                    <div className="font-mono text-xs text-green-400 break-all select-all">{keypair.did}</div>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-3">
                    <div className="text-xs text-gray-400 mb-1">Private Key</div>
                    <div className="font-mono text-xs text-yellow-400 break-all select-all">{keypair.privateKeyHex}</div>
                  </div>
                  <button onClick={handleExportKey} className="w-full rounded-lg border border-gray-700 py-2 text-xs hover:border-gray-600">
                    ⬇️ Export Key File
                  </button>
                </div>
              )}
            </section>

            {/* Step 2 */}
            <section className={`rounded-xl border ${step >= 2 ? "border-purple-500/50" : "border-gray-800"} bg-gray-900/50 p-5`}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs">2</span>
                Register
              </h2>
              {keypair && !registered ? (
                <button onClick={handleRegister} disabled={loading} className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold hover:bg-green-500 disabled:opacity-50">
                  Register DID
                </button>
              ) : registered ? (
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-xs text-green-400">
                  ✓ Registered! DID published to Technocore.<br />
                  <span className="text-gray-400">Intro message sent to /r/lobby</span>
                </div>
              ) : (
                <div className="text-gray-500 text-xs">Complete step 1 first.</div>
              )}
            </section>

            {/* Quick Stats */}
            {registered && keypair && (
              <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-300">Activity</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Messages</span>
                    <span className="text-white">{messages.filter((m) => m.isOwn).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Active</span>
                    <span className="text-white">{lastActivity ? new Date(lastActivity).toLocaleTimeString() : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-ping</span>
                    <button onClick={() => setAutoPing(!autoPing)} className={`rounded px-2 py-0.5 text-xs ${autoPing ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"}`}>
                      {autoPing ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right: Chat Room */}
          <div className="lg:col-span-2">
            <section className={`rounded-xl border ${step >= 3 ? "border-purple-500/50" : "border-gray-800"} bg-gray-900/50 overflow-hidden`}>
              <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">💬 Chat Room</h2>
                  {registered && (
                    <span className={`text-xs px-2 py-1 rounded ${isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {isConnected ? "● Live" : "○ Offline"}
                    </span>
                  )}
                </div>
                {registered && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {Object.entries(ROOM_INFO).map(([room, info]) => (
                      <button key={room} onClick={() => setActiveRoom(room)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition ${
                        activeRoom === room ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}>
                        /r/{room}
                      </button>
                    ))}
                  </div>
                )}
                {registered && activeRoom && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="text-gray-400">{ROOM_INFO[activeRoom]?.desc}</span> — {ROOM_INFO[activeRoom]?.purpose}
                  </div>
                )}
              </div>

              {!registered ? (
                <div className="flex h-96 items-center justify-center text-gray-500 text-sm">
                  Register DID to access chat rooms
                </div>
              ) : (
                <>
                  <div className="h-96 overflow-y-auto p-4 space-y-2 bg-gray-950/50" id="chat-scroll">
                    {messages.length === 0 && pendingMessages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-gray-600 text-sm">
                        No messages yet. Say hello! 👋
                      </div>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                              msg.isOwn ? "bg-purple-600/80 text-white" : "bg-gray-800 text-gray-200"
                            }`}>
                              <div className="text-xs opacity-60 mb-0.5 font-mono">
                                {msg.from.slice(0, 12)}...
                              </div>
                              <div>{msg.text}</div>
                              {msg.isOwn && (
                                <button onClick={() => verifyMessage(msg)} className="mt-1 text-xs opacity-50 hover:opacity-100">🔍 verify</button>
                              )}
                            </div>
                          </div>
                        ))}
                        {pendingMessages.map((msg) => (
                          <div key={msg.id} className="flex justify-end">
                            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm bg-purple-600/40 text-white border border-purple-500/30`}>
                              <div className="text-xs opacity-60 mb-0.5 font-mono">{msg.from.slice(0, 12)}...</div>
                              <div>{msg.text}</div>
                              <div className="mt-1 text-xs opacity-60">
                                {msg.status === "sending" && "⏳ sending..."}
                                {msg.status === "sent" && "✓ sent"}
                                {msg.status === "error" && "✗ failed"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Replies */}
                  {showQuickReplies && (
                    <div className="border-t border-gray-800 p-2 flex gap-1.5 overflow-x-auto bg-gray-900/50">
                      {QUICK_REPLIES.map((reply) => (
                        <button key={reply} onClick={() => handleSend(reply)} className="shrink-0 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700">
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <div className="border-t border-gray-800 p-3">
                    <div className="flex gap-2">
                      <button onClick={() => setShowQuickReplies(!showQuickReplies)} className={`rounded-lg px-3 py-2 text-sm ${showQuickReplies ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}>
                        ⚡
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                          placeholder="Type a message..."
                          maxLength={500}
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 pr-12 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">{input.length}/500</span>
                      </div>
                      <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        {/* Faucet */}
        <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-yellow-400">🚰 Q4 Faucet (Coming Soon)</h2>
              <p className="text-sm text-gray-400 mt-1">Claim test tokens → spend on inference → real FLOP. More spending = more FLOP allocation.</p>
            </div>
            <div className="text-4xl">🔜</div>
          </div>
        </section>
      </div>
    </main>
  );
}
