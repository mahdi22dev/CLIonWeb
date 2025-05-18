#!/bin/bash

printf "\n\n\n hello"
git pull

echo "Building server"
docker-compose -f ./server/docker-compose.yml up -d --build

echo "Building client"
docker-compose -f ./terminal/docker-compose.yml up -d --build 

