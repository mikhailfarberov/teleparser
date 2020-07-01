#!/bin/bash

tar cvzf tgui.tar.gz --exclude='app/fe/node_modules/*' --exclude='app/telethon/__pycache__/*' --exclude='app/be/node_modules/*' .
