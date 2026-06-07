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

function getThemeImportPath(filePath, root) {
  const rel = path.relative(path.dirname(filePath), path.join(root, 'theme'));
  const normalized = rel.split(path.sep).join('/');
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

const root = path.resolve('src');
let fixed = 0;

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!/\bcolors\./.test(content)) continue;

  const createStylesIndex = content.indexOf('function createStyles');
  const beforeStyles = createStylesIndex >= 0 ? content.slice(0, createStylesIndex) : content;
  const afterStyles = createStylesIndex >= 0 ? content.slice(createStylesIndex) : '';

  let updatedBefore = beforeStyles.replace(/\bcolors\./g, 'theme.colors.');
  if (updatedBefore === beforeStyles) continue;

  if (!updatedBefore.includes('useAppTheme')) {
    const themeImportPath = getThemeImportPath(file, root);
    if (!updatedBefore.includes("from '../theme/AppThemeContext'") &&
        !updatedBefore.includes('from "../theme/AppThemeContext"')) {
      const importLine = `import { useAppTheme } from '${themeImportPath}/AppThemeContext';\n`;
      const firstImportEnd = updatedBefore.indexOf('\n', updatedBefore.indexOf('import ')) + 1;
      updatedBefore = updatedBefore.slice(0, firstImportEnd) + importLine + updatedBefore.slice(firstImportEnd);
    }

    if (updatedBefore.includes('useThemedStyles(createStyles)')) {
      updatedBefore = updatedBefore.replace(
        'const styles = useThemedStyles(createStyles);',
        'const theme = useAppTheme();\n  const styles = useThemedStyles(createStyles);',
      );
    } else if (/export function \w+\(/.test(updatedBefore)) {
      updatedBefore = updatedBefore.replace(
        /(export function \w+\([^)]*\)\s*\{\n)/,
        '$1  const theme = useAppTheme();\n',
      );
    }
  }

  content = updatedBefore + afterStyles;
  fs.writeFileSync(file, content);
  fixed += 1;
  console.log(`Fixed ${file}`);
}

console.log(`Done. Fixed ${fixed} files.`);
