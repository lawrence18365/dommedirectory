#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const issues = {
  critical: [],
  warnings: [],
  todos: [],
  placeholders: [],
  improvements: []
};

// Patterns to search for
const PATTERNS = {
  todo: /TODO|FIXME|HACK|XXX|BUG/i,
  placeholder: /test test|lorem ipsum|placeholder|example\.com|your@email|000-000-0000|\btest\b.*\btest\b/i,
  mockData: /mock|dummy|fake.*data/i,
  emptyFunction: /function\s+\w+\s*\(\)\s*\{\s*\}/,
  hardcoded: /hardcoded|temp|temporary/i,
  consoleLog: /console\.(log|warn|error|debug)\(/,
  unimplemented: /not implemented|coming soon|under construction/i
};

function scanFile(filePath, content) {
  const lines = content.split('\n');
  const basename = path.basename(filePath);
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for TODOs
    if (PATTERNS.todo.test(line)) {
      issues.todos.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: 'TODO/FIXME'
      });
    }
    
    // Check for placeholder text
    if (PATTERNS.placeholder.test(line)) {
      issues.placeholders.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: 'Placeholder'
      });
    }
    
    // Check for mock data
    if (PATTERNS.mockData.test(line) && !line.includes('//')) {
      issues.warnings.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: 'Mock Data'
      });
    }
    
    // Check for console.log
    if (PATTERNS.consoleLog.test(line) && !line.includes('//')) {
      issues.warnings.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: 'Console Statement'
      });
    }
    
    // Check for hardcoded values
    if (PATTERNS.hardcoded.test(line)) {
      issues.warnings.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: 'Hardcoded'
      });
    }
  });
}

function checkEmptyPages() {
  const pagesDir = path.join(process.cwd(), 'src/pages');
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if page is essentially empty
        const hasContent = content.length > 500;
        const hasRealContent = !content.includes('Coming Soon') && 
                               !content.includes('Under Construction') &&
                               !content.includes('Placeholder');
        
        if (!hasContent || !hasRealContent) {
          issues.improvements.push({
            file: fullPath.replace(process.cwd(), ''),
            line: 0,
            content: 'Page needs more content',
            type: 'Empty/Incomplete Page'
          });
        }
        
        scanFile(fullPath.replace(process.cwd(), ''), content);
      }
    });
  }
  
  scanDir(pagesDir);
}

function checkEnvironmentVariables() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    issues.critical.push({
      file: '.env.local',
      line: 0,
      content: 'Missing .env.local file',
      type: 'Missing Config'
    });
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const placeholderVars = [
    'your_',
    'placeholder',
    'example',
    'change_me',
    'YOUR_'
  ];
  
  const lines = envContent.split('\n');
  lines.forEach((line, index) => {
    placeholderVars.forEach(placeholder => {
      if (line.includes(placeholder) && !line.startsWith('#')) {
        issues.placeholders.push({
          file: '.env.local',
          line: index + 1,
          content: line.trim(),
          type: 'Placeholder Env Value'
        });
      }
    });
  });
}

function checkPackageJson() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Check for missing scripts
  const importantScripts = ['build', 'dev', 'start', 'lint'];
  importantScripts.forEach(script => {
    if (!pkg.scripts[script]) {
      issues.warnings.push({
        file: 'package.json',
        line: 0,
        content: `Missing script: ${script}`,
        type: 'Missing Script'
      });
    }
  });
  
  // Check for common dependencies
  const importantDeps = ['react', 'next', 'supabase-js'];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  Object.keys(allDeps).forEach(dep => {
    if (allDeps[dep].includes('^0.0.0') || allDeps[dep].includes('0.0.0')) {
      issues.warnings.push({
        file: 'package.json',
        line: 0,
        content: `Suspicious version for ${dep}: ${allDeps[dep]}`,
        type: 'Dependency Version'
      });
    }
  });
}

function checkDatabaseMigrations() {
  const migrationsPath = path.join(process.cwd(), 'supabase-migration.sql');
  
  if (!fs.existsSync(migrationsPath)) {
    issues.critical.push({
      file: 'supabase-migration.sql',
      line: 0,
      content: 'Missing database migration file',
      type: 'Missing Database Schema'
    });
  }
}

function checkREADME() {
  const readmePath = path.join(process.cwd(), 'README.md');
  
  if (!fs.existsSync(readmePath)) {
    issues.warnings.push({
      file: 'README.md',
      line: 0,
      content: 'Missing README.md',
      type: 'Missing Documentation'
    });
    return;
  }
  
  const content = fs.readFileSync(readmePath, 'utf8');
  
  if (content.length < 500) {
    issues.improvements.push({
      file: 'README.md',
      line: 0,
      content: 'README is too short - needs more documentation',
      type: 'Incomplete Documentation'
    });
  }
  
  if (!content.includes('Installation') && !content.includes('Getting Started')) {
    issues.improvements.push({
      file: 'README.md',
      line: 0,
      content: 'README missing installation/setup instructions',
      type: 'Missing Documentation'
    });
  }
}

