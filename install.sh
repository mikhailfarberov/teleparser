#!/bin/bash

# Teleparser installer
if [ -z "$1" ]; then
    STATE_PATH=`pwd`/state
else
    STATE_PATH=$1
fi

if [ ! -d $STATE_PATH ]; then
    mkdir -p $STATE_PATH
    mkdir $STATE_PATH/downloads
    mkdir $STATE_PATH/instagram
    mkdir $STATE_PATH/sqlite
    mkdir $STATE_PATH/telegram
    mkdir $STATE_PATH/vk
    echo 'teleparser:$apr1$0lzywxiv$ZmctqegkS1BxSUPUoXsCb1' > $STATE_PATH/auth.conf
    echo "State directory has been created"
else
    echo "State directory already exists"
fi
