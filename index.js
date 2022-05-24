const browserObject = require('./browser');
const scraperController = require('./scraperController');

const blog = process.env.BLOG;

(async () => {
    //Start the browser and create a browser instance
    let browserInstance = browserObject.startBrowser();

    // Pass the browser instance to the scraper controller
    await scraperController(browserInstance, blog)
})();

