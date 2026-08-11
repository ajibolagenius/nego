/**
 * Single source of truth for the app's release version.
 *
 * Keep these three in lockstep whenever a release must reach existing installs:
 *   - `APP_VERSION` here
 *   - `version` in package.json
 *   - `SW_VERSION` / `CACHE_VERSION` in public/sw.js
 *
 * The service worker constants are the ones that actually force an update: the
 * browser only treats a worker as new if the bytes of /sw.js changed, and it
 * only discards the previous caches if the cache names changed with it.
 */
export const APP_VERSION = '0.2.0'

/**
 * Bumped in the release that fixed push notifications being silently dead for
 * most users. Clients below this version are running a build with no
 * `pushsubscriptionchange` handler, so their push subscription cannot recover on
 * its own once the browser rotates it.
 */
export const MIN_PUSH_CAPABLE_VERSION = '0.2.0'
