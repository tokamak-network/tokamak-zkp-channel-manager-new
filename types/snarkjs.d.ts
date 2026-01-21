declare module 'snarkjs' {
  export interface Proof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
  }

  export interface PublicSignals {
    [key: string]: string;
  }

  export interface FullProve {
    proof: Proof;
    publicSignals: string[];
  }

  export const groth16: {
    fullProve: (
      input: Record<string, unknown>,
      wasmFile: string | Uint8Array,
      zkeyFile: string | Uint8Array,
      logger?: {
        debug?: (msg: string) => void;
        info?: (msg: string) => void;
        warn?: (msg: string) => void;
        error?: (msg: string) => void;
      }
    ) => Promise<FullProve>;
    
    verify: (
      vkey: Record<string, unknown>,
      publicSignals: string[],
      proof: Proof
    ) => Promise<boolean>;

    exportSolidityCallData: (
      proof: Proof,
      publicSignals: string[]
    ) => Promise<string>;
  };
}
