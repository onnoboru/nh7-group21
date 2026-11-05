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

export const PET_QUESTIONS = [
  { id: 'childhood-game', question: 'What game did you enjoy playing when you were a child?' },
  { id: 'after-school-snack', question: 'What was a favourite snack after school?' },
  { id: 'singapore-place', question: 'Which place in Singapore would you like Charlie to visit with us?' },
  { id: 'family-song', question: 'What song makes you smile, and what do you like about it?' },
  { id: 'teach-a-skill', question: 'What is something small you would enjoy teaching me?' },
  { id: 'garden-idea', question: 'If Charlie had a little garden, what should we grow there?' },
  { id: 'kindness-memory', question: 'What is a kind thing someone did that you still remember?' },
  { id: 'local-food', question: 'What local food should Charlie try in our next story?' },
  { id: 'family-tradition', question: 'What is a simple family tradition you enjoy?' },
  { id: 'childhood-toy', question: 'What toy or object did you love when you were young?' },
];

export const PET_DECORATIONS = [
  { id: 'sunny-window', name: 'Sunny window seat', icon: '🪟', unlockXp: 20 },
  { id: 'leaf-lamp', name: 'Leafy reading lamp', icon: '💡', unlockXp: 50 },
  { id: 'story-rug', name: 'Story-time rug', icon: '📚', unlockXp: 90 },
  { id: 'orchid-pot', name: 'Orchid flowerpot', icon: '🌸', unlockXp: 140 },
  { id: 'star-mobile', name: 'Starry night mobile', icon: '⭐', unlockXp: 200 },
];

export const PET_EVOLUTIONS = [
  { id: 'new-friend', name: 'New friend', unlockXp: 0 },
  { id: 'curious-sprout', name: 'Curious sprout', unlockXp: 30 },
  { id: 'little-explorer', name: 'Little explorer', unlockXp: 80 },
  { id: 'story-keeper', name: 'Story keeper', unlockXp: 180 },
];

export function getPetForm(experience) {
  if (!Number.isSafeInteger(experience) || experience < 0) throw new Error('Invalid growth points.');
  return PET_EVOLUTIONS.filter(form => experience >= form.unlockXp).at(-1);
}

// Learning bands are family choices, not developmental assessments.
export const LEARNING_STAGES = [
  { age: 6, level: 1, name: 'Little discoverer', ages: 'Ages 6–8', detail: 'Colours, counting, plants, and everyday places.' },
  { age: 9, level: 2, name: 'Growing explorer', ages: 'Ages 9–11', detail: 'Number patterns, nature, and connections around Singapore.' },
  { age: 12, level: 3, name: 'Curious thinker', ages: 'Ages 12+ / adults', detail: 'Culture, reasoning, and stories across generations.' },
];
export const CHALLENGES = [
  { id: 1, name: 'First steps', unlockLevel: 1, sticks: 9, detail: '4 quiz questions or talk prompts · 9 sticks · hints' },
  { id: 2, name: 'New adventures', unlockLevel: 2, sticks: 15, detail: '5 quiz questions or talk prompts · 15 sticks' },
  { id: 3, name: 'Master explorer', unlockLevel: 4, sticks: 21, detail: 'Full quiz and talk sets · 21 sticks' },
];

