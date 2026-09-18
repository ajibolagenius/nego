// Run: npx tsx src/lib/talent-url.test.ts
// Guards the one rule both sides of a profile URL depend on: what /t/[slug]
// links to must be what /t/[slug] can look up again.
import assert from 'node:assert/strict'
import { getTalentUrl, talentSlug } from './talent-url'

const id = '70a7f4cb-f457-4dd6-9261-991d2ebd23a6'

// clean usernames pass through untouched
assert.equal(talentSlug({ id, username: 'creamydee', display_name: 'Creamydee' }), 'creamydee')
assert.equal(talentSlug({ id, username: 'sweet_dov43' }), 'sweet_dov43')

// real usernames from the roster that used to 404
assert.equal(talentSlug({ id, username: '@bigkallang', display_name: '@bigkallang' }), 'bigkallang')
assert.equal(talentSlug({ id, username: 'mercy ray 💦', display_name: 'Mercy' }), 'mercy-ray')
assert.equal(talentSlug({ id, username: 'prettyme🍬🍭', display_name: 'ADEYEMI ITUNUOLUWA' }), 'prettyme')

// no username: fall back to the display name, then to the id
assert.equal(talentSlug({ id, username: null, display_name: 'Melinda Mary' }), 'melinda-mary')
assert.equal(talentSlug({ id, username: '💦💦', display_name: '🎀' }), id)

// every slug must be URL-safe, or the link cannot survive the round trip
for (const u of ['@bigkallang', 'mercy ray 💦', 'prettyme🍬🍭', 'bitch👿🥹', 'Mixed Case']) {
    const slug = talentSlug({ id, username: u, display_name: 'Name' })
    assert.equal(slug, encodeURIComponent(slug), `not URL-safe: ${slug}`)
}

assert.equal(getTalentUrl({ id, username: 'mercy ray 💦', display_name: 'Mercy' }), '/t/mercy-ray')
assert.equal(getTalentUrl({ id, username: null, display_name: null }), `/talent/${id}`)

console.log('talent-url: all assertions passed')
