const CACHE_NAME = "bumpmarks-v11";

const APP_SHELL = [
    "/",
    "/app",
    "/offline",
    "/static/css/landing.css",
    "/static/css/app.css",
    "/static/js/landing.js",
    "/static/js/app.js",
    "/static/manifest.webmanifest",
    "/static/icons/icon-192.png",
    "/static/icons/icon-512.png",
    "/static/icons/icon-maskable-512.png",
    "/static/icons/apple-touch-icon.png",
    "/static/images/app-preview.png",
    "/static/images/landing-mother-window.png",
    "/static/images/landing-mother-phone.png",
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});


self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const copy = response.clone();

                    caches
                        .open(CACHE_NAME)
                        .then(cache => cache.put(event.request, copy))
                        .catch(() => {});

                    return response;
                })
                .catch(async () => {
                    if (requestUrl.pathname.startsWith("/app")) {
                        return (
                            await caches.match("/app") ||
                            await caches.match("/offline")
                        );
                    }

                    return (
                        await caches.match("/") ||
                        await caches.match("/offline")
                    );
                })
        );

        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== "basic") {
                    return response;
                }

                const copy = response.clone();

                caches
                    .open(CACHE_NAME)
                    .then(cache => cache.put(event.request, copy))
                    .catch(() => {});

                return response;
            });
        })
    );
});
