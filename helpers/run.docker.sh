#!/bin/bash

docker rm teleparser_$1
docker run -it \
 --name teleparser_$1 \
 --publish 8000:80 \
 --publish 9000:9000 \
 --volume `pwd`/state/redis:/var/lib/redis \
 --volume `pwd`/state/sqlite:/var/db/sqlite \
 --volume `pwd`/state/downloads:/usr/local/tgui/downloads \
 --volume `pwd`/state/telegram:/usr/local/tgui/telethon/state \
 --volume `pwd`/state/instagram:/usr/local/tgui/instagram/state \
socslns/teleparser/$1
