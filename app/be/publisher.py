import sys
import json
import random
from os import listdir, environ
from os.path import isdir, isfile, join, splitext
from aiostream import stream
from datetime import datetime
import traceback
import asyncio
import requests
import time
import re
import yaml
from lib.sqlite.sqliteworker import Sqlite3Worker

#sqlite_location = '../../state/sqlite/teleparser.db'
sqlite_location = '/var/db/sqlite/teleparser.db'
sqlite = Sqlite3Worker(sqlite_location)
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

# publisher
def publish_message(id, text, date, media, channel_id, feed_id, feed_name, feed_username, feed_desc, envs):
    error = None
    try:
        if text is None and not media:
            raise Exception('Messsage is empty')

        for ee in envs:
            # Send to Sendy
            api_url = ee['url']
            try:
                # send files
                files = []
                if media and len(media) > 0:
                    for item in media:
                        filename = item['filename']
                        basename, ext = splitext(filename)
                        file_type = None
                        if ext in ['.png', '.jpg', '.jpeg', '.gif','.pjpeg', '.jt']:
                            file_type = 'image'
                        elif ext in ['.pjp', '.webp']:
                            file_type = '.file'
                        elif ext in ['.mp4', '.avi', '.mov', '.flv']:
                            file_type = 'video'
                        if file_type is not None:
                            resp = requests.post(api_url + 'newFile', files={'file': (filename, open(cfg['app']['downloads_location']+'/'+str(channel_id)+'/'+str(id)+'/'+filename,'rb'))}, data={'user_name': feed_username, 'type': file_type})
                            if resp.status_code == 200 and int(resp.text) > 0:
                                files.append(int(resp.text))
                            else:
                                print('********************************************************** newFile')
                                print(' [' + datetime.now().strftime("%d/%m/%Y %H:%M:%S") + '] --> ' + api_url)
                                print(' REQUEST:\n'  +  api_url + 'newFile\n' + 'file: ' + cfg['app']['downloads_location']+'/'+str(channel_id)+'/'+str(id)+'/'+filename)
                                print(' RESPONSE:\n', resp)
                                raise Exception('media publishing error')

                # Send new data
                resp = requests.models.Response()
                req = json.dumps({'files': files, 'text': text, 'time': date, 'user_name': feed_username, 'type': 'channel', 'chat_name': feed_name})
                resp = requests.post(api_url + 'addContent', req, headers={'Content-type': 'application/json'})
                print('[' + datetime.now().strftime("%d/%m/%Y %H:%M:%S") + '] URL: ' + api_url + ', user: ' + feed_username + ', channel: ' + feed_name + ' (with ' + str(len(files)) + '/' + str(len(media)) + ' files)')

                if resp.status_code != 200:
                    print('********************************************************** addContent')
                    print(' [' + datetime.now().strftime("%d/%m/%Y %H:%M:%S") + '] --> ' + api_url)
                    print(' REQUEST:\n', req)
                    print(' RESPONSE:\n', resp)
                    raise Exception('post publishing error')
            except Exception as e:
                print(traceback.format_exc())
                error = str(e)
    except Exception as e:
        print(traceback.format_exc())
        error = str(e)
    finally:
        return error

