const CACHE_NAME = "bumpmarks-v15";
const ASSET_REV = "bm008c";

const APP_DOCUMENT = "/app/index.html";
const LANDING_DOCUMENT = "/index.html";
const OFFLINE_DOCUMENT = "/offline/index.html";
const PRIVACY_DOCUMENT = "/privacy/index.html";
const TERMS_DOCUMENT = "/terms/index.html";
const REFUND_DOCUMENT = "/refund-policy/index.html";
const CONTACT_DOCUMENT = "/contact/index.html";

const APP_CSS = `/static/css/app.css?v=${ASSET_REV}`;
const APP_JS = `/static/js/app.js?v=${ASSET_REV}`;
const LANDING_CSS = `/static/css/landing.css?v=${ASSET_REV}`;
const LANDING_JS = `/static/js/landing.js?v=${ASSET_REV}`;
const LEGAL_CSS = `/static/css/legal.css?v=${ASSET_REV}`;
const MANIFEST = `/static/manifest.webmanifest?v=${ASSET_REV}`;
const APP_PREVIEW = `/static/images/app-preview.png?v=${ASSET_REV}`;

const CORE_ASSETS = [
    APP_DOCUMENT,
    LANDING_DOCUMENT,
    OFFLINE_DOCUMENT,
    PRIVACY_DOCUMENT,
    TERMS_DOCUMENT,
    REFUND_DOCUMENT,
    CONTACT_DOCUMENT,
    APP_CSS,
    APP_JS,
    LEGAL_CSS,
    MANIFEST,
    "/static/icons/icon-192.png",
    "/static/icons/icon-512.png",
    "/static/icons/icon-maskable-512.png",
    "/static/icons/apple-touch-icon.png",
];

const OPTIONAL_ASSETS = [
    LANDING_CSS,
    LANDING_JS,
    APP_PREVIEW,
    "/static/images/landing-mother-window.png",
    "/static/images/landing-mother-phone.png",
];


async function freshFetch(url) {
    const response = await fetch(url, { cache: "reload" });

    if (!response || !response.ok) {
        throw new Error(`Could not cache ${url}`);
    }

    return response;
}


async function precacheFresh(cache, urls) {
    await Promise.all(
        urls.map(async url => {
            const response = await freshFetch(url);
            await cache.put(url, response.clone());
        })
    );
}


async function seedAliases(cache) {
    const appDocument = await cache.match(APP_DOCUMENT);
    const landingDocument = await cache.match(LANDING_DOCUMENT);
    const offlineDocument = await cache.match(OFFLINE_DOCUMENT);
    const privacyDocument = await cache.match(PRIVACY_DOCUMENT);
    const termsDocument = await cache.match(TERMS_DOCUMENT);
    const refundDocument = await cache.match(REFUND_DOCUMENT);
    const contactDocument = await cache.match(CONTACT_DOCUMENT);

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

    if (privacyDocument) {
        await cache.put("/privacy", privacyDocument.clone());
        await cache.put("/privacy/", privacyDocument.clone());
    }

    if (termsDocument) {
        await cache.put("/terms", termsDocument.clone());
        await cache.put("/terms/", termsDocument.clone());
    }

    if (refundDocument) {
        await cache.put("/refund-policy", refundDocument.clone());
        await cache.put("/refund-policy/", refundDocument.clone());
    }

    if (contactDocument) {
        await cache.put("/contact", contactDocument.clone());
        await cache.put("/contact/", contactDocument.clone());
    }
}


self.addEventListener("install", event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            await precacheFresh(cache, CORE_ASSETS);
            await seedAliases(cache);

            await Promise.allSettled(
                OPTIONAL_ASSETS.map(async asset => {
                    const response = await freshFetch(asset);
                    await cache.put(asset, response.clone());
                })
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
                    .filter(key => key.startsWith("bumpmarks-") && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );

            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }

            await self.clients.claim();
        })()
    );
});


self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


async function cacheResponse(cacheKey, response) {
    if (!response || !response.ok) {
        return response;
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.put(cacheKey, response.clone());
    return response;
}


async function networkFirstNavigation(event, canonicalUrl) {
    try {
        const preload = await event.preloadResponse;
        const response = preload || await fetch(event.request, { cache: "no-store" });

        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
            await cache.put(canonicalUrl, response.clone());
            return response;
        }
    } catch (error) {
        // Fall through to the local app shell.
    }

    return (
        await caches.match(event.request) ||
        await caches.match(canonicalUrl) ||
        await caches.match(OFFLINE_DOCUMENT)
    );
}


async function networkFirstAsset(request) {
    try {
        const response = await fetch(request, { cache: "no-store" });
        return await cacheResponse(request, response);
    } catch (error) {
        return (
            await caches.match(request) ||
            await caches.match(request, { ignoreSearch: true })
        );
    }
}


async function cacheFirstAsset(request) {
    const cached =
        await caches.match(request) ||
        await caches.match(request, { ignoreSearch: true });

    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    return await cacheResponse(request, response);
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
                networkFirstNavigation(event, APP_DOCUMENT)
            );
            return;
        }

        if (
            requestUrl.pathname === "/" ||
            requestUrl.pathname === "/index.html"
        ) {
            event.respondWith(
                networkFirstNavigation(event, LANDING_DOCUMENT)
            );
            return;
        }

        const legalRoutes = {
            "/privacy": PRIVACY_DOCUMENT,
            "/privacy/": PRIVACY_DOCUMENT,
            "/terms": TERMS_DOCUMENT,
            "/terms/": TERMS_DOCUMENT,
            "/refund-policy": REFUND_DOCUMENT,
            "/refund-policy/": REFUND_DOCUMENT,
            "/contact": CONTACT_DOCUMENT,
            "/contact/": CONTACT_DOCUMENT,
        };

        if (legalRoutes[requestUrl.pathname]) {
            event.respondWith(
                networkFirstNavigation(event, legalRoutes[requestUrl.pathname])
            );
            return;
        }

        event.respondWith(
            networkFirstNavigation(event, OFFLINE_DOCUMENT)
        );
        return;
    }

    if (
        event.request.destination === "script" ||
        event.request.destination === "style" ||
        event.request.destination === "manifest"
    ) {
        event.respondWith(networkFirstAsset(event.request));
        return;
    }

    event.respondWith(cacheFirstAsset(event.request));
});
