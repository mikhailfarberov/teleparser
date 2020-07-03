<?php
set_time_limit(0);
date_default_timezone_set('UTC');
require __DIR__.'/lib/vendor/autoload.php';
require __DIR__.'/lib/Netrequest.php';

function rmkdir($path) {
    if (is_dir($path))
        return;
    rmkdir(dirname($path));
    mkdir($path, 0775);
}

function json_safe_encode($var)
{
    return php2js($var);
}

function php2js($a = false, $is_key = false)
{
    if (is_null($a)) return 'null';
    if ($a === false) return 'false';
    if ($a === true) return 'true';
    if (is_scalar($a)) {
        static $jsonReplaces = array(array("\\", "/", "\n", "\t", "\r", "\b", "\f", '"'),
            array('\\\\', '\\/', '\\n', '\\t', '\\r', '\\b', '\\f', '\"'));
        if ($is_key) {
            return '"' . str_replace($jsonReplaces[0], $jsonReplaces[1], $a) . '"';
        }
        if (is_float($a)) {
            // Always use "." for floats.
            $a = str_replace(",", ".", strval($a));
        }

        if (is_numeric($a) && strlen($a) < 10 && substr($a, 0, 2) != '0x') {
            return $a;
        } else if (is_string($a)) {
            static $jsonReplaces = array(array("\\", "/", "\n", "\t", "\r", "\b", "\f", '"'),
                array('\\\\', '\\/', '\\n', '\\t', '\\r', '\\b', '\\f', '\"'));
            return '"' . str_replace($jsonReplaces[0], $jsonReplaces[1], $a) . '"';
        } else {
            return $a;
        }
    }
    $isList = true;
    for ($i = 0, reset($a); $i < count($a); $i++, next($a)) {
        if (key($a) !== $i) {
            $isList = false;
            break;
        }
    }
    $result = array();
    if ($isList) {
        foreach ($a as $v) $result[] = php2js($v);
        return '[ ' . join(', ', $result) . ' ]';
    } else {
        foreach ($a as $k => $v) $result[] = php2js($k, true) . ': ' . php2js($v);
        return '{ ' . join(', ', $result) . ' }';
    }
}

# account list
function get_accounts() {
    global $cfg;
    $req = new Netrequest();
    $req->setUri($cfg['app']['backend_url'] . '/accounts/ig/');
    $req->setHeader('Content-Type', 'application/json');
    try {
        $apiResponse = $req->request();
        $apiResponseJson = json_decode($apiResponse, true);
        return $apiResponseJson;
    }
    catch (Exception $e) {
        return null;
    }
}

# lock
$s_time = time();
$locked = false;
while(time() - $s_time < 120) {
    $fd = fopen(dirname(__FILE__) . '/app.lock', 'c');

    if ($fd === false)
        exit(-1);
    if (flock($fd, LOCK_EX | LOCK_NB) === false) {
        sleep(1);
    } else {
        $locked = true;
        break;
    }
}
if ($locked == false)
    exit(-1);

# settings
$_ENV = getenv();
if (isset($_ENV['box']))
    $cfgFilename = "../config/config-{$_ENV['box']}.yml";
else
    $cfgFilename = "../config/config-dev.yml";

$cfg = yaml_parse(file_get_contents($cfgFilename));
$req = new Netrequest();

# пройти по всем аккам
if (!isset($cfg['instagram'])) exit();
$ig = new \InstagramAPI\Instagram(false, true, array('basefolder' => $cfg['instagram']['session_path'], 'storage' => 'file'));

