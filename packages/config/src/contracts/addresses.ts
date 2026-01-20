/**
 * Contract Addresses
 * 
 * Auto-generated from Tokamak-zk-EVM-contracts repository
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

export const CONTRACT_ADDRESSES = {
  sepolia: {
    TokamakVerifier: '0xF43C2a14A8e5Ab3FC8740ea4AABc45010ED9fb52',
    Groth16Verifier16Leaves: '0x27f453C0f7eAC419A390edaae6b0ABA64D6490c9',
    Groth16Verifier32Leaves: '0xCF85A85856237C8B1E9FE43e117ca8245c2AbE6A',
    Groth16Verifier64Leaves: '0x9192Ab6CCe1FF89393153BD54CE95F7aEE0Cf831',
    Groth16Verifier128Leaves: '0xdb70a38547f6Bcc655786b2cf19D0f34e7B3ebED',
    BridgeCore: '0xB6bD0FaD0B47e8c322606a199fa83ED8ca182f23',
    BridgeDepositManager: '0x509C052f28924cbeafb75dBA8b507517B1989668',
    BridgeProofManager: '0x576E38b03DEeFAEE4b591106cBa6c3bD4A5537d0',
    BridgeWithdrawManager: '0xEeF0E1B4BFC44DbC35557c7ff0C7f8c9Cd02dFFB',
    BridgeAdminManager: '0xc5604C16779B7430827c0Ad6b8C758792F99BAc7',
  } as const,
} as const;

export type Network = keyof typeof CONTRACT_ADDRESSES;
export type ContractName<T extends Network> = keyof typeof CONTRACT_ADDRESSES[T];
