/**
 * Proof formatting utilities for submitProofAndSignature
 * 
 * Converts verified proofs from DB format to contract-compatible format
 */

import JSZip from 'jszip';

export interface ProofData {
  proofPart1: bigint[];
  proofPart2: bigint[];
  publicInputs: bigint[];
  smax: bigint;
}

export interface RawProofJson {
  proof_entries_part1: string[];
  proof_entries_part2: string[];
}

export interface RawInstanceJson {
  a_pub_user: string[];
  a_pub_block: string[];
  a_pub_function: string[];
}

export interface FormattedProofForSubmission {
  proofData: ProofData[];
  finalStateRoot: `0x${string}`;
  messageHash: `0x${string}`;
}

/**
 * Parse proof.json and instance.json from ZIP file
 */
export async function parseProofZipFile(
  zipFile: File | Blob
): Promise<{ proof: RawProofJson; instance: RawInstanceJson }> {
  const arrayBuffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find proof.json and instance.json
  let proofJson: string | null = null;
  let instanceJson: string | null = null;

  const files = Object.keys(zip.files);
  for (const filePath of files) {
    const fileName = filePath.split('/').pop()?.toLowerCase();
    if (fileName === 'proof.json') {
      const file = zip.file(filePath);
      if (file) proofJson = await file.async('string');
    } else if (fileName === 'instance.json') {
      const file = zip.file(filePath);
      if (file) instanceJson = await file.async('string');
    }
  }

  if (!proofJson || !instanceJson) {
    throw new Error('ZIP file must contain proof.json and instance.json');
  }

  const proof = JSON.parse(proofJson) as RawProofJson;
  const instance = JSON.parse(instanceJson) as RawInstanceJson;

  // Validate structure
  if (!Array.isArray(proof.proof_entries_part1) || !Array.isArray(proof.proof_entries_part2)) {
    throw new Error('Invalid proof.json structure');
  }
  if (!Array.isArray(instance.a_pub_user) || !Array.isArray(instance.a_pub_block) || !Array.isArray(instance.a_pub_function)) {
    throw new Error('Invalid instance.json structure');
  }

  return { proof, instance };
}

/**
 * Convert raw proof data to contract format
 */
export function formatProofForContract(
  proof: RawProofJson,
  instance: RawInstanceJson
): ProofData {
  // Concatenate public inputs: a_pub_user + a_pub_block + a_pub_function
  const publicInputsRaw = [
    ...instance.a_pub_user,
    ...instance.a_pub_block,
    ...instance.a_pub_function
  ];

  return {
    proofPart1: proof.proof_entries_part1.map((x: string) => BigInt(x)),
    proofPart2: proof.proof_entries_part2.map((x: string) => BigInt(x)),
    publicInputs: publicInputsRaw.map((x: string) => BigInt(x)),
    smax: BigInt(256), // Fixed value
  };
}

/**
 * Extract final state root from the last proof's public inputs
 */
export function extractFinalStateRoot(lastProof: ProofData): `0x${string}` {
  if (lastProof.publicInputs.length < 2) {
    throw new Error('Invalid public inputs length for state root extraction');
  }

  // a_pub_user[0] = lower 16 bytes, a_pub_user[1] = upper 16 bytes of resulting merkle root
  const lowerBytes = lastProof.publicInputs[0];
  const upperBytes = lastProof.publicInputs[1];

  // Combine: upper (16 bytes) + lower (16 bytes) = 32 bytes
  const lowerHex = lowerBytes.toString(16).padStart(32, '0');
  const upperHex = upperBytes.toString(16).padStart(32, '0');

  return `0x${upperHex}${lowerHex}` as `0x${string}`;
}

/**
 * Compute message hash for signature: keccak256(abi.encodePacked(channelId, finalStateRoot))
 */
export function computeMessageHash(
  channelId: string,
  finalStateRoot: `0x${string}`
): `0x${string}` {
  const { keccak256, encodePacked } = require('viem');
  
  const channelIdBigInt = BigInt(channelId);
  const messageHash = keccak256(encodePacked(
    ['uint256', 'bytes32'],
    [channelIdBigInt, finalStateRoot]
  ));

  return messageHash as `0x${string}`;
}

/**
 * Format multiple verified proofs from DB for contract submission
 */
export async function formatVerifiedProofsForSubmission(
  proofZipFiles: (File | Blob)[],
  channelId: string
): Promise<FormattedProofForSubmission> {
  if (proofZipFiles.length === 0) {
    throw new Error('No proof files provided');
  }
  if (proofZipFiles.length > 5) {
    throw new Error('Maximum of 5 proofs allowed');
  }

  const formattedProofs: ProofData[] = [];

  // Process each proof ZIP file
  for (const zipFile of proofZipFiles) {
    const { proof, instance } = await parseProofZipFile(zipFile);
    const formattedProof = formatProofForContract(proof, instance);
    formattedProofs.push(formattedProof);
  }

  // Extract final state root from the last proof
  const lastProof = formattedProofs[formattedProofs.length - 1];
  const finalStateRoot = extractFinalStateRoot(lastProof);
  
  // Compute message hash for signature
  const messageHash = computeMessageHash(channelId, finalStateRoot);

  return {
    proofData: formattedProofs,
    finalStateRoot,
    messageHash,
  };
}

/**
 * Load proof file from file path via API
 * Use /api/get-proof-zip endpoint to load files from server
 */
export async function loadProofFromFilePath(filePath: string): Promise<Blob> {
  const response = await fetch(`/api/get-proof-zip?path=${encodeURIComponent(filePath)}`);
  if (!response.ok) {
    throw new Error(`Failed to load proof file: ${filePath}`);
  }
  return await response.blob();
}
