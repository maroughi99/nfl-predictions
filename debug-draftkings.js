// Debug script to inspect DraftKings HTML structure
const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugDK() {
  let browser;
  try {
    console.log('🔍 Launching browser to inspect DraftKings...');
    
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://sportsbook.draftkings.com/leagues/basketball/nba';
    console.log(`📄 Loading ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('⏳ Waiting 8 seconds for content to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Save full HTML for inspection
    const html = await page.content();
    fs.writeFileSync('draftkings-page.html', html);
    console.log('✅ Saved page HTML to draftkings-page.html');
    
    // Get sample of text content
    const textSample = await page.evaluate(() => {
      const samples = [];
      
      // Try different selectors
      const selectors = [
        'table',
        '[class*="event"]',
        '[class*="game"]', 
        '[class*="sportsbook"]',
        '[class*="parlay"]',
        'tbody tr'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          samples.push({
            selector: selector,
            count: elements.length,
            firstElementText: elements[0]?.innerText?.substring(0, 500) || 'No text',
            firstElementHTML: elements[0]?.innerHTML?.substring(0, 500) || 'No HTML'
          });
        }
      });
      
      return samples;
    });
    
    console.log('\n📊 Element Analysis:');
    textSample.forEach(sample => {
      console.log(`\n  Selector: ${sample.selector}`);
      console.log(`  Count: ${sample.count}`);
      console.log(`  Sample text: ${sample.firstElementText.substring(0, 200)}`);
      console.log(`  ---`);
    });
    
    console.log('\n✋ Browser will stay open for 60 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) {
      await browser.close();
    }
  }
}

debugDK();
