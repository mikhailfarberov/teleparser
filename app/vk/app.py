import sys
from os import listdir, environ
from os.path import isdir, isfile, join, splitext, basename
from distutils.dir_util import mkpath
import json
import posixpath
import urllib.parse as urlparse
from aiostream import stream
from datetime import datetime
import traceback
import asyncio
import requests
import yaml
import time
import lib.vk as vk

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

if not cfg.get('vk'):
    sys.exit()

# account list
def get_accounts():
    try:
        resp = requests.get(cfg['app']['backend_url'] + '/accounts/vk/')
        if resp.status_code == 200:
            obj = json.loads(resp.text)
            return obj
        else:
            return None
    except Exception as e:
        return None

def download_media(vk_api, channel_id, msg_id, media):
    msg_media_path = cfg['app']['downloads_location'] + '/' + str(channel_id) + '/' + str(msg_id)
    if isdir(msg_media_path):
        return [{'filename': f, 'url': '', 'type': ('video' if '.mp4' in f else 'audio' if '.mp3' in f else 'photo')} for f in listdir(msg_media_path) if isfile(join(msg_media_path, f))]

    mkpath(msg_media_path, verbose=0)
    files = []
    for item in media:
        if item['type'] == 'video':
            # не скачиваем длинные видео
            if item['video']['duration'] > 60:
                continue
            url = vk_api.get_video_url(item['video']['owner_id'], item['video']['id'])
            if not url:
                continue
            filename = posixpath.basename(urlparse.urlsplit(url).path)
            vk_api.download_file(url, msg_media_path + '/' + filename)
            files.append({'type': item['type'], 'url': url, 'filename': filename})
        elif item['type'] == 'photo':
            url = None
            for s in item['photo']['sizes']:
                if s['type'] == 'x':
                    url = s['url']
                    break
            if not url:
                continue
            filename = posixpath.basename(urlparse.urlsplit(url).path)
            vk_api.download_file(url, msg_media_path + '/' + filename)
            files.append({'type': item['type'], 'url': url, 'filename': filename})
        elif item['type'] == 'audio':
            url = vk_api.get_audio_url(item['audio']['owner_id'], item['audio']['id'])
            if not url:
                continue
            filename = posixpath.basename(urlparse.urlsplit(url).path)
            vk_api.download_file(url, msg_media_path + '/' + filename)
            files.append({'type': item['type'], 'url': url, 'filename': filename})
    return files

def save_message(channel_id, channel_name, msg_id, msg_text, msg_date, msg_files):
    data = json.dumps({'channel': {'id': channel_id, 'name': channel_name}, 'id': msg_id, 'source': 'vk', 'text': msg_text, 'date': int(msg_date), 'files': msg_files}, ensure_ascii=False).encode('utf8')
    resp = requests.put(cfg['app']['backend_url'] + '/messages/' + str(channel_id), data, headers={'Content-type': 'application/json'})
    if resp.status_code == 200:
        obj = json.loads(resp.text)
        return obj['exists'] if (obj.get('exists')) else True
    else:
        return True

async def parse_task():
    max_depth = 10
    total_saved_items = 0
    session_path = cfg['vk']['session_path']
    while True:
        try:
            accounts = get_accounts()
            for account in accounts:
                vk_api = vk.UserAPI(app_id='3423895',
                                    user_login=account['username'],
                                    user_password=account['password'],
                                    scope='video,audio,offline',
                                    session=(session_path+'/'+str(account['username'])+'.session'))
                for feed_idx in range(len(account['feeds'])):
                    feed_name = account['feeds'][feed_idx]['name']
                    params = {}
                    if feed_name.isnumeric():
                        params['owner_id'] = feed_name
                    else:
                        params['domain'] = feed_name
                    params['count'] = 100
                    params['extended'] = 1
                    params['v'] = '5.103'
                    for depth in range(max_depth):
                        params['offset'] = 100*depth
                        response = vk_api.call('wall.get', params)
                        channel_id = None
                        channel_name = None
                        if response.get('groups'):
                            for group in response['groups']:
                                if group['screen_name'] == feed_name or group['id'] == feed_name:
                                    channel_id = 'vk_' + str(group['id'])
                                    channel_name = group['name']
                                    break
                        if not channel_id and response.get('profiles'):
                            for profile in response['profiles']:
                                if profile['screen_name'] == feed_name or profile['id'] == feed_name:
                                    channel_id = 'vk_' + str(profile['id'])
                                    channel_name = profile['screen_name']
                                    break
                        if not channel_id:
                            break
                        if not response.get('items'):
                            break
                        saved_items = 0
                        for item in response['items']:
                            msg_id = item['id']
                            msg_text = item['text']
                            msg_date = item['date']
                            msg_files = []
                            if item.get('attachments') and len(item['attachments']):
                                msg_files = download_media(vk_api, channel_id, msg_id, item['attachments'])
                                if not len(msg_files):
                                    continue

                            if not len(msg_text) and not len(msg_files):
                                continue
                            if save_message(channel_id, channel_name, msg_id, msg_text, msg_date, msg_files):
                                saved_items += 1
                        if saved_items == 0:
                            break
        except Exception as e:
            print(traceback.format_exc())
        await asyncio.sleep(300)

# loop
app_loop = asyncio.get_event_loop()
app_loop.run_until_complete(parse_task())
app_loop.close()
