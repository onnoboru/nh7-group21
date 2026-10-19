# Implementation contract

Build **Kindred**, an English-language, responsive, local-first intergenerational community prototype based on idea_a.md. No runtime dependencies, external assets, trackers, or build step. Static deployable `dist/` with relative URLs. Japanese README only; all product text English.

## Face-to-face use
Support two real people on one shared device without a profile. Enter two distinct nicknames and choose an activity. Both people answer each quiz question before revealing the answer; both take a turn on every conversation prompt. Save two independent ratings and optional notes in one in-person session review, including individual quiz scores. Award 30 device-wide points once per activity, after both reviews are submitted. Display these records in My circle even without a profile. Preserve existing v1 saved data, community demo, solo activities, and hosting portability. In-progress activities are not persisted.

## Ownership
- Core agent: `dist/core.js`, `tests/core.test.mjs`.
- UI agent: `dist/app.js`, `dist/index.html`.
- Design agent: `dist/styles.css`, optional original SVG assets in `dist/assets/`.
- Parent: package scripts, local server, Japanese docs, deployment workflow, integration and validation.

## Shared UI structure
Use `body`, `.app-shell`, `.sidebar`, `.brand`, `.brand-mark`, `.nav`, `.nav-item` (`.active`), `.sidebar-footer`, `.main`, `.topbar`, `.page-heading`, `.eyebrow`, `.page-title`, `.muted`, `.header-actions`, `.avatar`, `.points-pill`, `.button` (`.primary`, `.secondary`, `.ghost`, `.small`), `.hero`, `.hero-copy`, `.hero-art`, `.hero-tag`, `.hero-stats`, `.section-heading`, `.card`, `.grid`, `.match-grid`, `.match-card`, `.person-avatar`, `.interest-tag`, `.tags`, `.match-reason`, `.section-grid`, `.activity-card`, `.group-card`, `.reward-card`, `.empty-state`, `.modal-backdrop`, `.modal`, `.form-field`, `.choice-grid`, `.choice`, `.selected`, `.toast`, `.session-layout`, `.call-stage`, `.session-controls`, `.quiz-option`, `.review-stars`, `.notice`, `.progress-track`, `.progress-fill`.
UI agent can add classes and coordinate with design agent. Use emoji/icon-like inline SVG sparingly; create warm sophisticated illustrated hero with SVG/CSS, cream background, forest green primary, apricot accents, rounded cards, bold readable system typography. Desktop sidebar, mobile responsive bottom navigation. Product should look finished, not a generic landing page.

## Core exports (all pure unless explicitly persistence)
`INTERESTS`: array `{id, label, icon}`; interests ids `gardening`, `cooking`, `music`, `stories`, `art`, `games`.
`PEOPLE`: array `{id, name, age, generation: 'young'|'senior', interests: string[], bio, availability, color, initials}` (fictional profiles).
`GROUPS`: array `{id, name, interest, members, description, icon, color}`.
`REWARDS`: array `{id, name, description, cost, icon}` (clearly sample vouchers).
`ACTIVITIES`: array `{id, title, interest, kind: 'quiz'|'conversation', description, duration, icon, prompts: string[], questions?: [{question, answers: string[], correct: number, explanation}]}`.
`createState()`: `{version:1, profile:null, points:0, reviews:[], friends:[], joinedGroups:[], redemptions:[], completedSessions:[]}`.
`saveState(state, storage=globalThis.localStorage)`, `loadState(storage=globalThis.localStorage)` graceful on invalid storage/data. `saveState` returns boolean.
`setProfile(state, {name, age, interests, guardianConsent})`: returns new state or throws English Error; ages 6..110, name 1..40, >=1 interest. `age<12` always family mode, `age<18` needs guardianConsent for online-demo mode.
`getMode(profile)`: `'family'|'community'` (under 12, and under 18 without consent => family).
`getMatches(state)`: array of PEOPLE with `sharedInterests`, `score`, `reason`. opposite generation only, shared interest required, family mode returns []. Young profile age<60 matches senior; senior matches young. No matching real users.
`getRecommendedGroups(state)`: GROUPS with `reason`, based on interests and positively reviewed activity interests.
`getSuggestedActivity(state, personId?)`: ACTIVITY.
`completeSession(state, {id, personId:null|string, activityId, rating:1..5, note, addFriend:boolean})`: new state; +30 points once per unique session id; only valid PEOPLE, ACTIVITIES; family mode cannot add external friends. idempotent duplicate ids. Stores review including activity interest, rating and note. Completed activity required by UI before opening review.
`joinGroup(state, groupId)`: new state, idempotent; `redeemReward(state,rewardId)`: new state or error for insufficient points; creates local demo voucher `{id,rewardId,code,cost}` and deducts points.

## UX requirements
Navigation: Discover, Activities, My circle, Rewards. Seed hero starts usable with clear create profile CTA; onboarding modal collects nickname, age, interests and guardian involvement option. Persistent profile settings and reset demo data control with confirmation. No fabricated statistics claiming real users; sample profile indicators and "Demo · stays on this device" visible.
Discover: profile-aware hero, matching cards with shared-interest reason, recommended groups. Activities: playable quiz and conversation prompt decks. Session: explicit simulated connection (no real call or camera access), activity progression and finish then review; points only on completed review. Friends saved from review; groups join/leave optional; reward balance, demo voucher redemption, history. Family mode offers activities together and prevents community session launch.
No real AI API: recommendation reasons are based on interests and ratings; label them "Smart picks" / "Based on your interests", not falsely AI-generated. README explains AI and real calls are future server integrations. No copyrighted clips; use built-in prompts/quizzes.

Accessibility: native buttons, labeled forms, dialog focus trapping/escape/return focus, status live region, visible keyboard focus, reduced motion, >=44px touch targets, mobile fit.