const question = (text, answers, correct, explanation) => ({ question: text, answers, correct, explanation });
const JUNIOR_QUESTIONS = {
  'garden-quiz': [
    question('What does a plant need to drink?', ['Water', 'Sand', 'Juice'], 0, 'Plants need water. Can you help water a plant?'),
    question('Which part of a plant is usually green?', ['The pot', 'The leaf', 'The stone'], 1, 'Leaves are often green. Look for one nearby.'),
    question('What can grow into a new plant?', ['A spoon', 'A shoe', 'A seed'], 2, 'A seed can grow when it has the right conditions.'),
    question('Which animal can help flowers by moving pollen?', ['A bee', 'A cat', 'A fish'], 0, 'Bees visit flowers and can carry pollen between them.'),
    question('Where do roots usually grow?', ['In the sky', 'In the soil', 'On a plate'], 1, 'Roots usually grow in soil and take in water.'),
    question('Which part of a plant can be colourful and attract bees?', ['The root', 'The pot', 'The flower'], 2, 'Flowers can attract bees and other pollinators.'),
  ],
  'playful-puzzles': [
    question('You have 2 sticks and find 1 more. How many now?', ['3', '4', '5'], 0, 'Two plus one makes three. Count together.'),
    question('Which shape has 3 sides?', ['Circle', 'Triangle', 'Square'], 1, 'A triangle has three sides.'),
    question('What comes next: red, blue, red, blue, ...?', ['Green', 'Yellow', 'Red'], 2, 'Red comes next in this repeating pattern.'),
    question('You share 1 of your 4 sticks. How many are left?', ['3', '2', '4'], 0, 'Four take away one leaves three.'),
    question('Which number is the biggest?', ['2', '5', '3'], 1, 'Five is bigger than two or three.'),
    question('Which object can roll?', ['A book', 'A square tile', 'A ball'], 2, 'A round ball can roll. Can you find another round object?'),
  ],
  'singapore-quiz': [
    question('What colour is the lower half of Singapore’s flag?', ['White', 'Green', 'Blue'], 0, 'The flag has red above white.'),
    question('Where can a family buy food from different stalls?', ['A swimming pool', 'A hawker centre', 'A library shelf'], 1, 'A hawker centre has many food stalls.'),
    question('What should you take out when it rains?', ['A sunhat only', 'A toy boat', 'An umbrella'], 2, 'An umbrella helps keep you dry.'),
    question('Which animal has a trunk?', ['An elephant', 'A butterfly', 'A chicken'], 0, 'An elephant has a long trunk.'),
    question('What can you ride on MRT tracks?', ['A bicycle', 'A train', 'A boat'], 1, 'MRT trains carry people around Singapore.'),
    question('Which fruit has a spiky shell?', ['A banana', 'An apple', 'A durian'], 2, 'A durian has a spiky shell. Ask an adult to handle it.'),
  ],
};
const EXPLORER_QUESTIONS = {
  'garden-quiz': [
    question('Why do many plants need sunlight?', ['To make food in their leaves', 'To turn into rocks', 'To stop growing'], 0, 'Plants use light to make food. This is called photosynthesis.'),
    question('Which part usually takes water from soil?', ['Petals', 'Roots', 'Fruit'], 1, 'Roots absorb water and help anchor a plant.'),
    question('Which material can often be composted?', ['Plastic wrappers', 'Glass bottles', 'Fruit peels'], 2, 'Fruit peels can break down into compost.'),
    question('Why do bees visit many flowers?', ['To collect nectar and pollen', 'To count the leaves', 'To hide stones'], 0, 'As bees visit, they can move pollen between flowers.'),
    question('Which leaf gives pandan cake its fragrance?', ['Mint', 'Pandan', 'Lettuce'], 1, 'Pandan leaves give many dishes a distinctive fragrance.'),
    question('What may happen if soil stays too wet?', ['Roots turn into flowers', 'Plants need no light', 'Roots may rot'], 2, 'Too much water can harm roots. Check before watering.'),
  ],
  'playful-puzzles': [
    question('What comes next: 3, 6, 9, ...?', ['12', '10', '15'], 0, 'The pattern adds three each time.'),
    question('Two players collect 7 and 5 sticks. How many together?', ['10', '12', '14'], 1, 'Seven plus five is twelve.'),
    question('A red stick is worth 5 points. What are 3 worth?', ['8', '10', '15'], 2, 'Three groups of five make fifteen.'),
    question('What is half of 18 sticks?', ['9', '6', '12'], 0, 'Two equal groups of nine make eighteen.'),
    question('You have 20 points and spend 6. How many remain?', ['12', '14', '16'], 1, 'Twenty minus six is fourteen.'),
    question('Which shape has exactly 4 equal sides and 4 right angles?', ['Triangle', 'Circle', 'Square'], 2, 'A square has four equal sides and four right angles.'),
  ],
  'singapore-quiz': [
    question('What does the Merlion combine?', ['A lion and a fish', 'A bird and a cat', 'A tree and a flower'], 0, 'The Merlion has a lion’s head and a fish’s body.'),
    question('How many stars are on Singapore’s flag?', ['Four', 'Five', 'Six'], 1, 'There are five stars on the flag.'),
    question('Which is a way to save water at home?', ['Leave taps running', 'Ignore leaking taps', 'Turn off the tap while brushing'], 2, 'Turning off the tap avoids wasting water.'),
    question('Where is Singapore Zoo?', ['Mandai', 'Sentosa', 'Pulau Ubin'], 0, 'Singapore Zoo is in Mandai.'),
    question('What might you buy at a wet market?', ['Only computers', 'Fresh vegetables and fish', 'Only train tickets'], 1, 'Wet markets sell fresh food and other groceries.'),
    question('Which transport runs on rails around Singapore?', ['A bumboat', 'A taxi', 'The MRT'], 2, 'The MRT is a railway system.'),
  ],
};

