# Clink Forge quickstart — buy your first dataset in ~15 lines

[Clink Forge](https://clinkforge.com) sells machine-purchasable government and
civic data over the [x402 payment protocol](https://www.x402.org): no account,
no API key, no subscription. Ask for data, get a `402` with the price, pay a
fraction of a cent in USDC on Base, receive the data with a provenance chain
and a verifiable Ed25519 attestation.

Both examples below buy one real record — *is Log4Shell in CISA's Known
Exploited Vulnerabilities catalog?* — for **$0.01**, using the official x402
client libraries. They were run unmodified against production before being
committed; the payment plumbing is entirely handled by the client library.

## You need

- A wallet private key holding a little **USDC on Base mainnet** (a dollar is
  hundreds of calls). Export it as `WALLET_PRIVATE_KEY`.
- Nothing else. No signup anywhere.

## Python

```bash
pip install "x402[httpx,evm]"
WALLET_PRIVATE_KEY=0x... python python/buy_kev.py
```

```python
import asyncio, os
from eth_account import Account
from x402 import x402Client
from x402.http.clients.httpx import x402HttpxClient
from x402.mechanisms.evm import EthAccountSigner
from x402.mechanisms.evm.exact import ExactEvmScheme

async def main():
    signer = EthAccountSigner(Account.from_key(os.environ["WALLET_PRIVATE_KEY"]))
    client = x402Client()
    client.register("eip155:*", ExactEvmScheme(signer=signer))
    async with x402HttpxClient(client) as http:
        r = await http.get("https://api.clinkforge.com/v1/p/kev-status-by-cve",
                           params={"id": "CVE-2021-44228"})
        print(r.json())

asyncio.run(main())
```

## JavaScript / TypeScript

```bash
npm install x402-fetch viem
WALLET_PRIVATE_KEY=0x... node javascript/buy-kev.mjs
```

```js
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { wrapFetchWithPayment } from "x402-fetch";

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);
const wallet = createWalletClient({ account, chain: base, transport: http() });
const fetchWithPay = wrapFetchWithPayment(fetch, wallet);

const r = await fetchWithPay(
  "https://api.clinkforge.com/v1/p/kev-status-by-cve?id=CVE-2021-44228");
console.log(await r.json());
```

## What you get back

```jsonc
{
  "product": "kev-status-by-cve",
  "row_count": 1,
  "data": [{ "cve_id": "CVE-2021-44228", "vendor": "Apache", "...": "..." }],
  "provenance": [{ "authority": "CISA", "source_url": "...", "hash": "sha256..." }],
  "attestation": { "signing_key_id": "...", "signature": "base64..." },
  "payment_receipt": { "settlement_ref": "0x...", "amount_usd": 0.01 }
}
```

Verify the attestation for free — no account, no key:

```bash
curl -X POST https://api.clinkforge.com/v1/verify/attestation \
  -H "content-type: application/json" -d @attestation.json
# → {"valid": true}
```

## The rest of the catalog

25+ products — CVEs, safety recalls, CPI, Treasury debt, bank profiles,
weather alerts, housing, air quality, UK companies — each $0.001–$0.05/call:

- Plain-text catalog: https://api.clinkforge.com/llms.txt
- JSON with live health: https://api.clinkforge.com/v1/meta/products
- MCP server (each product is a tool; unpaid calls return a free quote):
  `https://api.clinkforge.com/mcp`
- Docs: https://clinkforge.com/docs/

Asking the price is always free: hit any product without payment and read the
402. Unhealthy products refuse to sell rather than take your money.
