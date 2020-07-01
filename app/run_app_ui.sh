#!/bin/bash
nginx
cd /usr/local/tgui/be
python3 publisher.py >/var/log/publisher.log &
python3 app.py