const JUNIOR_PROMPTS = {
  'family-recipes': [
    'Name a food you like. What colour is it?',
    'What snack would you share with your partner?',
    'Point to or name a spoon, bowl, or cup you use at home.',
    'What fruit would you put in a picnic basket?',
    'What kitchen job can you do with an adult?',
    'Draw or describe a meal you would make together.',
  ],
  'music-memories': [
    'Hum a tune you like, or name a song.',
    'Clap a short pattern for your partner to copy.',
    'Name an animal and make its sound together.',
    'Which song makes you want to dance?',
    'What sound do you hear near home?',
    'Make up a little song about Charlie.',
  ],
  'small-stories': [
    'Name a game you like to play.',
    'Tell your partner about a toy you like.',
    'What made you smile today?',
    'Where would you take Charlie for a fun day?',
    'Name someone who helped you recently.',
    'What would you like your partner to teach you?',
  ],
  'creative-colours': [
    'Choose a colour you like. Find something that colour.',
    'Point to a round object, or draw a circle.',
    'Draw or describe a happy face for Charlie.',
    'What colour would you paint Charlie’s room?',
    'Make a shape with your hands for your partner to copy.',
    'Draw or describe a card for someone you love.',
  ],
  'garden-walk-talk': [
    'Name a plant you have seen near home.',
    'Can you spot or imagine a green leaf?',
    'What sound might a bird make?',
    'Would Charlie like to sit under a tree or beside a flower?',
    'Name something you might see in a park.',
    'Tell your partner about a place you like to play.',
  ],
  'random-talk': [
    'If Charlie could wear a hat, what colour would it be?',
    'What animal would you like to meet?',
    'Name something that makes you laugh.',
    'What would you put in a pretend treasure box?',
    'Show your partner a funny face or describe one.',
    'What kind thing could you do together today?',
  ],
  'would-you-rather': [
    'Would you rather draw a cat or a bird?',
    'Would you rather splash in puddles or build a sandcastle?',
    'Would you rather sing a song or listen to a story?',
    'Would you rather have a red kite or a blue ball?',
    'Would you rather visit a park or a beach?',
    'Would you rather teach Charlie to clap or wave?',
  ],
  'hawker-choices': [
    'Would you rather have rice or noodles? Point or say why.',
    'Would you rather share a banana or an orange?',
    'Would you rather eat with a spoon or chopsticks?',
    'Would you rather sit indoors or in the shade outside?',
    'Would you rather choose a snack or help set the table?',
    'Would you rather bring a picnic or visit a food stall?',
  ],
  'story-stitch': [
    'Start a story: Charlie finds a tiny red bag. What is inside?',
    'Charlie takes the bag to a park. Who does he meet?',
    'The bag belongs to someone. Who could help find its owner?',
    'A rain cloud appears. Where can the friends stay dry?',
    'A neighbour offers a clue. What does the neighbour say?',
    'Tell us how they return the bag and end the story.',
  ],
  'neighbourhood-story': [
    'Start a story about Charlie visiting a playground. Who joins him?',
    'The friends find a lost toy. What does it look like?',
    'How can an adult help them find the toy’s owner?',
    'It starts raining. Where can they safely wait with the toy?',
    'A neighbour recognises the toy. What do they tell the friends?',
    'The owner gets the toy back. How does the story end?',
  ],
  'then-and-now': [
    'Name something you liked when you were smaller.',
    'What is a game you enjoy now?',
    'Ask your partner what toy they liked as a child.',
    'What can you do now that you could not do as a baby?',
    'Show or describe a family photo you remember.',
    'What would you like to learn next?',
  ],
  'charlie-walk': [
    'With an adult, choose a safe path, or imagine a walk from home.',
    'Look for or imagine something green. What is it?',
    'What sound can Charlie hear? Copy or describe it.',
    'Pause somewhere safe. What did you enjoy about the walk?',
    'Name something round you might see on your path.',
    'What would you tell Charlie about walking safely?',
  ],
};

