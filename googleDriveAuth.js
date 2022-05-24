
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');

const {google} = require('googleapis');
const people = google.docs('v1')

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

async function runSample() {
  // retrieve user profile
  const res = await people.documents.get({
    documentId: '16y8mUU2QAlNGlraNth-wKJPwKcz8GVaOcRyiPi6RSuU'
  });
  console.log(res.data)
  console.log(res.data.body.content[1].paragraph.elements);
}
//creating a foler
async function createFolder(callback){
  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
  }); 
  var fileMetadata = {
    'name': 'n2news/blog',
    'mimeType': 'application/vnd.google-apps.folder'
  };
  await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  }, async function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('Folder Id: ', file.data.id);
      await callback(file.data.id)
    }
  });
  }

async function postText({content,parentId}) {
  console.log("postText___", parentId)
  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
  }); 
  const title = content.date ? content.date + '_' + content.title : content.title;

  const res =  await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'text/html',
      parents: [parentId]
    },
    media: {
      mimeType: 'text/html',
      body: (content.article)
      }
  });
  console.log(res)
}

const scopes = [
  'https://www.googleapis.com/auth/drive'
];
authenticate(scopes)
  .then(client => runSample(client))
  .catch(console.error);

module.exports = {
  postText,
  createFolder
}