// Run: npx tsx src/lib/talent-url.test.ts
// Guards the one rule both sides of a profile URL depend on: what /t/[slug]
// links to must be what /t/[slug] can look up again.
import assert from 'node:assert/strict'
import { getTalentUrl, isValidUsername, talentSlug } from './talent-url'

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

// A stored username must equal its own slug, or the unique index and the URL
// disagree about who owns a name.
for (const u of ['creamydee', 'sweet_dov43', 'nel_son', 'abc', 'a'.repeat(30)]) {
    assert.ok(isValidUsername(u), `should be valid: ${u}`)
    assert.equal(talentSlug({ id, username: u }), u)
}
for (const u of ['@bigkallang', 'mercy ray 💦', 'prettyme🍬🍭', 'MixedCase', 'ab', 'a'.repeat(31), '', '---', '___']) {
    assert.ok(!isValidUsername(u), `should be rejected: ${u}`)
}

// Different usernames can normalise to one key, which is why the URL key — not
// username — is what profiles_talent_slug_unique indexes: these two cannot both
// exist, so talentSlug() never has to break a tie.
assert.equal(
    talentSlug({ id, username: '@bigkallang', display_name: 'Big Kallang' }),
    talentSlug({ id, username: 'bigkallang', display_name: 'Someone Else' })
)

// Nothing derivable: falls back to the id, which needs no uniqueness rule.
assert.equal(talentSlug({ id, username: '---', display_name: '.' }), id)

console.log('talent-url: all assertions passed')
