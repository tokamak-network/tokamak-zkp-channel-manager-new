import { NUMBER_OF_PREV_BLOCK_HASHES } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/interface/qapCompiler/importedConstants";
import { getBlockInfoFromRPC } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/interface/rpc/rpc";
import { SynthesizerBlockInfo } from "@/Tokamak-Zk-EVM/packages/frontend/synthesizer/src/interface";
import { addHexPrefix, hexToBytes } from "@ethereumjs/util";
import { ethers } from "ethers";
import { getChainByChainId } from "@tokamak/config";

/**
 * Get RPC URL from environment variable or fallback to chain configuration
 *
 * @param chainId - Chain ID to get RPC URL for (used as fallback)
 * @returns RPC URL string
 */
function getRpcUrl(chainId: number): string {
  // First, try to get RPC URL from .env file
  const envRpcUrl = process.env.RPC_URL;
  if (envRpcUrl) {
    return envRpcUrl;
  }

  // Fallback to chain configuration if RPC_URL is not set
  const chain = getChainByChainId(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Get the default RPC URL from the chain
  // Wagmi chains have rpcUrls.default.http array
  const rpcUrls = chain.rpcUrls;
  if (rpcUrls?.default?.http && rpcUrls.default.http.length > 0) {
    return rpcUrls.default.http[0];
  }

  // Fallback to public RPC if available
  if (rpcUrls?.public?.http && rpcUrls.public.http.length > 0) {
    return rpcUrls.public.http[0];
  }

  throw new Error(`No RPC URL found for chain ID: ${chainId}`);
}

/**
 * Get block info for a given block number
 * Uses RPC URL from .env file or Wagmi chain configuration as fallback
 *
 * @param chainId - Chain ID to get RPC URL for (used as fallback)
 * @param blockNumber - Block number to fetch
 * @returns Block info
 */
export const getBlockInfo = async (
  chainId: number,
  blockNumber: number
): Promise<SynthesizerBlockInfo> => {
  const rpcUrl = getRpcUrl(chainId);
  return await getBlockInfoFromRPC(
    rpcUrl,
    blockNumber,
    NUMBER_OF_PREV_BLOCK_HASHES
  );
};

/**
 * Get block number for a transaction hash
 * Uses RPC URL from .env file or Wagmi chain configuration as fallback
 *
 * @param chainId - Chain ID to get RPC URL for (used as fallback)
 * @param initTxHash - Transaction hash
 * @returns Block number
 */
export const getBlockNumber = async (
  chainId: number,
  initTxHash: `0x${string}`
): Promise<number> => {
  const rpcUrl = getRpcUrl(chainId);
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const tx = await provider.getTransaction(initTxHash);

  if (tx === null || tx.blockNumber === null) {
    throw new Error("Initialize transaction not found or not yet mined");
  }
  return tx.blockNumber;
};

/**
 * Get contract code at a specific block
 * Uses RPC URL from .env file or Wagmi chain configuration as fallback
 *
 * @param chainId - Chain ID to get RPC URL for (used as fallback)
 * @param contractAddress - Contract address
 * @param blockNumber - Block number
 * @returns Contract bytecode
 */
export const getContractCode = async (
  chainId: number,
  contractAddress: `0x${string}`,
  blockNumber: number
): Promise<Uint8Array> => {
  const rpcUrl = getRpcUrl(chainId);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const byteCodeStr = await provider.getCode(contractAddress, blockNumber);
  return hexToBytes(addHexPrefix(byteCodeStr));
};
