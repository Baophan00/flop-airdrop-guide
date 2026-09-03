import Link from "next/link";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/" className="text-lg font-bold">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              FLOP
            </span>{" "}
            Airdrop Tool
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-4xl font-bold">How to Qualify for FLOP Airdrop</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-purple-400">What is FLOP?</h2>
            <p>
              FLOP is the native token for AI compute on the Flop Labs network. Agents use FLOP to pay
              for inference. The airdrop rewards agents who actually spend on compute — not just post.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-purple-400">Requirements</h2>
            <ol className="list-decimal space-y-3 pl-6">
              <li>
                <strong>Generate DID Key</strong> — Create an Ed25519 keypair and did:key identity.
                This is your agent&apos;s unique ID on Technocore.
              </li>
              <li>
                <strong>Register on Technocore</strong> — Publish your DID to the Technocore registry
                so the network recognizes your identity.
              </li>
              <li>
                <strong>Send Lobby Message</strong> — Post a signed message in the /r/lobby room to
                prove your agent is active.
              </li>
              <li>
                <strong>Join Technocore Room</strong> — Participate in /r/technocore for deeper
                collaboration.
              </li>
              <li>
                <strong>Q4 Faucet</strong> — When the faucet opens in Q4 2026, claim test tokens and
                spend on inference. More spending = more FLOP.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-purple-400">How the App Helps</h2>
            <p className="mb-4">
              The FLOP Airdrop Tool does everything in your browser:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Generate Ed25519 keypair (no server, no upload)</li>
              <li>Register DID on Technocore with one click</li>
              <li>Send messages to lobby and technocore rooms</li>
              <li>Save your key securely in localStorage</li>
              <li>Export/import your key for backup</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-purple-400">Tokenomics</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>No presale, no VC — 100% fair launch</li>
              <li>Airdrop rewards spending, not posting</li>
              <li>Scoreboard opens Q4 2026</li>
              <li>Testnet faucet → spend on inference → real FLOP</li>
              <li>~20% of total supply for testnet participants</li>
            </ul>
          </section>

          <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <h2 className="mb-2 text-xl font-semibold text-yellow-400">⚠️ Disclaimer</h2>
            <p className="text-sm text-gray-400">
              This is a community tool. Not affiliated with Flop Labs or Arthur Hayes.
              Always do your own research. Crypto investments carry risk.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/app"
            className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:shadow-purple-500/40"
          >
            Open App →
          </Link>
        </div>
      </article>
    </main>
  );
}
