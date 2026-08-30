// Buy one record from Clink Forge with the official x402 fetch wrapper.
//
//     npm install x402-fetch viem
//     WALLET_PRIVATE_KEY=0x... node buy-kev.mjs
//
// Costs $0.01 in USDC on Base. The 402 handshake, EIP-3009 signing, and
// retry are all handled by x402-fetch — this file is just a fetch call.
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { wrapFetchWithPayment } from "x402-fetch";

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);
const wallet = createWalletClient({ account, chain: base, transport: http() });
const fetchWithPay = wrapFetchWithPayment(fetch, wallet);

const response = await fetchWithPay(
  "https://api.clinkforge.com/v1/p/kev-status-by-cve?id=CVE-2021-44228",
);
const body = await response.json();

console.log(body.data[0]);
console.log("paid:", body.payment_receipt.amount_usd, "USD",
  "· tx:", body.payment_receipt.settlement_ref);
console.log("attestation id:", body.attestation.attestation_id,
  "(verify free at POST /v1/verify/attestation)");
