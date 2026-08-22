export function assertSnapshotAcquisitionAllowed(store, { artifactOnly, requested }) {
  if (typeof artifactOnly !== "boolean" || !Array.isArray(requested)) throw new Error("invalid snapshot acquisition policy");
  if (!artifactOnly || requested.length === 0) store.assertWritable();
  return { artifactOnly, discovery: requested.length === 0, localMutation: !artifactOnly };
}
