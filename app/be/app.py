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
from flask import Flask, request, Response
from flask_cors import CORS, cross_origin
from lib.sqlite.sqliteworker import Sqlite3Worker
import lib.watermarks as watermarks

#sqlite_location = '../../state/sqlite/teleparser.db'
sqlite_location = '/var/db/sqlite/teleparser.db'

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

app = Flask(__name__)
CORS(app, support_credentials=True)

# accounts
@app.route('/accounts/', methods=['GET', 'POST', 'DELETE'])
@cross_origin(origin='*', supports_credentials=True)
def get_all_accounts():
    if request.method == 'POST':
        obj = json.loads(request.data)
        id = int(obj['id'])
        if id:
            if obj['password'] != '':
                sqlite.execute("UPDATE accounts SET source = ?, username = ?, password = ?, user_id = ? WHERE id = ?", [obj['source'], obj['username'], obj['password'], obj['user_id'], id])
            else:
                sqlite.execute("UPDATE accounts SET source = ?, username = ?, user_id = ? WHERE id = ?", [obj['source'], obj['username'], obj['user_id'], id])
        else:
            sqlite.execute("INSERT INTO accounts (source, username, password, user_id) VALUES (?, ?, ?, ?)",
                    [obj['source'], obj['username'], obj['password'], obj['user_id']])
        if obj.get('feeds'):
            sqlite.execute("DELETE FROM account_feeds WHERE account_id = ?", [id])
            for idx in range(len(obj['feeds'])):
                if obj['feeds'][idx] != '':
                    sqlite.execute('INSERT INTO account_feeds (account_id, feed) VALUES (?, ?)',
                        [id, obj['feeds'][idx]])
    if request.method == 'DELETE':
        obj = json.loads(request.data)
        id = int(obj['id'])
        sqlite.execute("DELETE FROM accounts WHERE id = ?", [id])

    accounts = sqlite.execute("SELECT id, source, username, user_id FROM accounts", [])
    for idx in range(len(accounts)):
        feeds = sqlite.execute('''SELECT feed as name
                                    FROM account_feeds
                                    WHERE account_id = ?''',
                                [accounts[idx]['id']])
        accounts[idx]['feeds'] = [f['name'] for f in feeds]

    return Response(json.dumps(accounts), mimetype='application/json')



@app.route('/accounts/<source>/', methods=['GET'])
@cross_origin(origin='*', supports_credentials=True)
def get_accounts_by_source(source):
    accounts = sqlite.execute("SELECT * FROM accounts WHERE source = ?", [source])
    for idx in range(len(accounts)):
        feeds = sqlite.execute('''SELECT feed as name
                                    FROM account_feeds
                                    WHERE account_id = ?''',
                                [accounts[idx]['id']])
        accounts[idx]['feeds'] = feeds

    return Response(json.dumps(accounts), mimetype='application/json')

