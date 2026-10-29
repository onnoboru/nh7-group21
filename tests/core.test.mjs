import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITIES, GROUPS, INTERESTS, PEOPLE, REWARDS, PET_QUESTIONS, STORAGE_KEY, createState, setProfile, getMode, getMatches, getRecommendedGroups, getSuggestedActivity, getPetStats, getPetWeek, getWeekStartKey, feedPet, askPetQuestion, replyToPetQuestion, completeSession, createTogetherSession, answerTogetherQuestion, advanceTogetherSession, skipTogetherStep, completeTogetherSession, joinGroup, redeemReward, saveState, loadState } from '../dist/core.js';

const profile = (age = 20, interests = ['gardening'], guardianConsent = false) => setProfile(createState(), { name: ' Alex ', age, interests, guardianConsent });
const session = (state, id = 'session-1', changes = {}) => completeSession(state, { id, personId: null, activityId: 'garden-quiz', rating: 5, note: ' Lovely! ', addFriend: false, ...changes });
const storage = initial => ({ value: initial ?? null, getItem(key) { assert.equal(key, STORAGE_KEY); return this.value; }, setItem(key, value) { assert.equal(key, STORAGE_KEY); this.value = value; } });
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

test('profiles validate ages, names, interests, and consent without changing the input', () => {
  const initial = freeze(createState());
  const next = setProfile(initial, { name: ' Alex ', age: 20, interests: ['art', 'art'] });
  assert.equal(initial.profile, null);
  assert.equal(next.profile.name, 'Alex');
  assert.deepEqual(next.profile.interests, ['art']);
  for (const age of [5, 111, 12.5, '16', NaN]) assert.throws(() => profile(age), /age/);
  for (const name of ['', '  ', 'x'.repeat(41), null]) assert.throws(() => setProfile(initial, { name, age: 18, interests: ['art'] }), /name/);
  for (const interests of [[], ['unknown'], null]) assert.throws(() => profile(18, interests), /interests/);
  assert.throws(() => profile(15, ['art'], 'yes'), /guardian/);
});

test('family mode applies at the correct age and consent boundaries', () => {
  assert.equal(getMode(null), 'family');
  for (const [age, consent, expected] of [[6, true, 'family'], [11, true, 'family'], [12, false, 'family'], [12, true, 'community'], [17, false, 'family'], [17, true, 'community'], [18, false, 'community'], [110, false, 'community']]) {
    assert.equal(getMode(profile(age, ['art'], consent).profile), expected);
  }
});

test('every completed activity style feeds Charlie’s growth, with daily care and stories adding more', () => {
  const initial = freeze(createState());
  assert.equal(getPetStats(initial).experience, 0);
  const firstGame = completeTogetherSession(initial, finishTogether('garden-quiz'), bothReviews);
  assert.equal(getPetStats(firstGame).gameExperience, 10);
  assert.equal(getPetStats(firstGame).experience, 10);

  const familyGame = completeTogetherSession(firstGame, finishTogether('family-recipes', 'together-2'), bothReviews);
  assert.equal(getPetStats(familyGame).experience, 20);
  const communityGame = session(setProfile(familyGame, { name: 'Alex', age: 20, interests: ['gardening'] }), 'community-3', { activityId: 'garden-walk-talk' });
  assert.equal(getPetStats(communityGame).gameExperience, 30);
  assert.equal(getPetStats(communityGame).experience, 30);
  assert.equal(getPetStats(communityGame).level, 1);
  assert.deepEqual(initial.petJourney, { fedDates: [], weeks: [] });

  const fed = feedPet(communityGame, '2026-10-19');
  assert.equal(getPetStats(fed, new Date(2026, 9, 19)).experience, 33);
  assert.equal(feedPet(fed, '2026-10-19'), fed);
  assert.throws(() => feedPet(fed, '2026-02-31'), /valid day/);
});

