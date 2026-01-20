/**
 * Fetch contract addresses and ABIs from external repository
 * 
 * This script fetches contract deployment information from the Tokamak-zk-EVM-contracts
 * repository and generates TypeScript files for use in the application.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Get __dirname in a way that works with both ESM and CommonJS
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const CONFIG_ROOT = join(__dirname, '..');
const CONTRACTS_DIR = join(CONFIG_ROOT, 'src', 'contracts');
const OUTPUT_ADDRESSES = join(CONTRACTS_DIR, 'addresses.ts');
const OUTPUT_ABIS = join(CONTRACTS_DIR, 'abis.ts');
const OUTPUT_INDEX = join(CONTRACTS_DIR, 'index.ts');

// Configuration
const CONTRACTS_REPO_BASE = process.env.CONTRACTS_REPO_URL || 
  'https://raw.githubusercontent.com/tokamak-network/Tokamak-zk-EVM-contracts/main';
const NETWORKS = ['sepolia', 'mainnet'] as const;

interface ContractInfo {
  address: string;
  abi: unknown[];
}

interface ContractFile {
  network: string;
  generatedDate: string;
  source: string;
  contracts: {
    [contractName: string]: ContractInfo;
  };
}

interface ContractsData {
  [network: string]: {
    [contractName: string]: ContractInfo;
  };
}

/**
 * Fetch JSON from URL
 */
async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Generate addresses TypeScript file
 */
function generateAddressesFile(data: ContractsData): string {
  const networks = Object.keys(data);
  
  let content = `/**
 * Contract Addresses
 * 
 * Auto-generated from Tokamak-zk-EVM-contracts repository
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

export const CONTRACT_ADDRESSES = {
`;

  for (const network of networks) {
    const contracts = data[network];
    if (!contracts) continue;

    content += `  ${network}: {\n`;
    
    for (const [contractName, contractInfo] of Object.entries(contracts)) {
      const address = contractInfo.address;
      content += `    ${contractName}: '${address}',\n`;
    }
    
    content += `  } as const,\n`;
  }

  content += `} as const;

export type Network = keyof typeof CONTRACT_ADDRESSES;
export type ContractName<T extends Network> = keyof typeof CONTRACT_ADDRESSES[T];
`;

  return content;
}

/**
 * Generate ABIs TypeScript file
 */
function generateABIsFile(data: ContractsData): string {
  const networks = Object.keys(data);
  const allContracts = new Set<string>();
  
  // Collect all contract names
  for (const network of networks) {
    const contracts = data[network];
    if (contracts) {
      Object.keys(contracts).forEach(name => allContracts.add(name));
    }
  }

  let content = `/**
 * Contract ABIs
 * 
 * Auto-generated from Tokamak-zk-EVM-contracts repository
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Abi } from 'viem';

`;

  for (const contractName of Array.from(allContracts).sort()) {
    // Get ABI from first available network
    let abi: unknown[] | null = null;
    for (const network of networks) {
      const contracts = data[network];
      if (contracts?.[contractName]?.abi) {
        abi = contracts[contractName].abi as unknown[];
        break;
      }
    }

    if (!abi) continue;

    const abiString = JSON.stringify(abi, null, 2);
    content += `export const ${contractName.toUpperCase()}_ABI = ${abiString} as const satisfies Abi;\n\n`;
  }

  return content;
}

/**
 * Generate index file
 */
function generateIndexFile(): string {
  return `/**
 * Contract exports
 * 
 * Auto-generated - DO NOT EDIT MANUALLY
 */

export * from './addresses';
export * from './abis';
`;
}

/**
 * Main function
 */
async function main() {
  console.log('📦 Fetching contract information...');

  // Create contracts directory
  if (!existsSync(CONTRACTS_DIR)) {
    mkdirSync(CONTRACTS_DIR, { recursive: true });
  }

  const contractsData: ContractsData = {};

  // Fetch contracts for each network
  for (const network of NETWORKS) {
    const url = `${CONTRACTS_REPO_BASE}/script/output/contracts-${network}.json`;
    console.log(`  Fetching ${network}...`);
    
    try {
      const fileData = await fetchJSON<ContractFile>(url);
      
      // Extract contracts from the file structure
      if (fileData.contracts) {
        contractsData[network] = fileData.contracts;
        console.log(`  ✓ ${network} fetched successfully (${Object.keys(fileData.contracts).length} contracts)`);
      } else {
        console.warn(`  ⚠ No contracts found in ${network} data`);
      }
    } catch (error) {
      console.warn(`  ⚠ Failed to fetch ${network}:`, error instanceof Error ? error.message : error);
      // Continue with other networks
    }
  }

  if (Object.keys(contractsData).length === 0) {
    throw new Error('No contract data fetched from any network');
  }

  // Generate TypeScript files
  console.log('📝 Generating TypeScript files...');
  
  const addressesContent = generateAddressesFile(contractsData);
  const abisContent = generateABIsFile(contractsData);
  const indexContent = generateIndexFile();

  writeFileSync(OUTPUT_ADDRESSES, addressesContent, 'utf-8');
  writeFileSync(OUTPUT_ABIS, abisContent, 'utf-8');
  writeFileSync(OUTPUT_INDEX, indexContent, 'utf-8');

  console.log('✅ Contract files generated successfully!');
  console.log(`   - ${OUTPUT_ADDRESSES}`);
  console.log(`   - ${OUTPUT_ABIS}`);
  console.log(`   - ${OUTPUT_INDEX}`);
}

// Run
main().catch((error) => {
  console.error('❌ Error fetching contracts:', error);
  process.exit(1);
});

