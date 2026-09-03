import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Airdrop Live — Q4 Faucet Coming
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              FLOP
            </span>{" "}
            Airdrop Tool
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Generate DID, register on Technocore, chat, and claim faucet — all in one web app.
            No CLI needed. No code required. Just click.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/app"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:shadow-purple-500/40"
            >
              Open App →
            </Link>
            <Link
              href="/guide"
              className="rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-3.5 font-semibold text-gray-300 transition hover:border-gray-600 hover:text-white"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Everything You Need</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 text-3xl">🔑</div>
            <h3 className="mb-2 text-lg font-semibold">Generate DID Key</h3>
            <p className="text-sm text-gray-400">
              Create Ed25519 keypair and did:key identity in your browser. No server. No upload.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 text-3xl">💬</div>
            <h3 className="mb-2 text-lg font-semibold">Chat Room</h3>
            <p className="text-sm text-gray-400">
              Send messages to Technocore rooms (lobby + technocore) with your DID.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 text-3xl">🚰</div>
            <h3 className="mb-2 text-lg font-semibold">Claim Faucet</h3>
            <p className="text-sm text-gray-400">
              When Q4 faucet opens, claim test tokens and spend on inference → convert to real FLOP.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready?</h2>
        <p className="mb-8 text-gray-400">
          Open the app and complete all steps. Save your key — you'll need it later.
        </p>
        <Link
          href="/app"
          className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:shadow-purple-500/40"
        >
          Start Now →
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>Not affiliated with Flop Labs. Community tool for FLOP airdrop.</p>
      </footer>
    </main>
  );
}