const EXPLORER_PROMPTS = {
  'family-recipes': [
    'Choose a favourite dish. Which ingredients do you recognise?',
    'How would you describe its taste to someone who has never tried it?',
    'Ask your partner who taught them to make or enjoy a favourite meal.',
    'Plan a meal together. Which safe jobs could each of you do?',
    'What could you do with leftovers instead of wasting them?',
    'Invent a new snack using two ingredients you both like.',
  ],
  'music-memories': [
    'Pick a song and explain what mood it creates for you.',
    'Teach your partner a rhythm and ask them to change one beat.',
    'Compare a song you enjoy with one your partner enjoyed as a child.',
    'Choose three sounds for a song about your neighbourhood.',
    'Which instrument would you learn, and what would you practise first?',
    'Make a two-song playlist together and explain each choice.',
  ],
  'small-stories': [
    'Describe a time you learned something after making a mistake.',
    'Ask your partner how they spent an afternoon at your age.',
    'What is one thing you do differently, and one thing you have in common?',
    'Plan a small adventure you could enjoy together.',
    'Tell a story about someone being kind in your neighbourhood.',
    'Choose a skill you could teach each other and explain the first step.',
  ],
  'creative-colours': [
    'Choose two colours for a picture and explain the mood they create.',
    'Find or imagine a repeating pattern. How could you extend it?',
    'Describe a familiar place so your partner could sketch it.',
    'Design a useful object for Charlie’s room. What problem does it solve?',
    'Compare something handmade with something made by a machine.',
    'Plan a card using a shape, a colour, and a message for someone.',
  ],
  'garden-walk-talk': [
    'Describe two things a plant might need in a neighbourhood garden.',
    'What differences do you notice between a bird and a butterfly?',
    'Plan a shady walking route and explain why you chose it.',
    'Ask your partner about a green space they remember from childhood.',
    'How could you help keep a park pleasant for other visitors?',
    'Choose a nature question you would like to investigate together.',
  ],
  'random-talk': [
    'If Charlie could invent something helpful, what problem would it solve?',
    'What new skill could you practise for ten minutes a day?',
    'Plan a fun afternoon together without buying anything.',
    'Which everyday object could you use in a completely new way?',
    'What question would you ask someone who grew up in another time?',
    'Describe a small act of kindness and explain its effect.',
  ],
  'would-you-rather': [
    'Would you rather invent a board game or write a comic? Explain why.',
    'Would you rather explore a nature trail or a museum? What would you learn?',
    'Would you rather learn a family recipe or teach a game? Give a reason.',
    'Would you rather travel by bicycle or MRT for a day out? Compare them.',
    'Would you rather be able to talk to birds or understand every song?',
    'Would you rather improve a playground or create a community garden?',
  ],
  'hawker-choices': [
    'Would you rather introduce a visitor to kaya toast or roti prata? Why?',
    'Would you rather try a new dish or learn how a favourite is made?',
    'Would you rather share several small dishes or one large dish? Compare.',
    'Would you rather choose a stall by its menu or a family recommendation?',
    'Would you rather help plan the order or help tidy the table? Explain.',
    'Would you rather invent a dessert or a savoury snack for your family?',
  ],
  'story-stitch': [
    'Start a story about a character with a useful but surprising object.',
    'Give the character a goal and a reason to visit a new place.',
    'Add a problem that cannot be solved by the object alone.',
    'Introduce a helper with a different skill. How do they work together?',
    'Explain how their plan solves the problem.',
    'Resolve the problem and end with something the characters learned from each other.',
  ],
  'neighbourhood-story': [
    'Start a story about two neighbours planning a community celebration.',
    'Choose a familiar meeting place and a job for each neighbour.',
    'A sudden rain shower changes their plan. What becomes difficult?',
    'A new neighbour offers a skill that could help. What is it?',
    'Describe how the neighbours solve the problem together.',
    'Resolve the problem and end with a new tradition for the neighbourhood.',
  ],
  'then-and-now': [
    'Ask your partner how they kept in touch with friends at your age.',
    'Compare one of their childhood games with a game you play today.',
    'What can a newer way of doing something make easier?',
    'What is worth keeping from an older way of doing it?',
    'How has a place you both know changed?',
    'Choose a family tradition to keep and one to start together.',
  ],
  'charlie-walk': [
    'With an adult, plan a safe short walk, or imagine one from home. Explain your route.',
    'Compare two plants, buildings, or colours you notice or imagine.',
    'What might explain a neighbourhood sound Charlie hears?',
    'Pause somewhere safe and ask your partner how this area used to look.',
    'Suggest one way to make the path more pleasant for others.',
    'Choose a question to explore on your next walk together.',
  ],
};

