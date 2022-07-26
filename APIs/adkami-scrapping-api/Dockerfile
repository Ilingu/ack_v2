FROM golang:1.18-alpine

# Installing Chromium
RUN apk add --no-cache chromium

# Create a directory for the app
RUN mkdir /app
 
# Copy all files from the current directory to the app directory
COPY . /app
 
# Set working directory
WORKDIR /app

# Set prod config env variables
ENV APP_MODE=prod \
    PORT=3000

RUN mkdir -p server/bin
# go build will build an executable file named server in the current directory
RUN go build -o ./server/bin/api ./cmd/api

# Run the server executable
CMD [ "/app/server/bin/api" ]