# channels
@app.route('/channels/', methods=['GET', 'POST'])
@cross_origin(origin='*', supports_credentials=True)
def get_all_channels():
    if request.method == 'POST':
        obj = json.loads(request.data)
        channel_id = obj['id']
        source = obj['source']
        if obj.get('channel'):
            upd = obj['channel']
            binds = list(upd.values())
            set_clause = ", ".join([k+' = ?' for k in upd])
            if set_clause != '':
                binds.append(False)
                binds.append(channel_id)
                sqlite.execute("UPDATE channels SET " + set_clause + " WHERE del = ? AND id = ?", binds)

        sqlite.execute("DELETE FROM channel_drops WHERE source = ? AND channel_id = ?", [source, channel_id])
        for idx in range(len(obj['drops'])):
            if int(obj['drops'][idx]['id']) < 0:
                sqlite.execute('INSERT INTO channel_drops (source, channel_id, expr) VALUES (?, ?, ?)',
                    [source, channel_id, obj['drops'][idx]['expr']])
            else:
                sqlite.execute('INSERT INTO channel_drops (id, source, channel_id, expr) VALUES (?, ?, ?, ?)',
                    [int(obj['drops'][idx]['id']), source, channel_id, obj['drops'][idx]['expr']])

        sqlite.execute("DELETE FROM channel_replacements WHERE source = ? AND channel_id = ?", [source, channel_id])
        for idx in range(len(obj['replacements'])):
            if int(obj['replacements'][idx]['id']) < 0:
                sqlite.execute('INSERT INTO channel_replacements (source, channel_id, expr_search, expr_replace) VALUES (?, ?, ?, ?)',
                    [source, channel_id, obj['replacements'][idx]['expr_search'], obj['replacements'][idx]['expr_replace']])
            else:
                sqlite.execute('INSERT INTO channel_replacements (id, source, channel_id, expr_search, expr_replace) VALUES (?, ?, ?, ?, ?)',
                    [int(obj['replacements'][idx]['id']), source, channel_id, obj['replacements'][idx]['expr_search'], obj['replacements'][idx]['expr_replace']])

        sqlite.execute("DELETE FROM channel_whitelist WHERE source = ? AND channel_id = ?", [source, channel_id])
        for idx in range(len(obj['whitelist'])):
            if int(obj['whitelist'][idx]['id']) < 0:
                sqlite.execute('INSERT INTO channel_whitelist (source, channel_id, url) VALUES (?, ?, ?)',
                    [source, channel_id, obj['whitelist'][idx]['url']])
            else:
                sqlite.execute('INSERT INTO channel_whitelist (id, source, channel_id, url) VALUES (?, ?, ?, ?)',
                    [int(obj['whitelist'][idx]['id']), source, channel_id, obj['whitelist'][idx]['url']])

    channels = sqlite.execute("SELECT * FROM channels WHERE del = ?", [False])
    for idx in range(len(channels)):
        drops = sqlite.execute('''SELECT id, expr
                                    FROM channel_drops
                                    WHERE source = ? AND channel_id = ?''',
                                [channels[idx]['source'], channels[idx]['id']])
        channels[idx]['drops'] = drops

        replacements = sqlite.execute('''SELECT id, expr_search, expr_replace
                                FROM channel_replacements
                                WHERE source = ? AND channel_id = ?''',
                            [channels[idx]['source'], channels[idx]['id']])
        channels[idx]['replacements'] = replacements

        whitelist = sqlite.execute('''SELECT id, url
                                FROM channel_whitelist
                                WHERE source = ? AND channel_id = ?''',
                            [channels[idx]['source'], channels[idx]['id']])
        channels[idx]['whitelist'] = whitelist

    return Response(json.dumps(channels), mimetype='application/json')

@app.route('/channels/<channel_id>', methods=['GET', 'POST'])
@cross_origin(origin='*', supports_credentials=True)
def get_one_channel(channel_id):
    channels = sqlite.execute("SELECT * FROM channels WHERE del = ? AND id = ?", [False, channel_id])

    for idx in range(len(channels)):
        drops = sqlite.execute('''SELECT expr
                                    FROM channel_drops
                                    WHERE source = ? AND channel_id = ?''',
                                [channels[idx]['source'], channels[idx]['id']])
        channels[idx]['drops'] = drops

        replacements = sqlite.execute('''SELECT expr_search, expr_replace
                                FROM channel_replacements
                                WHERE source = ? AND channel_id = ?''',
                            [channels[idx]['source'], channels[idx]['id']])
        channels[idx]['replacements'] = replacements

        whitelist = sqlite.execute('''SELECT url
                                    FROM channel_whitelist
                                    WHERE source = ? AND channel_id = ?''',
                                [channels[idx]['source'], channels[idx]['id']])
        channels[idx]['whitelist'] = whitelist

    return Response(json.dumps(channels), mimetype='application/json')

