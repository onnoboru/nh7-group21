// Local-only demo data. No accounts, network requests, or real vouchers.
export const STORAGE_KEY = 'kindred.v1';
export const INTERESTS = [
  { id: 'gardening', label: 'Gardening', icon: '🌱' },
  { id: 'cooking', label: 'Cooking', icon: '🥣' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'stories', label: 'Stories', icon: '📖' },
  { id: 'art', label: 'Art & craft', icon: '🎨' },
  { id: 'games', label: 'Games', icon: '🎲' },
];

export const PEOPLE = [
  { id: 'margaret', name: 'Margaret', age: 68, generation: 'senior', interests: ['gardening', 'cooking', 'stories'], bio: 'A balcony gardener with a recipe and a story for every season.', availability: 'Weekend afternoons', color: 'sage', initials: 'M' },
  { id: 'arthur', name: 'Arthur', age: 72, generation: 'senior', interests: ['music', 'games', 'stories'], bio: 'Jazz records, chess puzzles, and stories from a lifetime of travels.', availability: 'Weekday afternoons', color: 'peach', initials: 'A' },
  { id: 'mei', name: 'Mei', age: 65, generation: 'senior', interests: ['art', 'gardening', 'music'], bio: 'Watercolour enthusiast who finds inspiration in small, everyday things.', availability: 'Saturday mornings', color: 'lavender', initials: 'M' },
  { id: 'david', name: 'David', age: 70, generation: 'senior', interests: ['games', 'cooking', 'art'], bio: 'Retired teacher, weekend baker, and enthusiastic board-game player.', availability: 'Sunday afternoons', color: 'butter', initials: 'D' },
  { id: 'ava', name: 'Ava', age: 16, generation: 'young', interests: ['art', 'music', 'stories'], bio: 'Always sketching, making playlists, and looking for a good story.', availability: 'After school', color: 'lavender', initials: 'A' },
  { id: 'leo', name: 'Leo', age: 15, generation: 'young', interests: ['games', 'gardening', 'cooking'], bio: 'Learning to grow herbs and turn them into something delicious.', availability: 'Weekend afternoons', color: 'sage', initials: 'L' },
  { id: 'sam', name: 'Sam', age: 19, generation: 'young', interests: ['music', 'games', 'cooking'], bio: 'Beginner guitarist, puzzle fan, and curious home cook.', availability: 'Weekend mornings', color: 'peach', initials: 'S' },
  { id: 'nia', name: 'Nia', age: 17, generation: 'young', interests: ['gardening', 'art', 'stories'], bio: 'Loves paper crafts, plants, and hearing how things used to be.', availability: 'After school', color: 'butter', initials: 'N' },
];

export const GROUPS = [
  { id: 'garden-club', name: 'Little Green Club', interest: 'gardening', members: 4, description: 'Swap growing tips and celebrate the first new leaf. Sample group.', icon: '🌱', color: 'sage' },
  { id: 'recipe-circle', name: 'The Recipe Exchange', interest: 'cooking', members: 4, description: 'Share the dishes that bring your family together. Sample group.', icon: '🥣', color: 'peach' },
  { id: 'music-room', name: 'The Listening Room', interest: 'music', members: 4, description: 'Discover a favourite song from another generation. Sample group.', icon: '🎵', color: 'lavender' },
  { id: 'story-circle', name: 'Stories Across Time', interest: 'stories', members: 4, description: 'Make space for memories, big ideas, and good questions. Sample group.', icon: '📖', color: 'butter' },
  { id: 'art-table', name: 'The Creative Table', interest: 'art', members: 4, description: 'Draw, make, and find inspiration together. Sample group.', icon: '🎨', color: 'peach' },
  { id: 'game-club', name: 'Playful Minds', interest: 'games', members: 4, description: 'A friendly place for puzzles and playful challenges. Sample group.', icon: '🎲', color: 'sage' },
];

export const REWARDS = [
  { id: 'tea', name: 'A little tea break', description: 'Sample café voucher. Demo only; no cash value or real partner.', cost: 60, icon: '☕' },
  { id: 'seeds', name: 'Something to grow', description: 'Sample seed-pack voucher. Demo only; no cash value or real partner.', cost: 90, icon: '🌱' },
  { id: 'book', name: 'Your next chapter', description: 'Sample bookshop voucher. Demo only; no cash value or real partner.', cost: 120, icon: '📚' },
];

