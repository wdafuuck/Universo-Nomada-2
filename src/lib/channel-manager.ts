/**
 * Stub de channel manager / GDS — interfaces listas, sin alterar búsqueda pública.
 */

export type ChannelProvider = "manual" | "booking" | "liteapi" | "ratehawk" | "gds_stub";

export type ChannelInventoryItem = {
  externalId: string;
  provider: ChannelProvider;
  name: string;
  available: boolean;
  lastSyncedAt: string | null;
};

export type ChannelSyncResult = {
  provider: ChannelProvider;
  ok: boolean;
  items: ChannelInventoryItem[];
  message: string;
};

export async function syncChannelInventory(
  provider: ChannelProvider,
): Promise<ChannelSyncResult> {
  if (provider === "manual") {
    return {
      provider,
      ok: true,
      items: [],
      message: "Inventario manual: sin sync externo.",
    };
  }

  return {
    provider,
    ok: true,
    items: [],
    message: `Stub ${provider}: sync no conectado (sin cambios en UI pública).`,
  };
}

export function listChannelProviders(): ChannelProvider[] {
  return ["manual", "booking", "liteapi", "ratehawk", "gds_stub"];
}
