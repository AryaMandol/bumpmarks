const CACHE_NAME = "bumpmarks-v13";

const APP_DOCUMENT = "/app/index.html";
const LANDING_DOCUMENT = "/index.html";
const OFFLINE_DOCUMENT = "/offline/index.html";

const CORE_ASSETS = [
    APP_DOCUMENT,
    LANDING_DOCUMENT,
    OFFLINE_DOCUMENT,
    "/static/css/app.css",
    "/static/js/app.js",
    "/static/manifest.webmanifest",
    "/static/icons/icon-192.png",
    "/static/icons/icon-512.png",
    "/static/icons/icon-maskable-512.png",
    "/static/icons/apple-touch-icon.png",
];

const OPTIONAL_ASSETS = [
    "/static/css/landing.css",
    "/static/js/landing.js",
    "/static/images/app-preview.png",
    "/static/images/landing-mother-window.png",
    "/static/images/landing-mother-phone.png",
];


async function seedAliases(cache) {
    const appDocument = await cache.match(APP_DOCUMENT);
    const landingDocument = await cache.match(LANDING_DOCUMENT);
    const offlineDocument = await cache.match(OFFLINE_DOCUMENT);

    if (appDocument) {
        await cache.put("/app", appDocument.clone());
        await cache.put("/app/", appDocument.clone());
    }

    if (landingDocument) {
        await cache.put("/", landingDocument.clone());
    }

    if (offlineDocument) {
        await cache.put("/offline", offlineDocument.clone());
        await cache.put("/offline/", offlineDocument.clone());
    }
}


self.addEventListener("install", event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            await cache.addAll(CORE_ASSETS);
            await seedAliases(cache);

            await Promise.allSettled(
                OPTIONAL_ASSETS.map(asset => cache.add(asset))
            );

            await self.skipWaiting();
        })()
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );

            await self.clients.claim();
        })()
    );
});


self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


async function cacheNetworkResponse(request, response) {
    if (!response || !response.ok) {
        return response;
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
    return response;
}


async function networkFirstNavigation(request, fallbackUrl) {
    try {
        const response = await fetch(request);
        return await cacheNetworkResponse(request, response);
    } catch (error) {
        return (
            await caches.match(request) ||
            await caches.match(fallbackUrl) ||
            await caches.match(OFFLINE_DOCUMENT)
        );
    }
}


self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    if (event.request.mode === "navigate") {
        if (
            requestUrl.pathname === "/app" ||
            requestUrl.pathname === "/app/" ||
            requestUrl.pathname.startsWith("/app/")
        ) {
            event.respondWith(
                (async () => {
                    const cachedApp =
                        await caches.match(APP_DOCUMENT) ||
                        await caches.match("/app") ||
                        await caches.match("/app/");

                    if (cachedApp) {
                        return cachedApp;
                    }

                    return networkFirstNavigation(
                        event.request,
                        OFFLINE_DOCUMENT
                    );
                })()
            );
            return;
        }

        if (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") {
            event.respondWith(
                networkFirstNavigation(
                    event.request,
                    LANDING_DOCUMENT
                )
            );
            return;
        }

        event.respondWith(
            networkFirstNavigation(
                event.request,
                OFFLINE_DOCUMENT
            )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }

            return fetch(event.request).then(response =>
                cacheNetworkResponse(event.request, response)
            );
        })
    );
});
