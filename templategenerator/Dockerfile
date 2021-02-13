FROM mongo:latest
  COPY . .  
  CMD mongoimport --collection meme-templates --file template.json --jsonArray --uri "mongodb://mongo:27017/omm"