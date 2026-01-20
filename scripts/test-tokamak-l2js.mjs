#!/usr/bin/env node

/**
 * Test script for tokamak-l2js package
 * 
 * Tests MPT key generation functions in Node.js environment
 * Run with: npm run test:tokamak-l2js
 */

import {
  deriveL2AddressFromKeys,
  deriveL2KeysFromSignature,
  deriveL2MptKeyFromAddress,
  L2_PRV_KEY_MESSAGE,
} from "tokamak-l2js";
import { bytesToHex } from "@ethereumjs/util";

// Test signature (mock - in real usage, this comes from wallet signing)
const TEST_SIGNATURE = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234";
const TEST_CHANNEL_ID = "123";
const TEST_SLOT_INDEX = 0;

console.log("🧪 Testing tokamak-l2js package in Node.js environment\n");
console.log("=" .repeat(60));

// Test 1: Check if L2_PRV_KEY_MESSAGE is exported
console.log("\n📋 Test 1: L2_PRV_KEY_MESSAGE export");
try {
  console.log(`   Message: "${L2_PRV_KEY_MESSAGE}"`);
  if (typeof L2_PRV_KEY_MESSAGE === "string" && L2_PRV_KEY_MESSAGE.length > 0) {
    console.log("   ✅ PASS: L2_PRV_KEY_MESSAGE is exported correctly");
  } else {
    console.log("   ❌ FAIL: L2_PRV_KEY_MESSAGE is not a valid string");
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  process.exit(1);
}

// Test 2: deriveL2KeysFromSignature
console.log("\n🔑 Test 2: deriveL2KeysFromSignature");
try {
  const keys = deriveL2KeysFromSignature(TEST_SIGNATURE);
  console.log(`   Private Key length: ${keys.privateKey.length} bytes`);
  console.log(`   Public Key length: ${keys.publicKey.length} bytes`);
  
  if (keys.privateKey && keys.privateKey.length === 32) {
    console.log("   ✅ PASS: Private key generated correctly (32 bytes)");
  } else {
    console.log(`   ❌ FAIL: Invalid private key length: ${keys.privateKey?.length}`);
    process.exit(1);
  }
  
  if (keys.publicKey && keys.publicKey.length > 0) {
    console.log("   ✅ PASS: Public key generated correctly");
  } else {
    console.log("   ❌ FAIL: Invalid public key");
    process.exit(1);
  }
  
  console.log(`   Private Key (hex): ${bytesToHex(keys.privateKey)}`);
  console.log(`   Public Key (hex): ${bytesToHex(keys.publicKey)}`);
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  console.error("   Error details:", error);
  process.exit(1);
}

// Test 3: deriveL2AddressFromKeys
console.log("\n📍 Test 3: deriveL2AddressFromKeys");
try {
  const keys = deriveL2KeysFromSignature(TEST_SIGNATURE);
  const address = deriveL2AddressFromKeys(keys);
  console.log(`   L2 Address: ${address}`);
  
  if (address && address.startsWith("0x") && address.length === 42) {
    console.log("   ✅ PASS: L2 address generated correctly (42 chars, starts with 0x)");
  } else {
    console.log(`   ❌ FAIL: Invalid address format: ${address}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  console.error("   Error details:", error);
  process.exit(1);
}

// Test 4: deriveL2MptKeyFromAddress
console.log("\n🌳 Test 4: deriveL2MptKeyFromAddress");
try {
  const keys = deriveL2KeysFromSignature(TEST_SIGNATURE);
  const address = deriveL2AddressFromKeys(keys);
  const mptKey = deriveL2MptKeyFromAddress(address, TEST_SLOT_INDEX);
  console.log(`   MPT Key: ${mptKey}`);
  
  if (mptKey && mptKey.startsWith("0x")) {
    console.log("   ✅ PASS: MPT key generated correctly (starts with 0x)");
  } else {
    console.log(`   ❌ FAIL: Invalid MPT key format: ${mptKey}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  console.error("   Error details:", error);
  process.exit(1);
}

// Test 5: Full flow - signature to MPT key
console.log("\n🔄 Test 5: Full flow (signature → keys → address → MPT key)");
try {
  const keys = deriveL2KeysFromSignature(TEST_SIGNATURE);
  const address = deriveL2AddressFromKeys(keys);
  const mptKey = deriveL2MptKeyFromAddress(address, TEST_SLOT_INDEX);
  
  console.log(`   Signature: ${TEST_SIGNATURE.slice(0, 20)}...`);
  console.log(`   Private Key: ${bytesToHex(keys.privateKey).slice(0, 20)}...`);
  console.log(`   Public Key: ${bytesToHex(keys.publicKey).slice(0, 20)}...`);
  console.log(`   L2 Address: ${address}`);
  console.log(`   MPT Key: ${mptKey}`);
  console.log("   ✅ PASS: Full flow completed successfully");
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  console.error("   Error details:", error);
  process.exit(1);
}

// Test 6: Different slot indices
console.log("\n🔢 Test 6: Different slot indices");
try {
  const keys = deriveL2KeysFromSignature(TEST_SIGNATURE);
  const address = deriveL2AddressFromKeys(keys);
  
  const slotIndices = [0, 1, 2, 10, 100];
  const mptKeys = slotIndices.map(slot => deriveL2MptKeyFromAddress(address, slot));
  
  // Check that different slot indices produce different MPT keys
  const uniqueKeys = new Set(mptKeys);
  if (uniqueKeys.size === mptKeys.length) {
    console.log("   ✅ PASS: Different slot indices produce different MPT keys");
    slotIndices.forEach((slot, i) => {
      console.log(`   Slot ${slot}: ${mptKeys[i].slice(0, 20)}...`);
    });
  } else {
    console.log("   ❌ FAIL: Some slot indices produce duplicate MPT keys");
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  console.error("   Error details:", error);
  process.exit(1);
}

// Test 7: Deterministic - same signature produces same keys
console.log("\n🔄 Test 7: Deterministic behavior");
try {
  const keys1 = deriveL2KeysFromSignature(TEST_SIGNATURE);
  const keys2 = deriveL2KeysFromSignature(TEST_SIGNATURE);
  
  const privateKey1 = bytesToHex(keys1.privateKey);
  const privateKey2 = bytesToHex(keys2.privateKey);
  const publicKey1 = bytesToHex(keys1.publicKey);
  const publicKey2 = bytesToHex(keys2.publicKey);
  
  if (privateKey1 === privateKey2 && publicKey1 === publicKey2) {
    console.log("   ✅ PASS: Same signature produces same keys (deterministic)");
  } else {
    console.log("   ❌ FAIL: Same signature produces different keys (non-deterministic)");
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}`);
  console.error("   Error details:", error);
  process.exit(1);
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("✅ All tests passed! tokamak-l2js is working correctly in Node.js environment.");
console.log("=".repeat(60) + "\n");
