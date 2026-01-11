import { groth16 } from 'snarkjs';

export interface CircuitInput {
  storage_keys_L2MPT: string[];
  storage_values: string[];
  treeSize?: number;
}

export interface ProofResult {
  proof: {
    pA: readonly [bigint, bigint, bigint, bigint];
    pB: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
    pC: readonly [bigint, bigint, bigint, bigint];
    merkleRoot: `0x${string}`;
  };
  publicSignals: string[];
  rawProof: any;
}

/**
 * Generate a Groth16 proof client-side using snarkjs
 */
export async function generateClientSideProof(
  input: CircuitInput,
  onProgress?: (status: string) => void
): Promise<ProofResult> {
  try {
    // Validate input
    if (!input.storage_keys_L2MPT || !input.storage_values) {
      throw new Error('Missing storage_keys_L2MPT or storage_values');
    }

    // Determine tree size
    const dataLength = input.storage_keys_L2MPT.length;
    let treeSize = input.treeSize || dataLength;
    
    // Validate tree size is supported
    if (![16, 32, 64, 128].includes(treeSize)) {
      throw new Error('Tree size must be 16, 32, 64, or 128');
    }
    
    if (input.storage_keys_L2MPT.length !== treeSize || input.storage_values.length !== treeSize) {
      throw new Error(`Both arrays must contain exactly ${treeSize} elements for tree size ${treeSize}`);
    }

    onProgress?.('Loading circuit files...');

    // Use appropriate circuit for each tree size 
    const getCircuitConfig = (size: number) => {
      const configs = {
        16: {
          wasmUrl: '/zk-assets/wasm/circuit_N4.wasm',
          zkeyUrl: `/zk-assets/zkey/circuit_final_16.zkey`,
          circuitName: 'circuit_N4',
          actualTreeSize: 16
        },
        32: {
          wasmUrl: '/zk-assets/wasm/circuit_N5.wasm',
          zkeyUrl: `/zk-assets/zkey/circuit_final_32.zkey`,
          circuitName: 'circuit_N5',
          actualTreeSize: 32
        },
        64: {
          wasmUrl: '/zk-assets/wasm/circuit_N6.wasm',
          zkeyUrl: `/api/proxy-large-zkey?size=64`,
          circuitName: 'circuit_N6', 
          actualTreeSize: 64
        },
        128: {
          wasmUrl: '/zk-assets/wasm/circuit_N7.wasm',
          zkeyUrl: `/api/proxy-large-zkey?size=128`,
          circuitName: 'circuit_N7',
          actualTreeSize: 128
        }
      };
      
      return configs[size as keyof typeof configs] || configs[16];
    };

    const config = getCircuitConfig(treeSize);
    if (!config) {
      throw new Error(`Unsupported tree size: ${treeSize}`);
    }

    const actualConfig = config;
    
    if (treeSize > 16) {
      console.log('🔍 VERIFYING LARGE CIRCUIT FILES:');
      console.log(`  WASM file: ${actualConfig.wasmUrl}`);
      console.log(`  zkey file: ${actualConfig.zkeyUrl}`);
      console.log(`  Expected tree size: ${treeSize} leaves`);
    }
    
    console.log('🔍 CLIENT PROOF GENERATION DEBUG:');
    console.log('  Requested Tree Size:', treeSize);
    console.log('  Input Keys Length:', input.storage_keys_L2MPT.length);
    console.log('  Input Values Length:', input.storage_values.length);
    console.log('  Using Config:', actualConfig);
    
    if (actualConfig.actualTreeSize === treeSize) {
      console.log('✅ PERFECT MATCH: Using', treeSize, '-leaf circuit for', treeSize, '-leaf tree');
      onProgress?.(`Using ${treeSize}-leaf circuit (perfect match)`);
      
      if (treeSize >= 64) {
        console.warn('⚠️ PERFORMANCE WARNING: Large circuit detected');
        console.warn(`  ${treeSize}-leaf proof generation requires ${getMemoryRequirement(treeSize)} and may take 5-15 minutes`);
        onProgress?.(`⚠️ Large circuit: ${getMemoryRequirement(treeSize)} required, this will take several minutes...`);
      }
    } else {
      console.warn('⚠️ TREE SIZE MISMATCH: Requested', treeSize, 'but using', actualConfig.actualTreeSize, '-leaf circuit');
      onProgress?.(`⚠️ Using ${actualConfig.actualTreeSize}-leaf circuit instead of ${treeSize}-leaf`);
    }

    onProgress?.('Preparing circuit input...');
    
    const actualTreeSize = actualConfig.actualTreeSize;
    
    console.log('  Actual Tree Size Used:', actualTreeSize);
    console.log('  Original Input Keys (first 5):', input.storage_keys_L2MPT.slice(0, 5));
    console.log('  Original Input Values (first 5):', input.storage_values.slice(0, 5));
    
    const circuitInput = {
      storage_keys_L2MPT: input.storage_keys_L2MPT.slice(0, actualTreeSize),
      storage_values: input.storage_values.slice(0, actualTreeSize)
    };
    
    console.log('  Truncated Input Keys Length:', circuitInput.storage_keys_L2MPT.length);
    console.log('  Truncated Input Values Length:', circuitInput.storage_values.length);
    
    if (actualTreeSize !== treeSize) {
      onProgress?.(`⚠️ Using ${actualTreeSize}-leaf circuit instead of ${treeSize}-leaf (input truncated)`);
    }

    onProgress?.('Generating proof... Please wait a few seconds...');

    const { proof, publicSignals } = await groth16.fullProve(
      circuitInput,
      actualConfig.wasmUrl,
      actualConfig.zkeyUrl
    );

    onProgress?.('Formatting proof for Solidity...');

    const splitFieldElement = (element: string): [string, string] => {
      const bigIntElement = BigInt(element);
      const hex = bigIntElement.toString(16).padStart(96, '0');
      const lowHex = hex.slice(-64);
      const highHex = hex.slice(0, 32).padStart(64, '0');
      const lowPart = BigInt('0x' + lowHex).toString();
      const highPart = BigInt('0x' + highHex).toString();
      return [highPart, lowPart];
    };

    const [pA_x_part1, pA_x_part2] = splitFieldElement(proof.pi_a[0]);
    const [pA_y_part1, pA_y_part2] = splitFieldElement(proof.pi_a[1]);
    
    const [pB_x0_part1, pB_x0_part2] = splitFieldElement(proof.pi_b[0][1]);
    const [pB_x1_part1, pB_x1_part2] = splitFieldElement(proof.pi_b[0][0]);
    const [pB_y0_part1, pB_y0_part2] = splitFieldElement(proof.pi_b[1][1]);
    const [pB_y1_part1, pB_y1_part2] = splitFieldElement(proof.pi_b[1][0]);
    
    const [pC_x_part1, pC_x_part2] = splitFieldElement(proof.pi_c[0]);
    const [pC_y_part1, pC_y_part2] = splitFieldElement(proof.pi_c[1]);
    
    const formattedProof = {
      pA: [BigInt(pA_x_part1), BigInt(pA_x_part2), BigInt(pA_y_part1), BigInt(pA_y_part2)] as const,
      pB: [BigInt(pB_x0_part1), BigInt(pB_x0_part2), BigInt(pB_x1_part1), BigInt(pB_x1_part2), BigInt(pB_y0_part1), BigInt(pB_y0_part2), BigInt(pB_y1_part1), BigInt(pB_y1_part2)] as const,
      pC: [BigInt(pC_x_part1), BigInt(pC_x_part2), BigInt(pC_y_part1), BigInt(pC_y_part2)] as const,
      merkleRoot: `0x${BigInt(publicSignals[0]).toString(16).padStart(64, '0')}` as `0x${string}`
    };

    console.log('🔍 PROOF GENERATION COMPLETED:');
    console.log('  Raw Proof:', proof);
    console.log('  Public Signals:', publicSignals);
    console.log('  Formatted Proof pA:', formattedProof.pA);
    console.log('  Formatted Proof pB:', formattedProof.pB);
    console.log('  Formatted Proof pC:', formattedProof.pC);
    console.log('  Merkle Root:', formattedProof.merkleRoot);

    onProgress?.('Proof generated successfully!');

    return {
      proof: formattedProof,
      publicSignals: publicSignals.map(signal => signal.toString()),
      rawProof: proof
    };

  } catch (error) {
    console.error('Client-side proof generation error:', error);
    throw error;
  }
}

/**
 * Check if client-side proof generation is supported
 */
export function isClientProofGenerationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof WebAssembly === 'undefined') return false;
  return !!(typeof window.fetch !== 'undefined' && typeof window.Worker !== 'undefined');
}

/**
 * Estimate memory requirements for proof generation
 */
export function getMemoryRequirement(treeSize: number): string {
  const requirements = {
    16: '~512MB RAM',
    32: '~1GB RAM',
    64: '~2GB RAM',
    128: '~4GB RAM'
  };
  return requirements[treeSize as keyof typeof requirements] || '~512MB RAM';
}

/**
 * Check if large circuit files need to be downloaded
 */
export function requiresExternalDownload(treeSize: number): boolean {
  return false;
}

/**
 * Get estimated download size for circuit
 */
export function getDownloadSize(treeSize: number): string {
  const sizes = {
    16: '0MB (local)',
    32: '0MB (local)', 
    64: '~51MB (from R2)',
    128: '~102MB (from R2)'
  };
  return sizes[treeSize as keyof typeof sizes] || '0MB (local)';
}
