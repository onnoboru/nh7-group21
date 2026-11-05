import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';
import * as core from '../dist/core.js';

// Minimal DOM harness: runs the real app event handlers, templates, and core
// transitions. It does not validate browser layout, keyboard focus, or HTML APIs.
// Replace only the ESM import so dependencies can be injected into an isolated VM.
const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8')
  .replace(/^import \{[\s\S]*?\} from '\.\/core\.js';/m, '')
  .replace(/^import \{[\s\S]*?\} from '\.\/local-audio\.js';/m, '');

function harness({ initial = null, initialPreferences = null, blocked = false, initialHash = '' } = {}) {
  const handlers = {};
  const nodes = new Map();
  const saved = new Map(initial ? [[core.STORAGE_KEY, JSON.stringify(initial)]] : []);
  if (initialPreferences) saved.set('kindred-local-preferences-v1', JSON.stringify(initialPreferences));
  const speechCalls = [];
  const voiceNotes = new Map();
  class TestSpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  const speechSynthesis = { cancel() {}, speak(utterance) { speechCalls.push(utterance.text); } };
  let document;
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {
      innerHTML: '', textContent: '', dataset: {}, inert: false, isConnected: true,
      get firstElementChild() { return this.innerHTML ? element(id + ':child') : null; },
      classList: { add() {}, remove() {}, toggle() {} },
      querySelector(selector) { return element(id + selector); },
      querySelectorAll() { return []; },
      contains() { return true; }, setAttribute() {}, scrollIntoView() {},
      focus() { document.activeElement = this; },
    });
    return nodes.get(id);
  }
  document = {
    querySelector: element, body: element('body'), activeElement: element('initial'),
    addEventListener(name, handler) { handlers[name] = handler; },
  };
  const storage = {
    getItem: key => saved.get(key) ?? null,
    setItem(key, value) { if (blocked) throw new Error('Storage blocked'); saved.set(key, value); },
    removeItem(key) { if (blocked) throw new Error('Storage blocked'); saved.delete(key); },
    get length() { return saved.size; },
  };
  const location = { hash: initialHash };
  const context = createContext({
    ...core, document, location, localStorage: storage,
    saveVoiceNote: async (id, blob) => { voiceNotes.set(id, blob); },
    loadVoiceNote: async id => voiceNotes.get(id) || null,
    deleteVoiceNote: async id => { voiceNotes.delete(id); },
    clearVoiceNotes: async () => { voiceNotes.clear(); },
    canRecordVoiceNote: () => false,
    SpeechSynthesisUtterance: TestSpeechSynthesisUtterance, speechSynthesis,
    loadState: () => core.loadState(storage), saveState: state => core.saveState(state, storage),
    window: { scrollTo() {}, addEventListener() {} },
    history: { replaceState(_a, _b, hash) { location.hash = hash; } },
    matchMedia: () => ({ matches: true }), setTimeout() { return 1; }, clearTimeout() {},
    FormData: class {
      constructor(target) { this.data = target.data; }
      get(key) { return this.data[key] ?? null; }
      getAll(key) { return this.data[key] || []; }
    },
  });
  new Script(source + '\nglobalThis.inspect = {state: () => state, session: () => session};', { filename: 'app.js' }).runInContext(context);
  return {
    state: context.inspect.state, session: context.inspect.session,
    html: () => element('#app').innerHTML,
    dialog: () => element('#dialog-root').innerHTML,
    status: () => element('#status').textContent,
    error: selector => element(selector).textContent,
    preferences: () => JSON.parse(saved.get('kindred-local-preferences-v1') || '{}'),
    textSize: () => document.body.dataset.textSize,
    async keyStick(index, key) {
      const stick = { dataset: { action: 'stick-select', index: String(index) } };
      handlers.keydown({ key, preventDefault() {}, target: { closest: selector => selector === '.stick-on-table' ? stick : null } });
      await Promise.resolve();
    },
    speechCalls,
    change(id, checked) { handlers.change({ target: { matches: selector => selector === `#${id}`, checked } }); },
    input(id, data) { handlers.input({ target: { form: { id, data } } }); },
    stored: () => core.loadState(storage),
    async submit(id, data, dataset = {}) { await handlers.submit({ preventDefault() {}, target: { id, data, dataset } }); },
    typePetReply(value) { handlers.input({ target: { matches: selector => selector === '#pet-reply-text', value } }); },
    async click(action, extras = {}) {
      const target = { disabled: false, dataset: { action, ...extras } };
      handlers.click({ target: { closest: selector => selector === '[data-action]' ? target : null } });
      await Promise.resolve();
    },
  };
}
const profile = (ui, overrides = {}) => ui.submit('profile-form', {
  name: 'Alex', age: '20', interests: ['gardening', 'cooking'], ...overrides,
});
async function finishQuiz(ui) {
  await ui.click('start-activity', { id: 'garden-quiz' });
  await ui.click('session-start');
  const questions = ui.session().activity.questions;
  for (const question of questions) {
    await ui.click('quiz-answer', { index: String(question.correct) });
    await ui.click('session-next');
  }
}

async function finishCommunityActivity(ui, { activityId = 'garden-quiz', personId = null } = {}) {
  await ui.click(personId ? 'connect' : 'start-activity', { id: personId || activityId });
  await ui.click('session-start');
  const activitySession = ui.session();
  const activity = activitySession.activity;
  const total = activity.kind === 'quiz' ? activity.questions.length : activitySession.promptOrder.length;
  if (activity.kind === 'quiz') {
    for (const question of activity.questions) {
      await ui.click('quiz-answer', { index: String(question.correct) });
      await ui.click('session-next');
    }
  } else {
    for (let index = 0; index < total; index += 1) await ui.click('session-next');
  }
}