function checkServices() {
  const servicesDir = path.join(process.cwd(), 'src/services');
  
  if (!fs.existsSync(servicesDir)) {
    return;
  }
  
  const files = fs.readdirSync(servicesDir);
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(servicesDir, file), 'utf8');
      
      // Check for empty service functions
      const hasAsyncFunctions = content.includes('async');
      const hasReturnStatements = content.includes('return');
      
      if (hasAsyncFunctions && !hasReturnStatements) {
        issues.warnings.push({
          file: `src/services/${file}`,
          line: 0,
          content: 'Service file has async functions but may be missing return statements',
          type: 'Incomplete Service'
        });
      }
    }
  });
}

function checkComponents() {
  const componentsDir = path.join(process.cwd(), 'src/components');
  
  if (!fs.existsSync(componentsDir)) {
    return;
  }
  
  function scanComponents(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanComponents(fullPath);
      } else if (item.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for components with no props validation
        if (content.includes('export default') && !content.includes('PropTypes')) {
          // This is just a suggestion, not an issue
        }
        
        scanFile(fullPath.replace(process.cwd(), ''), content);
      }
    });
  }
  
  scanComponents(componentsDir);
}

function printResults() {
  log('\n' + '═'.repeat(60), 'cyan');
  log('PROJECT AUDIT RESULTS', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  // Critical Issues
  if (issues.critical.length > 0) {
    log('\n🔴 CRITICAL ISSUES (' + issues.critical.length + ')', 'red');
    log('─'.repeat(60), 'red');
    issues.critical.forEach(issue => {
      log(`\nFile: ${issue.file}:${issue.line}`, 'red');
      log(`Type: ${issue.type}`, 'yellow');
      log(`Issue: ${issue.content.substring(0, 100)}${issue.content.length > 100 ? '...' : ''}`, 'gray');
    });
  }
  
  // Placeholders
  if (issues.placeholders.length > 0) {
    log('\n\n🟡 PLACEHOLDER CONTENT (' + issues.placeholders.length + ')', 'yellow');
    log('─'.repeat(60), 'yellow');
    issues.placeholders.forEach(issue => {
      log(`\nFile: ${issue.file}:${issue.line}`, 'cyan');
      log(`Content: ${issue.content.substring(0, 80)}${issue.content.length > 80 ? '...' : ''}`, 'gray');
    });
  }
  
  // TODOs
  if (issues.todos.length > 0) {
    log('\n\n🔵 TODOs & FIXMEs (' + issues.todos.length + ')', 'blue');
    log('─'.repeat(60), 'blue');
    issues.todos.forEach(issue => {
      log(`\nFile: ${issue.file}:${issue.line}`, 'cyan');
      log(`Content: ${issue.content.substring(0, 80)}${issue.content.length > 80 ? '...' : ''}`, 'gray');
    });
  }
  
  // Warnings
  if (issues.warnings.length > 0) {
    log('\n\n⚠️  WARNINGS (' + issues.warnings.length + ')', 'yellow');
    log('─'.repeat(60), 'yellow');
    issues.warnings.forEach(issue => {
      log(`\nFile: ${issue.file}:${issue.line}`, 'cyan');
      log(`Type: ${issue.type}`, 'yellow');
      log(`Content: ${issue.content.substring(0, 80)}${issue.content.length > 80 ? '...' : ''}`, 'gray');
    });
  }
  
  // Improvements
  if (issues.improvements.length > 0) {
    log('\n\n💡 SUGGESTED IMPROVEMENTS (' + issues.improvements.length + ')', 'green');
    log('─'.repeat(60), 'green');
    issues.improvements.forEach(issue => {
      log(`\nFile: ${issue.file}`, 'cyan');
      log(`Issue: ${issue.content}`, 'gray');
    });
  }
  
  // Summary
  log('\n\n' + '═'.repeat(60), 'cyan');
  log('SUMMARY', 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`🔴 Critical: ${issues.critical.length}`, issues.critical.length > 0 ? 'red' : 'green');
  log(`🟡 Placeholders: ${issues.placeholders.length}`, issues.placeholders.length > 0 ? 'yellow' : 'green');
  log(`🔵 TODOs: ${issues.todos.length}`, issues.todos.length > 0 ? 'blue' : 'green');
  log(`⚠️  Warnings: ${issues.warnings.length}`, issues.warnings.length > 0 ? 'yellow' : 'green');
  log(`💡 Improvements: ${issues.improvements.length}`, 'green');
  log('═'.repeat(60), 'cyan');
  
  const totalIssues = issues.critical.length + issues.placeholders.length + 
                     issues.todos.length + issues.warnings.length;
  
  if (totalIssues === 0) {
    log('\n✅ No issues found! Project looks good.', 'green');
  } else if (issues.critical.length > 0) {
    log('\n❌ Critical issues found. Please fix before production.', 'red');
    process.exit(1);
  } else {
    log(`\n⚠️  ${totalIssues} issues found. Review recommended.`, 'yellow');
  }
}

// Run the audit
log('🔍 Auditing project...', 'cyan');

checkEmptyPages();
checkEnvironmentVariables();
checkPackageJson();
checkDatabaseMigrations();
checkREADME();
checkServices();
checkComponents();

printResults();
