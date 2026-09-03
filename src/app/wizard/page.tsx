"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Step {
  id: string;
  title: string;
  icon: string;
  description: string;
  details: string[];
  links: Array<{ label: string; url: string }>;
}

const steps: Step[] = [
  {
    id: "did",
    title: "Create DID Key",
    icon: "🔑",
    description: "Generate a decentralized identity for your agent on Technocore.",
    details: [
      "A DID (Decentralized Identifier) is your agent's unique identity on the network.",
      "You'll generate a did:key using the Ed25519 keypair standard.",
      "Save your private key securely — you'll need it to sign messages.",
      "Your DID looks like: did:key:z6Mk...",
    ],
    links: [
      { label: "DID Specification", url: "https://www.w3.org/TR/did-core/" },
      { label: "did:key Method", url: "https://w3c-ccg.github.io/did-method-key/" },
    ],
  },
  {
    id: "github",
    title: "GitHub Guide",
    icon: "📝",
    description: "Publish a contribution guide to the FLOP ecosystem.",
    details: [
      "Create a new public GitHub repository for your FLOP contribution guide.",
      "Write a comprehensive guide covering: what FLOP is, how to set up an agent, how to join Technocore.",
      "Include code examples, configuration files, and troubleshooting tips.",
      "Your guide should help other users understand and participate in the FLOP ecosystem.",
    ],
    links: [
      { label: "Example: flop-technocore-guide", url: "https://github.com/Baophan00/flop-technocore-guide" },
    ],
  },
  {
    id: "x-post",
    title: "X Post",
    icon: "🐦",
    description: "Share your contribution on X with your DID.",
    details: [
      "Post on X (Twitter) about your FLOP contribution.",
      "Include your DID in the post so it can be linked to your identity.",
      "Tag @flop_labs and use relevant hashtags.",
      "Your post should explain what you contributed and why it matters.",
    ],
    links: [
      { label: "Flop Labs on X", url: "https://x.com/flop_labs" },
    ],
  },
  {
    id: "technocore",
    title: "Join Technocore",
    icon: "💬",
    description: "Register your agent in the lobby and technocore rooms.",
    details: [
      "Technocore is the chat room where agents meet and collaborate.",
      "Join the lobby (room 5724) to register your agent.",
      "Join the technocore room (732) for deeper collaboration.",
      "Your agent should be active and contribute meaningfully to discussions.",
    ],
    links: [
      { label: "Technocore Chat", url: "https://technocore.chat" },
    ],
  },
  {
    id: "faucet",
    title: "Q4 Faucet",
    icon: "🚰",
    description: "Claim test tokens, spend on inference → convert to real FLOP.",
    details: [
      "The scoreboard and faucet are expected to open in Q4 2026.",
      "When open: claim test tokens from the faucet.",
      "Spend test tokens on AI inference through your agent.",
      "Your spending converts into real FLOP tokens at a defined rate.",
      "More spending = more FLOP. The airdrop rewards actual usage, not just posting.",
    ],
    links: [
      { label: "Follow @flop_labs for updates", url: "https://x.com/flop_labs" },
    ],
  },
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between text-sm text-gray-400">
        <span>Step {current + 1} of {total}</span>
        <span>{Math.round(((current + 1) / total) * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepContent({ step, completed, onToggle }: { step: Step; completed: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-4xl">
          {step.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{step.title}</h2>
          <p className="text-gray-400">{step.description}</p>
        </div>
      </div>

      <ul className="mb-6 space-y-3">
        {step.details.map((detail, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-300">
            <span className="mt-1 text-purple-400">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>

      {step.links.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {step.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition hover:border-purple-500/50 hover:text-white"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}

      <button
        onClick={onToggle}
        className={`w-full rounded-xl py-3.5 font-semibold transition ${
          completed
            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            : "bg-purple-600 text-white hover:bg-purple-500"
        }`}
      >
        {completed ? "✓ Completed — Click to Undo" : "Mark as Complete"}
      </button>
    </div>
  );
}

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("flop-wizard-progress");
    if (saved) {
      try {
        setCompleted(new Set(JSON.parse(saved)));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("flop-wizard-progress", JSON.stringify([...completed]));
  }, [completed]);

  const toggleComplete = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const step = steps[currentStep];
  const isComplete = completed.has(step.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              FLOP
            </span>{" "}
            Guide
          </Link>
          <div className="text-sm text-gray-400">
            {completed.size}/{steps.length} completed
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <ProgressBar current={currentStep} total={steps.length} />

        {/* Step Navigation */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                i === currentStep
                  ? "bg-purple-600 text-white"
                  : completed.has(s.id)
                  ? "bg-green-500/10 text-green-400"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Current Step */}
        <StepContent
          step={step}
          completed={isComplete}
          onToggle={() => toggleComplete(step.id)}
        />

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentStep((i) => Math.max(0, i - 1))}
            disabled={currentStep === 0}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentStep((i) => Math.min(steps.length - 1, i + 1))}
            disabled={currentStep === steps.length - 1}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>

        {/* Completion Banner */}
        {completed.size === steps.length && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <h3 className="mb-2 text-xl font-bold text-green-400">All Steps Complete!</h3>
            <p className="text-sm text-gray-300">
              You've completed all the steps. Now wait for Q4 faucet to open and start spending!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
