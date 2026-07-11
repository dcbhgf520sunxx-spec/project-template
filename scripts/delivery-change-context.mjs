function routeRoots(source = '') {
  return new Set([...source.matchAll(/path:\s*'([^/'][^']*)'/g)]
    .map((match) => match[1])
    .filter((route) => !route.startsWith('samples/') && !route.startsWith('system/'))
    .map((route) => `/${route.split('/')[0]}`));
}

export function resolveDeliveryChangeContext({
  currentRoutes,
  baseRoutes = '',
  statusOutput = '',
  hasGitBaseline
}) {
  if (!hasGitBaseline) return { changedFiles: [], changedRouteRoots: [] };

  const beforeRouteRoots = routeRoots(baseRoutes);
  return {
    changedFiles: statusOutput
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(3)),
    changedRouteRoots: [...routeRoots(currentRoutes)].filter((route) => !beforeRouteRoots.has(route))
  };
}
