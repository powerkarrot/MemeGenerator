# omm

Final Project - Online Multimedia - LMU

## Server

By now we are using the package `nodejs-meme-generator` to generate the meme image.
You need to install all its dependencies listed on the npm page.
On Ubuntu, you additionally need to run these commands:

`sudo apt install libjpeg-dev`

`sudo apt install libgif-dev`

Install MongoDB and run this command to start it:

`sudo mongod --bind_ip localhost`

Install node dependencies:

`cd server`

`npm i`

Apply a workaround in the meme-generator so that it processes local files.
Edit the file `server/node_modules/nodejs-meme-generator/index.js`.


Add this line to the beginning of the file:

`const fs = require('fs')`

Update the method `generateMeme`:

    MemeGenerator.prototype.generateMeme = function (imageOptions) {
        this.setImageOptions(imageOptions);
        return new Promise((resolve, reject) => {
            if (!this.url.includes('http')) {
                let that = this
                fs.readFile(this.url, function(err, data) {
                    if (err) {
                        reject(new Error('The image could not be loaded.'));
                    }
                    that.canvasImg.src = new Buffer(data);
    
                    that.calculateCanvasSize();
                    that.drawMeme();
    
                    resolve(that.canvas.toBuffer());
                })
            } else {
                request.get(this.url, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        this.canvasImg.src = new Buffer(body);
    
                        this.calculateCanvasSize();
                        this.drawMeme();
    
                        resolve(this.canvas.toBuffer());
                    } else {
                        reject(new Error('The image could not be loaded.'));
                    }
                });
            }
	    });
    }

Run the server:

`nodemon app.js`

## Client

Our client is built on Angular. In order to start it, run the following commands:

`cd client`

`npm i`

`ng serve`

