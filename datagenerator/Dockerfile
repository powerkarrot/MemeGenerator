FROM mongo:latest
  COPY . .
  CMD mongoimport --collection memes --file memesdata.json --jsonArray --uri "mongodb://mongo:27017/omm"