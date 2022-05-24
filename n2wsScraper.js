const fs = require('fs');

const n2wsScraper = {
    url: 'https://n2ws.com/blog',
    async scrape(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);

        let scrapedData = [];

        async function scrapeCurrentPage() {
            await page.waitForSelector('.elementor-post__card');
            const articles = await page.$$eval('.elementor-post__card', async (elArr) => {
                // Extract the links from the data
                return elArr.map(el => {
                    const url = el.querySelector('h3 > a').href;
                    const dateRaw = el.querySelector('.elementor-post-date').textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");

                    let date = '';
                    if (dateRaw) {
                        const parsedDate = new Date(Date.parse(dateRaw));
                        const offset = parsedDate.getTimezoneOffset()
                        const offsetDate = new Date(parsedDate.getTime() - (offset*60*1000))

                        date = offsetDate.toISOString().split('T')[0];
                    }
                    return {url, date}
                });
            });

            // Loop through each of those links, open a new page instance and get the relevant data from them
            async function getArticleData(articleObj) {
                const articlePage = await browser.newPage();
                await articlePage.goto(articleObj.url);

                articleObj['content'] = await articlePage.evaluate(() => {
                    const element = document.querySelector('.elementor-widget-theme-post-content');
                    return element ? element.innerHTML : '';
                });

                articleObj['title'] = await articlePage.evaluate(() => {
                    const element = document.querySelector('h1.elementor-heading-title');
                    return element ? element.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "") : '';
                });

                articleObj['author'] = await articlePage.evaluate(() => {
                    const element = document.querySelector('.elementor-author-box__name');
                    return element ? element.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "") : '';
                });

                articleObj['category'] = await articlePage.evaluate(() => {
                    const element = document.querySelector('.elementor-post-info__terms-list-item');
                    return element ? element.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "") : 'Other';
                });
                await articlePage.close();
            }

            for (const article of articles) {
                await getArticleData(article);
                scrapedData.push(article);
            }

            async function scrapeNextPage() {
                let nextButtonExist;
                try{
                    await page.$eval('.next', a => a.textContent);
                    nextButtonExist = true;
                }
                catch(err){
                    nextButtonExist = false;
                }
                if(nextButtonExist){
                    await page.click('.next');
                    return scrapeCurrentPage(); // Call this function recursively
                }
            }

            // await scrapeNextPage();
            await page.close();
        }

        await scrapeCurrentPage();

        // stringify JSON Object
        let jsonContent = JSON.stringify(scrapedData);

        fs.writeFile("n2ws.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been saved.");
        });
    }
}

module.exports = n2wsScraper;
