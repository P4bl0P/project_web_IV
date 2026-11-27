import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
  const templateBytes = await readFile(
    resolve(process.cwd(), 'public/templates/HOJA_DE_INSCRIPCION_SCOUT.pdf'),
  );
  const pdfMod = await server.ssrLoadModule('/src/__tests__/pdfGenerator.test.ts');
  await pdfMod.runPdfGeneratorTests(new Uint8Array(templateBytes));
  const solicitudMod = await server.ssrLoadModule('/src/__tests__/solicitudForm.test.tsx');
  await solicitudMod.runSolicitudFormTests();
} finally {
  await server.close();
}
