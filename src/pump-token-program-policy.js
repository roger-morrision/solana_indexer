const LEGACY_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const TOKEN_PROGRAMS = new Set([LEGACY_TOKEN_PROGRAM, TOKEN_2022_PROGRAM]);
const CREATE_V2_TOKEN_2022_EXTENSIONS = new Set(["metadataPointer", "tokenMetadata"]);

export function assessPumpV2TokenProgramPolicy(snapshot) {
  if (!TOKEN_PROGRAMS.has(snapshot?.baseTokenProgram) || !TOKEN_PROGRAMS.has(snapshot?.quoteTokenProgram)) return { supported: false, mode: null, reason: "unsupported_token_program" };
  const evidence = [snapshot?.mint0Evidence, snapshot?.mint1Evidence];
  const expectedPrograms = [snapshot.baseTokenProgram, snapshot.quoteTokenProgram];
  for (let index = 0; index < evidence.length; index++) {
    const row = evidence[index];
    if (row?.programId !== expectedPrograms[index]) return { supported: false, mode: null, reason: "token_program_evidence_mismatch" };
    if (row.programId === LEGACY_TOKEN_PROGRAM && (!Array.isArray(row.extensionTypes) || row.extensionTypes.length)) return { supported: false, mode: null, reason: "legacy_token_extension_inventory" };
    if (row?.programId !== TOKEN_2022_PROGRAM) continue;
    const extensions = row.extensionTypes;
    if (!Array.isArray(extensions) || extensions.length !== CREATE_V2_TOKEN_2022_EXTENSIONS.size || extensions.some((extension) => !CREATE_V2_TOKEN_2022_EXTENSIONS.has(extension))) return { supported: false, mode: null, reason: "unsupported_token_2022_extension_inventory" };
  }
  return { supported: true, mode: evidence.some((row) => row?.programId === TOKEN_2022_PROGRAM) ? "token_2022_transfer_neutral_extensions" : "legacy_spl", reason: null };
}

export const PUMP_TOKEN_PROGRAM_POLICY = Object.freeze({
  legacyTokenProgram: LEGACY_TOKEN_PROGRAM,
  token2022Program: TOKEN_2022_PROGRAM,
  token2022Extensions: Object.freeze([...CREATE_V2_TOKEN_2022_EXTENSIONS].sort()),
});
