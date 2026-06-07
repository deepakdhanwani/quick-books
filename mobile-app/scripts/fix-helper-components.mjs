import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.name.endsWith('.tsx')) files.push(fullPath);
  }
  return files;
}

const root = path.resolve('src');

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  content = content.replace(/theme\.theme\.colors/g, () => {
    changed = true;
    return 'theme.colors';
  });

  const helperPatterns = [
    /function getAvatarColor\(active: boolean\) \{\s*return active \? theme\.colors\.(\w+) : theme\.colors\.(\w+);\s*\}/g,
    /function statusColor\(status\?: [^\)]+\) \{\s*if \(status === 'ACTIVE'\) return theme\.colors\.(\w+);\s*if \(status === 'EXPIRED'\) return theme\.colors\.(\w+);\s*return theme\.colors\.(\w+);\s*\}/g,
  ];

  content = content.replace(
    /function getAvatarColor\(active: boolean\) \{\s*return active \? theme\.colors\.(\w+) : theme\.colors\.(\w+);\s*\}/g,
    'function getAvatarColor(active: boolean, colors: AppTheme["colors"]) {\n  return active ? colors.$1 : colors.$2;\n}',
  );
  if (content !== fs.readFileSync(file, 'utf8')) changed = true;

  const beforeStatus = content;
  content = content.replace(
    /function statusColor\(status\?: SubscriberAccountProfile\['subscriptionStatus'\]\) \{\s*if \(status === 'ACTIVE'\) return theme\.colors\.(\w+);\s*if \(status === 'EXPIRED'\) return theme\.colors\.(\w+);\s*return theme\.colors\.(\w+);\s*\}/,
    'function statusColor(status: SubscriberAccountProfile[\'subscriptionStatus\'] | undefined, colors: AppTheme["colors"]) {\n  if (status === \'ACTIVE\') return colors.$1;\n  if (status === \'EXPIRED\') return colors.$2;\n  return colors.$3;\n}',
  );
  if (content !== beforeStatus) changed = true;

  const fnRegex = /^function ([A-Z][A-Za-z0-9_]*)\([^)]*\)[^{]*\{/gm;
  let match;
  const inserts = [];
  while ((match = fnRegex.exec(content)) !== null) {
    const fnName = match[1];
    if (fnName === 'createStyles') continue;
    const fnStart = match.index + match[0].length;
    const fnBody = content.slice(fnStart, fnStart + 400);
    if (!fnBody.includes('styles.')) continue;
    if (fnBody.includes('useThemedStyles(createStyles)')) continue;
    inserts.push({ fnStart, fnName });
  }

  for (const insert of inserts.reverse()) {
    content =
      content.slice(0, insert.fnStart) +
      '\n  const styles = useThemedStyles(createStyles);\n' +
      content.slice(insert.fnStart);
    changed = true;
  }

  if (changed) {
    if (!content.includes('useThemedStyles')) {
      const themeImportPath = path
        .relative(path.dirname(file), path.join(root, 'theme'))
        .split(path.sep)
        .join('/');
      const normalized = themeImportPath.startsWith('.') ? themeImportPath : `./${themeImportPath}`;
      const firstImportEnd = content.indexOf('\n', content.indexOf('import ')) + 1;
      content =
        content.slice(0, firstImportEnd) +
        `import { useThemedStyles } from '${normalized}/useThemedStyles';\n` +
        content.slice(firstImportEnd);
    }
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}