# messages
@app.route('/messages/<channel_id>', methods=['GET', 'PUT', 'POST'])
@cross_origin(origin='*', supports_credentials=True)
def get_messages(channel_id):

    if request.method == 'POST':
        obj = json.loads(request.data)
        msg_id = obj['id']
        if obj.get('msg'):
            upd = obj['msg']
            binds = list(upd.values())
            set_clause = ", ".join([k+' = ?' for k in upd])
            if set_clause != '':
                binds.append(False)
                binds.append(channel_id)
                binds.append(msg_id)
                sqlite.execute("UPDATE messages SET " + set_clause + " WHERE del = ? AND channel_id = ? AND id = ?", binds)

    if request.method == 'PUT':
        try:
            # save message (from parser)
            msg = json.loads(request.data)
            # global filters
            global_drops = sqlite.execute("SELECT expr FROM global_drops")
            global_replacements = sqlite.execute("SELECT expr_search, expr_replace FROM global_replacements")
            global_whitelist = sqlite.execute("SELECT url FROM global_whitelist")

            # local filters
            local_drops = sqlite.execute("SELECT expr FROM channel_drops WHERE source = ? AND channel_id = ?", [msg['source'], channel_id])
            local_replacements = sqlite.execute("SELECT expr_search, expr_replace FROM channel_replacements WHERE source = ? AND channel_id = ?", [msg['source'], channel_id])
            local_whitelist = sqlite.execute("SELECT url FROM channel_whitelist WHERE source = ? AND channel_id = ?", [msg['source'], channel_id])

            drops = global_drops + local_drops
            replacements = global_replacements + local_replacements
            whitelist = global_whitelist + local_whitelist

            channel_name = msg['channel']['name']
            # create channel
            new_channel = False
            obj = sqlite.execute("""SELECT id, moderation,
                                        watermark_used, watermark_orient, watermark_method,
                                        watermark_height, watermark_width
                                    FROM channels
                                    WHERE source = ? AND id = ?""",
                                [msg['source'], channel_id])
            if not obj or len(obj) == 0:
                new_channel = True
                sqlite.execute("""INSERT INTO channels
                                (source, id, name, created, last_message, sync, del, moderation)
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                            [
                                msg['source'],
                                channel_id,
                                channel_name,
                                int(datetime.now().timestamp()),
                                None,
                                True,
                                False,
                                True
                            ]
                )
                channel = {'id': channel_id, 'moderation': True, 'use_watermark': False}
            else:
                channel = obj[0]
            exists = False
            obj = None
            # replace message
            if msg.get('replace') and msg['replace']:
                sqlite.execute("DELETE FROM messages WHERE source = ? AND channel_id = ? AND id = ?",
                    [msg['source'], channel_id, msg['id']])
                sqlite.execute("DELETE FROM media WHERE source = ? AND channel_id = ? AND msg_id = ?",
                    [msg['source'], channel_id, msg['id']])
            else:
                obj = sqlite.execute("SELECT id FROM messages WHERE source = ? AND channel_id = ? AND id = ?",
                                    [msg['source'], channel_id, msg['id']])
             # save message
            if obj and len(obj) > 0:
                exists = True
                # update media
                order_idx = 1
                sqlite.execute("DELETE FROM media WHERE msg_id = ? AND source = ? AND channel_id = ?", [msg['id'], msg['source'], channel_id])

                for f in msg['files']:
                    sqlite.execute("""INSERT INTO media
                                (msg_id, source, channel_id, order_idx, filename, url, media_type)
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?)
                            """,
                            [
                                msg['id'], msg['source'], channel_id, order_idx, f['filename'], f['url'], f['type']
                            ]
                    )
                    order_idx += 1
            else:
                filtered = False
                msg_text = msg['text']
                # filters
                # stop words filter
                if msg_text is not None and len(drops):
                    for rr in drops:
                        expr = rr['expr'].replace('*', '(.*)')
                        if re.match(expr, msg_text, re.IGNORECASE):
                            filtered = True
                            break
                # links filter
                if not filtered and msg_text is not None:
                    urls = re.findall('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', msg_text)
                    if len(urls):
                        filtered = True
                        for url in urls:
                            for wl in whitelist:
                                if len(re.findall(wl['url'], url, re.IGNORECASE)):
                                    filtered = False
                                    break
                            if not filtered:
                                break
                # replacements rules
                if not filtered and msg_text is not None and len(replacements):
                    for rr in replacements:
                        msg_text = msg_text.replace(rr['expr_search'], rr['expr_replace'])
                msg_text_origin = msg['text'] if msg_text != msg['text'] else None
                has_media = True if len(msg['files']) else False
                sqlite.execute("""INSERT INTO messages
                                    (id, source, channel_id, txt, txt_origin, has_media, moderated, del, created, filtered)
                                    VALUES
                                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                            [
                                msg['id'],
                                msg['source'],
                                channel_id,
                                msg_text,
                                msg_text_origin,
                                has_media,
                                not channel['moderation'],
                                False,
                                msg['date'],
                                filtered
                            ]
                )
                order_idx = 1
                msg_media_path = cfg['app']['downloads_location'] + '/' + str(channel_id) + '/' + str(msg['id'])
                for f in msg['files']:
                    if f['type'] == 'photo' and channel['watermark_used']:
                        # remove watermark
                        if channel['watermark_method'] == 'inpaint':
                            watermarks.wm_image_inpaint(
                                msg_media_path + '/' + f['filename'],
                                channel['watermark_orient'],
                                channel['watermark_height'],
                                channel['watermark_width']
                            )
                        elif channel['watermark_method'] == 'scale':
                            watermarks.wm_image_scale(
                                msg_media_path + '/' + f['filename'],
                                channel['watermark_orient'],
                                channel['watermark_height'],
                                channel['watermark_width']
                            )
                        elif channel['watermark_method'] == 'cut':
                            watermarks.wm_image_cut(
                                msg_media_path + '/' + f['filename'],
                                channel['watermark_orient'],
                                channel['watermark_height'],
                                channel['watermark_width']
                            )
                    sqlite.execute("""INSERT INTO media
                                (msg_id, source, channel_id, order_idx, filename, url, media_type)
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?)
                            """,
                            [
                                msg['id'], msg['source'], channel_id, order_idx, f['filename'], f['url'], f['type']
                            ]
                    )
                    order_idx += 1

                sqlite.execute("UPDATE channels SET last_message = ? WHERE source = ? AND id = ?",
                                [msg['id'], msg['source'], msg['id']])
            return Response(json.dumps({'success': 1, 'new': new_channel, 'exists': exists}), mimetype='application/json')
        except Exception as e:
            print(traceback.format_exc())
            return Response(json.dumps({'success': 0, 'error': str(e)}), mimetype='application/json')
    else:
        channels = sqlite.execute("SELECT * FROM channels WHERE id = ?", [channel_id])
        if len(channels):
            channel = channels[0]
            # messages list
            count = request.args.get('count') if request.args.get('count') else 50
            offset = request.args.get('offset') if request.args.get('offset') else 0
            if request.args.get('filter') and request.args.get('filter') == 'new':
                filter = ' AND filtered = 0 AND moderated = 1 AND published is null'
            elif request.args.get('filter') and request.args.get('filter') == 'moderated':
                filter = ' AND moderated = 0 AND filtered = 0'
            elif request.args.get('filter') and request.args.get('filter') == 'published':
                filter = ' AND published is not null'
            elif request.args.get('filter') and request.args.get('filter') == 'filtered':
                filter = ' AND filtered = 1 and published is null'
            else:
                filter = ''
            messages = sqlite.execute('SELECT * FROM messages WHERE channel_id = ? AND del = ? ' + filter + ' ORDER BY created DESC LIMIT ?, ?',
                                            [channel_id, False, offset, count])
            for idx in range(len(messages)):
                media = sqlite.execute('SELECT * FROM media WHERE source = ? AND channel_id = ? AND msg_id = ? ORDER BY order_idx',
                                    [messages[idx]['source'], messages[idx]['channel_id'], messages[idx]['id']])
                messages[idx]['files'] = media

                publications = sqlite.execute("""SELECT fm.feed_id, f.name, fm.published, fm.error
                                                FROM feed_messages fm, feeds f
                                                WHERE fm.source = ? AND fm.channel_id = ? AND fm.msg_id = ? AND f.id = fm.feed_id""",
                                    [messages[idx]['source'], messages[idx]['channel_id'], messages[idx]['id']])
                messages[idx]['publications'] = publications
        else:
            channel = {}
            messages = []
        return Response(json.dumps({'channel': channel, 'messages': messages}), mimetype='application/json')

