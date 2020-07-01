import re
import urllib
import logging
import pickle
import requests
import json
import time
from bs4 import BeautifulSoup
from .exceptions import VkAuthError, VkAPIError
from .api import APINamespace, APIRequest
from .utils import json_iter_parse, stringify

logger = logging.getLogger('vk')

RE_ALBUM_ID = re.compile(r'act=audio_playlist(-?\d+)_(\d+)')
RE_ACCESS_HASH = re.compile(r'access_hash=(\w+)')
RE_M3U8_TO_MP3 = re.compile(r'/[0-9a-f]+(/audios)?/([0-9a-f]+)/index.m3u8')
RPS_DELAY = 1.5
VK_STR = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/="

TRACKS_PER_USER_PAGE = 100
TRACKS_PER_ALBUM_PAGE = 100
ALBUMS_PER_USER_PAGE = 100

def splice(l, a, b, c):
    """ JS's Array.prototype.splice
    var x = [1, 2, 3],
        y = x.splice(0, 2, 1337);
    eq
    x = [1, 2, 3]
    x, y = splice(x, 0, 2, 1337)
    """

    return l[:a] + [c] + l[a + b:], l[a:a + b]


def decode_audio_url(string, user_id):
    vals = string.split("?extra=", 1)[1].split("#")

    tstr = vk_o(vals[0])
    ops_list = vk_o(vals[1]).split('\x09')[::-1]

    for op_data in ops_list:

        split_op_data = op_data.split('\x0b')
        cmd = split_op_data[0]
        if len(split_op_data) > 1:
            arg = split_op_data[1]
        else:
            arg = None

        if cmd == 'v':
            tstr = tstr[::-1]

        elif cmd == 'r':
            tstr = vk_r(tstr, arg)

        elif cmd == 'x':
            tstr = vk_xor(tstr, arg)
        elif cmd == 's':
            tstr = vk_s(tstr, arg)
        elif cmd == 'i':
            tstr = vk_i(tstr, arg, user_id)
        else:
            tstr = None

    return tstr


def vk_o(string):
    result = []
    index2 = 0

    for s in string:
        sym_index = VK_STR.find(s)

        if sym_index != -1:
            if index2 % 4 != 0:
                i = (i << 6) + sym_index
            else:
                i = sym_index

            if index2 % 4 != 0:
                index2 += 1
                shift = -2 * index2 & 6
                result += [chr(0xFF & (i >> shift))]
            else:
                index2 += 1

    return ''.join(result)


def vk_r(string, i):
    vk_str2 = VK_STR + VK_STR
    vk_str2_len = len(vk_str2)

    result = []

    for s in string:
        index = vk_str2.find(s)

        if index != -1:
            offset = index - int(i)

            if offset < 0:
                offset += vk_str2_len

            result += [vk_str2[offset]]
        else:
            result += [s]

    return ''.join(result)


def vk_xor(string, i):
    xor_val = ord(i[0])

    return ''.join(chr(ord(s) ^ xor_val) for s in string)


def vk_s_child(t, e):
    i = len(t)

    if not i:
        return []

    o = []
    e = int(e)

    for a in range(i - 1, -1, -1):
        e = (i * (a + 1) ^ e + a) % i
        o.append(e)

    return o[::-1]


def vk_s(t, e):
    i = len(t)

    if not i:
        return t

    o = vk_s_child(t, e)
    t = list(t)

    for a in range(1, i):
        t, y = splice(t, o[i - 1 - a], 1, t[a])
        t[a] = y[0]

    return ''.join(t)

def vk_i(t, e, user_id):
    return vk_s(t, int(e) ^ user_id)

class APIBase:
    METHOD_COMMON_PARAMS = {'v', 'lang', 'https', 'test_mode'}

    API_URL = 'https://api.vk.com/method/'
    CAPTCHA_URL = 'https://m.vk.com/captcha.php'

    def __init__(self, timeout=10):
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers['Accept'] = 'application/json'
        self.session.headers['Content-Type'] = 'application/x-www-form-urlencoded'

    def call(self, method, params):
        return self.send(APIRequest(method, params))

    def send(self, request):

        logger.debug('Prepare API Method request')

        self.prepare_request(request)

        method_url = self.API_URL + request.method
        response = self.session.post(method_url, request.method_params, timeout=self.timeout)

        # todo Replace with something less exceptional
        response.raise_for_status()

        # TODO: there are may be 2 dicts in one JSON
        # for example: "{'error': ...}{'response': ...}"
        for response_or_error in json_iter_parse(response.text):
            request.response = response_or_error

            if 'response' in response_or_error:
                # todo Can we have error and response simultaneously
                # for error in errors:
                #     logger.warning(str(error))
                return response_or_error['response']

            elif 'error' in response_or_error:
                api_error = VkAPIError(request.response['error'])
                request.api_error = api_error
                return self.handle_api_error(request)

    def prepare_request(self, request):
        request.method_params['access_token'] = self.access_token

    def get_access_token(self):
        raise NotImplementedError

    def handle_api_error(self, request):
        logger.error('Handle API error: %s', request.api_error)

        api_error_handler_name = 'on_api_error_' + str(request.api_error.code)
        api_error_handler = getattr(self, api_error_handler_name, self.on_api_error)

        return api_error_handler(request)

    def on_api_error_14(self, request):
        """
        14. Captcha needed
        """
        request.method_params['captcha_key'] = self.get_captcha_key(request)
        request.method_params['captcha_sid'] = request.api_error.captcha_sid

        return self.send(request)

    def on_api_error_15(self, request):
        """
        15. Access denied
            - due to scope
        """
        logger.error('Authorization failed. Access token will be dropped')
        self.access_token = self.get_access_token()
        return self.send(request)

    def on_api_error(self, request):
        logger.error('API error: %s', request.api_error)
        raise request.api_error

    def get_captcha_key(self, request):
        """
        Default behavior on CAPTCHA is to raise exception
        Reload this in child
        """
        # request.api_error.captcha_img
        raise request.api_error


