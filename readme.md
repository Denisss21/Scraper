# Articles scraper

## Description
This page scraper is built to scrap articles from https://n2ws.com/blog and https://clumio.com/blog/

## Getting started
### Install dependencies
1. npm install
### Scrap articles
1. npm run scrape:n2ws (It will scrap articles from n2ws.com to the n2ws.json file)
2. npm run scrape:clumio (It will scrap articles from clumio.com to the clumio.json file)
### Upload to google drive
To enable upload to google drive please follow the steps below:
1. Generate Google Cloud Oauth client credentials with : https://developers.google.com/workspace/guides/create-credentials#oauth-client-id
2. Set oauth callback as http://localhost:3000/oauth2callback
3. Save them to the root of the project as oauth2.keys.json
4. npm run gdrive:n2ws (It will upload n2ws articles to Google Drive; You will be prompted to provide access to the Google Drive account)
5. npm run gdrive:clumio (It will upload n2ws articles to Google Drive; You will be prompted to provide access to the Google Drive account)
