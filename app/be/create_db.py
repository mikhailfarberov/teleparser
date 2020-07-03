import sys
import sqlite3

sqlite_location = '/var/db/sqlite/teleparser.db'
sqlite = sqlite3.connect(sqlite_location)
cursor = sqlite.cursor()

# accounts table
cursor.execute("""CREATE TABLE IF NOT EXISTS accounts
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, source, username, password, user_id)
                """)

cursor.execute("""CREATE TABLE IF NOT EXISTS account_feeds
                    (account_id, feed)
                """)

# channels table
cursor.execute("""CREATE TABLE IF NOT EXISTS channels
                    (source, id varchar(200), name, created, last_message, sync, del, moderation, cmt, watermark_used, watermark_orient, watermark_height, watermark_width, watermark_method)
                """)

# channel_drops
cursor.execute("""CREATE TABLE IF NOT EXISTS channel_drops
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, source, channel_id varchar(200), expr)
                """)

# channel_replacements
cursor.execute("""CREATE TABLE IF NOT EXISTS channel_replacements
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, source, channel_id varchar(200), expr_search, expr_replace)
                """)

# channel_whitelist
cursor.execute("""CREATE TABLE IF NOT EXISTS channel_whitelist
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, source, channel_id varchar(200), url)
                """)

# messages table
cursor.execute("""CREATE TABLE IF NOT EXISTS messages
                    (id, source, channel_id varchar(200), txt, txt_origin, has_media, moderated, del, created, published, filtered, manual)
                """)

# media table
cursor.execute("""CREATE TABLE IF NOT EXISTS media
                    (msg_id, source, channel_id varchar(200), order_idx, filename, url, media_type)
                """)

# enviroments table
cursor.execute("""CREATE TABLE IF NOT EXISTS envs
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, url)
                """)

# feeds table
cursor.execute("""CREATE TABLE IF NOT EXISTS feeds
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, name, desc, username, sync, publish_mode,
                    time_from, time_to, interval_from, interval_to, created)
                """)

# feed_channels table
cursor.execute("""CREATE TABLE IF NOT EXISTS feed_channels
                    (feed_id, source, channel_id varchar(200))
                """)

# feed_envs
cursor.execute("""CREATE TABLE IF NOT EXISTS feed_envs
                    (feed_id int, env_id int)
                """)

# feed_messages
cursor.execute("""CREATE TABLE IF NOT EXISTS feed_messages
                    (feed_id int, source, channel_id varchar(200), msg_id, published int, error)
                """)

# global_drops
cursor.execute("""CREATE TABLE IF NOT EXISTS global_drops
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, expr)
                """)

# global_replacements
cursor.execute("""CREATE TABLE IF NOT EXISTS global_replacements
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, expr_search, expr_replace)
                """)

# global_whitelist
cursor.execute("""CREATE TABLE IF NOT EXISTS global_whitelist
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, url)
                """)

sqlite.close()
print('DB has been created')