test('weekly pet questions accept a local text or voice story and award growth once', () => {
  const monday = new Date(2026, 9, 19);
  const thursday = new Date(2026, 9, 22);
  assert.equal(getWeekStartKey(thursday), '2026-10-19');
  const question = PET_QUESTIONS[0];
  const asked = askPetQuestion(createState(), { weekStart: '2026-10-19', questionId: question.id, askedAt: 1000 });
  assert.equal(getPetWeek(asked, thursday).questionId, question.id);
  assert.equal(askPetQuestion(asked, { weekStart: '2026-10-19', questionId: PET_QUESTIONS[1].id, askedAt: 2000 }), asked);
  assert.equal(getPetStats(asked, monday).experience, 0);
  assert.throws(() => replyToPetQuestion(asked, { weekStart: '2026-10-19', repliedAt: 1500 }), /short story or record/);

  const replied = replyToPetQuestion(asked, { weekStart: '2026-10-19', replyText: 'We played five stones after school.', repliedAt: 3000 });
  assert.equal(getPetStats(replied, thursday).experience, 15);
  assert.equal(getPetStats(replied, thursday).answeredWeeks, 1);
  assert.equal(replied.petJourney.weeks[0].replyText, 'We played five stones after school.');
  const voiceOnly = replyToPetQuestion(asked, { weekStart: '2026-10-19', voiceNoteId: 'voice-12345678', repliedAt: 3000 });
  assert.equal(getPetStats(voiceOnly, thursday).experience, 15);
  assert.throws(() => replyToPetQuestion(asked, { weekStart: '2026-10-19', voiceNoteId: 'bad-id', repliedAt: 3000 }), /valid voice story/);
  assert.throws(() => replyToPetQuestion(asked, { weekStart: '2026-10-26', replyText: 'Hello', repliedAt: 3000 }), /ask the weekly question/);
});

test('matching requires overlapping interests, opposite generation, and community mode', () => {
  assert.deepEqual(getMatches(createState()), []);
  assert.deepEqual(getMatches(profile(11, ['art'], true)), []);
  assert.deepEqual(getMatches(profile(16)), []);
  for (const age of [12, 59, 60, 95]) {
    const matches = getMatches(profile(age, ['gardening', 'music'], true));
    assert.ok(matches.length);
    matches.forEach(person => {
      assert.equal(person.generation, age < 60 ? 'senior' : 'young');
      assert.equal(person.score, person.sharedInterests.length);
      assert.ok(person.sharedInterests.every(id => ['gardening', 'music'].includes(id)));
      assert.ok(person.reason.includes('You both enjoy'));
    });
    assert.deepEqual(matches.map(person => person.score), matches.map(person => person.score).sort((a, b) => b - a));
  }
});

test('session review awards points once and adds a sample friend immutably', () => {
  const original = freeze(profile());
  const next = session(original, 'shared-1', { personId: 'margaret', addFriend: true });
  assert.equal(original.points, 0);
  assert.deepEqual(original.friends, []);
  assert.equal(next.points, 30);
  assert.deepEqual(next.friends, ['margaret']);
  assert.equal(next.reviews[0].note, 'Lovely!');
  assert.equal(next.reviews[0].interest, 'gardening');
  assert.equal(session(next, 'shared-1', { personId: 'margaret', addFriend: true }), next);
  assert.equal(session(next, 'shared-1', { rating: 0 }), next);
  const again = session(freeze(next), 'shared-2', { personId: 'margaret', addFriend: true });
  assert.equal(again.points, 60);
  assert.deepEqual(again.friends, ['margaret']);
});

test('invalid and family community sessions cannot award points or add friends', () => {
  assert.throws(() => session(createState()), /profile/);
  for (const changes of [{ id: '' }, { activityId: 'bad' }, { personId: 'bad' }, { rating: 0 }, { rating: 6 }, { rating: 2.5 }, { note: 'x'.repeat(501) }, { addFriend: 'yes' }, { addFriend: true }, { personId: 'ava' }, { personId: 'arthur' }]) {
    assert.throws(() => session(profile(), 's', changes));
  }
  const family = freeze(profile(10));
  assert.throws(() => session(family, 's', { personId: 'margaret' }), /Family/);
  assert.throws(() => session(family, 's', { addFriend: true }), /community session/);
  assert.equal(session(family).points, 30);
  assert.deepEqual(family.friends, []);
});

