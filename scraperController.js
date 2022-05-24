const n2wsScraper = require('./n2wsScraper');

async function scrapeAll(browserInstance, blog){
	let browser;
	try{
		browser = await browserInstance;

        switch (blog) {
            case 'n2ws':
                await n2wsScraper.scrape(browser);
                break;
            default:
                console.error('Please specify blog to scrap: n2ws, clumio');
        }
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}

    await browser.close();
}

module.exports = (browserInstance, blog) => scrapeAll(browserInstance, blog)