export const ACTIVITIES = [
  { id: 'pick-up-sticks', title: 'Pick Up Sticks', interest: 'games', kind: 'sticks', description: 'An old-school favourite in Singapore. Lift the top sticks, keep a steady eye, and collect points together.', duration: '5 min', icon: '🥢', prompts: ['Which games did your family play growing up?'] },
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
  { id: 'charlie-walk', title: 'Walk with Charlie', interest: 'gardening', kind: 'walk', description: 'Take a short, safe walk with an adult—or imagine one together. No GPS is used.', duration: '6 min', icon: '👟', prompts: ['Choose a familiar path or imagine one from home. What would you tell Charlie before setting off?', 'What colour, plant, bird, or building do you notice first?', 'Charlie hears a Singapore neighbourhood sound. What might it be?', 'Choose a shady place to pause. What story would you share there?', 'What would you like Charlie to notice on another walk?'] },
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
  return { version: 2, profile: null, points: 0, reviews: [], friends: [], joinedGroups: [], redemptions: [], completedSessions: [], petJourney: { fedDates: [], weeks: [] } };
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

export function getWeekStartKey(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return getDateKey(monday);
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getPetWeek(state, date = new Date()) {
  const weekStart = getWeekStartKey(date);
  return state.petJourney.weeks.find(week => week.weekStart === weekStart) ?? null;
}

export function getPetQuestionForWeek(state, date = new Date()) {
  const existing = getPetWeek(state, date);
  if (existing) return PET_QUESTIONS.find(item => item.id === existing.questionId) ?? null;
  const previousQuestionId = state.petJourney.weeks.at(-1)?.questionId;
  const choices = PET_QUESTIONS.filter(item => item.id !== previousQuestionId);
  const seed = getWeekStartKey(date).replace(/\D/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0);
  return choices[seed % choices.length] ?? PET_QUESTIONS[0];
}

export function getPetStats(state, date = new Date()) {
  const gameExperience = state.reviews.length * 10;
  const careExperience = state.petJourney.fedDates.length * 3;
  const storyExperience = state.petJourney.weeks.filter(week => week.repliedAt !== null).length * 15;
  const experience = gameExperience + careExperience + storyExperience;
  const level = Math.floor(experience / 40) + 1;
  const form = getPetForm(experience);
  const evolutionIndex = PET_EVOLUTIONS.indexOf(form);
  const week = getPetWeek(state, date);
  return {
    experience,
    gameExperience,
    level,
    stage: form.name,
    form,
    evolutionIndex,
    nextEvolution: PET_EVOLUTIONS[evolutionIndex + 1] ?? null,
    progress: experience % 40,
    nextLevelAt: level * 40,
    challenges: CHALLENGES.filter(item => level >= item.unlockLevel),
    fedToday: state.petJourney.fedDates.includes(getDateKey(date)),
    week,
    unlockedDecorations: PET_DECORATIONS.filter(item => experience >= item.unlockXp),
    answeredWeeks: state.petJourney.weeks.filter(item => item.repliedAt !== null).length,
  };
}

export function getLearningStage(age = 12) {
  if (!Number.isInteger(age) || age < 6 || age > 110) fail('Choose an age from 6 to 110.');
  return LEARNING_STAGES[age < 9 ? 0 : age < 12 ? 1 : 2];
}

export function getLearningSettings(state, age = state.profile?.age ?? 12, challenge = 1) {
  const stage = getLearningStage(age);
  const option = CHALLENGES.find(item => item.id === challenge);
  if (!option || getPetStats(state).level < option.unlockLevel) fail(`This challenge needs Charlie to reach level ${option?.unlockLevel ?? 4}.`);
  return { age: stage.age, challenge };
}

function cleanLearning(value) {
  if (!isObject(value) || !LEARNING_STAGES.some(item => item.age === value.age) || !CHALLENGES.some(item => item.id === value.challenge)) fail('Invalid learning settings.');
  return { age: value.age, challenge: value.challenge };
}

export function getLearningActivity(activityId, learning) {
  const activity = activityById.get(activityId);
  if (!activity) fail('Please choose an available activity.');
  if (learning === undefined) return activity;
  const settings = cleanLearning(learning);
  if (activity.kind === 'sticks') return activity;
  const field = activity.kind === 'quiz' ? 'questions' : 'prompts';
  const junior = activity.kind === 'quiz' ? JUNIOR_QUESTIONS : JUNIOR_PROMPTS;
  const explorer = activity.kind === 'quiz' ? EXPLORER_QUESTIONS : EXPLORER_PROMPTS;
  const items = settings.age === 6 ? junior[activityId] : settings.age === 9 ? explorer[activityId] : activity[field];
  const count = settings.challenge === 1 ? 4 : settings.challenge === 2 ? 5 : items.length;
  const ordered = activity.kind === 'collaborative' && settings.age < 12;
  const selected = ordered && count < items.length ? [...items.slice(0, count - 1), items.at(-1)] : items.slice(0, count);
  return { ...activity, [field]: selected, ...(ordered ? { ordered: true } : {}) };
}

export const STICK_COLOURS = [
  { name: 'Yellow', color: '#b77a05', points: 1 },
  { name: 'Blue', color: '#3475b4', points: 3 },
  { name: 'Red', color: '#b94d4b', points: 5 },
  { name: 'Black', color: '#383c43', points: 25 },
];

// Replay moves against a seeded pile to validate completion and scores.
export function createStickGame({ seed = Math.floor(Math.random() * 4294967296), count = 9 } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295 || ![9, 15, 21].includes(count)) fail('Invalid stick pile.');
  return { seed, count, moves: [] };
}

function stickPile(game) {
  let seed = game.seed;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: game.count }, (_, id) => {
    const x = 120 + random() * 160, y = 100 + random() * 140;
    const angle = random() * Math.PI, length = 120 + random() * 80;
    return { id, x1: x - Math.cos(angle) * length / 2, y1: y - Math.sin(angle) * length / 2, x2: x + Math.cos(angle) * length / 2, y2: y + Math.sin(angle) * length / 2, ...STICK_COLOURS[id % STICK_COLOURS.length] };
  });
}

