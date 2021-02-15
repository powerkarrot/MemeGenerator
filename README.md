# omm

Final Project - Online Multimedia - LMU

## Server

By now we are using the package `canvas` to generate the meme image.
You need to install all its dependencies listed on the npm page.
On Ubuntu, you additionally need to run these commands:

`sudo apt install libjpeg-dev`

`sudo apt install libgif-dev`

Install MongoDB and run this command to start it:

`sudo mongod --bind_ip localhost`

Install node dependencies:

`cd server`

`npm i`

Run the server:

`nodemon app.js`

## Client

Our client is built on Angular. In order to start it, run the following commands:

`cd client`

`npm i`

`ng serve`

