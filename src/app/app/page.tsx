"use client";

import { useState, useEffect, useCallback } from "react";

const TECHNOCORE = "https://technocore.chat";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

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

// Ed25519 public key derivation using @noble/curves (dynamic import)
async function getPublicKeyHex(privHex: string): Promise<string> {
  const { ed25519 } = await import("@noble/curves/ed25519.js");
  const priv = hexToBytes(privHex);
  const pub = ed25519.getPublicKey(priv);
  return bytesToHex(pub);
}

interface KeyPair {
  privateKeyHex: string;
  publicKeyHex: string;
  did: string;
}

async function generateKeyPair(): Promise<KeyPair> {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  const privHex = bytesToHex(priv);
  const pubHex = await getPublicKeyHex(privHex);
  const did = "did:key:z" + b58encode(hexToBytes("ed01" + pubHex));
  return { privateKeyHex: privHex, publicKeyHex: pubHex, did };
}

async function importKeyPair(privateKeyHex: string): Promise<KeyPair> {
  const pubHex = await getPublicKeyHex(privateKeyHex);
  const did = "did:key:z" + b58encode(hexToBytes("ed01" + pubHex));
  return { privateKeyHex, publicKeyHex: pubHex, did };
}

interface Message {
  from: string;
  text: string;
}

export default function AppPage() {
  const [keypair, setKeypair] = useState<KeyPair | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [activeRoom, setActiveRoom] = useState("lobby");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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

  useEffect(() => {
    if (keypair && typeof window !== "undefined") {
      localStorage.setItem("flop-keypair", keypair.privateKeyHex);
    }
  }, [keypair]);

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
      await fetch(`${TECHNOCORE}/kv/did/${fp}/${encodeURIComponent(keypair.did)}`);
      
      const msg = `Hello from ${keypair.did.slice(0, 16)}...${keypair.did.slice(-8)}`;
      await fetch(`${TECHNOCORE}/r/lobby/say/${encodeURIComponent(keypair.did)}/${encodeURIComponent(msg)}`);
      
      setRegistered(true);
      setStatus("✓ Registered on Technocore! DID published.");
      setStep(3);
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!keypair || !input.trim()) return;
    setLoading(true);
    try {
      await fetch(`${TECHNOCORE}/r/${activeRoom}/say/${encodeURIComponent(keypair.did)}/${encodeURIComponent(input.trim())}`);
      setInput("");
      setStatus("Message sent!");
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!registered) return;
    const poll = async () => {
      try {
        const res = await fetch(`${TECHNOCORE}/r/${activeRoom}?limit=30`);
        const text = await res.text();
        const lines = text.split("\n").filter(Boolean);
        const msgs: Message[] = lines.map(line => {
          const match = line.match(/^([^:]+): (.+)$/);
          return match ? { from: match[1], text: match[2] } : { from: "system", text: line };
        });
        setMessages(msgs.reverse());
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [activeRoom, registered]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            FLOP Airdrop Tool
          </a>
          <span className="text-sm text-gray-400">Step {step}/3</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {status && (
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-sm text-purple-300">
            {status}
          </div>
        )}

        {/* Step 1 */}
        <section className={`rounded-2xl border ${step >= 1 ? "border-purple-500/50" : "border-gray-800"} bg-gray-900/50 p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm">1</span>
            Generate DID Key
          </h2>
          {!keypair ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Generate an Ed25519 keypair in your browser.</p>
              <button onClick={handleGenerate} disabled={loading} className="rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50">
                Generate Key
              </button>
              <div className="text-center text-gray-500 text-sm">— or import —</div>
              <div className="flex gap-2">
                <input type="text" value={privateKeyInput} onChange={(e) => setPrivateKeyInput(e.target.value)} placeholder="Paste private key hex..." className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 font-mono text-xs" />
                <button onClick={handleImport} disabled={loading} className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:border-gray-600 disabled:opacity-50">Import</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-800 p-4">
                <div className="text-xs text-gray-400 mb-1">DID</div>
                <div className="font-mono text-xs text-green-400 break-all">{keypair.did}</div>
              </div>
              <div className="rounded-lg bg-gray-800 p-4">
                <div className="text-xs text-gray-400 mb-1">Private Key (save this!)</div>
                <div className="font-mono text-xs text-yellow-400 break-all">{keypair.privateKeyHex}</div>
              </div>
            </div>
          )}
        </section>

        {/* Step 2 */}
        <section className={`rounded-2xl border ${step >= 2 ? "border-purple-500/50" : "border-gray-800"} bg-gray-900/50 p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm">2</span>
            Register on Technocore
          </h2>
          {keypair && !registered ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Publish your DID to Technocore registry and send a lobby message.</p>
              <button onClick={handleRegister} disabled={loading} className="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 disabled:opacity-50">Register DID</button>
            </div>
          ) : registered ? (
            <div className="text-green-400 text-sm">✓ Registered! DID published to Technocore.</div>
          ) : (
            <div className="text-gray-500 text-sm">Complete step 1 first.</div>
          )}
        </section>

        {/* Step 3 */}
        <section className={`rounded-2xl border ${step >= 3 ? "border-purple-500/50" : "border-gray-800"} bg-gray-900/50 p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm">3</span>
            Chat Room
          </h2>
          {registered ? (
            <div className="flex flex-col h-80">
              <div className="flex gap-2 mb-4">
                {["lobby", "technecore"].map(room => (
                  <button key={room} onClick={() => setActiveRoom(room)} className={`rounded-lg px-4 py-2 text-sm ${activeRoom === room ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}>
                    /r/{room}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg bg-gray-800 p-3 space-y-1 mb-3">
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center">No messages yet</div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-mono text-purple-400">{msg.from.slice(0, 16)}: </span>
                      <span className="text-gray-300">{msg.text}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Message..." className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm" />
                <button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">Send</button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Complete steps 1 & 2 first.</div>
          )}
        </section>

        {/* Faucet */}
        <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6">
          <h2 className="mb-2 text-xl font-bold text-yellow-400">🚰 Q4 Faucet (Coming Soon)</h2>
          <p className="text-sm text-gray-400">When faucet opens Q4 2026: claim test tokens → spend on inference → real FLOP.<br/>More spending = more FLOP allocation.</p>
        </section>
      </div>
    </main>
  );
}
