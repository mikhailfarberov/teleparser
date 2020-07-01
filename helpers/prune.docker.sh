#!/bin/bash
docker images | awk '{if ($1 == "<none>") print $3}' | xargs docker rmi --force