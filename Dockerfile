FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn ci

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "index.js" ]