function sticksTouch(a, b) {
  const distance = (x, y, line) => {
    const dx = line.x2 - line.x1, dy = line.y2 - line.y1;
    const t = Math.max(0, Math.min(1, ((x - line.x1) * dx + (y - line.y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - line.x1 - t * dx, y - line.y1 - t * dy);
  };
  const cross = (line, x, y) => (line.x2 - line.x1) * (y - line.y1) - (line.y2 - line.y1) * (x - line.x1);
  const intersects = cross(a, b.x1, b.y1) * cross(a, b.x2, b.y2) <= 0
    && cross(b, a.x1, a.y1) * cross(b, a.x2, a.y2) <= 0
    && Math.max(a.x1, a.x2) >= Math.min(b.x1, b.x2) && Math.max(b.x1, b.x2) >= Math.min(a.x1, a.x2)
    && Math.max(a.y1, a.y2) >= Math.min(b.y1, b.y2) && Math.max(b.y1, b.y2) >= Math.min(a.y1, a.y2);
  return intersects || Math.min(distance(a.x1, a.y1, b), distance(a.x2, a.y2, b), distance(b.x1, b.y1, a), distance(b.x2, b.y2, a)) <= 7;
}

export function getStickGameStats(game) {
  if (!isObject(game) || !Number.isInteger(game.seed) || ![9, 15, 21].includes(game.count)) fail('Invalid stick game.');
  createStickGame(game);
  if (!Array.isArray(game.moves) || game.moves.length > 10000) fail('Invalid stick moves.');
  const remaining = stickPile(game), scores = [0, 0], collected = [0, 0];
  let hp = 3, turn = 0, message = 'Look for a stick with nothing crossing over it.';
  for (const move of game.moves) {
    if (!remaining.length) fail('This stick game is already complete.');
    if (move === 'rest') {
      if (hp !== 0) fail('Rest after using all three HP.');
      hp = 3;
      message = 'HP restored. Take your time and try again.';
      continue;
    }
    if (move === 'pass') { turn = 1 - turn; message = 'Turn passed. Look for a top stick.'; continue; }
    if (hp === 0) fail('Restore HP before picking another stick.');
    const index = remaining.findIndex(stick => stick.id === move);
    if (!Number.isInteger(move) || index < 0) fail('Choose a stick still on the table.');
    const stick = remaining[index];
    if (remaining.some(other => other.id > stick.id && sticksTouch(stick, other))) {
      hp--;
      turn = 1 - turn;
      message = `Stick ${stick.id + 1} has another stick on top. −1 HP. Pass the turn.`;
    } else {
      scores[turn] += stick.points;
      collected[turn]++;
      remaining.splice(index, 1);
      message = `Stick ${stick.id + 1} lifted! +${stick.points} stick points. Pick again or pass.`;
    }
  }
  return { remaining, scores, collected, hp, turn, message, finished: remaining.length === 0,
    available: remaining.filter(stick => !remaining.some(other => other.id > stick.id && sticksTouch(stick, other))).map(stick => stick.id) };
}

export function pickStick(game, id) {
  const next = { ...game, moves: [...game.moves, id] };
  getStickGameStats(next);
  return next;
}

function validDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) && getDateKey(date) === value;
}

function cleanPetJourney(value) {
  if (!isObject(value) || !Array.isArray(value.fedDates) || !Array.isArray(value.weeks)
    || value.fedDates.length > 5000 || value.weeks.length > 1000) fail('Invalid pet journey.');
  if (value.fedDates.some(day => !validDateKey(day)) || !unique(value.fedDates)) fail('Invalid pet care history.');
  const seenWeeks = new Set();
  const weeks = value.weeks.map(week => {
    if (!isObject(week) || !validDateKey(week.weekStart)) fail('Invalid weekly question.');
    const monday = new Date(`${week.weekStart}T00:00:00`);
    if ((monday.getDay() + 6) % 7 !== 0 || seenWeeks.has(week.weekStart)) fail('Invalid weekly question date.');
    seenWeeks.add(week.weekStart);
    const question = PET_QUESTIONS.find(item => item.id === week.questionId);
    if (!question || !Number.isSafeInteger(week.askedAt) || week.askedAt < 0 || !isText(week.replyText, 1600)) fail('Invalid weekly story.');
    if (week.repliedAt !== null && (!Number.isSafeInteger(week.repliedAt) || week.repliedAt < week.askedAt)) fail('Invalid weekly story date.');
    if (week.voiceNoteId !== null && (typeof week.voiceNoteId !== 'string' || !/^voice-[A-Za-z0-9_-]{8,128}$/.test(week.voiceNoteId))) fail('Invalid voice story reference.');
    if (week.repliedAt === null && (week.replyText || week.voiceNoteId !== null)) fail('An unfinished story cannot include a saved reply.');
    if (week.repliedAt !== null && !week.replyText.trim() && week.voiceNoteId === null) fail('A saved story needs text or a voice note.');
    return { weekStart: week.weekStart, questionId: question.id, askedAt: week.askedAt, replyText: week.replyText, repliedAt: week.repliedAt, voiceNoteId: week.voiceNoteId };
  });
  return { fedDates: [...value.fedDates], weeks };
}

export function feedPet(state, date = new Date()) {
  const day = typeof date === 'string' ? date : getDateKey(date);
  if (!validDateKey(day)) fail('Please choose a valid day for Charlie’s care.');
  if (state.petJourney.fedDates.includes(day)) return state;
  return { ...state, petJourney: { ...state.petJourney, fedDates: [...state.petJourney.fedDates, day] } };
}

export function askPetQuestion(state, { weekStart = getWeekStartKey(), questionId, askedAt = Date.now() } = {}) {
  if (!validDateKey(weekStart) || (new Date(`${weekStart}T00:00:00`).getDay() + 6) % 7 !== 0) fail('Please choose the start of a week.');
  if (!PET_QUESTIONS.some(item => item.id === questionId)) fail('Please choose an available question for Charlie.');
  if (!Number.isSafeInteger(askedAt) || askedAt < 0) fail('Please choose a valid question time.');
  const previous = state.petJourney.weeks.find(week => week.weekStart === weekStart);
  if (previous) return state;
  const week = { weekStart, questionId, askedAt, replyText: '', repliedAt: null, voiceNoteId: null };
  return { ...state, petJourney: { ...state.petJourney, weeks: [...state.petJourney.weeks, week] } };
}

export function replyToPetQuestion(state, { weekStart, replyText = '', repliedAt = Date.now(), voiceNoteId = null } = {}) {
  if (!validDateKey(weekStart)) fail('Please choose a valid weekly question.');
  if (!isText(replyText, 1600)) fail('Please keep the story to 1,600 characters.');
  if (voiceNoteId !== null && (typeof voiceNoteId !== 'string' || !/^voice-[A-Za-z0-9_-]{8,128}$/.test(voiceNoteId))) fail('Please choose a valid voice story.');
  const index = state.petJourney.weeks.findIndex(week => week.weekStart === weekStart);
  if (index < 0) fail('Charlie needs to ask the weekly question first.');
  const current = state.petJourney.weeks[index];
  const nextVoiceNoteId = voiceNoteId ?? current.voiceNoteId;
  if (!replyText.trim() && nextVoiceNoteId === null) fail('Add a short story or record a voice reply.');
  if (!Number.isSafeInteger(repliedAt) || repliedAt < current.askedAt) fail('Please choose a valid reply time.');
  const weeks = [...state.petJourney.weeks];
  weeks[index] = { ...current, replyText: replyText.trim(), repliedAt, voiceNoteId: nextVoiceNoteId };
  return { ...state, petJourney: { ...state.petJourney, weeks } };
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
  if (session.learning) getLearningSettings(state, session.learning.age, session.learning.challenge);
  if (activity.kind === 'sticks' && !getStickGameStats(session.sticks).finished) fail('Clear the stick pile before saving.');
  if (personId !== null && !personIds.has(personId)) fail('Please choose an available sample profile.');
  if (personId !== null && getMode(state.profile) === 'family') fail('Family activities take place with someone you know, without community matching.');
  if (personId !== null && !getMatches(state).some(person => person.id === personId)) fail('Please choose a sample profile with a shared interest from another generation.');
  if (addFriend && personId === null) fail('A community session is required to add a sample friend.');
  const review = { id, sessionId: id, personId, activityId, interest: activity.interest, rating, note: note.trim(), ...sessionMetadata(session) };
  if (session.learning) review.learning = cleanLearning(session.learning);
  if (activity.kind === 'sticks') {
    const expected = CHALLENGES[(session.learning?.challenge ?? 1) - 1].sticks;
    if (session.sticks.count !== expected) fail('Invalid stick challenge.');
    review.stickScores = getStickGameStats(session.sticks).scores;
    review.stickCount = expected;
  }
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
  const activity = getLearningActivity(options.activityId, options.learning);
  if (!activity) fail('Please choose an available activity.');
  const names = cleanTogetherNames(options.names);
  return {
    id: options.id, activity, personId: null, mode: 'in-person',
    participants: names.map(name => ({ name })), step: 0, turn: 0,
    answers: [[], []], revealed: false, started: false, finished: false,
    startedAt: Number.isSafeInteger(options.startedAt) ? options.startedAt : null,
    dailyThemeDate: options.dailyThemeDate || null,
    ...(options.learning ? { learning: cleanLearning(options.learning) } : {}),
    ...(activity.kind === 'sticks' ? { sticks: createStickGame({ seed: options.seed, count: CHALLENGES[(options.learning?.challenge ?? 1) - 1].sticks }) } : {}),
  };
}

// Check progression against the original activity, including every earlier answer.
// This prevents a partially completed quiz from being submitted as a finished one.
function checkTogetherSession(session) {
  if (!isObject(session) || !isText(session.id, 120, 1) || !session.id.trim() || session.mode !== 'in-person' || session.personId !== null) fail('Please start a valid together session.');
  const activity = getLearningActivity(session.activity?.id, session.learning);
  if (!activity) fail('Please choose an available activity.');
  if (!Array.isArray(session.participants) || session.participants.some(participant => !isObject(participant))) fail('This session needs two participants.');
  cleanTogetherNames(session.participants.map(participant => participant.name));
  if (typeof session.started !== 'boolean' || typeof session.finished !== 'boolean' || typeof session.revealed !== 'boolean' || ![0, 1].includes(session.turn)) fail('Invalid activity progress.');
  if (activity.kind === 'sticks') {
    const game = getStickGameStats(session.sticks);
    if (session.sticks.count !== CHALLENGES[(session.learning?.challenge ?? 1) - 1].sticks || session.step !== 0 || session.turn !== game.turn || session.finished !== game.finished || session.revealed
      || !Array.isArray(session.answers) || session.answers.length !== 2 || session.answers.some(answers => !Array.isArray(answers) || answers.length)
      || (!session.started && session.sticks.moves.length)) fail('Invalid stick game progress.');
    return activity;
  }
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
  if (activity.kind === 'sticks') fail('Clear the stick pile to finish this game.');
  if (!session.started || session.finished) fail('Start an unfinished activity before continuing.');
  if (activity.kind === 'quiz' && !session.revealed) fail('Both participants need to answer before continuing.');
  if (activity.kind !== 'quiz' && session.turn === 0) return { ...session, activity, turn: 1 };
  const count = activity.kind === 'quiz' ? activity.questions.length : activity.prompts.length;
  if (session.step === count - 1) return { ...session, activity, finished: true };
  return { ...session, activity, step: session.step + 1, turn: 0, revealed: false };
}

export function skipTogetherStep(session) {
  const activity = checkTogetherSession(session);
  if (activity.kind === 'sticks') fail('Clear the stick pile to finish this game.');
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
  if (session.learning) getLearningSettings(state, session.learning.age, session.learning.challenge);
  const names = cleanTogetherNames(session.participants.map(participant => participant.name));
  const participants = names.map((name, index) => ({
    name, ...feedback[index],
    score: activity.kind === 'quiz' ? session.answers[index].reduce((total, answer, step) => total + Number(answer === activity.questions[step].correct), 0) : null,
  }));
  const review = {
    id: session.id, sessionId: session.id, personId: null, activityId: activity.id,
    interest: activity.interest, rating: feedback.every(item => Number.isInteger(item.rating)) ? Math.round((feedback[0].rating + feedback[1].rating) / 2) : null,
    note: '', mode: 'in-person', participants,
    ...(session.learning ? { learning: cleanLearning(session.learning) } : {}),
    ...(activity.kind === 'quiz' ? { questionCount: activity.questions.length } : {}),
    ...(activity.kind === 'sticks' ? { stickScores: getStickGameStats(session.sticks).scores, stickCount: session.sticks.count } : {}),
    ...sessionMetadata({
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
  if (!isObject(value) || ![1, 2].includes(value.version)) fail('Unsupported saved data.');
  const state = createState();
  state.petJourney = value.version === 1 ? { fedDates: [], weeks: [] } : cleanPetJourney(value.petJourney);
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
    const activity = getLearningActivity(review.activityId, review.learning);
    const rated = Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5;
    if (!activity || review.interest !== activity.interest || (!rated && !(review.mode === 'in-person' && review.rating === null)) || !isText(review.note, 500)) fail('Invalid saved review.');
    if (review.personId !== null && !personIds.has(review.personId)) fail('Invalid saved review profile.');
    const result = { id: review.id, sessionId: review.sessionId, personId: review.personId, activityId: review.activityId, interest: review.interest, rating: review.rating, note: review.note };
    if (review.learning !== undefined) result.learning = cleanLearning(review.learning);
    if (review.questionCount !== undefined) {
      if (activity.kind !== 'quiz' || review.questionCount !== activity.questions.length) fail('Invalid question count.');
      result.questionCount = review.questionCount;
    }
    if (review.stickScores !== undefined || review.stickCount !== undefined) {
      const expected = CHALLENGES[(review.learning?.challenge ?? 1) - 1].sticks;
      if (activity.kind !== 'sticks' || review.stickCount !== expected || !Array.isArray(review.stickScores) || review.stickScores.length !== 2
        || review.stickScores.some(score => !Number.isInteger(score) || score < 0)) fail('Invalid saved stick scores.');
      const total = Array.from({ length: expected }, (_, index) => STICK_COLOURS[index % 4].points).reduce((sum, score) => sum + score, 0);
      if (review.stickScores[0] + review.stickScores[1] !== total) fail('Invalid saved stick score total.');
      result.stickScores = [...review.stickScores];
      result.stickCount = expected;
    }
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
