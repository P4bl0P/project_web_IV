import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});

try {
  const mod = await server.ssrLoadModule('/src/__tests__/permissions.test.tsx');
  await mod.runPermissionTests();
} finally {
  await server.close();
}
