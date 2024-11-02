export {};

if (!globalThis.fetch) {
  globalThis.fetch = (await import("node-fetch"))
    .default as unknown as typeof fetch;
}
