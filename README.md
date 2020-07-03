# Teleparser - a simple utility to get content from Telegram channels, VK and Instagram pages

Teleparser allows you to get content from Telegram channels, VK or Instagram pages with all attached media files. Parsed content can be premoderated, filtered or replaced on-flight and then aggregated and published to any other social media account via API.

The repo contains sources of Telegram, VK and Instagram parsers and UI to manage parsed data.
Parsers couldn't run without UI component, because they get configuration via API provided by UI.
So if you need only Telegram parser you have to install both UI and Telegram components.

UI component contains stubs for calling publishing API. This code is given as an example and can be used to write your own code to publish stored posts.

This software is provided as is without any warranty.

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
   * [Basic configuration](#basic-configuration)
   * [Telegram channels parser](#telegram-channels-parser)
   * [VK pages parser](#vk-pages-parser)
   * [Instagram pages parser](#instagram-pages-parser)
   * [UI](#ui)
   * [Publishing posts](#publishing-posts)
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

First of all you need to install **teleparser-ui** that allows you to save parsed content in sqlite database and manage it through the web interface.

To install Teleparser UI please pull and run this image:
```
docker pull mikhailfarberov/teleparser-ui
```

During the first run sqlite database is created.

Other services are optional and can be installed selectively.

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
By opening http://localhost:8000 you will see a dashboard.

### Telegram channels parser

### VK pages parser

### Instagram pages parser

### Publishing posts

## Credits

## License
Teleparser is released under the [MIT](https://github.com/mikhailfarberov/teleparser/blob/master/LICENSE) license.