class API(APIBase):
    def __init__(self, access_token, **kwargs):
        super().__init__(**kwargs)
        self.access_token = access_token


class UserAPI(APIBase):
    LOGIN_URL = 'https://m.vk.com'
    AUTHORIZE_URL = 'https://oauth.vk.com/authorize'

    def __init__(self, user_login='', user_password='', app_id=None, scope='offline', session = None, **kwargs):
        super().__init__(**kwargs)

        self.user_login = user_login
        self.user_password = user_password
        self.app_id = app_id
        self.scope = scope
        self.session_storage = session
        self.user_id = None
        self.access_token = None
        self.get_session()
        if not self.access_token:
            self.access_token = self.get_access_token()
        self.save_session()

    def get_session(self):
        data = None
        if self.session_storage:
            try:
                with open(self.session_storage, 'rb') as f:
                    (self.auth_session, self.access_token, self.user_id) = pickle.load(f)
            except Exception as e:
                self.auth_session = requests.session()

    def save_session(self):
        if self.session_storage:
            with open(self.session_storage, 'wb+') as f:
                pickle.dump((self.auth_session, self.access_token, self.user_id), f)

    def get_video_url(self, owner_id, video_id):
        url = None
        try:
            response = self.auth_session.post(
                'https://vk.com/al_video.php',
                headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36',
                        'X-Requested-With': 'XMLHttpRequest'},
                params={'act': 'show_inline',
                'al': '1',
                'video': (str(owner_id)+'_'+str(video_id))},
                allow_redirects=False
            ).json()
            url = response['payload'][1][3]['player']['params'][0]['cache720']
        except Exception as e:
            return None
        return url

    def download_file(self, url, filename):
        print(url)
        print(filename)
        response = self.auth_session.get(url)

        with open(filename, 'wb+') as f:
            f.write(response.content)

    def scrap_audio_data(self, html, user_id, filter_root_el=None, convert_m3u8_links=True):
        """ Парсинг списка аудиозаписей из html страницы """

        if filter_root_el is None:
            filter_root_el = {'id': 'au_search_items'}

        soup = BeautifulSoup(html, 'html.parser')
        tracks = []
        ids = []

        last_request = 0.0

        root_el = soup.find(**filter_root_el)

        if root_el is None:
            raise ValueError('Could not find root el for audio')

        playlist_snippets = soup.find_all('div', {'class': "audioPlaylistSnippet__list"})
        for playlist in playlist_snippets:
            playlist.decompose()

        for audio in root_el.find_all('div', {'class': 'audio_item'}):
            if 'audio_item_disabled' in audio['class']:
                continue

            data_audio = json.loads(audio['data-audio'])
            data_audio[13] = re.sub('(/+)', '/', data_audio[13].strip('/')).split('/')
            if len(data_audio[13]) == 6:
                data_audio[13] = [data_audio[13][2], data_audio[13][4]]
            else:
                data_audio[13] = data_audio[13][-2:]

            full_id = (
                str(data_audio[1]), str(data_audio[0]), data_audio[13][0], data_audio[13][1]
            )
            ids.append(full_id)

        for ids_group in [ids[i:i + 10] for i in range(0, len(ids), 10)]:
            delay = RPS_DELAY - (time.time() - last_request)

            if delay > 0:
                time.sleep(delay)

            result = self.auth_session.post(
                'https://m.vk.com/audio',
                data={'act': 'reload_audio', 'ids': ','.join(['_'.join(i) for i in ids_group])}
            ).json()

            last_request = time.time()
            if result['data']:
                data_audio = result['data'][0]
                for audio in data_audio:
                    artist = BeautifulSoup(audio[4], 'html.parser').text
                    title = BeautifulSoup(audio[3].strip(), 'html.parser').text
                    duration = audio[5]
                    link = audio[2]

                    if 'audio_api_unavailable' in link:
                        link = decode_audio_url(link, user_id)

                    if convert_m3u8_links and 'm3u8' in link:
                        link = RE_M3U8_TO_MP3.sub(r'\1/\2.mp3', link)

                    tracks.append({
                        'id': audio[0],
                        'owner_id': audio[1],
                        'track_covers': audio[14].split(',') if audio[14] else '',
                        'url': link,
                        'artist': artist,
                        'title': title,
                        'duration': duration,
                    })

        return tracks

    def get_audio_url(self, owner_id, audio_id):
        response = self.auth_session.get(
            'https://m.vk.com/audio{}_{}'.format(owner_id, audio_id),
            allow_redirects=False
        )
        try:
            track = self.scrap_audio_data(
                response.text,
                int(self.user_id),
                filter_root_el={'class': 'basisDefault'}
            )
        except Exception as e:
            return None
        if track and len(track) and track[0].get('url') and track[0]['url']:
            return track[0]['url']
        else:
            return None

    @staticmethod
    def get_form_action(response):
        form_action = re.findall(r'<form(?= ).* action="(.+)"', response.text)
        if form_action:
            return form_action[0]
        else:
            raise VkAuthError('No form on page {}'.format(response.url))

    def get_response_url_queries(self, response):
        if not response.ok:
            if response.status_code == 401:
                raise VkAuthError(response.json()['error_description'])
            else:
                response.raise_for_status()

        return self.get_url_queries(response.url)

    @staticmethod
    def get_url_queries(url):
        parsed_url = urllib.parse.urlparse(url)
        url_queries = urllib.parse.parse_qsl(parsed_url.fragment)
        # We lose repeating keys values
        return dict(url_queries)

    def get_access_token(self):
        if self.login():
            return self.authorize()

    def get_login_form_data(self):
        return {
            'email': self.user_login,
            'pass': self.user_password,
        }

    def login(self):
        # Get login page
        login_page_response = self.auth_session.get(self.LOGIN_URL)
        if 'remixsid' in self.auth_session.cookies or 'remixsid6' in self.auth_session.cookies:
            return True
        # Get login form action. It must contains ip_h and lg_h values
        login_action = self.get_form_action(login_page_response)
        # Login using user credentials
        login_response = self.auth_session.post(login_action, self.get_login_form_data())

        if 'remixsid' in self.auth_session.cookies or 'remixsid6' in self.auth_session.cookies:
            return True

        url_queries = self.get_url_queries(login_response.url)
        if 'sid' in url_queries:
            self.auth_captcha_is_needed(login_response)

        elif url_queries.get('act') == 'authcheck':
            self.auth_check_is_needed(login_response.text)

        elif 'security_check' in url_queries:
            self.phone_number_is_needed(login_response.text)

        else:
            raise VkAuthError('Login error (e.g. incorrect password)')

    def get_auth_params(self):
        return {
            'client_id': self.app_id,
            'scope': self.scope,
            'display': 'mobile',
            'response_type': 'token',
        }

    def authorize(self):
        """
        OAuth2
        """
        # Ask access
        ask_access_response = self.auth_session.post(self.AUTHORIZE_URL, self.get_auth_params())
        url_queries = self.get_response_url_queries(ask_access_response)

        if 'access_token' not in url_queries:
            # Grant access
            grant_access_action = self.get_form_action(ask_access_response)
            grant_access_response = self.auth_session.post(grant_access_action)
            url_queries = self.get_response_url_queries(grant_access_response)

        return self.process_auth_url_queries(url_queries)

    def process_auth_url_queries(self, url_queries):
        self.expires_in = url_queries.get('expires_in')
        self.user_id = url_queries.get('user_id')
        return url_queries.get('access_token')


