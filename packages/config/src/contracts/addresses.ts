/**
 * Contract Addresses
 * 
 * Auto-generated from Tokamak-zk-EVM-contracts repository
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

export const CONTRACT_ADDRESSES = {
  sepolia: {
    TokamakVerifier: '0xf43c2a14a8e5ab3fc8740ea4aabc45010ed9fb52',
    Groth16Verifier16Leaves: '0x27f453c0f7eac419a390edaae6b0aba64d6490c9',
    Groth16Verifier32Leaves: '0xcf85a85856237c8b1e9fe43e117ca8245c2abe6a',
    Groth16Verifier64Leaves: '0x9192ab6cce1ff89393153bd54ce95f7aee0cf831',
    Groth16Verifier128Leaves: '0xdb70a38547f6bcc655786b2cf19d0f34e7b3ebed',
    ZecFrost: '0x910eee98a93d54ad52694cbf2b45b1534c8c8d10',
    BridgeCore: '0xb6bd0fad0b47e8c322606a199fa83ed8ca182f23',
    BridgeDepositManager: '0x509c052f28924cbeafb75dba8b507517b1989668',
    BridgeProofManager: '0x576e38b03deefaee4b591106cba6c3bd4a5537d0',
    BridgeWithdrawManager: '0xeef0e1b4bfc44dbc35557c7ff0c7f8c9cd02dffb',
    BridgeAdminManager: '0xc5604c16779b7430827c0ad6b8c758792f99bac7',
  } as const,
} as const;

export type Network = keyof typeof CONTRACT_ADDRESSES;
export type ContractName<T extends Network> = keyof typeof CONTRACT_ADDRESSES[T];
