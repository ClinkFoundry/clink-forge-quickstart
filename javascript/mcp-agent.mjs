// Pay for Clink Forge data over MCP with the official x402 MCP client.
//
// The agent connects to the Clink Forge MCP server, searches the catalog (free),
// then calls a paid tool. The first call comes back "payment required"; the
// client signs a USDC payment and retries on its own, and the data arrives with
// the on-chain settlement reference.
//
//   npm install
//   WALLET_PRIVATE_KEY=0x... node mcp-agent.mjs
//
// The wallet needs a little USDC on Base mainnet. This run spends $0.001.
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { createx402MCPClient } from "@x402/mcp";
import { privateKeyToAccount } from "viem/accounts";

const MCP_URL = process.env.FORGE_MCP_URL ?? "https://api.clinkforge.com/mcp";
const MAX_USDC = 0.05; // refuse anything dearer than this per call

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);
const client = createx402MCPClient({
  name: "clink-forge-quickstart",
  version: "1.0.0",
  schemes: [{ network: "eip155:*", client: new ExactEvmScheme(account) }],
  onPaymentRequested: ({ toolName, paymentRequired }) => {
    const usdc = Number(paymentRequired.accepts[0].amount) / 1e6;
    console.log(`${toolName} costs $${usdc} USDC`);
    return usdc <= MAX_USDC;
  },
});
await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL)));

// Free: what does the catalog have on exploited vulnerabilities?
const search = await client.callTool("search_catalog", { query: "known exploited vulnerabilities" });
for (const hit of JSON.parse(search.content[0].text).results.slice(0, 3)) {
  console.log(`found ${hit.slug} ($${hit.price_usd}) -> tool ${hit.tool}`);
}

// Paid: is Log4Shell on CISA's Known Exploited Vulnerabilities list?
const tool = process.env.FORGE_TOOL ?? "kev_status_by_cve";
const args = JSON.parse(process.env.FORGE_ARGS ?? '{"id":"CVE-2021-44228"}');
const result = await client.callTool(tool, args);
if (result.isError) throw new Error(result.content[0].text);

const body = JSON.parse(result.content[0].text);
console.log("data:", body.data);
console.log("attested by:", body.attestation?.signing_key_id);
console.log("settled:", result.paymentResponse?.transaction);
await client.close();