@app.route('/channels/<channel_id>/<msg_id>', methods=['POST'])
@cross_origin(origin='*', supports_credentials=True)
def update_message(channel_id, msg_id):
    if request.method == 'POST':
        upd = json.loads(request.data)
        binds = list(upd.values())
        set_clause = ", ".join([k+' = ?' for k in upd])
        if set_clause != '':
            binds.append(False)
            binds.append(channel_id)
            binds.append(msg_id)
            sqlite.execute("UPDATE messages SET " + set_clause + " WHERE del = ? AND channel_id = ? AND id = ?", binds)
    messages = sqlite.execute('SELECT * FROM messages WHERE channel_id = ? AND del = ? AND id = ?',
                                [channel_id, False, msg_id])
    for idx in range(len(messages)):
        media = sqlite.execute('SELECT * FROM media WHERE source = ? AND msg_id = ? ORDER BY order_idx',
                            [messages[idx]['source'], messages[idx]['id']])
        messages[idx]['files'] = media
    return Response(json.dumps(messages), mimetype='application/json')

# feeds
@app.route('/feeds/', methods=['GET', 'POST', 'DELETE'])
@cross_origin(origin='*', supports_credentials=True)
def get_all_feeds():
    if (request.method == 'DELETE'):
        obj = json.loads(request.data)
        id = int(obj['id'])
        sqlite.execute("DELETE FROM feeds WHERE id = ?", [id])
        sqlite.execute("DELETE FROM feed_envs WHERE feed_id = ?", [id])
        sqlite.execute("DELETE FROM feed_channels WHERE feed_id = ?", [id])

    if (request.method == 'POST'):
        obj = json.loads(request.data)
        id = int(obj['id'])
        if not id:
            sqlite.execute("INSERT INTO feeds (name, created) VALUES (?, ?)", ['', int(datetime.now().timestamp())])
            last_id = sqlite.execute("SELECT last_insert_rowid() as id")
            id = last_id[0]['id']
        if obj.get('feed'):
            upd = obj['feed']
            binds = list(upd.values())
            set_clause = ", ".join([k + ' = ?' for k in upd])
            if set_clause != '':
                binds.append(id)
                sqlite.execute("UPDATE feeds SET " + set_clause + " WHERE id = ?", binds)

        if obj.get('envs'):
            sqlite.execute("DELETE FROM feed_envs WHERE feed_id = ?", [id])
            for idx in range(len(obj['envs'])):
                sqlite.execute('INSERT INTO feed_envs (feed_id, env_id) VALUES (?, ?)',
                    [id, int(obj['envs'][idx])])

        if obj.get('channels'):
            sqlite.execute("DELETE FROM feed_channels WHERE feed_id = ?", [id])
            for idx in range(len(obj['channels'])):
                sqlite.execute('INSERT INTO feed_channels (feed_id, channel_id) VALUES (?, ?)',
                    [id, obj['channels'][idx]])

    feeds = sqlite.execute("SELECT * FROM feeds")
    for idx in range(len(feeds)):
        envs = sqlite.execute('''SELECT f.env_id
                                FROM feed_envs f
                                WHERE f.feed_id = ?''',
                            [feeds[idx]['id']])
        feeds[idx]['envs'] = [e['env_id'] for e in envs]

        channels = sqlite.execute('''SELECT f.source, f.channel_id
                                    FROM feed_channels f
                                    WHERE f.feed_id = ?''',
                            [feeds[idx]['id']])
        feeds[idx]['channels'] = [c['channel_id'] for c in channels]

    return Response(json.dumps(feeds), mimetype='application/json')

