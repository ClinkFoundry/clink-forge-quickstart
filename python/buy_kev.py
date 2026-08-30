"""Buy one record from Clink Forge with the official x402 Python SDK.

    pip install "x402[httpx,evm]"
    WALLET_PRIVATE_KEY=0x... python buy_kev.py

Costs $0.01 in USDC on Base. The 402 handshake, EIP-3009 signing, and retry
are all handled by the SDK — this file is just an HTTP GET.
"""
import asyncio
import json
import os

from eth_account import Account
from x402 import x402Client
from x402.http.clients.httpx import x402HttpxClient
from x402.mechanisms.evm import EthAccountSigner
from x402.mechanisms.evm.exact import ExactEvmScheme

URL = "https://api.clinkforge.com/v1/p/kev-status-by-cve"


async def main() -> None:
    signer = EthAccountSigner(Account.from_key(os.environ["WALLET_PRIVATE_KEY"]))
    client = x402Client()
    client.register("eip155:*", ExactEvmScheme(signer=signer))

    async with x402HttpxClient(client) as http:
        response = await http.get(URL, params={"id": "CVE-2021-44228"})
        body = response.json()

    print(json.dumps(body["data"][0], indent=2)[:600])
    print("\npaid:", body["payment_receipt"]["amount_usd"], "USD",
          "· tx:", body["payment_receipt"]["settlement_ref"])
    print("attestation id:", body["attestation"]["attestation_id"],
          "(verify free at POST /v1/verify/attestation)")


if __name__ == "__main__":
    asyncio.run(main())
