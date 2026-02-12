#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Color mappings: old -> new
const colorMappings = [
  // Purple -> Red
  { from: /bg-purple-600\b/g, to: 'bg-red-600' },
  { from: /bg-purple-500\b/g, to: 'bg-red-600' },
  { from: /bg-purple-400\b/g, to: 'bg-red-600' },
  { from: /text-purple-600\b/g, to: 'text-red-600' },
  { from: /text-purple-500\b/g, to: 'text-red-600' },
  { from: /text-purple-400\b/g, to: 'text-red-600' },
  { from: /border-purple-600\b/g, to: 'border-red-600' },
  { from: /border-purple-500\b/g, to: 'border-red-600' },
  { from: /border-purple-400\b/g, to: 'border-red-600' },
  
  // Purple with opacity -> Red with opacity
  { from: /bg-purple-600\/25/g, to: 'bg-red-600/20' },
  { from: /bg-purple-600\/20/g, to: 'bg-red-600/20' },
  { from: /bg-purple-500\/20/g, to: 'bg-red-600/20' },
  { from: /bg-purple-900\/20/g, to: 'bg-red-600/20' },
  { from: /bg-purple-900\/30/g, to: 'bg-red-600/20' },
  { from: /bg-purple-900\/40/g, to: 'bg-red-600/20' },
  { from: /bg-purple-900\/10/g, to: 'bg-red-600/10' },
  
  // Border purple with opacity -> Gray
  { from: /border-purple-900\/20/g, to: 'border-gray-800' },
  { from: /border-purple-900\/30/g, to: 'border-gray-700' },
  { from: /border-purple-900\/40/g, to: 'border-gray-700' },
  { from: /border-purple-700\/30/g, to: 'border-gray-700' },
  { from: /border-purple-500\/30/g, to: 'border-gray-700' },
  
  // Hover states
  { from: /hover:bg-purple-500\b/g, to: 'hover:bg-red-700' },
  { from: /hover:bg-purple-900\/20/g, to: 'hover:bg-gray-800' },
  { from: /hover:bg-purple-900\/10/g, to: 'hover:bg-gray-800' },
  { from: /hover:text-purple-400/g, to: 'hover:text-red-500' },
  { from: /hover:border-purple-400/g, to: 'hover:border-red-500' },
  { from: /hover:border-purple-500\/30/g, to: 'hover:border-red-600' },
  
  // Focus states
  { from: /focus:ring-purple-500/g, to: 'focus:ring-red-500' },
  { from: /focus:ring-purple-500\/30/g, to: 'focus:ring-red-500/30' },
  { from: /focus:border-purple-500/g, to: 'focus:border-red-500' },
  
  // Shadow
  { from: /shadow-purple-600\/25/g, to: 'shadow-red-600/20' },
  { from: /shadow-purple-900\/10/g, to: 'shadow-black/20' },
  
  // Gradients
  { from: /from-purple-600 to-purple-800/g, to: 'from-red-600 to-red-800' },
  { from: /from-purple-900\/40/g, to: 'from-red-900/20' },
  { from: /to-purple-800\/20/g, to: 'to-red-900/10' },
  
  // Custom dark colors -> Standard hex
  { from: /bg-dark-50\b/g, to: 'bg-[#0a0a0a]' },
  { from: /bg-dark-100\b/g, to: 'bg-[#0d0d0d]' },
  { from: /bg-dark-200\b/g, to: 'bg-[#141414]' },
  { from: /bg-dark-300\b/g, to: 'bg-[#1a1a1a]' },
  { from: /bg-dark-400\b/g, to: 'bg-[#1f1f1f]' },
  { from: /bg-dark-500\b/g, to: 'bg-[#262626]' },
  
  // Border custom dark
  { from: /border-dark-300/g, to: 'border-[#1a1a1a]' },
  
  // Text custom dark
  { from: /text-dark-400/g, to: 'text-gray-400' },
];

const srcDir = path.join(__dirname, '..', 'src');
let filesProcessed = 0;
let filesChanged = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let hasChanges = false;

  for (const mapping of colorMappings) {
    if (mapping.from.test(newContent)) {
      newContent = newContent.replace(mapping.from, mapping.to);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesChanged++;
    console.log(`  ✓ ${path.relative(process.cwd(), filePath)}`);
  }
  
  filesProcessed++;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(filePath);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      processFile(filePath);
    }
  }
}

console.log('🔧 Fixing UI colors...\n');
walkDir(srcDir);

console.log(`\n✅ Done! Processed ${filesProcessed} files, changed ${filesChanged} files.`);
console.log('\n🎨 Standard color palette:');
console.log('   • Background: #0a0a0a (main), #0d0d0d (header), #1a1a1a (cards)');
console.log('   • Accent: red-600');
console.log('   • Text: white (primary), gray-400 (secondary)');
console.log('   • Borders: gray-800, gray-700');