async function startTogether(ui, { kind = 'quiz', name0 = 'Alex', name1 = 'Gran' } = {}) {
  await ui.click('together-mode', { kind });
  ui.submit('together-setup-form', { kind, name0, name1 });
  assert.ok(ui.session(), ui.error('#together-setup-error') || 'Together setup did not create a session.');
  assert.equal(ui.session().started, false);
  assert.match(ui.dialog(), /HOW TO PLAY/);
  assert.match(ui.dialog(), /class="together-scene(?: [^"]*)?"/);
  assert.match(ui.dialog(), /Charlie is your family’s virtual pet/);
  assert.match(ui.dialog(), /class="charlie-mascot"/);
  await ui.click('session-start');
  assert.equal(ui.session().started, true);
  return ui.session();
}

async function finishTogether(ui) {
  const current = ui.session();
  const activity = current.activity;
  const total = activity.kind === 'quiz' ? activity.questions.length : current.promptOrder.length;
  if (activity.kind === 'quiz') {
    for (let step = 0; step < total; step += 1) {
      const correct = activity.questions[step].correct;
      await ui.click('together-answer', { index: String(correct) });
      await ui.click('together-answer', { index: String(correct) });
      await ui.click('together-next');
    }
  } else {
    for (let step = 0; step < total; step += 1) {
      await ui.click('together-next');
      await ui.click('together-next');
    }
  }
}