test('recommendations use positive reviews and rotate through relevant activities', () => {
  const state = profile(20, ['music']);
  assert.equal(getSuggestedActivity(state).interest, 'music');
  assert.ok(ACTIVITIES.includes(getSuggestedActivity(createState())));
  assert.ok(ACTIVITIES.includes(getSuggestedActivity(profile(20, ['music', 'gardening']), 'margaret')));
  const positive = session(state);
  assert.ok(getRecommendedGroups(positive).some(group => group.interest === 'gardening' && group.reason.includes('enjoyed')));
  assert.ok(!getRecommendedGroups(session(state, 's', { rating: 2 })).some(group => group.interest === 'gardening'));
  const multiple = profile(20, ['gardening', 'music']);
  const playedGardenQuiz = session(multiple);
  const next = getSuggestedActivity(playedGardenQuiz);
  assert.ok(['gardening', 'music'].includes(next.interest));
  assert.notEqual(next.id, 'garden-quiz');
});

test('joining is idempotent and redemption preserves balance with unique demo codes', () => {
  const state = freeze(profile());
  const joined = joinGroup(state, GROUPS[0].id);
  assert.deepEqual(state.joinedGroups, []);
  assert.equal(joinGroup(joined, GROUPS[0].id), joined);
  assert.throws(() => joinGroup(state, 'bad'));
  assert.throws(() => joinGroup(createState(), GROUPS[0].id));
  assert.throws(() => redeemReward(state, REWARDS[0].id), /more points/);
  assert.throws(() => redeemReward(state, 'bad'), /available/);
  const earned = ['a', 'b', 'c', 'd'].reduce((s, id) => session(s, id), state);
  const first = redeemReward(freeze(earned), 'tea');
  const second = redeemReward(freeze(first), 'tea');
  assert.equal(earned.points, 120);
  assert.equal(first.points, 60);
  assert.equal(second.points, 0);
  assert.notEqual(first.redemptions[0].code, second.redemptions[1].code);
  assert.ok(second.redemptions.every(voucher => voucher.code.startsWith('DEMO-')));
  assert.throws(() => redeemReward(second, 'tea'));
});

test('saved state round-trips complete history and survives profile changes', () => {
  let state = session(profile(), 'a', { personId: 'margaret', addFriend: true });
  state = redeemReward(session(joinGroup(state, 'garden-club'), 'b'), 'tea');
  state = setProfile(state, { name: 'Alex', age: 11, interests: ['games'] });
  const target = storage();
  assert.equal(saveState(state, target), true);
  assert.deepEqual(loadState(target), state);
  const restored = loadState(target);
  restored.profile.interests.push('music');
  assert.deepEqual(loadState(target).profile.interests, ['games']);
  assert.deepEqual(loadState(storage()), createState());
});

test('malformed, inconsistent, and unsupported persisted data resets safely', () => {
  const valid = session(profile());
  for (const value of [null, [], {}, { ...valid, version: 3 }, { ...valid, profile: { ...valid.profile, age: '20' } }, { ...valid, points: -1 }, { ...valid, points: 999 }, { ...valid, friends: ['unknown'] }, { ...valid, joinedGroups: ['unknown'] }, { ...valid, reviews: [] }, { ...valid, completedSessions: ['session-1', 'session-1'] }, { ...valid, reviews: [{ ...valid.reviews[0], rating: 6 }] }, { ...valid, reviews: [{ ...valid.reviews[0], interest: 'music' }] }, { ...valid, redemptions: [{ id: 'voucher-1', rewardId: 'tea', cost: 0, code: 'fake' }] }]) {
    assert.deepEqual(loadState(storage(JSON.stringify(value))), createState());
  }
  assert.deepEqual(loadState(storage('{broken')), createState());
  assert.equal(saveState({ ...valid, points: -1 }, storage()), false);
  const unavailable = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Full'); } };
  assert.deepEqual(loadState(unavailable), createState());
  assert.equal(saveState(valid, unavailable), false);
  assert.deepEqual(loadState(null), createState());
  assert.equal(saveState(valid, null), false);
});

test('all sample data references are valid and quiz answers exist', () => {
  const ids = new Set(INTERESTS.map(interest => interest.id));
  PEOPLE.forEach(person => person.interests.forEach(interest => assert.ok(ids.has(interest))));
  GROUPS.forEach(group => assert.ok(ids.has(group.interest)));
  ACTIVITIES.forEach(activity => {
    assert.ok(ids.has(activity.interest));
    assert.ok(activity.prompts.length > 0);
    if (activity.kind === 'quiz') activity.questions.forEach(question => assert.ok(question.answers[question.correct]));
  });
});

