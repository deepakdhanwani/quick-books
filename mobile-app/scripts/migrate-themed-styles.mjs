import fs from 'fs';
import path from 'path';

const root = path.resolve('src');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getThemeImportPath(filePath) {
  const rel = path.relative(path.dirname(filePath), path.join(root, 'theme'));
  const normalized = rel.split(path.sep).join('/');
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes("theme/colors")) {
    return false;
  }
  if (content.includes('useThemedStyles')) {
    return false;
  }
  if (!content.includes('StyleSheet.create')) {
    return false;
  }

  const themeImportPath = getThemeImportPath(filePath);
  content = content.replace(
    /import\s+\{\s*colors\s*\}\s+from\s+['"][^'"]*theme\/colors['"];\s*\n?/,
    '',
  );

  const styleMatch = content.match(/\nconst styles = StyleSheet\.create\(\{([\s\S]*?)\}\);\s*$/);
  if (!styleMatch) {
    console.warn(`Skipped (no trailing styles): ${filePath}`);
    return false;
  }

  let styleBody = styleMatch[1];
  styleBody = styleBody.replace(/\bcolors\./g, 'theme.colors.');
  styleBody = styleBody.replace(/fontSize:\s*(\d+)/g, 'fontSize: theme.scaleFont($1)');
  styleBody = styleBody.replace(/lineHeight:\s*(\d+)/g, 'lineHeight: theme.scaleFont($1)');

  content = content.replace(/\nconst styles = StyleSheet\.create\(\{[\s\S]*?\}\);\s*$/, '');

  if (!content.includes("import type { AppTheme }")) {
    const reactNativeImport = content.match(/import\s+\{([^}]+)\}\s+from\s+'react-native';/);
    if (!reactNativeImport) {
      console.warn(`Skipped (no react-native import): ${filePath}`);
      return false;
    }
    const names = reactNativeImport[1];
    if (!names.includes('StyleSheet')) {
      content = content.replace(
        /import\s+\{([^}]+)\}\s+from\s+'react-native';/,
        "import { $1, StyleSheet } from 'react-native';",
      );
    }
    const insertAt = content.indexOf("import {") ;
    const firstImportEnd = content.indexOf('\n', insertAt);
    content =
      content.slice(0, firstImportEnd + 1) +
      `import type { AppTheme } from '${themeImportPath}/types';\n` +
      `import { useThemedStyles } from '${themeImportPath}/useThemedStyles';\n` +
      content.slice(firstImportEnd + 1);
  }

  const exportFnMatch = content.match(/export function (\w+)\([^)]*\)\s*\{/);
  if (!exportFnMatch) {
    console.warn(`Skipped (no export function): ${filePath}`);
    return false;
  }

  const fnName = exportFnMatch[1];
  const fnStart = exportFnMatch.index + exportFnMatch[0].length;
  content =
    content.slice(0, fnStart) +
    '\n  const styles = useThemedStyles(createStyles);\n' +
    content.slice(fnStart);

  content += `\nfunction createStyles(theme: AppTheme) {\n  return {${styleBody}\n  };\n}\n`;

  fs.writeFileSync(filePath, content);
  return true;
}

const files = walk(root);
let migrated = 0;
for (const file of files) {
  if (migrateFile(file)) {
    migrated += 1;
    console.log(`Migrated ${file}`);
  }
}
console.log(`Done. Migrated ${migrated} files.`);
