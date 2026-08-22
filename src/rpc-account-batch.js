export const MAX_GET_MULTIPLE_ACCOUNTS = 100;

export async function getMultipleAccountsBatched(client, addresses, config, { expectedSlot = null, label = "account" } = {}) {
  if (!Array.isArray(addresses) || addresses.some((address) => typeof address !== "string" || !address)) throw new Error(`${label} addresses must be non-empty strings`);
  if (!addresses.length) return { context: { slot: expectedSlot }, value: [] };
  const values = [];
  let responseSlot = expectedSlot;
  for (let offset = 0; offset < addresses.length; offset += MAX_GET_MULTIPLE_ACCOUNTS) {
    const batch = addresses.slice(offset, offset + MAX_GET_MULTIPLE_ACCOUNTS);
    const response = await client.call("getMultipleAccounts", [batch, config]);
    const slot = response?.context?.slot;
    if (!Number.isSafeInteger(slot) || slot < 0 || !Array.isArray(response.value) || response.value.length !== batch.length) throw new Error(`invalid ${label} account response`);
    responseSlot ??= slot;
    if (slot !== responseSlot) throw new Error(`${label} accounts did not share the exact finalized snapshot context`);
    values.push(...response.value);
  }
  return { context: { slot: responseSlot }, value: values };
}
