const REQUIRED_STEPS = Object.freeze(["local_simulation", "external_signer_approval", "externally_operated_submission", "finalized_landed_message_verification"]);

export const EXECUTION_HANDOFF_POLICY = Object.freeze({
  schemaVersion: 1,
  policyVersion: "external-execution-handoff-v1",
  signingAuthority: "external_operator_only",
  submissionAuthority: "external_operator_only",
  indexerSigns: false,
  indexerSubmits: false,
  requiredSteps: REQUIRED_STEPS,
  simulationRequirements: Object.freeze({ commitment: "finalized", messageIdentityBound: true, tokenEffectsBound: true, programAllowlistBound: true }),
  signerRequirements: Object.freeze({ explicitApproval: true, feePayerAllowlist: true, maximumInputBound: true, maximumSlippageBound: true, slotExpiryBound: true }),
  confirmationRequirements: Object.freeze({ commitment: "finalized", exactMessageIdentity: true, successfulExecution: true })
});

export function bindExecutionHandoff(preparation) {
  if (preparation?.schemaVersion !== 1 || typeof preparation.type !== "string" || !preparation.type.endsWith("_simulation") || typeof preparation.protocol !== "string" || preparation.commitment !== "finalized" || preparation.transaction?.signed !== false || preparation.transaction?.submitted !== false || !/^[0-9a-f]{64}$/.test(preparation.preparationHash ?? "") || !/^[0-9a-f]{64}$/.test(preparation.transaction?.messageHash ?? "") || !/^[0-9a-f]{64}$/.test(preparation.transaction?.transactionHash ?? "")) throw new Error("execution preparation cannot be handed off");
  return { ...EXECUTION_HANDOFF_POLICY, requiredSteps: [...REQUIRED_STEPS], binding: { protocol: preparation.protocol, preparationType: preparation.type, preparationHash: preparation.preparationHash, messageHash: preparation.transaction.messageHash, unsignedTransactionHash: preparation.transaction.transactionHash, minimumContextSlot: preparation.minContextSlot } };
}
