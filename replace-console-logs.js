const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_DIR = './frontend/src';
const BACKEND_DIR = './backend';
const EXCLUDE_DIRS = ['node_modules', '.git', 'build', 'dist', 'logs', 'uploads'];
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to replace
const REPLACEMENTS = {
  // Frontend replacements
  frontend: {
    'console.log(': 'logger.log(',
    'console.warn(': 'logger.warn(',
    'console.error(': 'logger.error(',
    'console.info(': 'logger.info(',
    'console.debug(': 'logger.debug(',
  },
  // Backend replacements
  backend: {
    'console.log(': 'logger.log(',
    'console.warn(': 'logger.warn(',
    'console.error(': 'logger.error(',
    'console.info(': 'logger.info(',
    'console.debug(': 'logger.debug(',
  }
};

// Import statements to add
const IMPORTS = {
  frontend: "import logger from '../utils/logger';",
  backend: "const logger = require('../utils/logger');"
};

function shouldProcessFile(filePath) {
  // Check if file has allowed extension
  const ext = path.extname(filePath);
  if (!INCLUDE_EXTENSIONS.includes(ext)) return false;
  
  // Check if file is in excluded directory
  const relativePath = path.relative(process.cwd(), filePath);
  for (const excludeDir of EXCLUDE_DIRS) {
    if (relativePath.includes(excludeDir)) return false;
  }
  
  return true;
}

function getFilesRecursively(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_DIRS.includes(item)) {
          traverse(fullPath);
        }
      } else if (shouldProcessFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function addImportIfNeeded(content, filePath, type) {
  // Check if logger import already exists
  const hasLoggerImport = content.includes('logger') && 
    (content.includes('from') || content.includes('require'));
  
  if (hasLoggerImport) return content;
  
  // Check if file uses console statements
  const hasConsoleUsage = /console\.(log|warn|error|info|debug)\s*\(/.test(content);
  if (!hasConsoleUsage) return content;
  
  // Determine correct import path
  const relativePath = path.relative(path.dirname(filePath), 
    type === 'frontend' ? './frontend/src/utils' : './backend/utils');
  const importPath = relativePath.replace(/\\/g, '/') + '/logger';
  
  let importStatement;
  if (type === 'frontend') {
    importStatement = `import logger from '${importPath}';\n`;
  } else {
    importStatement = `const logger = require('${importPath}');\n`;
  }
  
  // Add import after existing imports
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find last import/require statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import ') || lines[i].includes('require(')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      break;
    }
  }
  
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

function replaceConsoleStatements(content, type) {
  let modifiedContent = content;
  const replacements = REPLACEMENTS[type];
  
  for (const [search, replace] of Object.entries(replacements)) {
    modifiedContent = modifiedContent.replace(new RegExp(search.replace('(', '\\('), 'g'), replace);
  }
  
  return modifiedContent;
}

function processFile(filePath, type) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace console statements
    content = replaceConsoleStatements(content, type);
    
    // Add import if needed
    content = addImportIfNeeded(content, filePath, type);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Starting console.log replacement...');
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  // Process frontend files
  if (fs.existsSync(FRONTEND_DIR)) {
    console.log('\n📁 Processing frontend files...');
    const frontendFiles = getFilesRecursively(FRONTEND_DIR);
    
    for (const file of frontendFiles) {
      totalFiles++;
      if (processFile(file, 'frontend')) {
        modifiedFiles++;
      }
    }
  }
  
  // Process backend files
  if (fs.existsSync(BACKEND_DIR)) {
    console.log('\n📁 Processing backend files...');
    const backendFiles = getFilesRecursively(BACKEND_DIR);
    
    for (const file of backendFiles) {
      totalFiles++;
      if (processFile(file, 'backend')) {
        modifiedFiles++;
      }
    }
  }
  
  console.log(`\n✅ Complete! Modified ${modifiedFiles} out of ${totalFiles} files.`);
  console.log('\n⚠️  Please review the changes and test your application.');
  console.log('💡 You may need to adjust import paths manually in some files.');
}

if (require.main === module) {
  main();
}

module.exports = { main, processFile, replaceConsoleStatements };