test('dashboard samples and entered profile/review text render safely', async () => {
  const ui = harness();
  assert.match(ui.html(), /Little Green Club/);
  assert.match(ui.html(), /Fictional demo profiles/);
  profile(ui, { name: '<script>bad</script>' });
  await ui.click('profile');
  assert.match(ui.dialog(), /value="&lt;script&gt;bad&lt;\/script&gt;"/);
  assert(!ui.dialog().includes('value="<script>bad</script>"'));
  await ui.click('close-dialog');
  await finishQuiz(ui);
  ui.submit('review-form', { rating: '5', note: '<img src=x onerror=alert(1)>' });
  await ui.click('navigate', { page: 'circle' });
  assert.match(ui.html(), /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert(!ui.html().includes('<img src=x'));
});

test('community quiz, friend, group, conversation, redemption, reload and reset work end to end', async () => {
  const ui = harness();
  profile(ui);
  await finishCommunityActivity(ui, { personId: 'margaret' });
  assert(ui.session().finished);
  assert.match(ui.dialog(), /How was your moment/);
  ui.submit('review-form', { rating: '5', note: 'A lovely moment', addFriend: 'on' });
  assert.equal(ui.state().points, 30);
  assert.deepEqual(ui.state().friends, ['margaret']);
  await ui.click('join-group', { id: 'garden-club' });
  assert.deepEqual(ui.state().joinedGroups, ['garden-club']);
  await finishCommunityActivity(ui, { activityId: 'family-recipes' });
  ui.submit('review-form', { rating: '4', note: 'A recipe to remember' });
  assert.equal(ui.state().points, 60);
  await ui.click('navigate', { page: 'rewards' });
  await ui.click('redeem', { id: 'tea' });
  assert.match(ui.dialog(), /no monetary value/);
  await ui.click('redeem-confirm', { id: 'tea' });
  assert.equal(ui.state().points, 0);
  assert.equal(ui.stored().redemptions.length, 1);
  const reloaded = harness({ initial: ui.stored() });
  await reloaded.click('navigate', { page: 'circle' });
  assert.match(reloaded.html(), /Margaret/);
  assert.match(reloaded.html(), /Little Green Club/);
  await ui.click('reset-confirm');
  assert.equal(ui.state().profile.name, 'Alex');
  await ui.click('reset');
  assert.equal(ui.state().profile, null);
  assert.equal(ui.stored().reviews.length, 0);
});

test('reward celebrations show the issued voucher once; cancel, stale confirmation and reload do not spend points', async () => {
  for (const reward of core.REWARDS) {
    const ui = harness();
    for (let game = 0; game < reward.cost / 30 + 2; game++) {
      await startTogether(ui, { kind: 'conversation' });
      await finishTogether(ui);
      await ui.click('close-dialog');
    }
    const balance = ui.state().points;
    const growth = core.getPetStats(ui.state()).experience;
    await ui.click('navigate', { page: 'rewards' });
    await ui.click('redeem', { id: reward.id });
    assert.doesNotMatch(ui.dialog(), /Your reward is ready!/);
    await ui.click('close-dialog');
    await ui.click('redeem-confirm', { id: reward.id });
    assert.equal(ui.state().points, balance, 'A cancelled confirmation is no longer valid.');
    await ui.click('redeem', { id: reward.id });
    await ui.click('redeem-confirm', { id: 'unknown' });
    assert.equal(ui.state().points, balance);
    await ui.click('redeem-confirm', { id: reward.id });
    const code = `DEMO-${reward.id.toUpperCase()}-0001`;
    assert.match(ui.dialog(), /Your reward is ready!/);
    assert.ok(ui.dialog().includes(reward.name));
    assert.ok(ui.dialog().includes(code));
    assert.ok(ui.dialog().includes(`${reward.cost} points used · 60 points left`));
    assert.equal(ui.state().points, 60);
    assert.equal(core.getPetStats(ui.state()).experience, growth);
    await ui.click('redeem-confirm', { id: reward.id });
    assert.equal(ui.state().points, 60, 'A repeated click cannot issue another voucher.');
    assert.equal(ui.stored().redemptions.length, 1);
    await ui.click('reward-view', { id: 'voucher-1' });
    assert.equal(ui.dialog(), '');
    assert.ok(ui.html().includes(code));
    const reloaded = harness({ initial: ui.stored() });
    assert.equal(reloaded.dialog(), '', 'Reload does not replay the celebration.');
    assert.equal(reloaded.state().points, 60);
    assert.equal(reloaded.stored().redemptions[0].code, code);
  }
  const empty = harness();
  await empty.click('redeem', { id: 'tea' });
  await empty.click('redeem-confirm', { id: 'tea' });
  assert.doesNotMatch(empty.dialog(), /Your reward is ready!/);
  assert.match(empty.status(), /more points/);
  assert.equal(empty.state().redemptions.length, 0);
});

test('family mode hides and rejects community connections; guardian involvement changes teen mode', async () => {
  const ui = harness();
  for (const age of ['9', '15']) {
    profile(ui, { age });
    assert.match(ui.html(), /Family mode/);
    assert(!ui.html().includes('data-action="connect"'));
    await ui.click('connect', { id: 'margaret' });
    assert.equal(ui.session(), null);
  }
  profile(ui, { age: '15', guardianConsent: 'on' });
  assert.match(ui.html(), /Community preview/);
  assert(ui.html().includes('data-action="connect"'));
  profile(ui, { age: '9', guardianConsent: 'on' });
  assert(!ui.html().includes('data-action="connect"'));
  await finishQuiz(ui);
  ui.submit('review-form', { rating: '5', note: 'A family game' });
  assert.equal(ui.state().points, 30);
  assert.deepEqual(ui.state().friends, []);
});

test('unfinished activities cannot award points and a repeated review submission cannot double them', async () => {
  const ui = harness();
  profile(ui);
  await ui.click('start-activity', { id: 'garden-quiz' });
  await ui.click('session-start');
  await ui.click('session-next');
  assert.equal(ui.session().step, 0);
  ui.submit('review-form', { rating: '5' });
  assert.equal(ui.state().points, 0);
  await ui.click('close-dialog');
  assert.match(ui.dialog(), /Leave this activity/);
  await ui.click('session-quit');
  assert.equal(ui.state().points, 0);
  await finishQuiz(ui);
  ui.submit('review-form', { rating: '4' });
  ui.submit('review-form', { rating: '4' });
  assert.equal(ui.state().points, 30);
});

test('blocked saving is disclosed, and failed reset warns that prior data may return', async () => {
  const initial = core.setProfile(core.createState(), { name: 'Before', age: 25, interests: ['gardening'] });
  const ui = harness({ initial, blocked: true });
  profile(ui, { name: 'This visit' });
  assert.equal(ui.state().profile.name, 'This visit');
  assert.equal(ui.stored().profile.name, 'Before');
  assert.match(ui.status(), /For this visit only: browser storage is unavailable/);
  assert.match(ui.html(), /Browser storage is unavailable/);
  await ui.click('reset');
  assert.equal(ui.state().profile, null);
  assert.equal(ui.stored().profile.name, 'Before');
  assert.match(ui.status(), /could not be removed and may return on reload/);
});

test('two people can play a quiz without a profile, keep answers private until both answer, and save one shared mission', async () => {
  const ui = harness();
  assert.match(ui.html(), />Play<\/button>/);
  const session = await startTogether(ui, { kind: 'quiz', name0: '<b>Alex</b>', name1: 'Gran' });
  assert.equal(session.activity.kind, 'quiz');
  assert.equal(ui.state().profile, null);
  assert.match(ui.dialog(), /&lt;b&gt;Alex&lt;\/b&gt;, it’s your turn/);
  assert(!ui.dialog().includes('<b>Alex</b>'));
  assert(!ui.dialog().includes('together-review-form'));
  await ui.click('together-next');
  assert.equal(ui.session().step, 0);
  assert.equal(ui.session().turn, 0);
  assert.equal(ui.state().points, 0);
  for (const question of session.activity.questions) {
    const correct = question.correct;
    await ui.click('together-answer', { index: String(correct) });
    assert.equal(ui.session().turn, 1);
    assert.equal(ui.session().revealed, false);
    assert.match(ui.dialog(), /Gran, it’s your turn/);
    assert(!ui.dialog().includes('class="quiz-option correct'));
    assert(!ui.dialog().includes('Correct answer:'));
    assert(!ui.dialog().includes(question.explanation));
    await ui.click('together-next');
    assert.equal(ui.session().turn, 1);
    await ui.click('together-answer', { index: String((correct + 1) % question.answers.length) });
    assert.equal(ui.session().revealed, true);
    assert.match(ui.dialog(), /Correct answer:/);
    if (ui.session().hp === 0) await ui.click('restore-hp');
    await ui.click('together-next');
  }
  assert.equal(ui.session(), null);
  assert.match(ui.dialog(), /MISSION COMPLETE/);
  assert.match(ui.dialog(), /class="charlie-mascot"/);
  assert.match(ui.dialog(), /\+30/);
  assert.equal(ui.state().points, 30);
  assert.equal(ui.state().profile, null);
  assert.equal(ui.state().friends.length, 0);
  assert.equal(ui.stored().reviews[0].participants[0].score, session.activity.questions.length);
  assert.equal(ui.stored().reviews[0].participants[1].score, 0);
  assert.equal(ui.stored().reviews[0].participants[0].rating, null);
  ui.submit('together-review-form', { rating0: '5', rating1: '5' });
  assert.equal(ui.state().points, 30);
  const reloaded = harness({ initial: ui.stored() });
  await reloaded.click('navigate', { page: 'circle' });
  assert.match(reloaded.html(), /MISSION COMPLETE/);
  assert.match(reloaded.html(), /&lt;b&gt;Alex&lt;\/b&gt;/);
  assert.match(reloaded.html(), new RegExp(`${session.activity.questions.length} \/ ${session.activity.questions.length} correct`));
  await reloaded.click('profile');
  assert.match(reloaded.dialog(), />Reset<\/button>/);
  await reloaded.click('reset-confirm');
  assert.match(reloaded.dialog(), />Reset<\/button>/);
  await reloaded.click('reset');
  assert.equal(reloaded.stored().reviews.length, 0);
});

test('quiz question can be skipped together without counting as a correct answer', async () => {
  const ui = harness();
  const session = await startTogether(ui, { kind: 'quiz' });
  const question = session.activity.questions[0];
  await ui.click('together-answer', { index: String(question.correct) });
  await ui.click('together-skip');
  assert.equal(ui.session().revealed, true);
  assert.deepEqual(ui.session().answers.map(answers => answers[0]), [null, null]);
  assert.match(ui.dialog(), /Skipped together/);
  await ui.click('together-next');
  assert.equal(ui.session().step, 1);
});

test('solo quiz can skip a question and continue without a selection', async () => {
  const ui = harness();
  profile(ui);
  await ui.click('start-activity', { id: 'garden-quiz' });
  await ui.click('session-start');
  await ui.click('session-skip');
  assert.equal(ui.session().step, 1);
  assert.equal(ui.session().answers[0], null);
  assert.match(ui.dialog(), /QUESTION 2 OF/);
});

test('display preferences, read aloud, and saved pair quick start work on this device', async () => {
  const ui = harness();
  await ui.click('profile');
  await ui.click('display-settings');
  assert.match(ui.dialog(), /Text size/);
  assert.match(ui.dialog(), /Read prompts aloud automatically/);
  await ui.click('text-size', { size: 'extra-large' });
  assert.equal(ui.textSize(), 'extra-large');
  assert.equal(ui.preferences().textSize, 'extra-large');
  ui.change('auto-read-toggle', true);
  assert.equal(ui.preferences().autoRead, true);
  await ui.click('profile');

  const session = await startTogether(ui, { kind: 'quiz', name0: 'Alex', name1: 'Gran' });
  assert.ok(session.activity.questions.length > 3);
  assert.ok(ui.speechCalls.some(text => text.includes(session.activity.questions[0].question)));
  await ui.click('close-dialog');
  await ui.click('session-quit');
  await ui.click('together-setup');
  assert.match(ui.dialog(), /Alex &amp; Gran[\s\S]*data-action="quick-pair-play"/);
  assert.match(ui.dialog(), /value="Alex"/);
  const reloaded = harness({ initialPreferences: ui.preferences() });
  assert.equal(reloaded.textSize(), 'extra-large');
  await reloaded.click('together-setup');
  assert.match(reloaded.dialog(), /Alex &amp; Gran[\s\S]*data-action="quick-pair-play"/);
  await ui.click('quick-pair-play');
  assert.deepEqual(ui.session().participants.map(participant => participant.name), ['Alex', 'Gran']);
  await ui.click('close-dialog');
  await ui.click('together-setup');
  await ui.click('forget-pair');
  assert.doesNotMatch(ui.dialog(), /Play together again/);
  assert.equal(ui.preferences().lastPair, null);
});

test('face-to-face conversations need both turns and finish without a rating form', async () => {
  const ui = harness();
  const session = await startTogether(ui, { kind: 'conversation' });
  assert.equal(session.activity.kind, 'conversation');
  await ui.click('close-dialog');
  assert.match(ui.dialog(), /Leave this activity/);
  await ui.click('session-resume');
  assert.equal(ui.session().turn, 0);
  const total = session.promptOrder.length;
  for (let step = 0; step < total; step++) {
    assert.equal(ui.session().step, step);
    assert.match(ui.dialog(), /Alex, it’s your turn/);
    await ui.click('together-next');
    assert.equal(ui.session().step, step);
    assert.equal(ui.session().turn, 1);
    assert.match(ui.dialog(), /Gran, it’s your turn/);
    assert.equal(ui.state().points, 0);
    await ui.click('together-next');
  }
  assert.equal(ui.session(), null);
  assert.match(ui.dialog(), /MISSION COMPLETE/);
  assert.equal(ui.state().points, 30);
  assert.equal(ui.stored().reviews[0].participants[0].score, null);
  assert.equal(ui.stored().reviews[0].participants[1].score, null);
  await startTogether(ui, { kind: 'conversation' });
  await ui.click('close-dialog');
  assert.match(ui.dialog(), /Leave this activity/);
  await ui.click('session-quit');
  assert.equal(ui.session(), null);
  assert.equal(ui.state().points, 30);
});

test('pet home keeps the weekly family loop central and community previews secondary', async () => {
  const ui = harness();
  assert.match(ui.html(), /Grow closer through play/);
  assert.match(ui.html(), />Charlie</);
  assert.match(ui.html(), />Open<\/button>/);
  assert.match(ui.html(), /TODAY’S GAME/);
  assert.match(ui.html(), /Grow closer through play/);
  assert.doesNotMatch(ui.html(), /Save Charlie(?:’s|&#39;s) portrait/);
  assert.doesNotMatch(ui.html(), /pet-portrait/);
  assert.match(ui.html(), /data-page="characters"/);
  assert.match(ui.html(), />Feed<\/button>/);
  assert.match(ui.html(), /Community preview/);
  assert(!ui.html().includes('Together now'));
  assert(!ui.html().includes('Trusted circle'));
  assert.match(ui.html(), /data-stat="moments">0</);
  assert.match(ui.html(), /data-stat="points">0</);
  assert(!ui.html().includes('data-stat="interests"'));
  await ui.click('together-mode', { kind: 'quiz' });
  assert.match(ui.dialog(), /GAME STYLE/);
  assert.match(ui.dialog(), /<h3>Quiz<\/h3>/);
  assert.doesNotMatch(ui.dialog(), /name="kind"/);
  assert.doesNotMatch(ui.dialog(), /Guided Talk/);
  assert.match(ui.dialog(), /game-style-illustration/);
  await ui.click('close-dialog');
  await ui.click('trusted-preview');
  assert.match(ui.dialog(), /verified guardian approval, scheduling, and remote calls are not available/);
  await ui.click('community-preview');
  assert.equal(ui.dialog(), '');
  assert.equal(ui.state().profile, null);
  assert.match(ui.html(), /Fictional demo profiles/);
  await ui.click('trusted-preview');
  await ui.click('together-setup');
  assert.match(ui.dialog(), /Player 1/);
  assert.match(ui.dialog(), /Player 2/);
  assert.equal(ui.state().profile, null);
});

test('Characters tab explains Charlie and clearly labels the fictional story cast', async () => {
  const ui = harness();
  await ui.click('navigate', { page: 'characters' });
  assert.match(ui.html(), /<h1 class="page-title">Characters<\/h1>/);
  assert.match(ui.html(), /YOUR FAMILY’S VIRTUAL PET/);
  assert.match(ui.html(), /Finish any game, care for Charlie, or share a family story/);
  assert.match(ui.html(), /Story characters/);
  assert.match(ui.html(), /Fictional demo profiles/);
  assert.match(ui.html(), /not real people or live connections/);
  for (const name of ['Margaret', 'Arthur', 'Mei', 'David', 'Ava', 'Leo', 'Sam', 'Nia']) {
    assert.match(ui.html(), new RegExp(`<h3>${name}<\\/h3>`));
  }
});

test('Play together keeps the chosen game style and daily theme without asking for another choice', async () => {
  const ui = harness();
  await ui.click('together-mode', { kind: 'conversation' });
  assert.match(ui.dialog(), /Guided Talk/);
  assert.match(ui.dialog(), /We’ll choose an unplayed activity at random/);
  assert.match(ui.dialog(), /name="name0"[^>]*value="Alex"/);
  assert.match(ui.dialog(), /name="name1"[^>]*value="Gran"/);
  assert.doesNotMatch(ui.dialog(), /name="kind"/);
  assert.doesNotMatch(ui.dialog(), /Choose a game\./);
  await ui.submit('together-setup-form', { name0: 'Alex', name1: 'Gran' }, { kind: 'conversation' });
  assert.equal(ui.session().activity.kind, 'conversation');

  const dailyUi = harness();
  const daily = core.getDailyTheme(dailyUi.state());
  await dailyUi.click('together-setup', { id: daily.id });
  assert.match(dailyUi.dialog(), /TODAY’S GAME/);
  assert.ok(dailyUi.dialog().includes(daily.title));
  assert.doesNotMatch(dailyUi.dialog(), /name="kind"/);
  await dailyUi.submit('together-setup-form', { name0: 'Alex', name1: 'Gran' }, { pinned: daily.id, kind: daily.kind });
  assert.equal(dailyUi.session().activity.id, daily.id);
});

test('local weekly pet story, printable book, and every face-to-face game grow Charlie', async () => {
  const ui = harness();
  assert.equal(core.getPetStats(ui.state()).experience, 0);
  await ui.click('pet-feed');
  assert.equal(core.getPetStats(ui.state()).experience, 3);
  assert.match(ui.html(), />Fed ✓<\/button>/);

  await ui.click('pet-ask');
  const weekStart = core.getWeekStartKey();
  assert.match(ui.dialog(), /CHARLIE’S QUESTION/);
  const activeWeek = core.getPetWeek(ui.state());
  assert.ok(activeWeek?.questionId);
  assert.match(ui.dialog(), /pass this device to a grandparent/);
  await ui.click('pet-reply');
  assert.match(ui.dialog(), /GRANDPARENT’S TURN/);
  assert.match(ui.dialog(), /Voice recording is not available here/);
  await ui.submit('pet-reply-form', { replyText: 'We played five stones after school.' }, { week: weekStart });
  assert.equal(core.getPetStats(ui.state()).experience, 18);
  assert.match(ui.dialog(), /Charlie learned something lovely/);
  assert.match(ui.dialog(), /\+15 growth points/);
  assert.equal(ui.stored().petJourney.weeks[0].replyText, 'We played five stones after school.');

  await ui.click('close-dialog');
  assert.match(ui.html(), /A family story to keep/);
  await ui.click('pet-read-story');
  assert.match(ui.dialog(), /We played five stones after school/);
  await ui.click('close-dialog');
  await ui.click('storybook');
  assert.match(ui.html(), /Our month with Charlie/);
  assert.match(ui.html(), /We played five stones after school/);
  await ui.click('print-storybook');

  await ui.click('navigate', { page: 'activities' });
  for (const kind of ['quiz', 'conversation', 'random', 'choice', 'collaborative', 'reflection', 'walk']) {
    const before = core.getPetStats(ui.state()).experience;
    await startTogether(ui, { kind });
    await finishTogether(ui);
    assert.equal(core.getPetStats(ui.state()).experience, before + 10, `${kind} should give Charlie growth points`);
    assert.match(ui.dialog(), /Charlie \+10 growth/);
    await ui.click('close-dialog');
  }
  assert.equal(ui.state().reviews.length, 7);
});

test('shared journey reflects completed activities and game styles choose fresh content', async () => {
  const ui = harness();
  await startTogether(ui, { kind: 'quiz' });
  await finishTogether(ui);
  await startTogether(ui, { kind: 'conversation', name0: '<b>Jo</b>', name1: 'Uncle Ray' });
  const secondActivityId = ui.session().activity.id;
  await finishTogether(ui);
  assert.match(ui.html(), /data-stat="moments">2</);
  assert.match(ui.html(), /data-stat="points">60</);
  assert.match(ui.html(), /journey-pair/);
  assert.match(ui.html(), /&lt;b&gt;Jo&lt;\/b&gt;/);
  assert.match(ui.html(), /Uncle Ray/);
  const played = new Set(ui.state().reviews.map(review => review.activityId));
  const suggestion = core.getSuggestedActivity(ui.state());
  assert(!played.has(suggestion.id));
  await ui.click('together-mode', { kind: 'conversation' });
  ui.submit('together-setup-form', { kind: 'conversation', name0: 'Alex', name1: 'Gran' });
  assert.equal(ui.session().activity.kind, 'conversation');
  assert.notEqual(ui.session().activity.id, secondActivityId);
  await ui.click('close-dialog');
  await ui.click('navigate', { page: 'rewards' });
  await ui.click('redeem', { id: 'tea' });
  await ui.click('redeem-confirm', { id: 'tea' });
  await ui.click('navigate', { page: 'discover' });
  assert.match(ui.html(), /data-stat="points">0</);
  assert.match(ui.html(), /data-stat="moments">2</);
  const reloaded = harness({ initial: ui.stored() });
  await reloaded.click('navigate', { page: 'circle' });
  assert.match(reloaded.html(), /Your moments/);
  assert.match(reloaded.html(), /data-stat="moments">2</);
  assert.match(reloaded.html(), /&lt;b&gt;Jo&lt;\/b&gt;/);
});

test('Pick Up Sticks plays together with HP recovery, hints, scores, saved history, and no duplicate award', async () => {
  const ui = harness();
  await ui.click('navigate', { page: 'activities' });
  assert.match(ui.html(), /Pick Up Sticks/);
  const current = await startTogether(ui, { kind: 'sticks' });
  assert.equal(current.sticks.count, 9);
  current.sticks = core.createStickGame({ seed: 123 });
  assert.match(ui.dialog(), /HP 3 \/ 3/);
  assert.match(ui.dialog(), /stick-number-grid/);
  await ui.click('together-skip');
  assert.equal(ui.state().points, 0);
  await ui.click('stick-hint');
  assert.match(ui.dialog(), /Charlie spotted stick/);
  const stats = core.getStickGameStats(ui.session().sticks);
  const blocked = stats.remaining.find(stick => !stats.available.includes(stick.id));
  assert.ok(blocked);
  for (let index = 0; index < 3; index++) {
    await ui.click('stick-select', { index: String(blocked.id) });
    await ui.click('stick-pick');
  }
  assert.match(ui.dialog(), /HP 0 \/ 3/);
  assert.equal(core.getStickGameStats(ui.session().sticks).remaining.length, 9);
  await ui.click('stick-select', { index: String(stats.available[0]) });
  await ui.click('stick-pick');
  assert.equal(core.getStickGameStats(ui.session().sticks).remaining.length, 9);
  await ui.click('restore-hp');
  assert.match(ui.dialog(), /HP 3 \/ 3/);
  assert.equal(ui.state().points, 0);
  while (ui.session()) {
    const game = core.getStickGameStats(ui.session().sticks);
    await ui.click('stick-select', { index: String(game.available[0]) });
    await ui.click('stick-pick');
    if (ui.session()) await ui.click('stick-pass');
  }
  assert.match(ui.dialog(), /MISSION COMPLETE/);
  assert.match(ui.dialog(), /stick points/);
  assert.equal(ui.state().points, 30);
  assert.equal(core.getPetStats(ui.state()).experience, 10);
  await ui.click('stick-pick');
  assert.equal(ui.state().points, 30);
  const reloaded = harness({ initial: ui.stored() });
  await reloaded.click('navigate', { page: 'circle' });
  assert.match(reloaded.html(), /Pick Up Sticks/);
  assert.match(reloaded.html(), /stick points/);
});

test('solo sticks cannot skip the board and save after the final stick only', async () => {
  const ui = harness();
  await profile(ui, { interests: ['games'] });
  await ui.click('start-random-activity', { kind: 'sticks' });
  assert.match(ui.dialog(), /digital version tests observation/);
  await ui.click('session-start');
  await ui.click('session-next');
  await ui.click('session-skip');
  assert.equal(ui.session().finished, false);
  assert.equal(ui.state().points, 0);
  while (!ui.session().finished) {
    const game = core.getStickGameStats(ui.session().sticks);
    await ui.click('stick-select', { index: String(game.available[0]) });
    await ui.click('stick-pick');
  }
  assert.match(ui.dialog(), /9 sticks cleared/);
  await ui.submit('review-form', { rating: '5', note: 'A childhood favourite.' });
  assert.equal(ui.state().points, 30);
  assert.equal(ui.stored().reviews[0].stickCount, 9);
  assert.deepEqual(ui.stored().reviews[0].learning, { age: 12, challenge: 1 });
});

test('quiz HP stays private until reveal, pauses at zero, and restores without losing answers', async () => {
  const ui = harness();
  await startTogether(ui, { kind: 'quiz' });
  for (let step = 0; step < 2; step++) {
    const q = ui.session().activity.questions[step];
    const hp = ui.session().hp;
    await ui.click('together-answer', { index: String((q.correct + 1) % q.answers.length) });
    assert.equal(ui.session().hp, hp, 'The first answer must not leak correctness through HP.');
    await ui.click('together-answer', { index: String((q.correct + 1) % q.answers.length) });
    if (step === 0) await ui.click('together-next');
  }
  assert.equal(ui.session().hp, 0);
  const answers = JSON.stringify(ui.session().answers);
  await ui.click('together-next');
  assert.equal(ui.session().step, 1);
  await ui.click('restore-hp');
  assert.equal(ui.session().hp, 3);
  assert.equal(JSON.stringify(ui.session().answers), answers);
  assert.equal(ui.state().points, 0);
  await ui.click('together-next');
  assert.equal(ui.session().step, 2);
});

test('age bands persist, locked challenges reject direct submissions, and earned levels unlock bigger piles', async () => {
  const ui = harness();
  await ui.click('navigate', { page: 'settings' });
  await ui.submit('learning-form', { ageBand: '6', challenge: '2' });
  assert.match(ui.status(), /level 2/);
  assert.equal(ui.preferences().learning, undefined);
  await ui.submit('learning-form', { ageBand: '6', challenge: '1' });
  assert.match(ui.html(), /Settings saved|Games &amp; conversations|Games & conversations/);
  await ui.click('together-mode', { kind: 'quiz' });
  await ui.submit('together-setup-form', { kind: 'quiz', name0: 'Alex', name1: 'Gran', ageBand: '6', challenge: '1' });
  assert.equal(ui.session().learning.age, 6);
  const expected = core.getLearningActivity(ui.session().activity.id, { age: 6, challenge: 1 });
  assert.equal(ui.session().activity.questions[0].question, expected.questions[0].question);
  await ui.click('session-start');
  await finishTogether(ui);
  await ui.click('close-dialog');
  for (let index = 0; index < 3; index++) {
    await startTogether(ui, { kind: 'conversation' });
    await finishTogether(ui);
    if (index === 2) assert.match(ui.dialog(), /New adventures unlocked/);
    await ui.click('close-dialog');
  }
  assert.equal(core.getPetStats(ui.state()).level, 2);
  await ui.click('navigate', { page: 'settings' });
  await ui.submit('learning-form', { ageBand: '9', challenge: '2' });
  await startTogether(ui, { kind: 'sticks' });
  assert.equal(ui.session().sticks.count, 15);
  assert.match(ui.dialog(), /15 \/ 15 left/);
  assert(!ui.dialog().includes('Learning level'));
  assert(!ui.dialog().includes('data-action="stick-hint"'));
  const reloaded = harness({ initial: ui.stored(), initialPreferences: ui.preferences() });
  assert.deepEqual(reloaded.preferences().learning, { age: 9, challenge: 2 });
});

test('age settings change prompts in every talk style for solo and shared games', async () => {
  for (const kind of ['conversation', 'random', 'choice', 'collaborative', 'reflection', 'walk']) {
    for (const age of [6, 9, 12]) {
      const ui = harness({ initialPreferences: { learning: { age, challenge: 1 } } });
      await profile(ui);
      await ui.click('start-random-activity', { kind });
      let current = ui.session();
      let expected = core.getLearningActivity(current.activity.id, { age, challenge: 1 });
      assert.deepEqual(Array.from(current.activity.prompts), expected.prompts);
      await ui.click('session-start');
      assert(!ui.dialog().includes('Learning level'));
      const promptIndex = ui.session().promptOrder[0];
      assert.ok(ui.dialog().includes(expected.prompts[promptIndex]), `${kind} / ${age} solo prompt`);
      for (let step = 0; step < expected.prompts.length; step++) await ui.click('session-next');
      await ui.submit('review-form', { rating: '5' });
      assert.equal(ui.state().points, 30);
      await startTogether(ui, { kind });
      current = ui.session();
      expected = core.getLearningActivity(current.activity.id, { age, challenge: 1 });
      assert.deepEqual(Array.from(current.activity.prompts), expected.prompts);
      if (kind === 'collaborative' && age < 12) assert.deepEqual(Array.from(current.promptOrder), [0, 1, 2, 3]);
      assert.ok(ui.dialog().includes(expected.prompts[current.promptOrder[0]]), `${kind} / ${age} shared prompt`);
      await finishTogether(ui);
      assert.equal(ui.stored().points, 60);
    }
  }
});

test('Pick Up Sticks setup asks only who is playing', async () => {
  const ui = harness();
  await ui.click('together-mode', { kind: 'sticks' });
  assert(!ui.dialog().includes('name="ageBand"'));
  assert(!ui.dialog().includes('name="challenge"'));
  assert.match(ui.dialog(), /Player 1/);
  assert.match(ui.dialog(), /Player 2/);
});

test('game preferences live in Settings while home, activities, characters, and game setup stay focused', async () => {
  const ui = harness({ initialHash: '#settings' });
  assert.match(ui.html(), /<h1 class="page-title">Settings<\/h1>/);
  assert.match(ui.html(), /name="ageBand"/);
  assert.match(ui.html(), /name="challenge"/);
  assert.match(ui.html(), /<details class="settings-progress">/);
  for (const page of ['discover', 'activities', 'characters']) {
    await ui.click('navigate', { page });
    assert(!ui.html().includes('name="ageBand"'));
    assert(!ui.html().includes('unlock-grid'));
    assert(!ui.html().includes('GROW AT YOUR OWN PACE'));
    assert(!ui.html().includes('Your next adventures'));
    assert.match(ui.html(), /data-page="settings"/);
  }
  await ui.click('together-mode', { kind: 'quiz' });
  assert(!ui.dialog().includes('name="ageBand"'));
  assert(!ui.dialog().includes('name="challenge"'));
  assert.match(ui.dialog(), /Player 1/);
});

test('saved Settings adapt new games implicitly and cannot be overridden by the player-name form', async () => {
  const ui = harness({ initialHash: '#settings' });
  await ui.submit('learning-form', { ageBand: '9', challenge: '1' });
  assert.deepEqual(ui.preferences().learning, { age: 9, challenge: 1 });
  await ui.click('navigate', { page: 'activities' });
  await ui.submit('learning-form', { ageBand: '12', challenge: '3' });
  assert.deepEqual(ui.preferences().learning, { age: 9, challenge: 1 });
  await ui.click('together-mode', { kind: 'quiz' });
  await ui.submit('together-setup-form', { kind: 'quiz', name0: 'Alex', name1: 'Gran', ageBand: '12', challenge: '3' });
  const current = ui.session();
  assert.equal(current.learning.age, 9);
  assert.equal(current.learning.challenge, 1);
  assert.equal(current.activity.questions[0].question, core.getLearningActivity(current.activity.id, { age: 9, challenge: 1 }).questions[0].question);
  assert(!ui.dialog().includes('Learning level'));
  await ui.click('session-start');
  assert(!ui.dialog().includes('Ages 9'));
  await ui.click('close-dialog');
  await ui.click('session-quit');
  const reloaded = harness({ initialPreferences: ui.preferences() });
  await reloaded.click('quick-pair-play');
  assert.equal(reloaded.session().learning.age, 9);
  assert(!reloaded.dialog().includes('name="ageBand"'));
  await reloaded.click('close-dialog');
  await reloaded.click('session-quit');
  await reloaded.click('navigate', { page: 'settings' });
  await reloaded.submit('learning-form', { ageBand: '6', challenge: '1' });
  await reloaded.click('quick-pair-play');
  assert.equal(reloaded.session().learning.age, 6);
});

test('the large stick board supports zoom, clear selection, and keyboard picking without changing the pile', async () => {
  const ui = harness();
  await startTogether(ui, { kind: 'sticks' });
  assert.match(ui.dialog(), /class="modal session-modal sticks-modal"/);
  assert.match(ui.dialog(), /role="group" aria-label="Pick Up Sticks table/);
  assert.match(ui.dialog(), /font-size="14"/);
  assert.ok(ui.dialog().indexOf('sticks-action-bar') < ui.dialog().indexOf('class="sticks-table"'));
  const current = ui.session();
  const original = JSON.stringify(current.sticks);
  await ui.click('stick-zoom');
  assert.match(ui.dialog(), /sticks-board-viewport is-zoomed/);
  assert.match(ui.dialog(), />Fit<\/button>/);
  assert.equal(JSON.stringify(ui.session().sticks), original);
  const id = core.getStickGameStats(ui.session().sticks).available[0];
  await ui.keyStick(id, 'Enter');
  assert.equal(ui.session().selectedStick, id);
  assert.match(ui.dialog(), /stick-on-table stick-selected/);
  assert.equal(ui.session().stickZoom, true);
  await ui.click('stick-pick');
  assert.equal(core.getStickGameStats(ui.session().sticks).remaining.length, current.sticks.count - 1);
  assert.equal(ui.state().points, 0);
  await ui.click('stick-zoom');
  assert.equal(ui.session().stickZoom, false);
  const next = core.getStickGameStats(ui.session().sticks).available[0];
  await ui.keyStick(next, ' ');
  assert.equal(ui.session().selectedStick, next);
});

test('earned evolution animates in completion and replay never awards growth or points', async () => {
  const ui = harness();
  for (let round = 0; round < 3; round++) {
    await startTogether(ui, { kind: 'conversation' });
    await finishTogether(ui);
    assert.equal(core.getPetStats(ui.state()).experience, (round + 1) * 10);
    if (round < 2) assert(!ui.dialog().includes('evolution-reveal'));
    else {
      assert.match(ui.dialog(), /Charlie evolved!/);
      assert.match(ui.dialog(), /data-from="new-friend" data-to="curious-sprout"/);
      assert.match(ui.dialog(), /MISSION COMPLETE/);
    }
    await ui.click('close-dialog');
  }
  const before = JSON.stringify(ui.stored());
  await ui.click('navigate', { page: 'characters' });
  assert.match(ui.html(), /Charlie’s journey/);
  await ui.click('evolution-replay', { id: 'curious-sprout' });
  assert.match(ui.dialog(), /EVOLUTION REPLAY/);
  assert.equal(JSON.stringify(ui.stored()), before);
  await ui.click('close-dialog');
  await ui.click('evolution-replay', { id: 'story-keeper' });
  assert.match(ui.status(), /unlock this look/);
  assert.equal(JSON.stringify(ui.stored()), before);
  const reloaded = harness({ initial: ui.stored() });
  assert.match(reloaded.html(), /data-pet-form="curious-sprout"/);
  assert(!reloaded.dialog().includes('evolution-reveal'), 'Reload must not repeat an earned evolution.');
});

test('daily care and a first family reply can trigger evolution without repeat awards', async () => {
  let cared = core.createState();
  for (let day = 1; day <= 9; day++) cared = core.feedPet(cared, `2026-10-${String(day).padStart(2, '0')}`);
  const ui = harness({ initial: cared });
  await ui.click('pet-feed');
  assert.equal(core.getPetStats(ui.state()).experience, 30);
  assert.match(ui.dialog(), /data-to="curious-sprout"/);
  const saved = JSON.stringify(ui.stored());
  await ui.click('close-dialog');
  await ui.click('pet-feed');
  assert.equal(JSON.stringify(ui.stored()), saved);

  const family = harness();
  for (let round = 0; round < 2; round++) {
    await startTogether(family, { kind: 'conversation' });
    await finishTogether(family);
    await family.click('close-dialog');
  }
  await family.click('pet-ask');
  await family.click('pet-reply');
  const week = core.getWeekStartKey();
  await family.submit('pet-reply-form', { replyText: 'We can play together.' }, { week });
  assert.equal(core.getPetStats(family.state()).experience, 35);
  assert.match(family.dialog(), /A FAMILY STORY SAVED/);
  assert.match(family.dialog(), /data-to="curious-sprout"/);
  await family.click('close-dialog');
  await family.submit('pet-reply-form', { replyText: 'A little more to remember.' }, { week });
  assert.equal(core.getPetStats(family.state()).experience, 35);
});

test('solo review evolution keeps the saved reward and cannot award it twice', async () => {
  const ui = harness();
  await profile(ui);
  for (let round = 0; round < 3; round++) {
    await finishQuiz(ui);
    await ui.submit('review-form', { rating: '5', note: '' });
  }
  assert.equal(ui.session(), null);
  assert.equal(ui.stored().points, 90);
  assert.equal(core.getPetStats(ui.stored()).experience, 30);
  assert.match(ui.dialog(), /data-from="new-friend" data-to="curious-sprout"/);
  await ui.submit('review-form', { rating: '5', note: '' });
  assert.equal(ui.stored().points, 90);
  assert.equal(core.getPetStats(ui.stored()).experience, 30);
});
