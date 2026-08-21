export const PROGRAM_REGISTRY_VERSION = 5;

const programs = [
  { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", protocol: "spl-token", deploymentVersion: "legacy", decoderVersion: 1, activationSlot: 0, eventTypes: ["instruction", "transfer", "balance_change"] },
  { programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", protocol: "token-2022", deploymentVersion: "current", decoderVersion: 1, activationSlot: 0, eventTypes: ["instruction", "transfer", "balance_change"] },
  { programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", protocol: "associated-token", deploymentVersion: "legacy", decoderVersion: 1, activationSlot: 0, eventTypes: ["instruction"] },
  { programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", protocol: "metaplex-token-metadata", deploymentVersion: "current", decoderVersion: 1, activationSlot: 0, eventTypes: ["instruction"] },
  { programId: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", protocol: "raydium-cpmm", deploymentVersion: "mainnet", decoderVersion: 2, activationSlot: 0, eventTypes: ["swap", "pool_created"] },
  { programId: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", protocol: "raydium-clmm", deploymentVersion: "mainnet", decoderVersion: 1, activationSlot: 0, eventTypes: ["swap"] },
  { programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", protocol: "pump-swap", deploymentVersion: "mainnet", decoderVersion: 2, activationSlot: 0, eventTypes: ["swap", "pool_created"] },
  { programId: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", protocol: "pump-bonding-curve", deploymentVersion: "mainnet", decoderVersion: 3, activationSlot: 0, eventTypes: ["swap", "pool_created", "pool_migrated"] },
];

export const PROGRAM_REGISTRY = new Map(programs.map((row) => [row.programId, Object.freeze(row)]));
export function programRegistration(programId, slot) { const row = PROGRAM_REGISTRY.get(programId); return row && slot >= row.activationSlot && (row.deprecationSlot == null || slot < row.deprecationSlot) ? row : null; }
export function registrySnapshot() { return { version: PROGRAM_REGISTRY_VERSION, programs: programs.map((row) => ({ ...row })) }; }
