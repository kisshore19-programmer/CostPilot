// Quick script to check if backend dependencies are installed
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeModulesPath = path.resolve(__dirname, 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ Backend dependencies are NOT installed!');
  console.log('\n📦 Please run: cd backend && npm install');
  process.exit(1);
} else {
  console.log('✅ Backend dependencies are installed');

  // Check for critical dependencies
  const criticalDeps = ['express', 'cors'];
  let allPresent = true;

  for (const dep of criticalDeps) {
    const depPath = path.resolve(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      console.error(`❌ Missing dependency: ${dep}`);
      allPresent = false;
    }
  }

  if (allPresent) {
    console.log('✅ All critical dependencies are present');
    process.exit(0);
  } else {
    console.log('\n📦 Please run: cd backend && npm install');
    process.exit(1);
  }
}
