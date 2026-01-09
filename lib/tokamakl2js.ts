/**
 * MPT Key Generation Utilities
 *
 * This module provides utilities for generating MPT keys that match
 * the on-chain deposit process.
 *
 * Note: These functions run in the browser (client-side) to match
 * the original manager app implementation.
 * Uses tokamak-l2js npm package (dev branch code migrated to package).
 */
import {
  deriveL2AddressFromKeys,
  deriveL2KeysFromSignature,
  deriveL2MptKeyFromAddress,
} from "tokamak-l2js";
import { bytesToHex } from "@ethereumjs/util";

export type DerivedL2Account = {
  privateKey: `0x${string}`;
  publicKey: `0x${string}`;
  l2Address: `0x${string}`;
  mptKey: `0x${string}`;
};

/**
 * Derive L2 MPT key from signature and slot index
 */
export const deriveL2MptKeyFromSignature = (
  signature: `0x${string}`,
  slotIndex: number
): `0x${string}` => {
  const keys = deriveL2KeysFromSignature(signature);
  const address = deriveL2AddressFromKeys(keys);
  return deriveL2MptKeyFromAddress(address, slotIndex);
};

/**
 * Derive L2 keys, address, and MPT key from signature and slot index
 */
export const deriveL2KeysAndAddressFromSignature = (
  signature: `0x${string}`,
  slotIndex: number
): DerivedL2Account => {
  const keys = deriveL2KeysFromSignature(signature);
  const address = deriveL2AddressFromKeys(keys);
  const mptKey = deriveL2MptKeyFromAddress(address, slotIndex);

  return {
    privateKey: bytesToHex(keys.privateKey),
    publicKey: bytesToHex(keys.publicKey),
    l2Address: address,
    mptKey,
  };
};
