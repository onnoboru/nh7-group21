import {
  INTERESTS, PEOPLE, GROUPS, REWARDS, ACTIVITIES, STORAGE_KEY, createState, loadState, saveState,
  setProfile, getMode, getMatches, getRecommendedGroups, getSuggestedActivity, getDailyTheme, getDateKey, getJourneyStats,
  completeSession, joinGroup, redeemReward, createTogetherSession, answerTogetherQuestion, advanceTogetherSession, skipTogetherStep, completeTogetherSession,
} from './core.js';

const app = document.querySelector('#app');
const dialogRoot = document.querySelector('#dialog-root');
const status = document.querySelector('#status');
let state = loadState();
let page = 'discover';
let session = null;
let returnFocus = null;
let toastTimer;
let storageAvailable = true;
const PREFERENCES_KEY = 'kindred-local-preferences-v1';
const GAME_KINDS = ['quiz', 'conversation', 'random', 'choice', 'collaborative', 'reflection'];
try { void localStorage.length; } catch { storageAvailable = false; }

function loadPreferences() {
  const defaults = { textSize: 'large', autoRead: false, lastPair: null };
  try {
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || 'null');
    if (!stored || typeof stored !== 'object') return defaults;
    const textSize = ['comfortable', 'large', 'extra-large'].includes(stored.textSize) ? stored.textSize : defaults.textSize;
    const names = stored.lastPair?.names;
    const kind = stored.lastPair?.kind;
    const lastPair = Array.isArray(names) && names.length === 2 && names.every(name => typeof name === 'string' && name.trim() && name.trim().length <= 40)
      && names[0].trim().toLowerCase() !== names[1].trim().toLowerCase() && GAME_KINDS.includes(kind)
      ? { names: names.map(name => name.trim()), kind } : null;
    return { textSize, autoRead: stored.autoRead === true, lastPair };
  } catch { return defaults; }
}
let preferences = loadPreferences();
function applyPresentationPreferences() {
  document.body.dataset.textSize = preferences.textSize;
}
function savePreferences(changes) {
  preferences = { ...preferences, ...changes };
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Keep the preference for this visit. */ }
  applyPresentationPreferences();
}
applyPresentationPreferences();
function speechAvailable() {
  return typeof globalThis.SpeechSynthesisUtterance === 'function' && Boolean(globalThis.speechSynthesis);
}
function speak(text) {
  if (!speechAvailable()) { notify('Read aloud is not available in this browser.'); return; }
  globalThis.speechSynthesis.cancel();
  const utterance = new globalThis.SpeechSynthesisUtterance(text);
  utterance.lang = 'en-SG';
  globalThis.speechSynthesis.speak(utterance);
}
function speechTextForSession() {
  if (!session) return '';
  const activity = session.activity;
  if (activity.kind !== 'quiz') return promptFor(session, session.step);
  const question = activity.questions[session.step];
  const answers = question.answers.map((answer, index) => `Option ${String.fromCharCode(65 + index)}: ${answer}`).join('. ');
  if (session.revealed) return `${question.question}. The correct answer is ${question.answers[question.correct]}. ${question.explanation}`;
  return `${question.question}. ${answers}`;
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = (name) => {
  const paths = {
    discover: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
    activities: '<rect x="3" y="6" width="18" height="13" rx="4"/><path d="M7 11v4m-2-2h4m6-1h.01M18 15h.01M8 6l2-3h4l2 3"/>',
    circle: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
    rewards: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
const interest = (id) => INTERESTS.find(item => item.id === id);
const interestName = (id) => interest(id)?.label || id;
const person = (id) => PEOPLE.find(item => item.id === id);
const isFamily = () => state.profile && getMode(state.profile) === 'family';
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
const button = (label, action, classes = 'secondary', extra = '') => `<button type="button" class="button ${classes}" data-action="${action}" ${extra}>${label}</button>`;
const tags = (ids) => `<div class="tags">${ids.map(id => `<span class="interest-tag">${esc(interest(id)?.icon || '')} ${esc(interestName(id))}</span>`).join('')}</div>`;

function notify(message) {
  clearTimeout(toastTimer);
  status.textContent = storageAvailable ? message : `${message} For this visit only: browser storage is unavailable.`;
  status.classList.add('visible');
  toastTimer = setTimeout(() => status.classList.remove('visible'), 4500);
}
function commit(next) {
  state = next;
  storageAvailable = saveState(state);
}
function render() {
  const nav = [['discover', 'Discover'], ['activities', 'Activities'], ['circle', 'My circle'], ['rewards', 'Rewards']];
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar" aria-label="Main navigation">
      <a class="brand" href="#discover" aria-label="Kindred home"><span class="brand-mark" aria-hidden="true">k<span>✦</span></span><span class="brand-name">kindred</span></a>
      <nav class="nav">${nav.map(([id, label]) => `<button type="button" class="nav-item ${page === id ? 'active' : ''}" data-action="navigate" data-page="${id}" ${page === id ? 'aria-current="page"' : ''}><span class="nav-icon">${icon(id)}</span><span>${label}</span>${id === 'circle' && state.friends.length ? `<span class="nav-count">${state.friends.length}</span>` : ''}</button>`).join('')}</nav>
      <div class="sidebar-footer">${button(`${icon('settings')} ${state.profile || state.reviews.length ? 'Profile & settings' : 'Set up profile'}`, 'profile', 'ghost profile-button')}</div>
    </aside>
    <main class="main" id="main-content" tabindex="-1">
      <header class="topbar"><div class="header-actions"><button class="points-pill" type="button" data-action="navigate" data-page="rewards" aria-label="${state.points} kindness points. Open rewards."><span aria-hidden="true">✦</span> ${state.points}<span class="points-label"> points</span></button><button type="button" class="avatar" data-action="profile" aria-label="${state.profile ? 'Edit your profile' : 'Create your profile'}">${state.profile ? esc(initials(state.profile.name)) : icon('circle')}</button></div></header>
      ${!storageAvailable ? '<div class="notice" role="alert">Browser storage is unavailable. Your changes will only last for this visit.</div>' : ''}
      ${page === 'discover' ? renderDiscover() : page === 'activities' ? renderActivities() : page === 'circle' ? renderCircle() : renderRewards()}
    </main></div>`;
}

function heroArt() {
  return `<svg class="connection-illustration" viewBox="0 0 430 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of two generations sharing a happy conversation">
    <ellipse cx="224" cy="264" rx="156" ry="18" fill="#c8d1b6" opacity=".55"/>
    <path d="M55 219C5 159 58 69 131 70c35-66 174-53 196 24 90 22 86 132 18 149Z" fill="#d9e0c9"/>
    <path d="M91 251c-20-45-32-71-39-97m34 60c-27-2-36-22-32-34 26 4 32 19 32 34m-14-43c13-31 8-42-3-48-13 20-9 35 3 48" fill="#789b70"/>
    <rect x="90" y="87" width="112" height="153" rx="18" fill="#fff9eb" transform="rotate(-9 146 164)"/>
    <rect x="98" y="95" width="96" height="136" rx="12" fill="#f5c29c" transform="rotate(-9 146 164)"/>
    <g transform="rotate(-9 146 164)"><path d="M104 223v-21c0-26 82-26 82 0v21" fill="#bd7651"/><path d="M133 172v17q13 12 26 0v-19" fill="#ad6544"/><ellipse cx="146" cy="145" rx="31" ry="38" fill="#cd8a61"/><path d="M114 141c-13-42 17-54 37-43 24-5 37 21 25 47l-7-24c-11 9-31 13-45 4l-4 20Z" fill="#443e30"/><circle cx="136" cy="147" r="2" fill="#443e30"/><circle cx="158" cy="147" r="2" fill="#443e30"/><path d="M138 160q8 8 17-1" fill="none" stroke="#643d2f" stroke-width="3" stroke-linecap="round"/><path d="m116 194 24 20 19-25" fill="none" stroke="#f9ddb5" stroke-width="4"/></g>
    <rect x="226" y="77" width="117" height="164" rx="18" fill="#fff9eb" transform="rotate(9 285 160)"/>
    <rect x="234" y="85" width="101" height="147" rx="12" fill="#b0c6b9" transform="rotate(9 285 160)"/>
    <g transform="rotate(9 285 160)"><path d="M239 229v-23c0-29 91-29 91 0v23" fill="#3c6854"/><path d="m274 171-2 19 13 13 14-14-3-18" fill="#d9a27c"/><ellipse cx="285" cy="143" rx="31" ry="39" fill="#e8b891"/><path d="M253 140c-12-29-1-54 30-53 39-3 42 34 32 53l-6-28c-18 9-27 9-45 3Z" fill="#eeeee3"/><path d="m252 128 9 4m48 0 9-4" stroke="#5c594e" stroke-width="3"/><rect x="259" y="130" width="22" height="15" rx="6" fill="none" stroke="#5c594e" stroke-width="2.5"/><rect x="286" y="130" width="22" height="15" rx="6" fill="none" stroke="#5c594e" stroke-width="2.5"/><path d="M281 135h5m-9 24q8 8 17 0" fill="none" stroke="#5c594e" stroke-width="2.5" stroke-linecap="round"/><path d="m263 194 21 18 23-20" fill="none" stroke="#93b29d" stroke-width="3"/></g>
    <path d="M174 48c0-15 14-25 33-25h20c19 0 32 10 32 25s-13 25-32 25h-5l-14 14-2-14c-18 0-32-10-32-25Z" fill="#fff9eb"/>
    <path d="M205 44c-7-10-19 2 0 14 19-12 7-24 0-14Z" fill="#cc805e"/>
    <circle cx="226" cy="49" r="3" fill="#7d9471"/><circle cx="237" cy="49" r="3" fill="#7d9471"/>
    <path d="m358 83 3-12 4 12 11 4-11 3-4 12-3-12-11-3Z" fill="#e5a252"/><path d="m76 67 2-8 3 8 8 3-8 2-3 8-2-8-8-2Z" fill="#789b70"/>
    <g transform="translate(175 222)"><rect width="103" height="33" rx="16.5" fill="#fff9eb"/><circle cx="19" cy="16" r="9" fill="#d8e3c8"/><path d="m15 16 3 3 5-6" fill="none" stroke="#416b49" stroke-width="2"/><text x="33" y="21" font-family="system-ui,sans-serif" font-size="11" font-weight="650" fill="#355443">Better together</text></g>
  </svg>`;
}
function renderSharedJourney(showLink = true) {
  const latestPair = state.reviews.slice().reverse().find(review => review.mode === 'in-person');
  const stats = getJourneyStats(state);
  const totalMinutes = Math.floor(stats.totalDurationMs / 60000);
  const duration = totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`;
  return `<section class="shared-journey card" aria-labelledby="journey-title"><h2 id="journey-title">Your moments</h2><dl class="journey-stats"><div><dt>Moments</dt><dd data-stat="moments">${state.reviews.length}</dd></div><div><dt>Points</dt><dd data-stat="points">${state.points}</dd></div><div><dt>Streak</dt><dd>${stats.currentStreak}<span class="stat-unit"> days</span></dd></div><div><dt>Time together</dt><dd>${duration}</dd></div></dl><p class="field-help">Best streak: ${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}</p>${latestPair ? `<div class="journey-pair"><p>${latestPair.participants.map(participant => `<span class="interest-tag">${esc(participant.name)}</span>`).join(' <span aria-hidden="true">&amp;</span> ')}</p></div>` : ''}${showLink ? button('See all moments', 'circle', 'ghost small') : ''}</section>`;
}
function renderDiscover() {
  const profile = state.profile;
  const matches = profile ? getMatches(state) : PEOPLE.filter(p => p.generation === 'senior').slice(0, 3);
  const groups = (profile ? getRecommendedGroups(state) : GROUPS).slice(0, 3);
  const suggested = getDailyTheme(state);
  const themeDone = getJourneyStats(state).completedThemeToday;
  return `<section class="hero"><div class="hero-copy"><h2>A little time together.</h2><div class="hero-actions">${button(`Play face to face ${icon('arrow')}`, 'together-setup', 'primary')}</div></div><div class="hero-art">${heroArt()}</div></section>
    <section class="connection-paths" aria-label="Ways to connect"><article class="connection-path together-path card"><span class="path-status">READY TO PLAY</span><p class="eyebrow">SAME PLACE. ONE SHARED SCREEN.</p><h2>Together now</h2><p class="muted">Two real people, taking turns on a quiz or trading stories face to face. Bring a family member or someone you know, and choose two nicknames.</p>${button('Play face to face', 'together-setup', 'primary')}</article><article class="connection-path trusted-path card"><span class="path-status">REMOTE CIRCLE · PLANNED</span><p class="eyebrow">FAMILIAR PEOPLE. A SHARED ROUTINE.</p><h2>Trusted circle</h2><p class="muted">A future space for family and people a guardian has approved, even from afar. Invitations and remote calls are not available yet.</p>${button('Preview trusted circle', 'trusted-preview', 'secondary')}</article></section>
    <div class="daily-journey-grid"><section class="daily-moment card ${themeDone ? 'daily-complete' : ''}" aria-labelledby="daily-title"><div class="icon-tile" aria-hidden="true">${themeDone ? '✓' : esc(suggested.icon)}</div><p class="eyebrow">${themeDone ? 'THEME COMPLETE' : 'TODAY’S THEME'}</p><h2 id="daily-title">${esc(suggested.title)}</h2><p class="muted">${esc(suggested.description)}</p><div class="activity-meta"><span>${esc(suggested.duration)}</span></div>${button(themeDone ? 'Play again' : 'Start together', 'together-setup', 'primary', `data-id="${esc(suggested.id)}"`)}</section>${renderSharedJourney()}</div>
    <details class="secondary-content" id="community-details"><summary>Explore community previews</summary><section id="matches" aria-labelledby="matches-title"><div class="section-heading"><div><p class="eyebrow">EXPLORE THE WIDER COMMUNITY</p><h2 id="matches-title">Community preview</h2></div><span class="section-subtitle">Fictional demo profiles</span></div><p class="muted">Explore how shared interests could connect generations. These profiles and sessions are simulated; they are separate from a future trusted circle.</p>
    ${isFamily() ? `<div class="card family-card"><div class="icon-tile">${esc(suggested.icon)}</div><div><h3>Your best company can be close to home.</h3><p class="muted">Family mode keeps community matching closed. Enjoy a guided activity with someone you already know on this device.</p></div>${button('Play together', 'together-setup', 'primary', `data-id="${esc(suggested.id)}"`)}</div>` : matches.length ? `<div class="grid match-grid">${matches.slice(0, 3).map(renderMatch).join('')}</div>` : `<div class="empty-state"><h3>A shared interest is a good place to start.</h3><p>Try adding another interest to find more sample profiles.</p>${button('Edit your interests', 'profile', 'primary')}</div>`}</section>
    <section aria-labelledby="groups-title"><div class="section-heading"><div><p class="eyebrow">MORE WAYS TO SHARE WHAT YOU LOVE</p><h2 id="groups-title">Interest circles, in preview.</h2></div><span class="section-subtitle">Sample groups</span></div><div class="group-preview-grid grid">${groups.map(renderGroup).join('')}</div></section></details>`;
}
function showTrustedPreview() {
  showDialog(`${dialogHeading('TRUSTED CIRCLE · FUTURE REMOTE CONNECTIONS', 'Keep familiar people close.')}<p class="muted">The trusted circle is designed around people you already know: family members and connections a parent or guardian has approved.</p><div class="notice">This is a preview of the idea. Trusted invitations, verified guardian approval, scheduling, and remote calls are not available in this prototype.</div><p>For now, play face to face and keep both people’s reflections in your shared journey. The separate community preview uses fictional profiles to demonstrate matching and guided activities.</p><div class="form-actions">${button('Explore community preview', 'community-preview', 'secondary')}${button('Play together now', 'together-setup', 'primary')}</div>`);
}
function renderMatch(p) {
  return `<article class="card match-card"><div class="person-top"><div class="person-avatar person-${esc(p.generation)} color-${esc(p.color)}" aria-hidden="true">${esc(p.initials)}</div><div class="person-details"><h3>${esc(p.name)} <span class="person-age">${p.age}</span></h3><span class="person-meta">${p.generation === 'senior' ? 'A lifetime of stories' : 'A fresh perspective'}</span></div><span class="sample-label">Sample</span></div><p class="person-bio">${esc(p.bio)}</p>${tags(p.sharedInterests || p.interests.slice(0, 2))}<div class="match-reason"><span aria-hidden="true">✦</span> ${esc(p.reason || 'Create your profile to discover shared interests.')}</div><div class="card-footer"><span class="person-meta">${esc(p.availability)}</span>${button(`Try a demo ${icon('arrow')}`, 'connect', 'secondary small', `data-id="${esc(p.id)}"`)}</div></article>`;
}
function renderGroup(group) {
  const joined = state.joinedGroups.includes(group.id);
  return `<article class="card group-card"><div class="icon-tile" aria-hidden="true">${esc(group.icon)}</div><div class="group-info"><h3>${esc(group.name)}</h3><p class="muted">${esc(group.reason || group.description)}</p><span class="person-meta">Sample interest group</span></div>${button(joined ? `${icon('check')} Joined` : 'Join', 'join-group', joined ? 'ghost small' : 'secondary small', `data-id="${esc(group.id)}" ${joined ? 'disabled' : ''} aria-label="${joined ? 'Joined' : 'Join'} ${esc(group.name)}"`)}</article>`;
}
function renderActivities() {
  const played = new Set(state.reviews.map(review => review.activityId));
  const modes = [
    { kind: 'quiz', title: 'Quiz', icon: '🧠', description: 'Take turns on Singapore trivia and playful brain teasers.' },
    { kind: 'conversation', title: 'Guided Talk', icon: '💬', description: 'Easy questions about family, memories, and everyday life.' },
    { kind: 'random', title: 'Random Talk', icon: '🎁', description: 'Get a surprise question and see where it takes you.' },
    { kind: 'choice', title: 'Would You Rather', icon: '↔️', description: 'Pick a side, explain why, and compare your choices.' },
    { kind: 'collaborative', title: 'Story Game', icon: '📖', description: 'Build a story together, one turn at a time.' },
    { kind: 'reflection', title: 'Then & Now', icon: '⌛', description: 'Share what has changed and what still feels the same.' },
  ];
  return `<div class="page-heading"><h1 class="page-title">Choose a game</h1></div><div class="grid activity-grid">${modes.map(mode => { const items = ACTIVITIES.filter(activity => activity.kind === mode.kind); const fresh = items.filter(activity => !played.has(activity.id)).length; return `<article class="card activity-card"><div class="activity-card-top"><span class="icon-tile" aria-hidden="true">${mode.icon}</span><span class="activity-type">${fresh ? `${fresh} NEW` : 'REPLAY'}</span></div><h2>${mode.title}</h2><p class="muted">${mode.description}</p><div class="activity-actions">${button('Play together', 'together-mode', 'primary', `data-kind="${mode.kind}"`)}${button('Try solo', 'start-random-activity', 'secondary', `data-kind="${mode.kind}"`)}</div></article>`; }).join('')}</div>`;
}
function renderCircle() {
  if (!state.profile && !state.reviews.length) return `<div class="page-heading"><div><p class="eyebrow">GOOD COMPANY GROWS HERE</p><h1 class="page-title">Your little circle<span class="greeting-dot">.</span></h1></div></div><div class="empty-state"><span class="empty-icon" aria-hidden="true">♡</span><h2>A place for familiar faces.</h2><p>Play face to face to save your shared moments here. A profile is only needed to explore sample community connections.</p>${button('Play face to face', 'together-setup', 'primary')}${button('Create your profile', 'profile', 'primary')}</div>`;
  const friends = PEOPLE.filter(p => state.friends.includes(p.id));
  const groups = GROUPS.filter(g => state.joinedGroups.includes(g.id));
  return `<div class="page-heading"><div><p class="eyebrow">FAMILIAR FACES. SHARED LITTLE JOYS.</p><h1 class="page-title">Your little circle<span class="greeting-dot">.</span></h1><p class="muted">Your shared moments, saved connections, and interest groups, on this device.</p></div></div>${renderSharedJourney(false)}${state.profile ? `<section><div class="section-heading"><h2>Sample connections <span class="count-label">${friends.length}</span></h2><span class="muted">Saved on this device</span></div>${friends.length ? `<div class="grid match-grid">${friends.map(renderMatch).join('')}</div>` : `<div class="card empty-state"><span class="empty-icon" aria-hidden="true">♡</span><h3>${isFamily() ? 'Your best company is close to home.' : 'Every friendship starts with a hello.'}</h3><p>${isFamily() ? 'Family mode offers shared activities with someone beside you.' : 'Complete a simulated activity and choose “Add to my circle” in your review.'}</p>${button(isFamily() ? 'Explore activities' : 'Discover people', isFamily() ? 'activities' : 'discover', 'secondary')}</div>`}</section><section><div class="section-heading"><h2>Your interest groups <span class="count-label">${groups.length}</span></h2></div>${groups.length ? `<div class="group-list">${groups.map(renderGroup).join('')}</div>` : `<div class="card empty-state"><h3>Find people who love what you love.</h3><p>Join a sample interest group to add it here. Live group discussions are not part of this demo.</p>${button('Explore groups', 'discover', 'secondary')}</div>`}</section>` : `<div class="notice">Your face-to-face sessions stay on this device. ${button('Settings & reset', 'profile', 'ghost small')}</div>`}<section><div class="section-heading"><h2>Moments you’ve made</h2></div>${state.reviews.length ? `<div class="circle-list">${state.reviews.slice().reverse().map(review => review.mode === 'in-person' ? renderTogetherHistory(review) : `<article class="card review-card"><div class="icon-tile" aria-hidden="true">${esc(ACTIVITIES.find(a => a.id === review.activityId)?.icon || '✦')}</div><div><h3>${esc(ACTIVITIES.find(a => a.id === review.activityId)?.title || 'Shared activity')}</h3><p class="muted">${review.personId ? `With ${esc(person(review.personId)?.name || 'a sample friend')}` : 'A moment for yourself or family'} · <span aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></p>${review.note ? `<p>${esc(review.note)}</p>` : ''}</div><span class="points-earned">+30 points</span></article>`).join('')}</div>` : '<p class="muted">Your completed activities and reflections will appear here.</p>'}</section>`;
}
function renderRewards() {
  return `<div class="page-heading"><div><p class="eyebrow">LITTLE MOMENTS DESERVE A LITTLE THANK YOU</p><h1 class="page-title">Kindness comes around<span class="greeting-dot">.</span></h1><p class="muted">Collect points for showing up and sharing time together.</p></div></div><section class="balance-card"><div><span class="eyebrow">THIS DEVICE’S KINDNESS POINTS</span><div class="balance-value"><span aria-hidden="true">✦</span> ${state.points}</div><p>Complete a face-to-face activity to earn 30 shared points.</p></div>${button('Make another moment', 'activities', 'primary')}</section><div class="notice">These are sample rewards for exploring the prototype. Vouchers have no monetary value and cannot be used at real businesses.</div><div class="section-heading"><h2>A little something for you</h2><span class="section-subtitle">Demo rewards</span></div><div class="grid reward-grid">${REWARDS.map(reward => `<article class="card reward-card"><div class="reward-art" aria-hidden="true">${esc(reward.icon)}</div><span class="eyebrow">SAMPLE VOUCHER</span><h2>${esc(reward.name)}</h2><p class="muted">${esc(reward.description)}</p><div class="card-footer"><span class="reward-cost">✦ ${reward.cost} points</span>${button('Redeem', 'redeem', 'secondary small', `data-id="${esc(reward.id)}" ${state.points < reward.cost ? 'disabled' : ''} aria-label="Redeem ${esc(reward.name)} for ${reward.cost} points"`)}</div>${state.points < reward.cost ? `<p class="field-help">${reward.cost - state.points} more points to go</p>` : ''}</article>`).join('')}</div><section><div class="section-heading"><h2>Your sample vouchers</h2></div>${state.redemptions.length ? `<div class="voucher-list">${state.redemptions.slice().reverse().map(item => `<article class="card voucher-item"><div><h3>${esc(REWARDS.find(r => r.id === item.rewardId)?.name || 'Sample reward')}</h3><p class="muted">Demo only · no cash value · ${item.cost} points</p></div><code class="voucher-code">${esc(item.code)}</code></article>`).join('')}</div>` : '<div class="card empty-state"><h3>Something to look forward to.</h3><p>Your redeemed sample vouchers will be saved here.</p></div>'}</section>`;
}

function showDialog(content, { wide = false, initialFocus = null, className = '' } = {}) {
  if (!dialogRoot.firstElementChild) returnFocus = document.activeElement;
  dialogRoot.innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? 'session-modal' : ''} ${className}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">${content}</section></div>`;
  app.inert = true;
  document.body.classList.add('dialog-open');
  const modal = dialogRoot.querySelector('.modal');
  (initialFocus ? modal.querySelector(initialFocus) : modal.querySelector('input:not([type="hidden"]), button, [tabindex="0"]'))?.focus();
  if (!modal.contains(document.activeElement)) modal.focus();
}
function closeDialog() {
  dialogRoot.innerHTML = '';
  app.inert = false;
  document.body.classList.remove('dialog-open');
  if (returnFocus?.isConnected) returnFocus.focus();
  else document.querySelector('.main')?.focus();
}
function dialogHeading(eyebrow, title) {
  return `<div class="modal-heading"><div><p class="eyebrow">${eyebrow}</p><h2 id="dialog-title">${title}</h2></div><button type="button" class="modal-close" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div>`;
}
function showProfile() {
  const profile = state.profile;
  showDialog(`${dialogHeading(profile ? 'MAKE YOURSELF AT HOME' : 'LET’S START WITH YOU', profile ? 'Your profile & settings' : 'A few things in common.')}<form id="profile-form"><div class="form-row"><div class="form-field"><label for="profile-name">Your nickname</label><input id="profile-name" name="name" autocomplete="nickname" required maxlength="40" value="${esc(profile?.name || '')}" placeholder="What should we call you?"></div><div class="form-field age-field"><label for="profile-age">Your age</label><input id="profile-age" name="age" type="number" min="6" max="110" required value="${profile?.age || ''}" inputmode="numeric" placeholder="e.g. 24"></div></div><fieldset class="form-field"><legend>What lights you up?</legend><p class="field-help">Choose one or more interests. We’ll find the things you share.</p><div class="choice-grid">${INTERESTS.map(item => `<label class="choice ${profile?.interests.includes(item.id) ? 'selected' : ''}"><input class="interest-check" type="checkbox" name="interests" value="${esc(item.id)}" ${profile?.interests.includes(item.id) ? 'checked' : ''}><span aria-hidden="true">${esc(item.icon)}</span> ${esc(item.label)}</label>`).join('')}</div></fieldset><label class="consent-field"><input name="guardianConsent" type="checkbox" ${profile?.guardianConsent ? 'checked' : ''}><span>A parent or guardian is involved and agrees to exploring the community demo.<small>For ages 12–17. Under 12 always uses family mode, with activities at home.</small></span></label><p class="field-help">Ages 12–17 without guardian involvement also use family mode. This is a prototype setting, not a verified consent process.</p><p class="form-error" id="profile-error" role="alert"></p><div class="form-actions">${profile || state.reviews.length || state.redemptions.length ? button('Reset demo data', 'reset-confirm', 'ghost danger') : ''}<button class="button primary" type="submit">${profile ? 'Save profile' : 'Find my kind of people'} ${icon('arrow')}</button>${button('Display & reading', 'display-settings', 'ghost')}</div></form>`, { initialFocus: '#profile-name' });
}

function showDisplaySettings() {
  const sizes = [['comfortable', 'Comfortable'], ['large', 'Large'], ['extra-large', 'Extra large']];
  showDialog(`${dialogHeading('DISPLAY & READING', 'Make this easier to read.')}<fieldset class="form-field text-size-options"><legend>Text size</legend><div class="text-size-grid">${sizes.map(([value, label]) => `<button type="button" class="button ${preferences.textSize === value ? 'primary' : 'secondary'}" data-action="text-size" data-size="${value}" aria-pressed="${preferences.textSize === value}">${label}</button>`).join('')}</div></fieldset><label class="consent-field reading-toggle"><input id="auto-read-toggle" type="checkbox" ${preferences.autoRead ? 'checked' : ''} ${speechAvailable() ? '' : 'disabled'}><span>Read prompts aloud automatically<small>${speechAvailable() ? 'The device reads each new question or prompt in English.' : 'Read aloud is not available in this browser.'}</small></span></label><p class="field-help">Your display and reading choices are saved only on this device.</p>${button('Test read aloud', 'test-read-aloud', 'secondary', speechAvailable() ? '' : 'disabled')}<div class="form-actions">${button('Back to profile', 'profile', 'primary')}</div>`);
}

function sessionId() {
  return globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function shuffledPromptOrder(activity) {
  const order = activity.prompts.map((_, index) => index);
  if (activity.kind !== 'quiz') {
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
  }
  return order;
}
function promptFor(activitySession, step) {
  return activitySession.activity.prompts[activitySession.promptOrder?.[step] ?? step];
}
function promptCount(activitySession) {
  return activitySession.promptOrder?.length ?? activitySession.activity.prompts.length;
}
function showTogetherSetup(activityId, requestedKind = '') {
  const pinned = activityId === getDailyTheme(state).id ? ACTIVITIES.find(activity => activity.id === activityId) : null;
  const selectedKind = pinned?.kind || requestedKind || preferences.lastPair?.kind;
  const modes = [['quiz', 'Quiz'], ['conversation', 'Guided Talk'], ['random', 'Random Talk'], ['choice', 'Would You Rather'], ['collaborative', 'Story Game'], ['reflection', 'Then & Now']];
  const names = preferences.lastPair?.names || ['', ''];
  const quickStart = preferences.lastPair ? `<div class="saved-pair"><div><span class="saved-pair-icon" aria-hidden="true">👥</span><div><h3>Play together again</h3><p>${preferences.lastPair.names.map(esc).join(' &amp; ')} · saved on this device</p></div></div>${button(`Quick start · ${preferences.lastPair.names.map(esc).join(' &amp; ')}`, 'quick-pair-play', 'primary', `data-kind="${esc(preferences.lastPair.kind)}"`)}<p>Edit either name in the fields below.</p>${button('Forget saved names', 'forget-pair', 'ghost small', `data-kind="${esc(selectedKind || preferences.lastPair.kind)}"`)}</div>` : '';
  showDialog(`${dialogHeading('PLAY TOGETHER', 'Choose a game.')}${quickStart}<form id="together-setup-form" data-pinned="${pinned ? esc(pinned.id) : ''}"><fieldset class="game-style-field"><legend>Game style</legend><div class="game-style-grid">${modes.map(([kind, label]) => `<label class="game-style-card"><input class="game-style-radio" type="radio" name="kind" value="${kind}" required ${kind === selectedKind ? 'checked' : ''}><span class="game-style-picture">${gameStyleIllustration(kind)}</span><span class="game-style-name">${label}</span></label>`).join('')}</div></fieldset><div class="together-player-fields">${[0, 1].map(index => `<div class="form-field"><label for="together-name-${index}">Player ${index + 1}</label><input id="together-name-${index}" name="name${index}" maxlength="40" required autocomplete="off" value="${esc(names[index])}" placeholder="${index ? 'Gran' : 'Alex'}"></div>`).join('')}</div><p class="form-error" id="together-setup-error" role="alert"></p><div class="form-actions">${button('Cancel', 'close-dialog', 'ghost')}<button class="button primary" type="submit">Next ${icon('arrow')}</button></div></form>`, { initialFocus: '.game-style-radio' });
}
function randomActivityForKind(kind) {
  const options = ACTIVITIES.filter(activity => activity.kind === kind);
  if (!options.length) return getSuggestedActivity(state);
  const played = new Set(state.reviews.map(review => review.activityId));
  const fresh = options.filter(activity => !played.has(activity.id));
  const pool = fresh.length ? fresh : options;
  return pool[Math.floor(Math.random() * pool.length)];
}
function beginTogetherActivity(kind, names) {
  const activity = randomActivityForKind(kind);
  const dailyThemeDate = activity.id === getDailyTheme(state).id ? getDateKey() : null;
  session = { ...createTogetherSession({ id: sessionId(), activityId: activity.id, names, startedAt: null, dailyThemeDate }), started: false };
  session.promptOrder = shuffledPromptOrder(session.activity);
  const lastPair = { names: session.participants.map(participant => participant.name), kind };
  savePreferences({ lastPair });
  showTogetherInstructions();
}
function togetherScene(activity) {
  return `<svg class="together-scene" viewBox="0 0 600 230" role="img" aria-label="A grandparent and child sharing ${esc(activity.title)} on one device" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="handoff-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 9 4.5 0 9Z" fill="#78936d"/></marker></defs>
    <rect x="1" y="1" width="598" height="228" rx="24" fill="#f0f2e4"/>
    <path d="M180 91C218 48 255 48 276 81M324 151c32 36 75 35 104-3" fill="none" stroke="#78936d" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 9" marker-end="url(#handoff-arrow)"/>
    <g transform="translate(44 24)"><path d="M16 187v-34c0-34 107-34 107 0v34" fill="#cf8d68"/><path d="M47 132v18q20 19 39 0v-18" fill="#b97b5a"/><circle cx="67" cy="91" r="45" fill="#e6b997"/><path d="M23 89C16 45 43 31 69 35c37-8 55 18 42 57l-9-28c-22 10-43 12-67 3Z" fill="#706b5c"/><circle cx="52" cy="94" r="3" fill="#453e36"/><circle cx="81" cy="94" r="3" fill="#453e36"/><path d="M54 111q14 11 27 0" fill="none" stroke="#815742" stroke-width="3" stroke-linecap="round"/><text x="69" y="215" text-anchor="middle" font-size="16" font-weight="700" fill="#425c48">PLAYER 1</text></g>
    <g transform="translate(429 24)"><path d="M16 187v-34c0-34 107-34 107 0v34" fill="#77977d"/><path d="M47 132v18q20 19 39 0v-18" fill="#d79f7d"/><circle cx="67" cy="91" r="45" fill="#efc49f"/><path d="M22 87c-1-35 19-55 48-54 37-1 51 26 39 60l-10-28c-20 12-44 13-68 5Z" fill="#503d32"/><circle cx="52" cy="94" r="3" fill="#453e36"/><circle cx="81" cy="94" r="3" fill="#453e36"/><path d="M54 111q14 11 27 0" fill="none" stroke="#815742" stroke-width="3" stroke-linecap="round"/><text x="69" y="215" text-anchor="middle" font-size="16" font-weight="700" fill="#425c48">PLAYER 2</text></g>
    <g><rect x="253" y="24" width="94" height="164" rx="18" fill="#3f5d49"/><rect x="260" y="34" width="80" height="139" rx="11" fill="#fffdf5"/><rect x="286" y="41" width="28" height="4" rx="2" fill="#a4ad98"/><rect x="269" y="57" width="62" height="72" rx="10" fill="#e9efdf"/><text x="300" y="105" text-anchor="middle" font-size="38">${esc(activity.icon)}</text><path d="M276 142h48M282 153h36" stroke="#93a486" stroke-width="5" stroke-linecap="round"/><circle cx="300" cy="163" r="3" fill="#678269"/></g>
  </svg>`;
}
function gameStyleIllustration(kind) {
  const drawings = {
    quiz: '<rect x="14" y="8" width="68" height="52" rx="10" fill="#fffdf5"/><circle cx="48" cy="25" r="10" fill="#e5af68"/><text x="48" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">?</text><path d="M27 43h42M27 51h29" stroke="#91a484" stroke-width="4" stroke-linecap="round"/>',
    conversation: '<path d="M12 13a12 12 0 0 1 12-12h25a12 12 0 0 1 12 12v11a12 12 0 0 1-12 12H30L19 45v-9a12 12 0 0 1-7-12Z" fill="#fffdf5"/><path d="M43 35a11 11 0 0 1 11-11h20a11 11 0 0 1 11 11v8a11 11 0 0 1-7 10v8l-10-8h-14a11 11 0 0 1-11-11Z" fill="#f2d6b8"/><circle cx="30" cy="19" r="2.5" fill="#668269"/><circle cx="39" cy="19" r="2.5" fill="#668269"/><circle cx="48" cy="19" r="2.5" fill="#668269"/><circle cx="61" cy="38" r="2.5" fill="#a36f51"/><circle cx="69" cy="38" r="2.5" fill="#a36f51"/>',
    random: '<rect x="23" y="12" width="48" height="48" rx="9" fill="#e2ead8" transform="rotate(-12 47 36)"/><rect x="28" y="9" width="46" height="50" rx="9" fill="#fffdf5" transform="rotate(8 51 34)"/><path d="m51 17 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#e5ad62"/>',
    choice: '<rect x="8" y="15" width="31" height="39" rx="8" fill="#fffdf5"/><rect x="57" y="15" width="31" height="39" rx="8" fill="#fffdf5"/><path d="M14 29h18M63 29h18" stroke="#8da17e" stroke-width="4" stroke-linecap="round"/><path d="m22 38 4 5 7-9M62 40h16m-5-5 5 5-5 5" fill="none" stroke="#bd8058" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    collaborative: '<path d="M11 14q18-7 37 3 19-10 37-3v42q-18-7-37 3-19-10-37-3Z" fill="#fffdf5" stroke="#d9e1d0" stroke-width="2"/><path d="M48 17v42M20 25h18m-18 8h18m24-8h16m-16 8h16" stroke="#8fa482" stroke-width="3" stroke-linecap="round"/><path d="m70 12 3-6 3 6 6 2-6 2-3 6-3-6-6-2Z" fill="#e5ad62"/>',
    reflection: '<circle cx="48" cy="34" r="25" fill="#fffdf5" stroke="#d9e1d0" stroke-width="3"/><path d="M48 17v18l13 8" fill="none" stroke="#668269" stroke-width="4" stroke-linecap="round"/><path d="M16 57h18m-9-7 7 7-7 7m51-50H59m9 7-7-7 7-7" fill="none" stroke="#bd8058" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  return `<svg class="game-style-illustration" viewBox="0 0 96 68" aria-hidden="true" focusable="false"><rect x="1" y="1" width="94" height="66" rx="16" fill="#edf2e6"/>${drawings[kind] || drawings.conversation}</svg>`;
}
function showTogetherInstructions() {
  const a = session.activity;
  const steps = a.kind === 'quiz'
    ? [['❓', 'Read', 'Read the question together.'], ['1️⃣', 'Player 1', 'Choose an answer.'], ['📱', 'Pass', 'Keep it hidden. Pass the device.'], ['2️⃣', 'Player 2', 'Choose, then reveal together.']]
    : a.kind === 'conversation'
      ? [['💬', 'Read', 'Read the prompt aloud.'], ['🗣️', 'Player 1', 'Share while the other listens.'], ['📱', 'Pass', 'Tap “Pass the turn.”'], ['🗣️', 'Player 2', 'Share, then tap “Next prompt.”']]
      : a.kind === 'random'
        ? [['🎁', 'Surprise', 'A new question appears.'], ['💬', 'Take turns', 'Answer and ask follow-ups.'], ['⏭️', 'Next', 'Skip any prompt you dislike.']]
        : a.kind === 'choice'
          ? [['↔️', 'Choose', 'Pick one of the two choices.'], ['🗣️', 'Explain', 'Take turns saying why.'], ['🤝', 'Compare', 'Share your different reasons.']]
          : a.kind === 'collaborative'
            ? [['📖', 'Story cue', 'Read the prompt together.'], ['💡', 'Add an idea', 'Player 1 adds a sentence.'], ['📱', 'Pass', 'Tap “Pass the turn.”'], ['🧵', 'Build together', 'Player 2 continues the story.']]
            : [['🕰️', 'Then', 'Think about how it used to be.'], ['☀️', 'Now', 'Share what life is like today.'], ['💬', 'Compare', 'Talk about what changed.'], ['♡', 'Your choice', 'Skip anything too personal.']];
  const stepsMarkup = steps.map(([picture, title, detail], index) => `<div class="rule-step"><div class="rule-picture" aria-hidden="true">${picture}</div><h3>${index + 1}. ${title}</h3><p>${detail}</p></div>${index < steps.length - 1 ? '<span class="rule-arrow" aria-hidden="true">➜</span>' : ''}`).join('');
  showDialog(`${dialogHeading('HOW TO PLAY', `Ready for ${esc(a.title)}?`)}<div class="session-intro"><h3>${esc(a.description)}</h3></div><div class="illustrated-rules">${togetherScene(a)}<div class="rule-flow" aria-label="How to play, step by step">${stepsMarkup}</div></div><p class="muted rules-footer">${esc(a.duration)} · ${a.kind === 'quiz' ? `${a.questions.length} questions` : `${a.prompts.length} prompts`} · +30 points when you finish together</p><div class="form-actions">${button('Cancel', 'close-dialog', 'ghost')}<button class="button primary" data-action="session-start" type="button">Start ${icon('arrow')}</button></div>`);
}
function renderTogetherSession() {
  const a = session.activity;
  const quiz = a.kind === 'quiz';
  const total = quiz ? a.questions.length : promptCount(session);
  const q = quiz ? a.questions[session.step] : null;
  const currentName = session.participants[session.turn].name;
  const activityTip = a.kind === 'collaborative' ? 'Add one sentence or idea, then pass the turn so your partner can continue the story.' : a.kind === 'choice' ? 'Choose a side, then explain your reasons. There are no wrong choices.' : a.kind === 'random' ? 'A surprise prompt is up. Follow the conversation wherever it leads.' : a.kind === 'reflection' ? 'Compare what was different then with what feels familiar today.' : 'Tell your story while the other person listens. Tap “I’m done” when you’re ready to pass the turn.';
  const answerWasSkipped = quiz && session.revealed && session.answers.every(answers => answers[session.step] === null);
  const readButton = speechAvailable() ? `${button('🔊 Read aloud', 'speak-prompt', 'secondary small')}${button('Stop reading', 'stop-reading', 'ghost small')}` : '';
  const answersMarkup = quiz ? `<div class="quiz-options">${q.answers.map((answer, index) => `<button type="button" class="quiz-option ${session.revealed && index === q.correct ? 'correct' : ''}" data-action="together-answer" data-index="${index}" ${session.revealed ? 'disabled' : ''}><span class="answer-letter">${String.fromCharCode(65 + index)}</span>${esc(answer)}${session.revealed && index === q.correct ? icon('check') : ''}</button>`).join('')}</div>${session.revealed ? `<div class="answer-feedback" role="status"><strong>${answerWasSkipped ? `Skipped together. The answer is ${esc(q.answers[q.correct])}.` : `Correct answer: ${esc(q.answers[q.correct])}`}</strong><p>${esc(q.explanation)}</p><div class="together-scores">${session.participants.map((participant, index) => { const answer = session.answers[index][session.step]; return `<p class="player-result"><strong>${esc(participant.name)}</strong>: ${answer === null ? 'Skipped' : `${esc(q.answers[answer])} · ${answer === q.correct ? 'Correct!' : 'A little something learned.'}`}</p>`; }).join('')}</div></div>` : `<p class="field-help">${session.turn === 1 ? 'Player 1’s answer is hidden until you choose. Pass the device and make your own pick.' : 'Choose your answer, then pass the device to player 2. Answers are revealed after both choices.'}</p>`}` : `<div class="conversation-tip"><span aria-hidden="true">✦</span><p>${activityTip}</p></div>`;
  showDialog(`${dialogHeading('FACE TO FACE · ON THIS DEVICE', esc(a.title))}<div class="participant-badges">${session.participants.map((participant, index) => `<div class="participant-badge ${!session.revealed && session.turn === index ? 'active' : ''}"><span class="mini-avatar" aria-hidden="true">${esc(initials(participant.name))}</span><span class="participant-name">Player ${index + 1} · ${esc(participant.name)}</span></div>`).join('')}</div><div class="activity-panel"><div class="session-audio-controls">${readButton}</div><div class="question-count"><span>${quiz ? 'QUESTION' : a.kind === 'random' ? 'SURPRISE PROMPT' : a.kind === 'choice' ? 'CHOOSE & SHARE' : a.kind === 'collaborative' ? 'STORY BEAT' : a.kind === 'reflection' ? 'THEN & NOW' : 'CONVERSATION STARTER'} ${session.step + 1} OF ${total}</span><span>${esc(a.icon)}</span></div><div class="progress-track" role="progressbar" aria-label="Shared activity progress" aria-valuemin="0" aria-valuemax="${total * 2}" aria-valuenow="${session.step * 2 + (session.revealed ? 2 : session.turn)}"><div class="progress-fill" style="width:${(session.step * 2 + (session.revealed ? 2 : session.turn)) / (total * 2) * 100}%"></div></div><p class="turn-label" role="status">${session.revealed ? answerWasSkipped ? 'Skipped together. Keep going when you are ready.' : 'Both answers are in. Let’s see!' : `${esc(currentName)}, it’s your turn.`}</p><h3 class="prompt-text" tabindex="-1">${esc(quiz ? q.question : promptFor(session, session.step))}</h3>${answersMarkup}<div class="session-footer">${!session.revealed ? button(quiz ? 'Skip this question' : 'Skip this prompt', 'together-skip', 'secondary') : ''}${button(quiz ? session.step === total - 1 ? 'Finish & earn points' : 'Next question' : session.turn === 0 ? 'Pass the turn' : session.step === total - 1 ? 'Finish & earn points' : 'Next prompt', 'together-next', 'primary', quiz && !session.revealed ? 'disabled' : '')}</div></div>`, { wide: true, initialFocus: '.prompt-text' });
  if (preferences.autoRead) speak(speechTextForSession());
}
function renderTogetherHistory(review) {
  const a = ACTIVITIES.find(item => item.id === review.activityId);
  return `<article class="card together-history"><div class="section-heading"><div><span class="eyebrow">MISSION COMPLETE</span><h3>${esc(a?.title || 'Shared activity')}</h3><p class="muted">${review.participants.map(participant => esc(participant.name)).join(' &amp; ')} · completed together</p></div><span class="points-earned">+30 shared points</span></div><div class="together-scores">${review.participants.map((participant, index) => `<div class="player-result"><h4>${esc(participant.name)}</h4>${participant.rating === null ? '<p class="muted">Played together</p>' : `<p>${'★'.repeat(participant.rating)}${'☆'.repeat(5 - participant.rating)} · ${participant.rating}/5</p>`}${participant.score === null ? '' : `<p>${participant.score} / ${a?.questions.length || 0} correct</p>`}${participant.note ? `<p>${esc(participant.note)}</p>` : ''}</div>`).join('')}</div></article>`;
}
function completeTogetherMission() {
  if (!session?.finished || session.mode !== 'in-person') return;
  const completed = session;
  completed.completedAt = Date.now();
  const finishedDailyTheme = completed.dailyThemeDate === getDateKey();
  const activity = completed.activity;
  const names = completed.participants.map(participant => participant.name);
  const scoreLine = activity.kind === 'quiz'
    ? `<p class="celebration-score">${completed.participants.map((participant, index) => { const answers = completed.answers[index]; const correct = answers.filter((value, question) => value === activity.questions[question].correct).length; const skipped = answers.filter(value => value === null).length; return `${esc(participant.name)}: ${correct}/${activity.questions.length} correct${skipped ? ` · ${skipped} skipped` : ''}`; }).join(' · ')}</p>`
    : '';
  commit(completeTogetherSession(state, completed));
  const streak = getJourneyStats(state).currentStreak;
  session = null;
  render();
  showDialog(`<div class="celebration" role="status" aria-live="polite"><div class="celebration-confetti" aria-hidden="true"><span>✨</span><span>🎉</span><span>🌟</span><span>🎊</span><span>🌼</span><span>🎉</span><span>✨</span></div><p class="eyebrow">MISSION COMPLETE</p><h2 id="dialog-title">You did it together!</h2><div class="celebration-emojis" aria-hidden="true"><span>🎉</span><span>🏆</span><span>🌟</span></div><div class="points-reward"><span>+30</span><strong>POINTS EARNED!</strong></div><p class="celebration-names">${names.map(esc).join(' &amp; ')}</p>${scoreLine}<p class="celebration-message">${finishedDailyTheme ? `Daily theme complete! Congratulations${streak ? ` — your shared streak is ${streak} ${streak === 1 ? 'day' : 'days'}` : ''}.` : 'Every story, answer, and laugh counts. Your shared points are ready!'}</p>${button('Play again with this pair', 'quick-pair-play', 'secondary')}${button('Hooray! Keep going', 'close-dialog', 'primary celebration-dismiss')}</div>`, { className: 'celebration-modal', initialFocus: '.celebration-dismiss' });
}

function startActivity(activityId, personId = null) {
  if (!state.profile) { showProfile(); notify('Create your profile first, then choose an activity.'); return; }
  if (personId && (isFamily() || !getMatches(state).some(p => p.id === personId))) { notify('This connection is unavailable for your profile. Try an activity at home.'); return; }
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return;
  session = { id: globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`, activity, personId, step: 0, answers: [], revealed: false, started: false, finished: false, promptOrder: shuffledPromptOrder(activity), dailyThemeDate: activity.id === getDailyTheme(state).id ? getDateKey() : null };
  showSessionIntro();
}
function showSessionIntro() {
  const partner = person(session.personId);
  showDialog(`${dialogHeading('A MOMENT TOGETHER', partner ? `Say hello to ${esc(partner.name)}.` : 'Make a little space to connect.')}<div class="session-intro"><span class="icon-tile">${esc(session.activity.icon)}</span><h3>${esc(session.activity.title)}</h3><p class="muted">${esc(session.activity.description)}</p></div>${partner ? `<div class="notice">${esc(partner.name)} is a fictional profile. This connection is simulated: there is no live participant, audio, video, or messaging.</div>` : ''}<p class="muted">${esc(session.activity.duration)} · ${session.activity.kind === 'quiz' ? 'Answer every question' : 'Explore every prompt'}${session.mode === 'in-person' ? '. Finish together to earn 30 points.' : ', then leave a review to earn 30 points.'}</p><div class="form-actions">${button('Maybe later', 'close-dialog', 'ghost')}${button('Start activity', 'session-start', 'primary')}</div>`);
}
function renderSession() {
  if (session.mode === 'in-person') { renderTogetherSession(); return; }
  const a = session.activity;
  const quiz = a.kind === 'quiz';
  const total = quiz ? a.questions.length : promptCount(session);
  const q = quiz ? a.questions[session.step] : null;
  const partner = person(session.personId);
  const selected = session.answers[session.step];
  const soloTip = a.kind === 'collaborative' ? 'Take turns adding one idea each. You can share this device and build the story together.' : a.kind === 'choice' ? 'Pick the option you like best, then share why. There are no wrong choices.' : a.kind === 'random' ? 'Try the surprise prompt and follow your curiosity.' : a.kind === 'reflection' ? 'Think about what has changed and what has stayed the same.' : 'Take turns. Ask “why?” or “what happened next?” There’s no right answer, just a story to share.';
  const readControls = speechAvailable() ? `<div class="session-audio-controls">${button('🔊 Read aloud', 'speak-prompt', 'secondary small')}${button('Stop reading', 'stop-reading', 'ghost small')}</div>` : '';
  const questionBody = quiz
    ? `<div class="quiz-options">${q.answers.map((answer, index) => `<button type="button" class="quiz-option ${session.revealed && index === q.correct ? 'correct' : ''} ${session.revealed && selected === index && index !== q.correct ? 'incorrect' : ''} ${selected === index ? 'selected' : ''}" data-action="quiz-answer" data-index="${index}" ${session.revealed ? 'disabled' : ''}><span class="answer-letter">${String.fromCharCode(65 + index)}</span>${esc(answer)}${session.revealed && index === q.correct ? icon('check') : ''}</button>`).join('')}</div>${session.revealed ? `<div class="answer-feedback" role="status"><strong>${selected === q.correct ? 'You got it!' : 'A little something new to learn.'}</strong><p>${esc(q.explanation)}</p></div>` : '<p class="field-help">Choose an answer. A little curiosity is all you need.</p>'}`
    : `<div class="conversation-tip"><span aria-hidden="true">✦</span><p>${soloTip}</p></div>`;
  const canSkip = !quiz || !session.revealed;
  showDialog(`${dialogHeading(partner ? 'SIMULATED CONNECTION · NO LIVE CALL' : 'A SHARED ACTIVITY · ON THIS DEVICE', esc(a.title))}<div class="session-layout"><aside class="call-stage"><div class="stage-avatar">${partner ? esc(partner.initials) : esc(initials(state.profile.name))}</div><h3>${partner ? esc(partner.name) : 'Your moment together'}</h3><p class="stage-caption">${partner ? 'Fictional demo companion' : isFamily() ? 'Share this device with family' : 'Play solo or with someone beside you'}</p><span class="demo-badge">${partner ? 'Simulated connection' : 'At your own pace'}</span><p class="field-help">Camera and microphone are not used.</p></aside><div class="activity-panel">${readControls}<div class="question-count"><span>${quiz ? 'QUESTION' : a.kind === 'random' ? 'SURPRISE PROMPT' : a.kind === 'choice' ? 'CHOOSE & SHARE' : a.kind === 'collaborative' ? 'STORY BEAT' : a.kind === 'reflection' ? 'THEN & NOW' : 'CONVERSATION STARTER'} ${session.step + 1} OF ${total}</span><span>${esc(a.icon)}</span></div><div class="progress-track" role="progressbar" aria-label="Activity progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${session.step}"><div class="progress-fill" style="width:${session.step / total * 100}%"></div></div><h3 class="prompt-text">${esc(quiz ? q.question : promptFor(session, session.step))}</h3>${questionBody}<div class="session-footer"><span class="field-help">${quiz ? 'Learning something new counts, too.' : 'Take as long as you like.'}</span>${canSkip ? button(quiz ? 'Skip this question' : 'Skip this prompt', 'session-skip', 'secondary') : ''}${button(session.step === total - 1 ? 'Finish & reflect' : quiz ? 'Next question' : 'Next prompt', 'session-next', 'primary', quiz && !session.revealed ? 'disabled' : '')}</div></div></div>`, { wide: true, initialFocus: '.prompt-text' });
  dialogRoot.querySelector('.prompt-text').setAttribute('tabindex', '-1');
  dialogRoot.querySelector('.prompt-text').focus();
  if (preferences.autoRead) speak(speechTextForSession());
}
function showReview() {
  const a = session.activity;
  const partner = person(session.personId);
  const score = a.kind === 'quiz' ? session.answers.filter((value, index) => value === a.questions[index].correct).length : null;
  showDialog(`${dialogHeading('A LITTLE REFLECTION GOES A LONG WAY', 'How was your moment?')}<div class="completion-banner"><span aria-hidden="true">✦</span><div><h3>You made time for connection.</h3><p>${a.kind === 'quiz' ? `${score} of ${a.questions.length} correct. ` : 'All conversation prompts explored. '}Save your review to collect 30 points.</p></div></div><form id="review-form"><fieldset class="form-field"><legend>How much did you enjoy this activity?</legend><div class="review-stars">${[1, 2, 3, 4, 5].map(value => `<label class="rating-choice"><input type="radio" name="rating" value="${value}" required ${value === 5 ? 'checked' : ''}><span aria-hidden="true">★</span><span>${value}</span><span class="sr-only">out of 5 stars</span></label>`).join('')}</div></fieldset><div class="form-field"><label for="review-note">Anything you’d like to remember? <span class="muted">(optional)</span></label><textarea id="review-note" name="note" maxlength="500" rows="3" placeholder="A favorite question, a shared story, a small surprise…"></textarea><span class="field-help">This reflection is saved only on this device.</span></div>${partner && !isFamily() ? `<label class="consent-field"><input type="checkbox" name="addFriend" ${state.friends.includes(partner.id) ? 'checked disabled' : 'checked'}><span>${state.friends.includes(partner.id) ? `${esc(partner.name)} is already in your circle` : `Add ${esc(partner.name)} to my circle`}<small>Save this fictional profile for another demo activity.</small></span></label>` : ''}<p class="form-error" id="review-error" role="alert"></p><div class="form-actions"><span class="field-help">Your ratings help shape your group picks.</span><button class="button primary" type="submit">Save review & earn 30 points ${icon('star')}</button></div></form>`);
}
function showQuit() {
  const pointsMessage = session.mode === 'in-person' ? 'Finish the activity together to save it and earn 30 shared points.' : 'This activity is not saved yet. Finish it and save a review to earn points.';
  showDialog(`${dialogHeading('TAKE YOUR TIME', 'Leave this activity?')}<p class="muted">${pointsMessage}</p><div class="form-actions">${button('Keep going', 'session-resume', 'primary')}${button('Leave activity', 'session-quit', 'ghost danger')}</div>`);
}
function handleClose() {
  if (speechAvailable()) globalThis.speechSynthesis.cancel();
  if (session?.started) showQuit();
  else { session = null; closeDialog(); }
}

function navigate(next) {
  if (!['discover', 'activities', 'circle', 'rewards'].includes(next)) return;
  page = next;
  if (location.hash !== `#${next}`) history.replaceState(null, '', `#${next}`);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('.main')?.focus({ preventScroll: true });
}
async function action(target) {
  const name = target.dataset.action;
  const id = target.dataset.id;
  if (name === 'navigate') navigate(target.dataset.page);
  else if (['discover', 'activities', 'circle', 'rewards'].includes(name)) navigate(name);
  else if (name === 'profile') showProfile();
  else if (name === 'display-settings') showDisplaySettings();
  else if (name === 'text-size') { savePreferences({ textSize: target.dataset.size }); showDisplaySettings(); }
  else if (name === 'test-read-aloud') speak('This is a reading test. Questions and prompts can be read aloud.');
  else if (name === 'speak-prompt') speak(speechTextForSession());
  else if (name === 'stop-reading') { if (speechAvailable()) globalThis.speechSynthesis.cancel(); }
  else if (name === 'close-dialog') handleClose();
  else if (name === 'scroll-matches') { const details = document.querySelector('#community-details'); if (details) details.open = true; document.querySelector('#matches')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); document.querySelector('#matches button')?.focus({ preventScroll: true }); }
  else if (name === 'connect') startActivity(getSuggestedActivity(state, id).id, id);
  else if (name === 'start-activity') startActivity(id);
  else if (name === 'together-setup') showTogetherSetup(id);
  else if (name === 'together-mode') showTogetherSetup('', target.dataset.kind);
  else if (name === 'quick-pair-play') { if (preferences.lastPair) beginTogetherActivity(preferences.lastPair.kind, preferences.lastPair.names); }
  else if (name === 'forget-pair') { savePreferences({ lastPair: null }); showTogetherSetup('', target.dataset.kind); }
  else if (name === 'start-random-activity') startActivity(randomActivityForKind(target.dataset.kind).id);
  else if (name === 'trusted-preview') showTrustedPreview();
  else if (name === 'community-preview') { navigate('discover'); closeDialog(); await action({ dataset: { action: 'scroll-matches' } }); }
  else if (name === 'together-answer') { session = answerTogetherQuestion(session, Number(target.dataset.index)); renderSession(); }
  else if (name === 'together-skip') { session = skipTogetherStep(session); if (session.finished) completeTogetherMission(); else renderSession(); }
  else if (name === 'together-next') { session = advanceTogetherSession(session); if (session.finished) completeTogetherMission(); else renderSession(); }
  else if (name === 'session-start') { session.started = true; session.startedAt = Date.now(); renderSession(); }
  else if (name === 'quiz-answer') { if (!session || session.mode === 'in-person' || session.revealed) return; session.answers[session.step] = Number(target.dataset.index); session.revealed = true; renderSession(); }
  else if (name === 'session-next') {
    if (!session || session.mode === 'in-person' || (session.activity.kind === 'quiz' && !session.revealed)) return;
    const total = session.activity.kind === 'quiz' ? session.activity.questions.length : promptCount(session);
    if (session.step + 1 === total) { session.finished = true; showReview(); }
    else { session.step++; session.revealed = false; renderSession(); }
  }
  else if (name === 'session-skip') {
    if (!session || session.mode === 'in-person') return;
    const total = session.activity.kind === 'quiz' ? session.activity.questions.length : promptCount(session);
    if (session.activity.kind === 'quiz') session.answers[session.step] = null;
    if (session.step + 1 === total) { session.finished = true; showReview(); }
    else { session.step++; session.revealed = false; renderSession(); }
  }
  else if (name === 'session-resume') { if (session.finished) showReview(); else renderSession(); }
  else if (name === 'session-quit') { session = null; closeDialog(); }
  else if (name === 'join-group') {
    if (!state.profile) { showProfile(); notify('Create your profile to save a sample group.'); return; }
    commit(joinGroup(state, id)); render(); document.querySelector('.main')?.focus({ preventScroll: true }); notify('Sample group added to your circle. Live group discussions are not available in this demo.');
  }
  else if (name === 'redeem') {
    const reward = REWARDS.find(r => r.id === id);
    if (!reward) return;
    showDialog(`${dialogHeading('A LITTLE THANK YOU', 'Redeem a sample reward?')}<div class="session-intro"><span class="icon-tile">${esc(reward.icon)}</span><h3>${esc(reward.name)}</h3><p>${reward.cost} kindness points</p></div><p class="notice">This creates a demo voucher with no monetary value. It cannot be used at a real business.</p><div class="form-actions">${button('Keep my points', 'close-dialog', 'ghost')}${button('Redeem sample voucher', 'redeem-confirm', 'primary', `data-id="${esc(id)}"`)}</div>`);
  }
  else if (name === 'redeem-confirm') { commit(redeemReward(state, id)); render(); closeDialog(); notify('Your sample voucher is ready. Find it below your rewards.'); }
  else if (name === 'reset-confirm') showDialog(`${dialogHeading('START FRESH', 'Reset your demo?')}<p class="muted">This will remove your profile, points, saved player names, connections, group choices, reviews, and sample vouchers from this browser.</p><div class="form-actions">${button('Keep my data', 'profile', 'secondary')}${button('Reset all demo data', 'reset', 'danger primary')}</div>`);
  else if (name === 'reset') {
    let removed = false;
    try { localStorage.removeItem(STORAGE_KEY); removed = true; } catch { /* Storage may be blocked. */ }
    commit(createState()); savePreferences({ lastPair: null }); session = null; navigate('discover'); closeDialog();
    notify(removed || storageAvailable ? 'Your demo has been reset. A fresh start awaits.' : 'This visit has been reset, but saved browser data could not be removed and may return on reload. Clear this site’s data in your browser settings to remove it.');
  }
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (target && !target.disabled) action(target).catch(error => notify(error.message || 'Something went wrong. Please try again.'));
  if (event.target.closest('.brand')) { event.preventDefault(); navigate('discover'); }
});
document.addEventListener('change', event => {
  if (event.target.matches('.interest-check')) event.target.closest('.choice').classList.toggle('selected', event.target.checked);
  if (event.target.matches('#auto-read-toggle')) savePreferences({ autoRead: event.target.checked });
});
document.addEventListener('submit', event => {
  if (event.target.id === 'together-setup-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const kind = form.get('kind');
      const requested = ACTIVITIES.find(item => item.id === event.target.dataset.pinned);
      const activity = requested?.kind === kind ? requested : randomActivityForKind(kind);
      const dailyThemeDate = activity.id === getDailyTheme(state).id ? getDateKey() : null;
      session = { ...createTogetherSession({ id: sessionId(), activityId: activity.id, names: [form.get('name0'), form.get('name1')], startedAt: null, dailyThemeDate }), started: false };
      session.promptOrder = shuffledPromptOrder(session.activity);
      savePreferences({ lastPair: { names: session.participants.map(participant => participant.name), kind } });
      showTogetherInstructions();
    } catch (error) { document.querySelector('#together-setup-error').textContent = error.message; }
  }
  if (event.target.id === 'profile-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      commit(setProfile(state, { name: form.get('name'), age: Number(form.get('age')), interests: form.getAll('interests'), guardianConsent: form.get('guardianConsent') === 'on' }));
      render(); closeDialog(); notify(`You’re all set, ${state.profile.name}. ${isFamily() ? 'Enjoy activities together in family mode.' : 'Explore your shared interests.'}`);
    } catch (error) { document.querySelector('#profile-error').textContent = error.message; }
  }
  if (event.target.id === 'review-form') {
    event.preventDefault();
    if (!session?.finished || session.mode === 'in-person') return;
    const form = new FormData(event.target);
    try {
      const completedAt = Date.now();
      commit(completeSession(state, { id: session.id, personId: session.personId, activityId: session.activity.id, rating: Number(form.get('rating')), note: String(form.get('note') || '').trim(), addFriend: form.get('addFriend') === 'on', completedAt, durationMs: session.startedAt ? Math.min(43200000, Math.max(0, completedAt - session.startedAt)) : 0, dailyThemeDate: session.dailyThemeDate }));
      const finishedDailyTheme = session.dailyThemeDate === getDateKey();
      const streak = getJourneyStats(state).currentStreak;
      session = null; render(); closeDialog(); notify(finishedDailyTheme ? `Daily theme complete! Congratulations${streak ? ` — a ${streak}-day streak` : ''}. You earned 30 points.` : 'A moment well spent. Your review is saved and you earned 30 kindness points.');
    } catch (error) { document.querySelector('#review-error').textContent = error.message; }
  }
});
document.addEventListener('keydown', event => {
  const modal = dialogRoot.querySelector('.modal');
  if (!modal) return;
  if (event.key === 'Escape') { event.preventDefault(); handleClose(); }
  if (event.key === 'Tab') {
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea, select, a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = focusable[0]; const last = focusable.at(-1);
    if (!first) { event.preventDefault(); modal.focus(); }
    else if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
});
window.addEventListener('hashchange', () => { if (!dialogRoot.firstElementChild) navigate(location.hash.slice(1)); });
const initialPage = location.hash.slice(1);
if (['discover', 'activities', 'circle', 'rewards'].includes(initialPage)) page = initialPage;
render();