const together = (activityId = 'garden-quiz', id = 'together-1') => ({ ...createTogetherSession({ id, activityId, names: [' Alex ', 'Pat'] }), started: true });
const finishTogether = (activityId = 'garden-quiz', id = 'together-1') => {
  let current = together(activityId, id);
  while (!current.finished) {
    if (current.activity.kind === 'quiz') {
      current = answerTogetherQuestion(current, current.activity.questions[current.step].correct);
      current = answerTogetherQuestion(current, (current.activity.questions[current.step].correct + 1) % current.activity.questions[current.step].answers.length);
    }
    current = advanceTogetherSession(current);
  }
  return current;
};
const bothReviews = [{ rating: 5, note: ' Great together! ' }, { rating: 2, note: 'Try music next.' }];

test('together session needs exactly two distinct trimmed nicknames and a valid activity', () => {
  const created = createTogetherSession({ id: 'new', activityId: 'garden-quiz', names: [' Alex ', ' Pat '] });
  assert.deepEqual(created.participants, [{ name: 'Alex' }, { name: 'Pat' }]);
  assert.equal(created.mode, 'in-person');
  assert.equal(created.personId, null);
  assert.equal(created.started, false);
  assert.equal(created.finished, false);
  assert.deepEqual(created.answers, [[], []]);
  for (const names of [[], ['Alex'], ['Alex', 'Pat', 'Nia'], ['Alex', ' alex '], ['', 'Pat'], ['Alex', 'x'.repeat(41)], [null, 'Pat']]) {
    assert.throws(() => createTogetherSession({ id: 'new', activityId: 'garden-quiz', names }));
  }
  assert.throws(() => createTogetherSession({ id: '', activityId: 'garden-quiz', names: ['Alex', 'Pat'] }));
  assert.throws(() => createTogetherSession({ id: 'new', activityId: 'missing', names: ['Alex', 'Pat'] }));
  assert.throws(() => answerTogetherQuestion(created, 0), /Start/);
  assert.throws(() => advanceTogetherSession(created), /Start/);
});

test('quiz answers remain unrevealed until both participants answer and advancement is gated', () => {
  const initial = freeze(together());
  assert.throws(() => advanceTogetherSession(initial), /Both participants/);
  for (const index of [-1, 3, 0.5, '1', undefined]) assert.throws(() => answerTogetherQuestion(initial, index), /listed answers/);
  const first = answerTogetherQuestion(initial, 1);
  assert.deepEqual(initial.answers, [[], []]);
  assert.equal(first.turn, 1);
  assert.equal(first.revealed, false);
  assert.deepEqual(first.answers, [[1], []]);
  assert.throws(() => advanceTogetherSession(first), /Both participants/);
  const second = answerTogetherQuestion(freeze(first), 0);
  assert.equal(second.turn, 1);
  assert.equal(second.revealed, true);
  assert.deepEqual(second.answers, [[1], [0]]);
  assert.throws(() => answerTogetherQuestion(second, 2), /already saved/);
  const next = advanceTogetherSession(freeze(second));
  assert.equal(next.step, 1);
  assert.equal(next.turn, 0);
  assert.equal(next.revealed, false);
  assert.equal(next.finished, false);
  assert.throws(() => answerTogetherQuestion({ ...next, turn: 1 }, 0), /in turn/);
  const finished = finishTogether();
  assert.equal(finished.step, finished.activity.questions.length - 1);
  assert.equal(finished.finished, true);
  assert.throws(() => answerTogetherQuestion(finished, 0), /unfinished/);
  assert.throws(() => advanceTogetherSession(finished), /unfinished/);
});

test('conversation gives both participants a turn on every prompt before finishing', () => {
  let current = together('family-recipes');
  assert.throws(() => answerTogetherQuestion(current, 0), /conversation/);
  const count = current.activity.prompts.length;
  for (let step = 0; step < count; step += 1) {
    assert.equal(current.step, step);
    assert.equal(current.turn, 0);
    const first = advanceTogetherSession(freeze(current));
    assert.equal(first.step, step);
    assert.equal(first.turn, 1);
    assert.equal(first.finished, false);
    current = advanceTogetherSession(freeze(first));
    assert.equal(current.finished, step === count - 1);
  }
  const state = completeTogetherSession(createState(), current, bothReviews);
  assert.deepEqual(state.reviews[0].participants.map(participant => participant.score), [null, null]);
});

