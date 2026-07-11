import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const rootDir = new URL('..', import.meta.url).pathname;
const apiDirArgIndex = process.argv.indexOf('--api-dir');
const apiDir = apiDirArgIndex >= 0 ? process.argv[apiDirArgIndex + 1] : join(rootDir, 'src/api');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return /Api\.tsx?$/.test(name) ? [path] : [];
  });
}

function requestMethod(node) {
  const requestCall = node.arguments[0];
  if (!requestCall || !ts.isCallExpression(requestCall) || !ts.isPropertyAccessExpression(requestCall.expression)) return '';
  return requestCall.expression.expression.getText() === 'request' ? requestCall.expression.name.text : '';
}

function returnTypeText(node, sourceFile) {
  return node.typeArguments?.[0]?.getText(sourceFile) || '';
}

const findings = [];

for (const file of walk(apiDir)) {
  const source = readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'unwrap') {
      const method = requestMethod(node);
      const typeText = returnTypeText(node, sourceFile);
      const hasContract = node.arguments.length >= 2;
      const isArray = typeText.endsWith('[]') || typeText.startsWith('Array<');
      const needsContract = method === 'get' || (method && typeText && typeText !== 'null');
      if (needsContract && !hasContract) {
        const reason = method === 'get'
          ? isArray
            ? '读取数组接口必须声明 arrayContract 运行时契约'
            : '读取接口必须声明运行时契约'
          : '写入接口的对象返回值必须声明运行时契约';
        findings.push({
          file: relative(rootDir, file),
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
          reason
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

console.log('API 契约审计');
console.log(`扫描文件：${walk(apiDir).length}`);
console.log(`阻断项：${findings.length}`);
for (const finding of findings) {
  console.log(`BLOCK ${finding.file}:${finding.line} unwrap ${finding.reason}`);
}
if (findings.length > 0) process.exitCode = 1;
