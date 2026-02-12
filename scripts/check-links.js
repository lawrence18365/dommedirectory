const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.CHECK_URL || 'http://localhost:3000';
const CONCURRENCY = 5;
const DELAY_MS = 100;

// Track visited and found links
const visited = new Set();
const errors = [];
const pageResults = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if URL is internal
function isInternalLink(url) {
  try {
    const parsed = new URL(url, BASE_URL);
    const base = new URL(BASE_URL);
    return parsed.hostname === base.hostname;
  } catch {
    return false;
  }
}

// Normalize URL
function normalizeUrl(url, baseUrl) {
  try {
    // Remove hash
    url = url.split('#')[0];
    // Remove trailing slash for comparison
    if (url.endsWith('/') && url !== '/') {
      url = url.slice(0, -1);
    }
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

// Fetch URL
async function fetchUrl(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'DommeDirectory-LinkChecker/1.0'
      }
    };

    const req = client.request(options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = normalizeUrl(res.headers.location, url);
        resolve({ status: res.statusCode, url, redirect: redirectUrl });
      } else {
        resolve({ status: res.statusCode, url });
      }
    });

    req.on('error', (err) => {
      resolve({ status: 'ERROR', url, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', url });
    });

    req.end();
  });
}

// Extract links from HTML
function extractLinks(html, baseUrl) {
  const links = new Set();
  
  // href attributes
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const url = normalizeUrl(match[1], baseUrl);
    if (url) links.add(url);
  }
  
  // src attributes
  const srcRegex = /src=["']([^"']+)["']/gi;
  while ((match = srcRegex.exec(html)) !== null) {
    const url = normalizeUrl(match[1], baseUrl);
    if (url) links.add(url);
  }
  
  return Array.from(links);
}

// Get page content
async function getPageContent(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'DommeDirectory-LinkChecker/1.0'
      }
    };

    let data = '';
    const req = client.request(options, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          url,
          content: data,
          contentType: res.headers['content-type']
        });
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

// Process a single URL
async function processUrl(url, sourcePage = null) {
  if (visited.has(url)) return;
  visited.add(url);
  
  const result = await fetchUrl(url);
  
  // Track errors
  if (result.status >= 400 || result.status === 'ERROR' || result.status === 'TIMEOUT') {
    const error = {
      url,
      status: result.status,
      source: sourcePage,
      error: result.error
    };
    errors.push(error);
    log(`  ✗ ${url} (${result.status})`, 'red');
  } else if (result.redirect) {
    log(`  → ${url} (redirect to ${result.redirect})`, 'yellow');
  } else {
    log(`  ✓ ${url} (${result.status})`, 'green');
  }
  
  pageResults.push({
    url,
    status: result.status,
    source: sourcePage,
    type: 'link'
  });
}

// Crawl a page and find all links
async function crawlPage(url) {
  if (visited.has(url)) return [];
  
  log(`\nCrawling: ${url}`, 'blue');
  
  const page = await getPageContent(url);
  if (!page || page.status >= 400) {
    log(`  ✗ Failed to load page (${page?.status || 'ERROR'})`, 'red');
    if (page?.status >= 400) {
      errors.push({ url, status: page.status, source: 'CRAWL' });
    }
    return [];
  }
  
  visited.add(url);
  
  // Only process HTML pages
  if (!page.contentType?.includes('text/html')) {
    return [];
  }
  
  const links = extractLinks(page.content, url);
  const internalLinks = links.filter(isInternalLink);
  
  log(`  Found ${internalLinks.length} internal links`, 'gray');
  
  return internalLinks;
}

// Main crawler
async function crawl() {
  log('╔═══════════════════════════════════════╗', 'blue');
  log('║     DommeDirectory Link Checker       ║', 'blue');
  log('╚═══════════════════════════════════════╝', 'blue');
  log(`\nBase URL: ${BASE_URL}\n`);
  
  const toVisit = [BASE_URL];
  const queue = [];
  
  // Initial crawl to find all pages
  while (toVisit.length > 0) {
    const url = toVisit.shift();
    const links = await crawlPage(url);
    
    for (const link of links) {
      if (!visited.has(link) && !toVisit.includes(link)) {
        // Only crawl HTML pages, not assets
        if (!link.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
          toVisit.push(link);
        }
      }
    }
    
    // Small delay to not overwhelm server
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  // Now check all discovered URLs
  log('\n' + '═'.repeat(50), 'blue');
  log('Checking all discovered URLs...', 'blue');
  log('═'.repeat(50) + '\n', 'blue');
  
  const allUrls = Array.from(visited);
  
  // Process in batches
  for (let i = 0; i < allUrls.length; i += CONCURRENCY) {
    const batch = allUrls.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(url => processUrl(url)));
  }
  
  // Print summary
  printSummary();
}

function printSummary() {
  log('\n' + '═'.repeat(50), 'blue');
  log('SUMMARY', 'blue');
  log('═'.repeat(50), 'blue');
  
  log(`\nTotal URLs checked: ${visited.size}`, 'blue');
  log(`Errors found: ${errors.length}`, errors.length > 0 ? 'red' : 'green');
  
  if (errors.length > 0) {
    log('\n❌ ERRORS:', 'red');
    errors.forEach((err, i) => {
      log(`\n  ${i + 1}. ${err.url}`, 'red');
      log(`     Status: ${err.status}`, 'red');
      if (err.source) {
        log(`     Found on: ${err.source}`, 'gray');
      }
      if (err.error) {
        log(`     Error: ${err.error}`, 'gray');
      }
    });
    
    log('\n' + '═'.repeat(50), 'red');
    log('❌ LINK CHECK FAILED - Errors found!', 'red');
    log('═'.repeat(50), 'red');
    process.exit(1);
  } else {
    log('\n' + '═'.repeat(50), 'green');
    log('✓ ALL LINKS OK - No errors found!', 'green');
    log('═'.repeat(50), 'green');
    process.exit(0);
  }
}

// Run the checker
crawl().catch(err => {
  log(`\nCrawler error: ${err.message}`, 'red');
  process.exit(1);
});
