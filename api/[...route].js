import { createBffRuntime } from '../server/index.js';

let runtimePromise = null;

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = createBffRuntime({
      configOverrides: {
        serverless: true,
        jobsEnabled: false,
        backupEnabled: false
      }
    }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }

  return runtimePromise;
}

export default async function handler(req, res) {
  const runtime = await getRuntime();
  await runtime.handler(req, res);
}
