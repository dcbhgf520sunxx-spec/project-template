import { delimiter, dirname } from 'node:path';

export function getNpmCommandEnv(env, nodeExecutable) {
  const nodeBinDir = dirname(nodeExecutable);
  return {
    ...env,
    PATH: [nodeBinDir, env.PATH].filter(Boolean).join(delimiter)
  };
}

export function shouldUseArm64Node({ platform, arch, translated, nodeExists }) {
  return platform === 'darwin' && arch === 'x64' && translated && nodeExists;
}