export const ACTIVITIES = [
  {
    id: 'garden-quiz', title: 'A little green knowledge', interest: 'gardening', kind: 'quiz', description: 'Discover a few growing secrets, one friendly question at a time.', duration: '5 min', icon: '🌱',
    prompts: ['What would you love to grow together in Singapore’s warm, tropical weather?'],
    questions: [
      { question: 'Which orchid was chosen as Singapore’s National Flower?', answers: ['Vanda Miss Joaquim', 'The moon orchid', 'The golden shower orchid'], correct: 0, explanation: 'Vanda Miss Joaquim was selected in 1981. Do either of you remember seeing it in a garden?' },
      { question: 'At Gardens by the Bay, what are the Supertrees?', answers: ['Vertical gardens', 'Real trees that grow fruit', 'Water towers'], correct: 0, explanation: 'They are vertical gardens displaying plants such as ferns and orchids. Which Singapore garden would you like to visit together?' },
      { question: 'Which fragrant leaf is used in pandan cakes and some rice dishes?', answers: ['Pandan', 'Mint', 'Basil'], correct: 0, explanation: 'Pandan leaves add fragrance to desserts and rice dishes, and pandan grows well in Singapore.' },
      { question: 'Which part of a plant usually takes in water from the soil?', answers: ['Roots', 'Petals', 'Fruit'], correct: 0, explanation: 'Roots take up water and help hold a plant in place. What plants can you spot near home?' },
      { question: 'Which plant part often grows into a fruit after flowering?', answers: ['The flower', 'The root', 'The stem'], correct: 0, explanation: 'In many plants, fruit develops from a flower after pollination. Have you ever grown a fruit or vegetable?' },
    ],
  },
  { id: 'family-recipes', title: 'A recipe worth sharing', interest: 'cooking', kind: 'conversation', description: 'Explore the memories and little rituals behind a favourite meal.', duration: '8 min', icon: '🥣', prompts: ['What meal reminds you of home, and why?', 'Which hawker dish would you introduce to someone visiting Singapore?', 'Who taught you something useful in the kitchen?', 'If we cooked a meal together, what would each of us make?', 'What smell from a kitchen brings back a happy memory?', 'Which local fruit would you bring to a family picnic?', 'What is a small cooking job you could teach each other?'] },
  { id: 'music-memories', title: 'The soundtrack of our lives', interest: 'music', kind: 'conversation', description: 'Find the songs, sounds, and memories that connect you.', duration: '8 min', icon: '🎵', prompts: ['Which song always makes you smile?', 'What music did you hear most often growing up?', 'If you could learn one instrument, which would it be?', 'Describe a song you would put on a shared playlist.', 'What sound reminds you of home?', 'Which song would you choose for a family celebration?', 'Have you heard music in another language that you enjoyed?'] },
  { id: 'small-stories', title: 'Then, now, and someday', interest: 'stories', kind: 'conversation', description: 'Trade small stories about the world you know and the one you imagine.', duration: '10 min', icon: '📖', prompts: ['What was a favourite game you played when you were younger?', 'What was your Singapore neighbourhood like when you were young?', 'What is something someone from another generation has taught you?', 'What is a small adventure you would like to have next?', 'What was your favourite place to visit as a child?', 'What has changed in Singapore that surprised you most?', 'What skill would you like to learn from each other?'] },
  { id: 'creative-colours', title: 'See the world in colour', interest: 'art', kind: 'conversation', description: 'A simple creative conversation. Paper and pencils are optional.', duration: '8 min', icon: '🎨', prompts: ['Choose a colour that fits your mood. What does it remind you of?', 'Find an everyday object nearby. What makes its shape interesting?', 'Describe or draw a place you would both enjoy visiting.', 'What would you like to learn to make with your hands?', 'What pattern have you seen in a Singapore building or garden?', 'If you made a card for someone, what would you draw?', 'What is the most beautiful thing you noticed this week?'] },
  {
    id: 'playful-puzzles', title: 'Great minds play together', interest: 'games', kind: 'quiz', description: 'Team up for lighthearted brain teasers.', duration: '6 min', icon: '🎲',
    prompts: ['What Singapore place would you like to explore together?'],
    questions: [
      { question: 'How many stars are on Singapore’s flag?', answers: ['Three', 'Five', 'Seven'], correct: 1, explanation: 'The five stars represent democracy, peace, progress, justice, and equality. Which of these values feels most meaningful to you?' },
      { question: 'Which of these is a familiar dish at Singapore hawker centres?', answers: ['Chicken rice', 'Fish and chips', 'Tacos'], correct: 0, explanation: 'Chicken rice is one of Singapore’s well-known hawker dishes. What is your favourite stall or version?' },
      { question: 'Hawker culture was added to UNESCO’s Intangible Cultural Heritage list in which year?', answers: ['2015', '2020', '2024'], correct: 1, explanation: 'Singapore’s hawker culture was inscribed in 2020. Hawker centres are also places where people meet, eat, and spend time together.' },
      { question: 'A plate has 6 pieces of toast. You share 2. How many pieces are left?', answers: ['3', '4', '5'], correct: 1, explanation: 'Six take away two leaves four. What would you enjoy sharing with someone?' },
      { question: 'What number comes next: 2, 4, 6, ...?', answers: ['7', '8', '10'], correct: 1, explanation: 'The numbers go up by two, so eight comes next. Can you make a number pattern together?' },
      { question: 'Which one does not belong with the others?', answers: ['Cup', 'Bowl', 'Bicycle'], correct: 2, explanation: 'A bicycle is a way to travel; a cup and bowl are things used for food or drink. What other groups can you think of?' },
    ],
  },
  { id: 'random-talk', title: 'A question out of the hat', interest: 'stories', kind: 'random', description: 'Pick a surprise prompt and follow wherever the conversation goes.', duration: '5 min', icon: '🎁', prompts: ['What tiny thing can instantly improve your day?', 'What would you teach someone in five minutes?', 'Which place would you revisit for one afternoon?', 'What is a funny thing you believed as a child?', 'What would your perfect slow day include?', 'Which everyday invention deserves more appreciation?', 'What is something in Singapore you would like to show a visitor?', 'What kind thing did someone do for you recently?', 'If you had a free afternoon together, what would you do?'] },
  { id: 'would-you-rather', title: 'Pick a side', interest: 'games', kind: 'choice', description: 'Choose between two playful options, then trade your reasons.', duration: '5 min', icon: '↔️', prompts: ['Would you rather spend an afternoon at Gardens by the Bay or Singapore Botanic Gardens?', 'Would you rather try a new hawker dish or revisit a favourite one?', 'Would you rather explore a nature park or discover a neighbourhood you have never visited?', 'Would you rather revisit one day from the past or peek at one day in the future?', 'Would you rather learn a family recipe or teach someone a game?', 'Would you rather take the MRT to a new place or walk around your neighbourhood?', 'Would you rather have a picnic by the sea or in a garden?'] },
  { id: 'story-stitch', title: 'One story, two imaginations', interest: 'stories', kind: 'collaborative', description: 'Take turns adding a sentence and build a story together.', duration: '8 min', icon: '🧵', prompts: ['Choose a hero and give them an unusual object.', 'Add a surprising place where the hero arrives.', 'Introduce a kind helper or a funny obstacle.', 'Decide how the adventure ends together.', 'Give the hero a neighbour who knows a useful secret.', 'Add a Singapore rain shower and decide what the hero does.', 'Invent a local snack that gives the hero a special power.'] },
  { id: 'then-and-now', title: 'Then & now', interest: 'music', kind: 'reflection', description: 'Compare the little things that have changed—and what still feels the same.', duration: '8 min', icon: '⌛', prompts: ['What song or sound takes you back to a particular time?', 'How has the way people keep in touch changed?', 'What is one thing that has stayed wonderful across generations?', 'What new tradition would you like to start together?', 'What did a typical weekend look like when you were young?', 'Which old and new ways of getting around do you both like?', 'What do you hope will never change about your family?'] },
  { id: 'singapore-quiz', title: 'Singapore, together', interest: 'stories', kind: 'quiz', description: 'Explore familiar places, food, and nature around Singapore.', duration: '8 min', icon: '🇸🇬', prompts: ['Which Singapore place would you like to visit together?'], questions: [
    { question: 'Which island is home to the Singapore Zoo?', answers: ['Sentosa', 'Pulau Ubin', 'Singapore mainland'], correct: 2, explanation: 'The Singapore Zoo is in Mandai, on the mainland. Have either of you visited?' },
    { question: 'What is a common name for Singapore’s national language, Malay, in everyday conversation?', answers: ['Bahasa Melayu', 'Tamil', 'Hokkien'], correct: 0, explanation: 'Malay is one of Singapore’s four official languages. What languages do you hear in your neighbourhood?' },
    { question: 'Which local tree is known for its bright red flowers?', answers: ['Rain tree', 'Flame of the Forest', 'Pandan tree'], correct: 1, explanation: 'The Flame of the Forest has striking red-orange flowers. Have you seen one in bloom?' },
    { question: 'What can you find at a wet market?', answers: ['Fresh produce and food', 'Only books', 'Train tickets'], correct: 0, explanation: 'Wet markets sell fresh produce, meat, seafood, and more. Which market do you remember visiting?' },
    { question: 'Which four languages are official languages of Singapore?', answers: ['English, Malay, Mandarin, and Tamil', 'English, Malay, Hokkien, and Japanese', 'Malay, Tamil, Cantonese, and French'], correct: 0, explanation: 'Singapore has four official languages: English, Malay, Mandarin, and Tamil. Which languages do you use with family or friends?' },
    { question: 'Which Singapore symbol has a lion’s head and a fish’s body?', answers: ['The Merlion', 'The Singapore Flyer', 'The Supertree'], correct: 0, explanation: 'The Merlion combines a lion’s head and a fish’s body. What symbol would you choose to represent Singapore?' },
    { question: 'What is a popular way to explore the village paths on Pulau Ubin?', answers: ['By bicycle', 'By cable car', 'By underground train'], correct: 0, explanation: 'Visitors often explore Pulau Ubin by bicycle or on foot. Which part of the island would you like to see?' },
  ] },
  { id: 'garden-walk-talk', title: 'A walk through Singapore', interest: 'gardening', kind: 'conversation', description: 'Share favourite green spaces and small discoveries in nature.', duration: '8 min', icon: '🌳', prompts: ['Which park or garden would you show a visitor first?', 'What bird or butterfly have you noticed nearby?', 'Would you rather walk by the sea or under shady trees?', 'What plant reminds you of someone in your family?', 'Which Singapore garden would you like to explore next?', 'What is a peaceful place you enjoy returning to?'] },
  { id: 'hawker-choices', title: 'Hawker favourites', interest: 'cooking', kind: 'choice', description: 'Pick a favourite and trade the stories behind it.', duration: '6 min', icon: '🍜', prompts: ['Would you choose kaya toast or roti prata for breakfast?', 'Would you share chicken rice or laksa with a visitor?', 'Would you try a new stall or return to your favourite?', 'Would you pick iced kopi or teh tarik on a warm day?', 'Would you rather order one big dish to share or several small bites?'] },
  { id: 'neighbourhood-story', title: 'Neighbourhood story makers', interest: 'stories', kind: 'collaborative', description: 'Imagine a friendly adventure set in a Singapore neighbourhood.', duration: '8 min', icon: '🏘️', prompts: ['Choose a character who knows every corner of the neighbourhood.', 'Set the story at a familiar market or hawker centre.', 'Add a sudden tropical rain shower.', 'Introduce a neighbour with a surprising talent.', 'Find a clue near a playground or community garden.', 'End the adventure with a shared meal.'] },
];