while (1) {
    # forever loop
    $totalSavedItems = 0;
    $maxDepth = 10;
    $accounts = get_accounts();
    if (!$accounts || !count($accounts)) {
        sleep(60);
        continue;
    }
    foreach ($accounts as $account) {
        try {
            $username = $account['username'];
            $password = $account['password'];
            if (!isset($account['feeds']) || !count($account['feeds'])) continue;
            # LOGIN
            echo "ACCOUNT: {$username}\n";
            $response = $ig->login($username, $password);
            if ($response) {
                if ($response->isChallenge()) {
                    // CHALLENGE
                    $challenge = $response->getChallenge();
                    $url = substr($challenge->getApiPath(), 1);
                    $response = $ig->request($url)->setNeedsAuth(false)->addPost('choice', 0)->getDecodedResponse();
                    while (1) {
                        echo "SMS CODE ({$username}): ";
                        $smscode = trim(fgets(STDIN));
                        if ($smscode != '') break;
                    }
                    $response = $ig->request($url)->setNeedsAuth( false )->addPost( 'security_code', $smscode )->addHeader('x-instagram-ajax', true)->getDecodedResponse();
                    $ig->login($username, $password);
                    echo "CORRECT\n";
                } else if ($response->isTwoFactorRequired()) {
                    throw new Exception('2FA is not supported: '.$username);
                }
            }
            $maxId = null;
            foreach ($account['feeds'] as $feed) {
                if ($feed['name'] == '') continue;
                echo "FEED: {$feed['name']}\n";
                $timelineDepth = 0;
                $feedId = $ig->people->getUserIdForName($feed['name']);
                while (1) {
                    # get user's timeline
                    $timeline = $ig->timeline->getUserFeed($feedId, $maxId);
                    echo "PAGE: {$timelineDepth}\n";
                    if ($timeline && $timeline->isItems()) {
                        $timelineDepth++;
                        # parse items
                        $items = $timeline->getItems();
                        $savedItems = 0;
                        foreach ($items as $item) {
                            # AUTHOR
                            $author = $item->getUser();
                            $authorId = $author->getId();
                            $authorName = $author->getUsername();
                            $channelId = "ig_{$authorName}";
                            $itemId = $item->getId();
                            $date = floor((int)$item->getDeviceTimestamp() / 1000000);
                            # CAPTION
                            if ($item->getCaption())
                              $caption = $item->getCaption()->getText();
                            else
                              $caption = '';
                            # MEDIA
                            $files = array();
                            if ($item->isCarouselMedia()) {
                                # media array
                                $media = $item->getCarouselMedia();
                            } else {
                                $media = array($item);
                            }
                            foreach ($media as $mediaItem) {
                                $type = $mediaItem->getMediaType();
                                switch ($type) {
                                    case \InstagramAPI\Response\Model\CarouselMedia::PHOTO:
                                        $versions = $mediaItem->getImageVersions2();
                                        if ($versions->isCandidates()) {
                                            $candidates = $versions->getCandidates();
                                            $url = $candidates[0]->getUrl();
                                            $files[] = array('type' => 'photo', 'url' => $url);
                                        }
                                        break;
                                    case \InstagramAPI\Response\Model\CarouselMedia::VIDEO:
                                        $versions = $mediaItem->getVideoVersions();
                                        if (count($versions)) {
                                            $url = $versions[0]->getUrl();
                                            $files[] = array('type' => 'video', 'url' => $url);
                                        }
                                        break;
                                    default:
                                }
                            }
                            # DOWNLOADS
                            if (count($files)) {
                                $mediaPath = $cfg['app']['downloads_location'] . '/' . $channelId . '/' . $itemId;
                                rmkdir($mediaPath);
                                foreach ($files as $fpos=>$file) {
                                    $parts = parse_url($file['url']);
                                    $filename = basename($parts['path']);
                                    file_put_contents($mediaPath . '/' . $filename, fopen($file['url'], 'r'));
                                    $files[$fpos]['filename'] = $filename;
                                }
                            }
                            # SAVE
                            $req->setUri($cfg['app']['backend_url'] . '/messages/' . $channelId);
                            $req->setHeader('Content-Type', 'application/json');
                            $apiResponse = $req->request(json_safe_encode(array('channel' => array('id' => $channelId, 'name' => $authorName), 'id' => $itemId, 'source' => 'ig', 'text' => $caption, 'date' => $date, 'files' => $files)),
                                        false,
                                        "PUT");
                            echo "TELEPARSER API RESPONSE: ".$apiResponse."\n\n";
                            $apiResponseJson = json_decode($apiResponse, true);
                            if (!$apiResponseJson['success'])
                              throw new Exception('Error on saving post: '.$apiResponse);
                            if (!$apiResponseJson['exists'])
                                $savedItems++;
                            $totalSavedItems++;
                        }
                        if (!$timeline->isMoreAvailable() || $savedItems == 0 || $timelineDepth > $maxDepth) break;
                        $maxId = $timeline->getNextMaxId();
                    } else
                        break;
                    # random sleep
                    sleep(random_int(5, 30));
                }
                # random sleep
                sleep(random_int(30, 120));
            }
        } catch (Exception $e) {
            echo $e->getMessage()."\n";
        }
    }

    echo "TOTAL SAVED ITEMS: {$totalSavedItems}\n";
    sleep(1800);
}

# unlock
flock($fd, LOCK_UN);
fclose($fd);