async def publish_task():
    while True:
        try:
            print('publish')
            # get messages to post
            feeds = sqlite.execute("""SELECT f.id as feed_id, f.name as feed_name, f.desc as feed_desc, f.username as feed_username,
                                            c.id as channel_id, c.source as channel_source, f.publish_mode, f.created,
                                            f.time_from, f.time_to, f.interval_from, f.interval_to
                                            FROM feeds f, feed_channels fc, channels c
                                            WHERE f.sync = 1 AND fc.feed_id = f.id
                                                AND c.id = fc.channel_id AND c.del = 0
                                                AND EXISTS (SELECT 1 FROM feed_envs fe WHERE fe.feed_id = f.id)
                                    """,
                        [])
            print(feeds)
            if len(feeds) > 0:
                for feed in feeds:
                    now = datetime.now()
                    if feed['publish_mode'] == 'timetable':
                        if feed['time_from'] is None or feed['time_to'] is None or feed['interval_from'] is None or feed['interval_to'] is None:
                            continue
                        # randomly by timetable
                        hour = int(now.hour)
                        if hour < int(feed['time_from']) or hour > int(feed['time_to']):
                            continue
                        last_msg = sqlite.execute('SELECT max(published) published FROM feed_messages WHERE feed_id = ? AND error is null',
                                                    [feed['feed_id']])
                        last_msg_ts = 0
                        if last_msg and len(last_msg) > 0 and last_msg[0]['published']:
                            last_msg_ts = int(last_msg[0]['published'])
                        if last_msg_ts > now.timestamp() - random.randint(int(feed['interval_from']), int(feed['interval_to']))*3600:
                            continue
                    if feed['publish_mode'] == 'manual':
                        messages = sqlite.execute('''SELECT m.id, m.txt, m.published
                                                    FROM messages m
                                                    WHERE m.source = ? AND m.channel_id = ? AND m.moderated = 1 AND m.filtered = 0 AND manual = 1
                                                        AND NOT EXISTS (SELECT 1
                                                                            FROM feed_messages fm
                                                                            WHERE fm.feed_id = ? AND fm.source = m.source AND fm.channel_id = m.channel_id AND fm.msg_id = m.id)
                                                    LIMIT 100''',
                                            [feed['channel_source'], feed['channel_id'], feed['feed_id']])
                    else:
                        messages = sqlite.execute('''SELECT m.id, m.txt, m.published
                                                    FROM messages m
                                                    WHERE m.source = ? AND m.channel_id = ? AND m.moderated = 1 AND m.filtered = 0
                                                        AND (m.created > ? OR m.source <> ?)
                                                        AND NOT EXISTS (SELECT 1
                                                                            FROM feed_messages fm
                                                                            WHERE fm.feed_id = ?
                                                                                AND fm.source = m.source
                                                                                AND fm.channel_id = m.channel_id
                                                                                AND fm.msg_id = m.id)
                                                    LIMIT 100''',
                                            [feed['channel_source'], feed['channel_id'], feed['created'], 'tg', feed['feed_id']])
                    if not messages or len(messages) == 0:
                        continue
                    print(messages)
                    random.shuffle(messages)
                    msg = messages[0]
                    msg_id = msg['id']
                    msg_text = msg['txt']
                    msg_date = msg['published']
                    print(msg)
                    media = sqlite.execute('SELECT * FROM media WHERE source = ? AND channel_id = ? AND msg_id = ? ORDER BY order_idx',
                            [feed['channel_source'], feed['channel_id'], msg_id])
                    envs = sqlite.execute('SELECT e.url FROM feed_envs f, envs e WHERE f.feed_id = ? AND e.id = f.env_id', [feed['feed_id']])
                    # post message
                    error = publish_message(msg_id, msg_text, msg_date, media, feed['channel_id'], feed['feed_id'], feed['feed_name'], feed['feed_username'], feed['feed_desc'], envs)
                    print('Error: ' + str(error))
                    # save
                    sqlite.execute('''INSERT INTO feed_messages
                                        (feed_id, source, channel_id, msg_id, published, error)
                                        VALUES
                                        (?, ?, ?, ?, ?, ?)''',
                                    [feed['feed_id'], feed['channel_source'], feed['channel_id'], msg_id, now.timestamp(), error])
                    sqlite.execute('UPDATE messages SET published = ? WHERE source = ? AND channel_id = ? AND id = ?',
                        [now.timestamp(), feed['channel_source'], feed['channel_id'], msg_id])
        except Exception as e:
            print(traceback.format_exc())
        await asyncio.sleep(120)

# loop
app_loop = asyncio.get_event_loop()
app_loop.run_until_complete(publish_task())
app_loop.close()
