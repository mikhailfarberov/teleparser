# Teleparser - a simple utility to get content from Telegram channels, VK and Instagram pages

[![DOCKER BUILD](https://img.shields.io/docker/cloud/build/mikhailfarberov/teleparser-ui?style=for-the-badge)](https://img.shields.io/docker/cloud/build/mikhailfarberov/teleparser-ui?style=for-the-badge) [![VERSION](https://img.shields.io/github/v/tag/mikhailfarberov/teleparser?label=version&sort=semver&style=for-the-badge)](https://img.shields.io/github/v/tag/mikhailfarberov/teleparser?label=version&sort=semver&style=for-the-badge)

Teleparser allows you to get content from Telegram channels, VK or Instagram pages with all attached media files. Parsed content can be premoderated, filtered or replaced on the fly and then aggregated and published to any other social media account via API.

The repo contains sources of Telegram, VK and Instagram parsers and UI to manage parsed data.
Parsers couldn't run without UI component, because they get configuration via API provided by UI.
So if you need only Telegram parser you have to install both UI and Telegram components.
But you are not limited to to use this code as an example to build you own solution.

UI component contains stubs for calling publishing API. This code is given as an example and can be used to write your own code to publish stored posts.

This software is provided as is without any warranty.

**You can donate $ or BTC to support this project.**
PayPal: https://paypal.me/crackspb?locale.x=en_US
Bitcoin: 3JbN5CL4fFP3LnNuD9kXv1PV7gv3PWFRae

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
   * [Basic configuration](#basic-configuration)
   * [UI](#ui)
   * [Telegram channels parser](#telegram-channels-parser)
   * [VK pages parser](#vk-pages-parser)
   * [Instagram pages parser](#instagram-pages-parser)
3. [Credits](#credits)
4. [License](#license)

## Installation

Teleparser is available in Docker and consists of 4 images.
You may use only those of them you need.

1. Clone the repository.
```
git clone https://github.com/mikhailfarberov/teleparser.git
```
2. Edit [docker-compose file](https://github.com/mikhailfarberov/teleparser/blob/master/docker-compose.yml). Before using please customize used services, volumes and ports.

3. Run installation script. It creates state directory tree.
```
./install.sh <PATH_TO_STATE>
```
If PATH_TO_STATE is not set directory called state is created reletively to the current directory.

4. Run docker-compose to get configured services up.
```
docker-compose up
```

First of all you need to install **teleparser-ui** that allows you to save parsed content in Sqlite database and manage it through the web interface.

To install Teleparser UI please pull and run this image:
```
docker pull mikhailfarberov/teleparser-ui
```

During the first run sqlite database is created.

Other services are optional and can be used selectively.

**teleparser-tg** is a Telegram channels parser.

To install Teleparser for Telegram please pull and run this image:
```
docker pull mikhailfarberov/teleparser-tg
```

After running it connects to API provided by UI and gets configured account credentials and channels to parse. At the moment it calls API only once when it starts, so if you change configuration in UI please restart parser to apply the changes.

**teleparser-vk** is a VK pages parser.

To install Teleparser for VK please pull and run this image:
```
docker pull mikhailfarberov/teleparser-vk
```

After running it connects to API provided by UI and gets configured account credentials and pages to parse.
Unlike Telegram parser you may reconfigure used accounts and parsed pages without restrting the services. Changes are applied immediately.

**teleparser-ig** is an Instagram pages parser.

To install Teleparser for Instagram please pull and run this image:
```
docker pull mikhailfarberov/teleparser-ig
```

After running it connects to API provided by UI and gets configured account credentials and pages to parse.
Unlike Telegram parser you may reconfigure used accounts and parsed pages without restrting the services. Changes are applied immediately.

## Usage

### Basic configuration
Before running please use this [docker-compose example](https://github.com/mikhailfarberov/teleparser/blob/master/docker-compose.yml) to configure used services.
At least you need to set correct paths and ports:
```
ports:
  - "8000:80"
volumes:
  - "./state/sqlite:/var/db/sqlite"
  - "./state/downloads:/usr/local/tgui/downloads"
  - "./state/auth.conf:/etc/nginx/auth.conf"
```

Then use ```docker-compose up``` to run the services.

### UI

By default UI is accessible at http://localhost:8000. You can change the port in docker-compose.yml or specify it manually if you don't use docker-compose and prefer to run docker containers by yourself.

**Authorisation**
UI access is protected by basic authorisation. Default username: teleparser.
Password: teleparser.
You can change it by editing auth.conf that is automatically created in your state directory by the installation script.

**Accounts**
First of all you need to set up accounts that are used for parsing.
![Accounts](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-accounts.png?raw=true)

![Accounts Edit](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-accounts-edit.png?raw=true)

**Global configuration**
It's optional. You may set [filtering and replacing rules](#filtering-and-replacing) or add API endpoints that used to republish prepared content.
![Config](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-config.png?raw=true)

**Channels management**
After opening http://localhost:8000 you will see a dashboard with channells list.
![Channels](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-channels.png?raw=true)
The list is updated automatically when parsing content from your accounts. You can edit channel properties and set filtering and replacing rules.
![Channels Edit](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-channels-edit.png?raw=true)

**Filtering and replacing**
Filtering and replacing rules can be set globally for all channels or individually for particular channel. Both are applied automatically when adding new posts.

**White list**
By default posts containing links are marked as moderated. But you can add trusted links to white list, so posts containing theses links will be marked ad clean.

**Watermark removal**
You can enable watermark removal. Teleparser supports 3 methods:
* Inpainting - watermark is blured according to its position and size.
* Cutting - image is cut to remove watermark. Fit to watermarks in the corners.
* Scaling - same as cutting but image is scaled to keep it's original dimensions ratio.

**Feeds (experimental)**
Feeds tab allows you to configure publishing of parsed content.
![Feeds](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-feeds.png?raw=true)
You can specify channels, publishing endpoints and timetable.
![Feeds Edit](https://github.com/mikhailfarberov/teleparser/blob/master/examples/ui-feeds-edit.png?raw=true)

This feature is experimental and requires replacing of [publishing stub](https://github.com/mikhailfarberov/teleparser/blob/master/app/be/app.py?raw=true) with real code.

### Telegram channels parser
Telegram parser gets configured account from the UI backend.
During the first run you need to authorize it by entering a code you get on your device.
After that the parser subscribes on a new message event and saves new messages with it's media from the channels to DB. 
When parser gets post from a channel it didn't know yet it downloads all messages from the channel.
All preconfigured filtering and replacing, white list and watermark rules are applied (see [UI section](#ui) for instructions).

**Features**
Video, audio and photo media downloads are supported.

**LImitations**
Currently the accounts' amount is limited by 1.

### VK pages parser
Unlike Telegram parser VK allows you to use several accounts.
It gets configured accounts from the UI backend and then simply iterate over them. For the VK parser it's necessery to specify pages to parse because it uses official VK API to get wall posts for particular public page (see [UI section](#ui) for instructions).

**Features**
Video, audio and photo media downloads are supported.

**Limitations**
The parser sees last 1000 posts only. That means it saves maximum 1000 posts for each page during the first run.

### Instagram pages parser
Unlike Telegram parser Instagram allows you to use several accounts.
It gets configured accounts from the UI backend and then simply iterate over them. For the Instagram parser it's necessery to specify accounts to parse because it scans each account instead of scanning your personal feed (see [UI section](#ui) for instructions).

**Features**
Video and photo media downloads are supported.

**Limitations**
* The parser sees last 1000 posts only. That means it saves maximum 1000 posts for each page during the first run.
* The parser uses 3rd party library to call Instagram API. This library is not presented in the repo due to a DMCA notice. But you may content the author for further consultations. 

## Credits

# Special thanks to 
1. LonamiWebs for [Telethon project](https://github.com/LonamiWebs/Telethon)
2. mgp25 for integration with [Instagram private API](https://github.com/mgp25/Instagram-API)
3. creativetimofficial for [beatiful react dashboard team](https://github.com/creativetimofficial/now-ui-dashboard-react)

## License
Teleparser is released under the [MIT](https://github.com/mikhailfarberov/teleparser/blob/master/LICENSE) license.
