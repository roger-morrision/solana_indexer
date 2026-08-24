const definitions = [
  ["account", "accountSnapshotFile", "applyAccountSnapshot"],
  ["cpmm_pool", "cpmmPoolSnapshotFile", "applyCpmmPoolSnapshot"],
  ["amm_v4_pool", "ammV4PoolSnapshotFile", "applyAmmV4PoolSnapshot"],
  ["pump_swap_pool", "pumpSwapPoolSnapshotFile", "applyPumpSwapPoolSnapshot"],
  ["pump_bonding_curve", "pumpBondingCurveSnapshotFile", "applyPumpBondingCurveSnapshot"],
  ["clmm_pool", "clmmPoolSnapshotFile", "applyPoolSnapshot"],
  ["orca_pool", "orcaPoolSnapshotFile", "applyOrcaPoolSnapshot"],
  ["meteora_dlmm_pool", "meteoraDlmmPoolSnapshotFile", "applyMeteoraDlmmPoolSnapshot"],
  ["phoenix_market", "phoenixMarketSnapshotFile", "applyPhoenixMarketSnapshot"],
  ["openbook_market", "openBookMarketSnapshotFile", "applyOpenBookMarketSnapshot"],
  ["offchain_metadata", "offchainMetadataSnapshotFile", "applyOffchainMetadataSnapshot"],
  ["execution_qualification", "executionQualificationFile", "applyExecutionQualification"],
];

export const SNAPSHOT_ARTIFACT_REGISTRY = Object.freeze(definitions.map(([type, configKey, applyMethod]) => Object.freeze({ type, configKey, applyMethod })));
export const SNAPSHOT_ARTIFACT_TYPES = Object.freeze(SNAPSHOT_ARTIFACT_REGISTRY.map(({ type }) => type));
