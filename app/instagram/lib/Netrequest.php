<?php

class Netrequest {
	private $uri;
	private $content_type;
	private $last_url;
	private $code;
	private $only_headers;
    private $cookieFilename;
    private $save_headers;
    private $userAgent;
    private $referer;
    private $header;

    private $user_agents = array(
        'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
        'Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US; rv:1.8.1.11) Gecko/20071203 IceCat/2.0.0.11-g1',
        'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; ru-ru) AppleWebKit/533.21.1 (KHTML, like Gecko) iCab/4.8 Safari/533.16',
        'Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US; rv:1.8.1.6) Gecko/2007072300 Iceweasel/2.0.0.6 (Debian-2.0.0.6-0etch1+lenny1)',
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        'Mozilla/5.0 (Windows; I; Windows NT 5.1; ru; rv:1.9.2.13) Gecko/20100101 Firefox/4.0',
        'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:16.0) Gecko/20120815 Firefox/16.0',
        'Opera/9.80 (Windows NT 6.1; U; ru) Presto/2.8.131 Version/11.10',
        'Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; ru) Presto/2.8.131 Version/11.10',
        'Mozilla/5.0 (Macintosh; I; Intel Mac OS X 10_6_7; ru-ru) AppleWebKit/534.31+ (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
    );
	
	function __construct($url = null, $params = null, $only_headers = false) {
	    if ($url)
		    $this->setUri($url, $params);
		$this->only_headers = $only_headers;
        $this->userAgent = $this->user_agents[array_rand($this->user_agents)];
        $this->referer = null;
        $this->header = array();
        $this->cookieFilename = null;
        $this->save_headers = $only_headers;
	}

	function setSaveHeaders($yn) {
        $this->save_headers = $yn;
    }
	
	function serializeParams($params) {
		if ($params === null)
			return '';
		$query = '';
		foreach ($params as $key=>$val) {
			$query .= $key . '=' . $val . '&';
		}
		return substr($query, 0, -1);
	}
	
	function setUri($url, $params = null) {
		if ($params)
			$this->uri = $url . '?' . $this->serializeParams($params);
		else 
			$this->uri = $url;
	}
	
	function getUri() {
		return $this->uri;
	}

    function setReferer($referer) {
        $this->referer = $referer;
    }

    function setUserAgent($agent) {
        $this->userAgent = $agent;
    }

    function setUserAgentIdx($idx) {
        $this->userAgent = $this->user_agents[$idx];
    }

    function setHeader($header, $val = null) {
        if (is_array($header))
            $this->header = array_merge($this->header, $header);
        else if ($header)
            $this->header[$header] = $header.':'.$val;
    }

    function unsetHeader($header) {
	    if ($header && isset($this->header[$header]))
	        unset($this->header[$header]);
	    else if ($header == null)
            $this->header = array();
    }
	
	function request($post_params = null, $encode = true, $method = null) {
		$ch = curl_init();
        $options = array();
        // установка URL и других необходимых параметров
        $options[CURLOPT_URL] = $this->uri;
        $reqheaders = array('Expect:');
		if ($post_params) {
			if ($encode) {
                if (is_array($post_params))
                    $options[CURLOPT_POSTFIELDS] = http_build_query($post_params);
                else
                    $options[CURLOPT_POSTFIELDS] = $post_params;
                $reqheaders[] = 'Content-Type: application/x-www-form-urlencoded';
            } else {
                // Преобразование в CURLFile
                if (is_array($post_params)) {
                    foreach ($post_params as $ppkey => $ppval) {
                        if (strpos($ppval, '@') === 0) {
                            $filename = substr($ppval, 1);
                            $post_params[$ppkey] = new CURLFile($filename, mime_content_type($filename), basename($filename));
                        }
                    }
                }
                $options[CURLOPT_POSTFIELDS] = $post_params;
            }
        }
        
        if ($method)
            $options[CURLOPT_CUSTOMREQUEST] = $method;
        else if ($post_params)
            $options[CURLOPT_POST] = 1;
		
		if ($this->only_headers) {
            $options[CURLOPT_NOBODY] = true;
            $options[CURLOPT_HEADER] = true;
		} else if ($this->save_headers)
            $options[CURLOPT_HEADER] = true;
		else
            $options[CURLOPT_HEADER] = false;

        $options[CURLOPT_COOKIESESSION] = false;
        $options[CURLOPT_AUTOREFERER] = true;
        $options[CURLOPT_RETURNTRANSFER] = true;
        $options[CURLOPT_FOLLOWLOCATION] = true;
        $options[CURLOPT_MAXREDIRS] = 30;
        $options[CURLOPT_TIMEOUT] = 20;
        $options[CURLOPT_CONNECTTIMEOUT] = 5;
        $options[CURLOPT_SSL_VERIFYPEER] = 0;
        $options[CURLOPT_SSL_VERIFYHOST] = 0;
        $options[CURLOPT_USERAGENT] = $this->userAgent;
        $options[CURLOPT_DNS_CACHE_TIMEOUT] = 1800;
        $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;

        if ($this->header && count($this->header))
            $reqheaders = array_merge($reqheaders, $this->header);
        if (count($reqheaders))
            $options[CURLOPT_HTTPHEADER] = $reqheaders;

        if ($this->referer)
            $options[CURLOPT_REFERER] = $this->referer;
        $chmod = false;
        if ($this->cookieFilename) {
            $options[CURLOPT_COOKIEJAR] = $this->cookieFilename;
            $options[CURLOPT_COOKIEFILE] = $this->cookieFilename;
            if (!is_file($this->cookieFilename))
                $chmod = true;
        }
        curl_setopt_array($ch, $options);

        // загрузка страницы и выдача её браузеру
		$res = curl_exec($ch);
		$this->content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
		$this->last_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
		$this->code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		// завершение сеанса и освобождение ресурсов
		curl_close($ch);
		return $res;
	}
	
	function getContentType() {
		return strtolower($this->content_type);
	}
	
	function getLastUrl() {
		return $this->last_url;
	}
	
	function getCode() {
		return $this->code;
	}

    function setCookieFile($filename) {
        $dir = dirname($filename);
        if ($dir == '' || is_dir($dir))
            $this->cookieFilename = $filename;
        else
            $this->cookieFilename = null;
    }

    function getCookieFile() {
        return $this->cookieFilename;
    }
}