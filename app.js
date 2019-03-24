const express = require('express')
const app = express()
const port = 3000
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const bodyparser = require("body-parser");
var multer = require('multer');
var upload = multer({ dest: 'public/uploads' })

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
'https://www.googleapis.com/auth/drive.appdata'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
app.use(bodyparser.urlencoded({extended: true}));
//app.use(express.static(__dirname, 'public'));
app.set('view engine', 'ejs');

app.get('/mydocs', (req, res) => {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), (auth) => {
            listFilesWithCallback(auth, (listFilesErr, listFilesRes) => {
                if (listFilesErr) return console.log('The API returned an error: ' + listFilesErr);
                
                const files = listFilesRes.data.files;
                if (files.length) {
                    console.log('Files:');
                    files.map((file) => {
                        console.log(`${file.name} (${file.id})`);
                    });
                    res.render('secretdoc', {
                        filesForFrontEnd: files
                    })
                } else {
                    console.log('No files found.');
                    res.send('no files found');
                }
            });
        });        
    });
});
/**
 * Inserts document on button click
 */
app.post('/mydocs', upload.single('file'), (req,res) => {
     // Load client secrets from a local file.
     console.log(req.file.filename);
     console.log(req.file.originalname);
     fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), (auth) => {
            const drive = google.drive({version: 'v3', auth});
            var fileMetadata = {
            'name': req.file.originalname,
            'parents': ['appDataFolder']
          };
          var media = {
            mimeType: 'application/json',
            body: fs.createReadStream("public/uploads/" + req.file.filename)
          };
          drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
          }, function (err, file) {
            if (err) {
              // Handle error
              console.error(err);
            } else {
              console.log('Folder Id:', file.data.id);
            }
            res.send("yay");
          });
        });        
    });
    
      
});




app.get('/', (req, res) => {

 res.render('index');

 })




/**************************************************************************************************Helper Methods */
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 100 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    spaces: 'appDataFolder',
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
});
}

function listFilesWithCallback(auth, callback) {
    const drive = google.drive({version: 'v3', auth});
    drive.files.list({
      spaces: 'appDataFolder',
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
    }, callback);
  }


/**
 * ****************************************************************************************functions to remove a document
 */

/**
 * Permanently delete a file, skipping the trash.
 *
 * @param {String} fileId ID of the file to delete.
 */
/*function deleteFile(fileId) {
    var request = gapi.client.drive.files.delete({
      'fileId': fileId
    });
    request.execute(function(resp) { });
  }*/

app.listen(port, () => console.log(`Example app listening on port ${port}!`))