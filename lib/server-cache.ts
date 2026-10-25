type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export async function withServerCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);

  if (hit && hit.expiresAt > now) {
    return hit.data as T;
  }

  const data = await loader();
  store.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

export function invalidateServerCache(keyPrefix?: string) {
  if (!keyPrefix) {
    store.clear();
    return;
  }
  Array.from(store.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      store.delete(key);
    }
  });
}