test('together completion rejects unfinished activities, missing answers, and invalid reviews', () => {
  assert.throws(() => completeTogetherSession(createState(), together(), bothReviews), /finish/);
  const finished = freeze(finishTogether());
  assert.throws(() => completeTogetherSession(createState(), { ...finished, answers: [[], []] }, bothReviews), /in turn/);
  assert.throws(() => completeTogetherSession(createState(), { ...finished, answers: [new Array(3), new Array(3)] }, bothReviews), /answers/);
  assert.throws(() => completeTogetherSession(createState(), { ...finished, started: false }, bothReviews), /Start/);
  for (const reviews of [[], [bothReviews[0]], [bothReviews[0], {}], [{}, bothReviews[1]], [bothReviews[0], { rating: 0 }], [bothReviews[0], { rating: 6 }], [bothReviews[0], { rating: '4' }], [bothReviews[0], { rating: 4, note: 'x'.repeat(501) }], [bothReviews[0], null]]) {
    assert.throws(() => completeTogetherSession(createState(), finished, reviews));
  }
});

test('together completion saves independent ratings and quiz scores, with one device award', () => {
  const initial = freeze(createState());
  const finished = freeze(finishTogether());
  const state = completeTogetherSession(initial, finished, bothReviews);
  assert.equal(initial.points, 0);
  assert.equal(initial.reviews.length, 0);
  assert.equal(state.profile, null);
  assert.equal(state.points, 30);
  assert.deepEqual(state.completedSessions, ['together-1']);
  assert.equal(state.reviews.length, 1);
  const review = state.reviews[0];
  assert.equal(review.mode, 'in-person');
  assert.equal(review.personId, null);
  assert.equal(review.rating, 4);
  assert.equal(review.note, '');
  assert.deepEqual(review.participants, [
    { name: 'Alex', rating: 5, note: 'Great together!', score: ACTIVITIES.find(activity => activity.id === 'garden-quiz').questions.length },
    { name: 'Pat', rating: 2, note: 'Try music next.', score: 0 },
  ]);
  assert.equal(completeTogetherSession(state, finished, bothReviews), state);
  assert.equal(completeSession(state, { id: finished.id }), state);
  assert.deepEqual(state.friends, []);
});

test('together participants can skip a quiz question or a shared conversation prompt', () => {
  let quiz = together();
  quiz = answerTogetherQuestion(quiz, quiz.activity.questions[0].correct);
  quiz = skipTogetherStep(quiz);
  assert.equal(quiz.revealed, true);
  assert.deepEqual(quiz.answers.map(answers => answers[0]), [null, null]);
  quiz = advanceTogetherSession(quiz);
  assert.equal(quiz.step, 1);
  while (!quiz.finished) {
    quiz = skipTogetherStep(quiz);
    if (!quiz.finished) quiz = advanceTogetherSession(quiz);
  }
  const completedQuiz = completeTogetherSession(createState(), quiz, bothReviews);
  assert.deepEqual(completedQuiz.reviews[0].participants.map(participant => participant.score), [0, 0]);

  let conversation = together('family-recipes');
  conversation = skipTogetherStep(conversation);
  assert.equal(conversation.step, 1);
  while (!conversation.finished) conversation = skipTogetherStep(conversation);
  assert.equal(completeTogetherSession(createState(), conversation, bothReviews).points, 30);
});

test('together recommendations consider either participant independently', () => {
  const state = completeTogetherSession(createState(), finishTogether(), [{ rating: 1 }, { rating: 4 }]);
  assert.equal(state.reviews[0].rating, 3);
  assert.ok(getRecommendedGroups(state).some(group => group.interest === 'gardening'));
  const low = completeTogetherSession(createState(), finishTogether(), [{ rating: 2 }, { rating: 3 }]);
  assert.deepEqual(getRecommendedGroups(low), []);
});