const interestIds = new Set(INTERESTS.map(item => item.id));
const personIds = new Set(PEOPLE.map(item => item.id));
const groupIds = new Set(GROUPS.map(item => item.id));
const activityById = new Map(ACTIVITIES.map(item => [item.id, item]));
const rewardById = new Map(REWARDS.map(item => [item.id, item]));
const label = id => INTERESTS.find(item => item.id === id)?.label ?? id;
const fail = message => { throw new Error(message); };
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value, max, min = 0) => typeof value === 'string' && value.length >= min && value.length <= max;
const unique = values => new Set(values).size === values.length;

export function createState() {
  return { version: 1, profile: null, points: 0, reviews: [], friends: [], joinedGroups: [], redemptions: [], completedSessions: [] };
}

function cleanProfile(value) {
  if (!isObject(value)) fail('Please create your profile first.');
  if (!isText(value.name, 200) || !value.name.trim() || value.name.trim().length > 40) fail('Please enter a name between 1 and 40 characters.');
  if (!Number.isInteger(value.age) || value.age < 6 || value.age > 110) fail('Please enter a whole-number age between 6 and 110.');
  if (!Array.isArray(value.interests) || !value.interests.length || value.interests.length > INTERESTS.length || value.interests.some(id => !interestIds.has(id))) fail('Please choose at least one of the listed interests.');
  if (value.guardianConsent !== undefined && typeof value.guardianConsent !== 'boolean') fail('Please choose a valid guardian involvement option.');
  return { name: value.name.trim(), age: value.age, interests: [...new Set(value.interests)], guardianConsent: value.guardianConsent === true };
}

