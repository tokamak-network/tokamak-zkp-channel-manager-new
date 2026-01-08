/**
 * @tokamak/frost - FROST Protocol Package
 *
 * Distributed Key Generation and Threshold Signing using FROST protocol.
 *
 * @example
 * ```ts
 * import { createFrostDKG, createFrostSigning } from '@tokamak/frost';
 *
 * // DKG
 * const dkg = createFrostDKG();
 * await dkg.init();
 * const session = await dkg.startSession(channelId, participants, threshold);
 *
 * // Signing
 * const signing = createFrostSigning();
 * await signing.init();
 * const signature = await signing.aggregateSignature(shares);
 * ```
 */

// Types
export * from './types';

// DKG
export { FrostDKG, createFrostDKG } from './dkg';

// Signing
export { FrostSigning, createFrostSigning } from './signing';

