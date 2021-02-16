# omm

Meme Generator - Online Multimedia - LMU

## Docker

Run the project via docker: 

`docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d`

Client URL: `http://localhost:4200/`

API URL: `http://localhost:3007/`

## Server

By now we are using the package `canvas` to generate the meme image.
Install dependency packages:

`sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

Install MongoDB: `https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/`

Run MongoDB:

`sudo mongod --bind_ip localhost`

Install node dependencies:

`cd server && npm i`

Run the server:

`nodemon app.js`

## Client

Our client is built on Angular. In order to start it, run the following commands:

`cd client && npm i`

`ng serve`

