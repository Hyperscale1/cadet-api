# Use the official Node.js LTS image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app source code
COPY . .

# Ensure the responses directory exists at container start
RUN mkdir -p responses

# Expose the app port
EXPOSE 3000

# Start the app
CMD [ "node", "app.js" ]
