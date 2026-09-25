// vitest alias target for the `server-only` package. That package throws by
// design when imported outside a React Server Component bundle, which would
// break unit tests that import server modules directly. Swapping it for this
// empty module lets us test the pure logic in those files in plain Node.
export {};
