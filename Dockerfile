FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package.json yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

CMD [ "node", "index.js" ]