export function setProfile(state, profile) {
  return { ...state, profile: cleanProfile(profile) };
}

export function getMode(profile) {
  if (!profile || profile.age < 12 || (profile.age < 18 && profile.guardianConsent !== true)) return 'family';
  return 'community';
}

export function getMatches(state) {
  if (!state.profile || getMode(state.profile) === 'family') return [];
  const generation = state.profile.age < 60 ? 'senior' : 'young';
  return PEOPLE.filter(person => person.generation === generation).map(person => {
    const sharedInterests = person.interests.filter(id => state.profile.interests.includes(id));
    return { ...person, interests: [...person.interests], sharedInterests, score: sharedInterests.length, reason: `You both enjoy ${sharedInterests.map(label).join(' and ')}.` };
  }).filter(person => person.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function getRecommendedGroups(state) {
  const enjoyed = new Set(state.reviews.filter(review => review.mode === 'in-person'
    ? review.participants.some(participant => participant.rating >= 4)
    : review.rating >= 4).map(review => review.interest));
  const interests = new Set(state.profile?.interests ?? []);
  return GROUPS.filter(group => interests.has(group.interest) || enjoyed.has(group.interest)).map(group => ({
    ...group,
    reason: enjoyed.has(group.interest) ? `You enjoyed a ${label(group.interest).toLowerCase()} activity.` : `Based on your interest in ${label(group.interest).toLowerCase()}.`,
  })).sort((a, b) => Number(enjoyed.has(b.interest)) - Number(enjoyed.has(a.interest)));
}

export function getSuggestedActivity(state, personId) {
  const person = PEOPLE.find(item => item.id === personId);
  const interests = state.profile?.interests ?? [];
  const shared = person ? interests.filter(id => person.interests.includes(id)) : interests;
  const options = ACTIVITIES.filter(activity => shared.includes(activity.interest));
  const played = new Set(state.reviews.map(review => review.activityId));
  const preferred = options.length ? options : ACTIVITIES;
  const unplayedPreferred = preferred.filter(activity => !played.has(activity.id));
  const unplayed = ACTIVITIES.filter(activity => !played.has(activity.id));
  const pool = unplayedPreferred.length ? unplayedPreferred : unplayed.length ? unplayed : preferred;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getDailyTheme(state, date = new Date()) {
  const key = getDateKey(date);
  const [year, month, day] = key.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  return ACTIVITIES[dayNumber % ACTIVITIES.length];
}

export function getJourneyStats(state, date = new Date()) {
  const today = getDateKey(date);
  const dates = [...new Set(state.reviews.map(review => review.dailyThemeDate).filter(Boolean))].sort();
  const dayMs = 86400000;
  const dayNumber = key => Math.floor(Date.UTC(...key.split('-').map((part, index) => Number(part) - (index === 1 ? 1 : 0))) / dayMs);
  const completed = new Set(dates.map(dayNumber));
  const todayNumber = dayNumber(today);
  let anchor = completed.has(todayNumber) ? todayNumber : completed.has(todayNumber - 1) ? todayNumber - 1 : null;
  let currentStreak = 0;
  if (anchor !== null) while (completed.has(anchor - currentStreak)) currentStreak++;
  let longestStreak = 0;
  let run = 0;
  let previous = null;
  for (const number of [...completed].sort((a, b) => a - b)) {
    run = previous !== null && number === previous + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = number;
  }
  return { currentStreak, longestStreak, totalDurationMs: state.reviews.filter(review => review.mode === 'in-person').reduce((total, review) => total + (review.durationMs || 0), 0), completedThemeToday: completed.has(todayNumber), activeDays: dates.length };
}

function sessionMetadata(session) {
  const result = {};
  if (Number.isSafeInteger(session.completedAt) && session.completedAt >= 0) result.completedAt = session.completedAt;
  if (Number.isSafeInteger(session.durationMs) && session.durationMs >= 0 && session.durationMs <= 43200000) result.durationMs = session.durationMs;
  if (typeof session.dailyThemeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(session.dailyThemeDate)) result.dailyThemeDate = session.dailyThemeDate;
  return result;
}

export function completeSession(state, session) {
  if (!isObject(session) || !isText(session.id, 120, 1) || !session.id.trim()) fail('This session needs a valid identifier.');
  if (state.completedSessions.includes(session.id)) return state;
  if (!state.profile) fail('Please create your profile before starting an activity.');
  const { id, activityId, rating, addFriend = false } = session;
  const personId = session.personId ?? null;
  const note = session.note ?? '';
  const activity = activityById.get(activityId);
  if (!activity) fail('Please choose an available activity.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail('Please choose a rating from 1 to 5.');
  if (!isText(note, 500)) fail('Please keep your review to 500 characters.');
  if (typeof addFriend !== 'boolean') fail('Please choose a valid friendship option.');
  if (personId !== null && !personIds.has(personId)) fail('Please choose an available sample profile.');
  if (personId !== null && getMode(state.profile) === 'family') fail('Family activities take place with someone you know, without community matching.');
  if (personId !== null && !getMatches(state).some(person => person.id === personId)) fail('Please choose a sample profile with a shared interest from another generation.');
  if (addFriend && personId === null) fail('A community session is required to add a sample friend.');
  const review = { id, sessionId: id, personId, activityId, interest: activity.interest, rating, note: note.trim(), ...sessionMetadata(session) };
  return {
    ...state,
    points: state.points + 30,
    reviews: [...state.reviews, review],
    completedSessions: [...state.completedSessions, id],
    friends: addFriend && !state.friends.includes(personId) ? [...state.friends, personId] : [...state.friends],
  };
}

function cleanTogetherNames(names) {
  if (!Array.isArray(names) || names.length !== 2) fail('Please enter a nickname for each of the two participants.');
  const result = Array.from(names, name => {
    if (!isText(name, 200) || !name.trim() || name.trim().length > 40) fail('Each nickname must contain between 1 and 40 characters.');
    return name.trim();
  });
  if (result[0].toLowerCase() === result[1].toLowerCase()) fail('Please use different nicknames so you can tell whose turn it is.');
  return result;
}

export function createTogetherSession(options) {
  if (!isObject(options) || !isText(options.id, 120, 1) || !options.id.trim()) fail('This session needs a valid identifier.');
  const activity = activityById.get(options.activityId);
  if (!activity) fail('Please choose an available activity.');
  const names = cleanTogetherNames(options.names);
  return {
    id: options.id, activity, personId: null, mode: 'in-person',
    participants: names.map(name => ({ name })), step: 0, turn: 0,
    answers: [[], []], revealed: false, started: false, finished: false,
    startedAt: Number.isSafeInteger(options.startedAt) ? options.startedAt : null,
    dailyThemeDate: options.dailyThemeDate || null,
  };
}

// Check progression against the original activity, including every earlier answer.
// This prevents a partially completed quiz from being submitted as a finished one.
function checkTogetherSession(session) {
  if (!isObject(session) || !isText(session.id, 120, 1) || !session.id.trim() || session.mode !== 'in-person' || session.personId !== null) fail('Please start a valid together session.');
  const activity = activityById.get(session.activity?.id);
  if (!activity) fail('Please choose an available activity.');
  if (!Array.isArray(session.participants) || session.participants.some(participant => !isObject(participant))) fail('This session needs two participants.');
  cleanTogetherNames(session.participants.map(participant => participant.name));
  if (typeof session.started !== 'boolean' || typeof session.finished !== 'boolean' || typeof session.revealed !== 'boolean' || ![0, 1].includes(session.turn)) fail('Invalid activity progress.');
  const count = activity.kind === 'quiz' ? activity.questions.length : activity.prompts.length;
  if (!Number.isInteger(session.step) || session.step < 0 || session.step >= count) fail('Invalid activity progress.');
  if (!Array.isArray(session.answers) || session.answers.length !== 2 || session.answers.some(answers => !Array.isArray(answers))) fail('Invalid activity answers.');
  if (activity.kind === 'quiz') {
    session.answers.forEach(answers => Array.from(answers).forEach((answer, index) => {
      if (!activity.questions[index] || (answer !== null && (!Number.isInteger(answer) || answer < 0 || answer >= activity.questions[index].answers.length))) fail('Invalid activity answers.');
    }));
    const lengths = session.revealed ? [session.step + 1, session.step + 1]
      : session.turn === 0 ? [session.step, session.step] : [session.step + 1, session.step];
    if (session.answers.some((answers, index) => answers.length !== lengths[index]) || (session.revealed && session.turn !== 1)) fail('Both participants must answer in turn.');
    if (session.revealed && ((session.answers[0][session.step] === null) !== (session.answers[1][session.step] === null))) fail('A skipped question must be skipped by both participants.');
    if (session.finished && (session.step !== count - 1 || !session.revealed)) fail('Finish every question before reviewing the activity.');
  } else {
    if (session.answers.some(answers => answers.length) || session.revealed) fail('Invalid conversation progress.');
    if (session.finished && (session.step !== count - 1 || session.turn !== 1)) fail('Both participants must finish every prompt before reviewing.');
  }
  if (!session.started && (session.step !== 0 || session.turn !== 0 || session.revealed || session.finished)) fail('Start the activity before continuing.');
  return activity;
}

export function answerTogetherQuestion(session, index) {
  const activity = checkTogetherSession(session);
  if (!session.started || session.finished) fail('Start an unfinished activity before answering.');
  if (activity.kind !== 'quiz') fail('This activity uses conversation prompts, not quiz answers.');
  if (session.revealed) fail('Both answers are already saved. Continue to the next question.');
  if (!Number.isInteger(index) || index < 0 || index >= activity.questions[session.step].answers.length) fail('Please choose one of the listed answers.');
  const answers = session.answers.map(items => [...items]);
  answers[session.turn].push(index);
  return { ...session, activity, answers, turn: 1, revealed: session.turn === 1 };
}

export function advanceTogetherSession(session) {
  const activity = checkTogetherSession(session);
  if (!session.started || session.finished) fail('Start an unfinished activity before continuing.');
  if (activity.kind === 'quiz' && !session.revealed) fail('Both participants need to answer before continuing.');
  if (activity.kind !== 'quiz' && session.turn === 0) return { ...session, activity, turn: 1 };
  const count = activity.kind === 'quiz' ? activity.questions.length : activity.prompts.length;
  if (session.step === count - 1) return { ...session, activity, finished: true };
  return { ...session, activity, step: session.step + 1, turn: 0, revealed: false };
}

export function skipTogetherStep(session) {
  const activity = checkTogetherSession(session);
  if (!session.started || session.finished) fail('Start an unfinished activity before continuing.');
  if (activity.kind === 'quiz') {
    if (session.revealed) fail('This question has already been answered. Continue to the next question.');
    const answers = session.answers.map(items => [...items]);
    answers[0][session.step] = null;
    answers[1][session.step] = null;
    return { ...session, activity, answers, turn: 1, revealed: true };
  }
  const count = activity.prompts.length;
  if (session.step === count - 1) return { ...session, activity, turn: 1, finished: true };
  return { ...session, activity, step: session.step + 1, turn: 0, revealed: false };
}

function cleanTogetherReviews(reviews) {
  if (!Array.isArray(reviews) || reviews.length !== 2) fail('Please collect a review from both participants.');
  return Array.from(reviews, review => {
    if (!isObject(review) || (review.rating !== null && (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5))) fail('Each participant needs to choose a rating from 1 to 5.');
    const note = review.note ?? '';
    if (!isText(note, 500)) fail('Please keep each review to 500 characters.');
    return { rating: review.rating, note: note.trim() };
  });
}

export function completeTogetherSession(state, session, reviews = null) {
  const activity = checkTogetherSession(session);
  if (!session.started || !session.finished) fail('Both participants need to finish the activity first.');
  const feedback = cleanTogetherReviews(reviews ?? [{ rating: null, note: '' }, { rating: null, note: '' }]);
  if (state.completedSessions.includes(session.id)) return state;
  const names = cleanTogetherNames(session.participants.map(participant => participant.name));
  const participants = names.map((name, index) => ({
    name, ...feedback[index],
    score: activity.kind === 'quiz' ? session.answers[index].reduce((total, answer, step) => total + Number(answer === activity.questions[step].correct), 0) : null,
  }));
  const review = {
    id: session.id, sessionId: session.id, personId: null, activityId: activity.id,
    interest: activity.interest, rating: feedback.every(item => Number.isInteger(item.rating)) ? Math.round((feedback[0].rating + feedback[1].rating) / 2) : null,
    note: '', mode: 'in-person', participants, ...sessionMetadata({
      completedAt: session.completedAt,
      durationMs: session.startedAt !== null && Number.isSafeInteger(session.startedAt) ? Math.min(43200000, Math.max(0, (session.completedAt || Date.now()) - session.startedAt)) : session.durationMs,
      dailyThemeDate: session.dailyThemeDate,
    }),
  };
  return { ...state, points: state.points + 30, reviews: [...state.reviews, review], completedSessions: [...state.completedSessions, session.id] };
}

export function joinGroup(state, groupId) {
  if (!state.profile) fail('Please create your profile before joining a sample group.');
  if (!groupIds.has(groupId)) fail('Please choose an available sample group.');
  if (state.joinedGroups.includes(groupId)) return state;
  return { ...state, joinedGroups: [...state.joinedGroups, groupId] };
}

export function redeemReward(state, rewardId) {
  const reward = rewardById.get(rewardId);
  if (!reward) fail('Please choose an available demo reward.');
  if (state.points < reward.cost) fail(`You need ${reward.cost - state.points} more points for this demo reward.`);
  const sequence = state.redemptions.length + 1;
  const voucher = { id: `voucher-${sequence}`, rewardId, code: `DEMO-${rewardId.toUpperCase()}-${String(sequence).padStart(4, '0')}`, cost: reward.cost };
  return { ...state, points: state.points - reward.cost, redemptions: [...state.redemptions, voucher] };
}

// Treat all persisted data as untrusted. Reject incompatible snapshots rather than
// partially restoring a balance or references that no longer agree with each other.
function validatedState(value) {
  if (!isObject(value) || value.version !== 1) fail('Unsupported saved data.');
  const state = createState();
  state.profile = value.profile === null ? null : cleanProfile(value.profile);
  for (const key of ['reviews', 'friends', 'joinedGroups', 'redemptions', 'completedSessions']) {
    if (!Array.isArray(value[key]) || value[key].length > 10000) fail('Invalid saved history.');
  }
  if (!Number.isSafeInteger(value.points) || value.points < 0) fail('Invalid saved balance.');
  if (!unique(value.friends) || value.friends.some(id => !personIds.has(id))) fail('Invalid saved friends.');
  if (!unique(value.joinedGroups) || value.joinedGroups.some(id => !groupIds.has(id))) fail('Invalid saved groups.');
  if (!unique(value.completedSessions) || value.completedSessions.some(id => !isText(id, 120, 1) || !id.trim())) fail('Invalid saved sessions.');
  state.friends = [...value.friends];
  state.joinedGroups = [...value.joinedGroups];
  state.completedSessions = [...value.completedSessions];
  state.reviews = value.reviews.map(review => {
    if (!isObject(review) || !isText(review.id, 120, 1) || review.id !== review.sessionId || !state.completedSessions.includes(review.sessionId)) fail('Invalid saved review.');
    const activity = activityById.get(review.activityId);
    const rated = Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5;
    if (!activity || review.interest !== activity.interest || (!rated && !(review.mode === 'in-person' && review.rating === null)) || !isText(review.note, 500)) fail('Invalid saved review.');
    if (review.personId !== null && !personIds.has(review.personId)) fail('Invalid saved review profile.');
    const result = { id: review.id, sessionId: review.sessionId, personId: review.personId, activityId: review.activityId, interest: review.interest, rating: review.rating, note: review.note };
    if (review.completedAt !== undefined || review.durationMs !== undefined || review.dailyThemeDate !== undefined) {
      if (review.completedAt !== undefined && (!Number.isSafeInteger(review.completedAt) || review.completedAt < 0)) fail('Invalid saved review metadata.');
      if (review.durationMs !== undefined && (!Number.isSafeInteger(review.durationMs) || review.durationMs < 0 || review.durationMs > 43200000)) fail('Invalid saved review metadata.');
      if (review.dailyThemeDate !== undefined && (typeof review.dailyThemeDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(review.dailyThemeDate))) fail('Invalid saved review metadata.');
      for (const key of ['completedAt', 'durationMs', 'dailyThemeDate']) if (review[key] !== undefined) result[key] = review[key];
    }
    if (review.mode !== undefined || review.participants !== undefined) {
      if (review.mode !== 'in-person' || review.personId !== null || review.note !== '' || !Array.isArray(review.participants)) fail('Invalid saved together review.');
      const feedback = cleanTogetherReviews(review.participants);
      const names = cleanTogetherNames(review.participants.map(participant => participant.name));
      const participants = review.participants.map((participant, index) => {
        if (activity.kind === 'quiz' ? !Number.isInteger(participant.score) || participant.score < 0 || participant.score > activity.questions.length : participant.score !== null) fail('Invalid saved quiz score.');
        return { name: names[index], ...feedback[index], score: participant.score };
      });
      const allRated = participants.every(participant => Number.isInteger(participant.rating));
      if (allRated ? review.rating !== Math.round((participants[0].rating + participants[1].rating) / 2) : review.rating !== null) fail('Invalid saved together rating.');
      Object.assign(result, { mode: 'in-person', participants });
    }
    return result;
  });
  if (state.reviews.length !== state.completedSessions.length || !unique(state.reviews.map(review => review.sessionId))) fail('Incomplete saved history.');
  state.redemptions = value.redemptions.map((voucher, index) => {
    if (!isObject(voucher)) fail('Invalid saved voucher.');
    const reward = rewardById.get(voucher.rewardId);
    if (!reward || voucher.cost !== reward.cost || voucher.id !== `voucher-${index + 1}` || voucher.code !== `DEMO-${reward.id.toUpperCase()}-${String(index + 1).padStart(4, '0')}`) fail('Invalid saved voucher.');
    return { id: voucher.id, rewardId: voucher.rewardId, code: voucher.code, cost: voucher.cost };
  });
  const balance = state.completedSessions.length * 30 - state.redemptions.reduce((sum, voucher) => sum + voucher.cost, 0);
  if (balance !== value.points || (!state.profile && (state.reviews.some(review => review.mode !== 'in-person') || state.joinedGroups.length || state.friends.length))) fail('Inconsistent saved data.');
  state.points = value.points;
  return state;
}

export function saveState(state, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    target.setItem(STORAGE_KEY, JSON.stringify(validatedState(state)));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const data = target.getItem(STORAGE_KEY);
    return data === null ? createState() : validatedState(JSON.parse(data));
  } catch {
    return createState();
  }
}
