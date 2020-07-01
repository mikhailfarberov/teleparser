#!/bin/bash

docker build -t socslns/teleparser/$1:latest -f docker/$1/Dockerfile .
