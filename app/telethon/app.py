import sys
from os import listdir, environ
from os.path import isdir, isfile, join, splitext
from distutils.dir_util import mkpath, remove_tree
from telethon import TelegramClient, sync, events
from telethon.tl.types import PeerChannel, MessageMediaWebPage, MessageMediaPhoto, Photo, MessageMediaDocument, Document
import json
import re
from aiostream import stream
from datetime import datetime
import traceback
import asyncio
import requests
import yaml
import time

# settings
if environ.get('box'):
    config_filename = "../config/config-%s.yml" % environ['box']
else:
    config_filename = "../config/config-dev.yml"

try:
    with open(config_filename, 'rt', encoding='utf8') as configFile:
        cfg = yaml.load(configFile, Loader = yaml.SafeLoader)
except FileNotFoundError:
    print('Configuration {} was not found'.format(config_filename), file=sys.stderr)
    sys.exit(1)
except yaml.scanner.ScannerError:
    print('Malformed configuration {}'.format(config_filename), file=sys.stderr)
    sys.exit(1)

# account list
def get_accounts():
    try:
        resp = requests.get(cfg['app']['backend_url'] + '/accounts/tg/')
        if resp.status_code == 200:
            obj = json.loads(resp.text)
            return obj
        else:
            return None
    except Exception as e:
        return None

# download msg media
async def download_media(msg_media_path, msg):
    if isinstance(msg.media, MessageMediaWebPage):
        msg_media_type = msg.media.webpage.type
    elif isinstance(msg.media, (MessageMediaPhoto, Photo)):
        msg_media_type = 'photo'
    elif isinstance(msg.media, (MessageMediaDocument, Document)):
        if msg.media.document.mime_type == 'audio/mpeg':
            msg_media_type = 'audio'
        elif msg.media.document.mime_type == 'video/mp4':
            msg_media_type = 'video'
        else:
            msg_media_type = 'document'
    if msg_media_type not in ['audio', 'video', 'photo']:
        return []
    await client.download_media(message=msg, file=msg_media_path)
    msg_files = [{'filename': f, 'url': '', 'type': msg_media_type} for f in listdir(msg_media_path) if isfile(join(msg_media_path, f))]

    return msg_files

# save message to db
def save_message(channel_id, channel_name, msg_id, msg_text, msg_date, msg_files, msg_media_path, replace):
    # обработка аттача картинок ссылкой от телепост
    urls = re.findall('\(https://tgraph.io/file/(.+?)\)', msg_text)
    if len(urls):
        for url in urls:
            if len(msg_files) == 0:
                # только если нет аттача webpage
                resp = requests.get('https://tgraph.io/file/' + url, allow_redirects=True)
                if resp.status_code == 200:
                    open(msg_media_path + '/' + url, 'wb+').write(resp.content)
                    msg_files.append({'filename': url, 'url': 'https://tgraph.io/file/' + url, 'type': 'photo'})
            msg_text = msg_text.replace('(https://tgraph.io/file/' + url + ')', '')

    data = json.dumps({'channel': {'id': channel_id, 'name': channel_name}, 'id': msg_id, 'source': 'tg', 'text': msg_text, 'date': int(msg_date), 'files': msg_files, 'replace': replace}, ensure_ascii=False).encode('utf8')
    print(data)
    resp = requests.put(cfg['app']['backend_url'] + '/messages/' + str(channel_id), data, headers={'Content-type': 'application/json'})
    if resp.status_code == 200:
        obj = json.loads(resp.text)
        print(obj)
        return obj['new'] if (obj.get('new')) else False
    else:
        return False

# process tg message
async def process_message(msg, replace=False):
    #print("**************v\n")
    #print(msg.media)
    #print("**************^\n")
    try:
        if isinstance(msg.to_id, PeerChannel):
            msg_grouped = False
            if msg.grouped_id is not None:
                msg_id = msg.grouped_id
                msg_grouped = True
            else:
                msg_id = msg.id

            msg_text = msg.text
            msg_date = msg.date.timestamp()
            if msg.media is None:
                msg_media = False
            else:
                msg_media = True
            if msg_text is None and not msg_media:
                return
            msg_media_type = False
            msg_files = []
            channel_id = msg.to_id.channel_id
            channel = await client.get_entity(msg.to_id)
            channel_name = channel.title

            msg_media_path = cfg['app']['downloads_location'] + '/' + str(channel_id) + '/' + str(msg_id)
            if replace:
                remove_tree(directory=msg_media_path, verbose=0)
            if not isdir(msg_media_path):
                mkpath(msg_media_path, verbose=0)
            if msg.media is not None:
                msg_files = await download_media(msg_media_path, msg)

            is_new = save_message(
                channel_id,
                channel_name,
                msg_id,
                msg_text,
                msg_date,
                msg_files,
                msg_media_path,
                replace
            )
            if is_new:
                await sync_channels(channel_id)
    except Exception as e:
        print(traceback.format_exc())

async def sync_channels(channel_id):
    # get new posts
    chat = await client.get_entity(PeerChannel(channel_id))
    async for msg in client.iter_messages(entity=chat, min_id=0, wait_time=cfg['app']['parse_sleep_sec']):
        await process_message(msg)

try:
    while True:
        accounts = get_accounts()
        print('ACCOUNTS')
        print(accounts)
        if accounts and len(accounts):
            break
        time.sleep(60)
    account = accounts[0]
    print(account)
    # TG
    client = TelegramClient(cfg['telegram']['session_path'] + '/' + account['username'], account['user_id'], account['password'])
    client.parse_mode = 'markdown'
    # events
    @client.on(events.NewMessage)
    async def new_message(event):
        msg = event.message
        await process_message(msg)

    @client.on(events.MessageEdited)
    async def edit_message(event):
        msg = event.message
        await process_message(msg, True)

    client.start()
    client.run_until_disconnected()
except Exception as e:
    print('Error: ' + str(e))
