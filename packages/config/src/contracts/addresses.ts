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
    BridgeCore: '0x04C0A9366280A4B6bcE0f01d5D18014d1Bd03845',
    BridgeDepositManager: '0x1B6073D620b8977D4760F5a36f1Be0ceB3A21fAE',
    BridgeProofManager: '0xCfD17915Fe378f49c4bF574d63F3De5c7AFD78c7',
    BridgeWithdrawManager: '0x0B9bE3471eEB400Dcf0872D7795308a959E3FDa8',
    BridgeAdminManager: '0x845C23BA92cE8994079eAB7E7fD078e5269F647d',
  } as const,
} as const;

export type Network = keyof typeof CONTRACT_ADDRESSES;
export type ContractName<T extends Network> = keyof typeof CONTRACT_ADDRESSES[T];
