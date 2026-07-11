import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(rootDir, file) {
  const path = join(rootDir, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function paths(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

export function checkDeliveryContract(rootDir, { changedFiles = [], changedRouteRoots = [] } = {}) {
  const errors = [];
  const agents = read(rootDir, 'AGENTS.md');
  const flow = read(rootDir, 'docs/ai-delivery-flow.md');
  const routes = read(rootDir, 'frontend/src/app/routes.tsx');
  const sidebar = read(rootDir, 'frontend/src/layouts/AdminLayout/index.tsx');
  const app = read(rootDir, 'backend/src/app.js');
  const schema = read(rootDir, 'backend/db/init/001_schema.sql');
  const deployReadme = read(rootDir, 'deploy/README.md');
  const nginx = read(rootDir, 'deploy/nginx.conf');

  if (!flow) errors.push('缺少 docs/ai-delivery-flow.md');
  if (!agents.includes('docs/ai-delivery-flow.md')) errors.push('AGENTS.md 未声明 AI 交付流程入口');
  if (!deployReadme.includes('PostgreSQL')) errors.push('部署说明未声明 PostgreSQL');
  if (/^\s*[-*]?\s*MySQL\s*(?:>=|\d)/mi.test(deployReadme) || /mysql\s+-u\s+/i.test(deployReadme)) {
    errors.push('部署说明仍包含过期的 MySQL 配置');
  }
  if (!/^\s*try_files\s+\$uri\s+\$uri\/\s+\/index\.html;/m.test(nginx)) {
    errors.push('Nginx 未配置 React history 路由 fallback');
  }

  const businessRoutes = paths(routes, /path:\s*'([^/'][^']*)'/g)
    .filter((route) => !route.startsWith('samples/') && !route.startsWith('system/'))
    .map((route) => `/${route.split('/')[0]}`);
  const sidebarPaths = new Set(paths(sidebar, /key:\s*'([^']+)'/g).filter((value) => value.startsWith('/')));
  const schemaPaths = new Set(paths(schema, /'((?:\/[A-Za-z0-9_-]+)+)'/g));
  const permissionPaths = paths(app, /checkPermission\('([^']+)'\)/g);
  const routeDirectory = join(rootDir, 'backend/src/routes');

  for (const route of new Set(businessRoutes)) {
    if (!sidebarPaths.has(route)) errors.push(`业务路由 ${route} 未配置侧栏菜单`);
    if (!schemaPaths.has(route)) errors.push(`业务路由 ${route} 未配置 pms_menu.path`);
  }
  for (const permission of permissionPaths) {
    if (!schemaPaths.has(permission)) errors.push(`权限路径 ${permission} 未配置 pms_menu.path`);
  }
  if (existsSync(routeDirectory)) {
    for (const file of readdirSync(routeDirectory).filter((name) => name.endsWith('.js'))) {
      const moduleName = file.slice(0, -3);
      const imported = app.match(new RegExp(`const\\s+(\\w+)\\s*=\\s*require\\(['\"]\\./routes/${moduleName}['\"]\\)`));
      if (!imported || !app.split('\n').some((line) => line.includes(`, ${imported[1]})`))) {
        errors.push(`后端路由 ${file} 未在 app.js 挂载`);
      }
    }
  }
  const migrationFiles = changedFiles.filter((file) => /^backend\/db\/migrations\/[^/]+\.sql$/.test(file));
  if (changedRouteRoots.length && !migrationFiles.length) {
    for (const route of changedRouteRoots) errors.push(`新增业务路由 ${route} 未同时新增 migration`);
  }
  for (const route of changedRouteRoots) {
    if (migrationFiles.length && !migrationFiles.some((file) => read(rootDir, file).includes(route))) {
      errors.push(`新增业务路由 ${route} 的 migration 未写入对应 pms_menu.path`);
    }
  }

  return errors;
}