@app.route('/global/', methods=['GET', 'POST', 'DELETE'])
@cross_origin(origin='*', supports_credentials=True)
def get_global_config():
    if request.method == 'DELETE':
        obj = json.loads(request.data)
        if obj.get('envs'):
            for idx in range(len(obj['envs'])):
                id = int(obj['envs'][idx]['id'])
                sqlite.execute('DELETE FROM envs WHERE id = ?', [id])

        if obj.get('drops'):
            for idx in range(len(obj['drops'])):
                id = int(obj['drops'][idx]['id'])
                sqlite.execute('DELETE FROM global_drops WHERE id = ?', [id])

        if obj.get('replacements'):
            for idx in range(len(obj['replacements'])):
                id = int(obj['replacements'][idx]['id'])
                sqlite.execute('DELETE FROM global_replacements WHERE id = ?', [id])

        if obj.get('whitelist'):
            for idx in range(len(obj['whitelist'])):
                id = int(obj['whitelist'][idx]['id'])
                sqlite.execute('DELETE FROM global_whitelist WHERE id = ?', [id])

    if request.method == 'POST':
        obj = json.loads(request.data)
        if obj.get('envs'):
            for idx in range(len(obj['envs'])):
                id = int(obj['envs'][idx]['id'])
                if id:
                    sqlite.execute('UPDATE envs SET url = ? WHERE id = ?',
                        [obj['envs'][idx]['url'], obj['envs'][idx]['id']])
                else:
                    sqlite.execute('INSERT INTO envs (url) VALUES (?)', [obj['envs'][idx]['url']])

        if obj.get('drops'):
            for idx in range(len(obj['drops'])):
                id = int(obj['drops'][idx]['id'])
                if id:
                    sqlite.execute('UPDATE global_drops SET expr = ? WHERE id = ?',
                        [obj['drops'][idx]['expr'], obj['drops'][idx]['id']])
                else:
                    sqlite.execute('INSERT INTO global_drops (expr) VALUES (?)',
                        [obj['drops'][idx]['expr']])

        if obj.get('replacements'):
            for idx in range(len(obj['replacements'])):
                id = int(obj['replacements'][idx]['id'])
                if id:
                    sqlite.execute('UPDATE global_replacements SET expr_search = ?, expr_replace = ? WHERE id = ?',
                        [obj['replacements'][idx]['expr_search'], obj['replacements'][idx]['expr_replace'], obj['replacements'][idx]['id']])
                else:
                    sqlite.execute('INSERT INTO global_replacements (expr_search, expr_replace) VALUES (?, ?)',
                        [obj['replacements'][idx]['expr_search'], obj['replacements'][idx]['expr_replace']])

        if obj.get('whitelist'):
            for idx in range(len(obj['whitelist'])):
                id = int(obj['whitelist'][idx]['id'])
                if id:
                    sqlite.execute('UPDATE global_whitelist SET url = ? WHERE id = ?',
                        [obj['whitelist'][idx]['url'], obj['whitelist'][idx]['id']])
                else:
                    sqlite.execute('INSERT INTO global_whitelist (url) VALUES (?)',
                        [obj['whitelist'][idx]['url']])

    # GET
    envs = sqlite.execute('SELECT id, url FROM envs')
    drops = sqlite.execute('SELECT id, expr FROM global_drops')
    replacements = sqlite.execute('SELECT id, expr_search, expr_replace FROM global_replacements')
    whitelist = sqlite.execute('SELECT id, url FROM global_whitelist')

    return Response(json.dumps({'envs': envs, 'drops': drops, 'replacements': replacements, 'whitelist': whitelist}),
                    mimetype='application/json')

# init app
if __name__ == '__main__':
    sqlite = Sqlite3Worker(sqlite_location)
    # flask
    app.run(host='0.0.0.0', port=9000)