test('together histories and redeemed rewards persist without a profile; old data stays compatible', () => {
  let state = completeTogetherSession(createState(), finishTogether(), bothReviews);
  state = completeTogetherSession(state, finishTogether('family-recipes', 'together-2'), [{ rating: 3 }, { rating: 4 }]);
  state = redeemReward(state, 'tea');
  const target = storage();
  assert.equal(saveState(state, target), true);
  assert.deepEqual(loadState(target), state);
  const withProfile = setProfile(loadState(target), { name: 'Alex', age: 19, interests: ['music'] });
  assert.deepEqual(withProfile.reviews, state.reviews);
  assert.deepEqual(withProfile.redemptions, state.redemptions);
  assert.equal(withProfile.points, 0);
  assert.equal(saveState(withProfile, target), true);
  assert.deepEqual(loadState(target), withProfile);
  const old = session(profile());
  assert.equal(saveState(old, target), true);
  assert.deepEqual(loadState(target), old);
  const legacy = { ...old, version: 1 };
  delete legacy.petJourney;
  const migrated = loadState(storage(JSON.stringify(legacy)));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.petJourney, { fedDates: [], weeks: [] });
  assert.deepEqual(migrated.reviews, old.reviews);
  assert.equal(saveState(legacy, target), true);
  assert.equal(loadState(target).version, 2);
  const mixed = completeTogetherSession(old, finishTogether(), bothReviews);
  assert.equal(saveState(mixed, target), true);
  assert.deepEqual(loadState(target), mixed);
  assert.equal(saveState({ ...old, profile: null }, target), false);
});

test('malformed persisted together ratings, scores, names, and account relationships are rejected', () => {
  const state = completeTogetherSession(createState(), finishTogether(), bothReviews);
  const original = state.reviews[0];
  const quizLength = ACTIVITIES.find(activity => activity.id === 'garden-quiz').questions.length;
  for (const change of [{ mode: 'remote' }, { personId: 'margaret' }, { rating: 1 }, { note: 'Unexpected aggregate note' }, { participants: [] }, { participants: [original.participants[0], { ...original.participants[1], name: 'alex' }] }, { participants: [original.participants[0], { ...original.participants[1], rating: 8 }] }, { participants: [original.participants[0], { ...original.participants[1], score: quizLength + 1 }] }, { participants: [original.participants[0], { ...original.participants[1], score: null }] }]) {
    const malformed = { ...state, reviews: [{ ...original, ...change }] };
    assert.deepEqual(loadState(storage(JSON.stringify(malformed))), createState());
  }
  for (const change of [{ friends: ['margaret'] }, { joinedGroups: ['garden-club'] }]) {
    assert.equal(saveState({ ...state, ...change }, storage()), false);
  }
});

test('activity suggestions choose eligible unplayed content before allowing repeats', () => {
  let state = completeTogetherSession(createState(), finishTogether(), [{ rating: 1 }, { rating: 3 }]);
  state = setProfile(state, { name: 'Alex', age: 20, interests: ['gardening', 'music'] });
  state = session(state, 'music-1', { activityId: 'music-memories', rating: 5 });
  const played = new Set(state.reviews.map(review => review.activityId));
  const next = getSuggestedActivity(state);
  assert.ok(['gardening', 'music'].includes(next.interest));
  assert.ok(!played.has(next.id));
  assert.equal(getSuggestedActivity(state, 'margaret').id, 'garden-walk-talk');
  const noProfileSuggestion = getSuggestedActivity({ ...state, profile: null });
  assert.ok(ACTIVITIES.includes(noProfileSuggestion));
  assert.ok(!played.has(noProfileSuggestion.id));
  state = session(state, 'music-2', { activityId: 'music-memories', rating: 5 });
  const allPlayed = ACTIVITIES.reduce((current, activity, index) => session(current, `played-${index}`, { activityId: activity.id }), state);
  assert.ok(ACTIVITIES.includes(getSuggestedActivity(allPlayed)));
});

test('anonymous shared moments combine with later sample connections and one device reward balance', () => {
  const anonymous = completeTogetherSession(createState(), finishTogether('music-memories'), [{ rating: 1 }, { rating: 4 }]);
  const profiled = setProfile(anonymous, { name: 'Alex', age: 20, interests: ['gardening'] });
  const connected = session(profiled, 'community-1', { personId: 'margaret', addFriend: true });
  const redeemed = redeemReward(connected, 'tea');
  assert.equal(redeemed.points, 0);
  assert.equal(redeemed.reviews.length, 2);
  assert.deepEqual(redeemed.reviews[0], anonymous.reviews[0]);
  assert.deepEqual(redeemed.friends, ['margaret']);
  assert.deepEqual(new Set(getRecommendedGroups(redeemed).map(group => group.interest)), new Set(['gardening', 'music']));
  assert.ok(getMatches(redeemed).every(person => person.sharedInterests.includes('gardening')));
  const target = storage();
  assert.equal(saveState(redeemed, target), true);
  assert.deepEqual(loadState(target), redeemed);
});
