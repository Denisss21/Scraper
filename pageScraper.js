const {postText,createFolder} =require("./googleDriveAuth")

const scraperObject = {
	url: 'https://n2ws.com/blog',
	async scraper(browser){
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		await page.goto(this.url);
        let scrapedData = [];

async function scrapeCurrentPage(){
		
		await page.waitForSelector('.elementor-section-wrap');
        let urls = await page.$$eval('.elementor-post__card', async (links,dates) => {
			// Extract the links from the data
			links = links.map(el => el.querySelector('h3 > a').href)
			dates = dates.map(el => el.querySelector('.elementor-post-date').textContent)
			return {links,dates};           
           	});
               // Loop through each of those links, open a new page instance and get the relevant data from them
			let pagePromise = (link) => new Promise(async(resolve, reject) => {
				let dataObj = {};
				let newPage = await browser.newPage();
				await newPage.goto(link);   
                    try{
					dataObj['article'] = await newPage.$eval('.elementor-widget-theme-post-content', text => text.innerHTML) 
				    dataObj['title'] = await newPage.$eval('h1.elementor-heading-title', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, ""));
				    dataObj['date'] = await newPage.$eval('.elementor-post-info__item--type-date', text =>text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "")); 
					dataObj['author'] = await newPage.$eval('.elementor-author-box__name', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, ""))	
				}
                catch(e){                    
                }
                resolve(dataObj);
				await newPage.close();
				
			});
            for(link in urls){
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData);
            }

			//console.log('Data object',content)
            let nextButtonExist = false;
			// try{
			// 	const nextButton = await page.$eval('.next', a => a.textContent);
			// 	nextButtonExist = true;
			// }
			// catch(err){
			// 	nextButtonExist = false;
			// }
			// if(nextButtonExist){
			// 	await page.click('.next');	
			// 	return scrapeCurrentPage(); // Call this function recursively
            // }
           
		 	await page.close();           
			return scrapedData;           
		}       
		let data = await scrapeCurrentPage();
		//console.log(data);
		//const sortDate = scrapedData.sort((a, b) => a.date - b.date);
        await createFolder(async (parentId) => {
			 console.log("createFolder___parentId", parentId)
			for(const article of scrapedData){
				await postText({content : article,parentId})
			};
		 })
		return data;
    }
	
}



module.exports = scraperObject;