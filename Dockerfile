# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files
COPY ./server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm install

#Copy the entire project into the container
WORKDIR /app
COPY . .

# Set environment variables (optional, or can be overridden by docker-compose)
ENV PORT=5003

# Expose the port to access your app
EXPOSE 5003

# Define the command to run your server
CMD ["node", "server/server.js"]
