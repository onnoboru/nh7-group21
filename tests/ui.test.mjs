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

function harness({ initial = null, initialPreferences = null, blocked = false } = {}) {
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
  const location = { hash: '' };
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
  assert.match(ui.dialog(), /class="together-scene"/);
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
  assert.match(ui.html(), /Play a game/);
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
  assert.match(reloaded.dialog(), /Reset demo data/);
  await reloaded.click('reset-confirm');
  assert.match(reloaded.dialog(), /Reset all demo data/);
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
  assert.match(ui.dialog(), /Quick start · Alex &amp; Gran/);
  assert.match(ui.dialog(), /value="Alex"/);
  const reloaded = harness({ initialPreferences: ui.preferences() });
  assert.equal(reloaded.textSize(), 'extra-large');
  await reloaded.click('together-setup');
  assert.match(reloaded.dialog(), /Quick start · Alex &amp; Gran/);
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
  assert.match(ui.html(), /MEET YOUR FAMILY’S VIRTUAL PET/);
  assert.match(ui.html(), />Charlie</);
  assert.match(ui.html(), /See this week’s question/);
  assert.match(ui.html(), /TODAY’S GAME/);
  assert.match(ui.html(), /Every game helps Charlie grow/);
  assert.doesNotMatch(ui.html(), /Save Charlie(?:’s|&#39;s) portrait/);
  assert.doesNotMatch(ui.html(), /pet-portrait/);
  assert.match(ui.html(), /data-page="characters"/);
  assert.match(ui.html(), /Feed Charlie/);
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
  assert.match(ui.html(), /Fed today/);

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
    assert.match(ui.dialog(), /Charlie gained 10 growth points/);
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
