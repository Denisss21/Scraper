const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');

const {google} = require('googleapis');
const blog = process.env.BLOG;

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, 'oauth2.keys.json');
let keys = {redirect_uris: ['']};
if (fs.existsSync(keyPath)) {
    keys = require(keyPath).web;
}

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
    keys.client_id,
    keys.client_secret,
    keys.redirect_uris[0]
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({auth: oauth2Client});

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate(scopes) {
    return new Promise((resolve, reject) => {
        // grab the url that will be used for authorization
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes.join(' '),
        });
        const server = http
            .createServer(async (req, res) => {
                try {
                    if (req.url.indexOf('/oauth2callback') > -1) {
                        const qs = new url.URL(req.url, 'http://localhost:3000')
                            .searchParams;
                        res.end('Authentication successful! Please return to the console.');
                        server.destroy();
                        const {tokens} = await oauth2Client.getToken(qs.get('code'));
                        oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
                        resolve(oauth2Client);

                        oauth2Client.on('tokens', (tokens) => {
                            if (tokens.refresh_token) {
                                // store the refresh_token in my database!
                                console.log(tokens.refresh_token);
                            }
                            console.log(tokens.access_token);
                        });
                    }
                } catch (e) {
                    reject(e);
                }
            })
            .listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
            });
        destroyer(server);
    });
}

//creating a folder
async function createFolder(name, parentId) {
    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    });
    let fileMetadata;
    fileMetadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parentId]
    };
    const folderObj =  await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
    });
    return folderObj.data.id;
}

async function createDoc({article, parentId}) {
    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    });
    const title = article.date ? article.date + ' ' + article.title : article.title;

    await drive.files.create({
        requestBody: {
            name: title,
            mimeType: 'text/html',
            parents: [parentId]
        },
        media: {
            mimeType: 'text/html',
            body: (article.content)
        }
    });
}

const scopes = [
    'https://www.googleapis.com/auth/drive'
];

authenticate(scopes)
    .then(async () => {
        switch (blog) {
            case 'n2ws':
                const rootFolderId = await createFolder('n2ws/blog');
                const rawdata = fs.readFileSync('n2ws.json');
                const articles = JSON.parse(rawdata);
                const categories = new Set(articles.map(article => article.category));
                const categoriesDict = {};
                for (const category of categories) {
                    categoriesDict[category] = await createFolder(category, rootFolderId);
                }
                for (const article of articles) {
                    await createDoc({article, parentId: categoriesDict[article.category]})
                }
                break;
            default:
                console.error('Please specify blog to scrap: n2ws, clumio');
        }
        //
        // for (const article of articles) {
        //     await createDoc({article, parentId: folderId})
        // }
    })
    .catch(console.error);