class CommunityAPI(UserAPI):
    def __init__(self, *args, **kwargs):
        self.group_ids = kwargs.pop('group_ids', None)
        self.default_group_id = None

        self.access_tokens = {}

        super().__init__(*args, **kwargs)

    def get_auth_params(self):
        auth_params = super().get_auth_params()
        auth_params['group_ids'] = stringify(self.group_ids)
        return auth_params

    def process_auth_url_queries(self, url_queries):
        super().process_auth_url_queries(url_queries)

        self.access_tokens = {}
        for key, value in url_queries.items():
            # access_token_GROUP-ID: ACCESS-TOKEN
            if key.startswith('access_token_'):
                group_id = int(key[len('access_token_'):])
                self.access_tokens[group_id] = value

        self.default_group_id = self.group_ids[0]

    def prepare_request(self, request):
        group_id = request.method_params.get('group_id', self.default_group_id)
        request.method_params['access_token'] = self.access_tokens[group_id]


class InteractiveMixin:

    def get_user_login(self):
        user_login = input('VK user login: ')
        return user_login.strip()

    def get_user_password(self):
        import getpass

        user_password = getpass.getpass('VK user password: ')
        return user_password

    def get_access_token(self):
        logger.debug('InteractiveMixin.get_access_token()')
        access_token = super().get_access_token()
        if not access_token:
            access_token = input('VK API access token: ')
        return access_token

    def get_captcha_key(self, captcha_image_url):
        """
        Read CAPTCHA key from shell
        """
        print('Open CAPTCHA image url: ', captcha_image_url)
        captcha_key = input('Enter CAPTCHA key: ')
        return captcha_key

    def get_auth_check_code(self):
        """
        Read Auth code from shell
        """
        auth_check_code = input('Auth check code: ')
        return auth_check_code.strip()
