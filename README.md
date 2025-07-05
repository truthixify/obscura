# Obscura 🕵️ – Shielded Pool on Starknet

**Obscura** is a privacy-focused shielded pool for Starknet, enabling private deposits, transfers, and withdrawals using zero-knowledge proofs and a UTXO-based model.

> It looks like magic, right?
> It’s not magic — it’s just math and UTXOs. 🧠

---

## ⚙️ How It Works

* 💰 Shielded deposits & withdrawals
* 🔐 Encrypted shielded transfers
* 🌳 Merkle tree for commitments
* 📟 Nullifiers to prevent double-spends
* 🔎 ZK proofs verified on-chain (Honk + Noir)

---

## 🐂️ Project Structure

```
contracts/obscura       # Core Cairo contracts (shielded pool logic)
contracts/obscura       # Verifier Cairo contracts (Garaga generated contract)
circuit/                 # Noir circuit
app/                    # Frontend UI (React + Vite)
```

---

## 🧪 Run Locally

```bash
yarn install             # Install deps
yarn chain               # Start Starknet devnet
make declare-verifier
make declare-contract
yarn test:e2e            # Run full test suite
```

Configure `.env` from `.env.example`.

---

## 🔗 Links
- 🧑‍💻 Code: [github.com/truthixify/obscura](github.com/truthixify/obscura)
- 🌐 App: [https://obscura-app.vercel.app](https://obscura-app.vercel.app)
- 📹 Demo: [https://www.youtube.com/watch?v=vVEz_tNnDgM](https://www.youtube.com/watch?v=vVEz_tNnDgM)

---

## 🪪 License

MIT
