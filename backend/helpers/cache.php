<?php

if (!function_exists("appCachePath")) {
    function appCachePath($key) {
        $dir = __DIR__ . "/../cache";

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir . "/" . sha1($key) . ".json";
    }
}

if (!function_exists("appGetCache")) {
    function appGetCache($key, $ttlSeconds = 60) {
        $path = appCachePath($key);

        if (!file_exists($path)) {
            return null;
        }

        if ((time() - filemtime($path)) > $ttlSeconds) {
            return null;
        }

        $json = file_get_contents($path);
        $data = json_decode($json, true);

        return is_array($data) ? $data : null;
    }
}

if (!function_exists("appSetCache")) {
    function appSetCache($key, $data) {
        $path = appCachePath($key);

        file_put_contents(
            $path,
            json_encode($data, JSON_UNESCAPED_UNICODE),
            LOCK_EX
        );

        return true;
    }
}