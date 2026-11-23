// Story Adventures: choose-your-path stories told in the first person.
// Compact authoring format (expanded to adventure.json by generate-content):
//   node  = { t: [paragraphs], c: [[choice text, target id], ...] }
//   ending = { t: [paragraphs], end: [title, mood] }       mood: happy | sweet | funny | dreamy | cozy
// Romance is boy-meets-girl / girl-meets-boy for now, and always sweet and all-ages.

export const adventures = [
  // ------------------------------------------------------------------ 1
  {
    id: 'the_lantern_trail',
    name: 'The Lantern Trail',
    description: 'On Lantern Night the great Moon Lantern will not light. Follow the trail into the Whispering Wood to find out why.',
    genre: 'Adventure',
    protagonist: 'girl',
    hero: 'Mira',
    minutes: 9,
    accent: '#f6b36f',
    cover: 'lantern',
    start: 'start',
    nodes: {
      start: {
        t: [
          'I am Mira, and tonight is Lantern Night. Every house in Hollowbrook has a paper lantern glowing in the window, every house except the big one in the square. The Moon Lantern is dark and cold.',
          'Grandpa says its flame grows from a seed that only blooms in the Whispering Wood. If I leave now, I can be back before the moon is high. Two paths lead away from the village edge.'
        ],
        c: [['Take the river path', 'river'], ['Climb the old stone steps', 'steps']]
      },
      river: {
        t: ['The river is loud and silver in the dusk. Flat stones cross it in a crooked line, and a tall grey heron stands on the far bank, watching me with one patient eye.'],
        c: [['Hop across the stones myself', 'stones'], ['Ask the heron for help', 'heron']]
      },
      steps: {
        t: ['The steps are green with moss and leaning like tired friends. Halfway up, a small red fox is sitting in the middle of the path, looking at my pocket. My pocket has a bread roll in it.'],
        c: [['Share my bread with the fox', 'fox'], ['Tiptoe around the fox', 'sneak']]
      },
      stones: {
        t: ['One hop, two hops, three. On the fourth stone my boot slips and I sit down in the river with a splash that startles every frog for a mile. I am wet to the knees and very cold.'],
        c: [['Go home and dry off by the fire', 'end_home'], ['Squelch onward to the wood', 'wood']]
      },
      heron: {
        t: ['The heron bows its long neck, steps close and lets me climb onto its back like a feathered boat. It crosses the river in three silent strides. "The wood is that way," it says in a voice like reeds. "Look for the glow."'],
        c: [['Thank the heron and enter the wood', 'wood']]
      },
      fox: {
        t: ['The fox takes the roll as if it were made of gold and gobbles it in two bites. Then it yips once and trots ahead, glancing back to check that I am following. It knows a shortcut, one with no steps at all.'],
        c: [['Follow the fox into the trees', 'wood']]
      },
      sneak: {
        t: ['I tiptoe around the fox, but my cloak catches on a bramble. The more I tug, the more the bramble hugs me back. The fox sits and watches, ears tilted, as if I were the evening show.'],
        c: [['Free myself carefully, one thorn at a time', 'wood'], ['Call out for help', 'end_help']]
      },
      wood: {
        t: [
          'The Whispering Wood is full of soft voices. The branches murmur, the leaves hush each other, and somewhere ahead a faint gold light flickers between the trunks.',
          'A cloud of glowing moths swirls past my head. Beside me is a hollow tree big enough to walk into. The trees themselves seem to be waiting for me to speak.'
        ],
        c: [['Listen to what the trees are whispering', 'whispers'], ['Follow the glowing moths', 'moths'], ['Duck inside the hollow tree', 'hollow']]
      },
      whispers: {
        t: ['I hold my breath and listen. Slowly the whispers sort themselves into words. "Light is not taken," they say. "Light is given. Light is given. Light is given." The glow ahead pulses, once, like a heartbeat.'],
        c: [['Hum a soft song to the glow', 'seed_sing'], ['Ask the glow politely for its seed', 'seed_ask']]
      },
      moths: {
        t: ['The moths dance in a long spiral and lead me to a still black pond. In the middle, the flame-seed shines, perfectly round and golden, so close I could almost touch it.'],
        c: [['Reach down to grab it', 'end_reflect'], ['Look up instead, at the sky', 'seed_sing']]
      },
      hollow: {
        t: ['Inside the tree it is warm and smells of toast. A very large badger in a nightcap is asleep on a cushion, snoring in time with the crickets. Behind him, on a shelf, sits a small glowing seed in a teacup.'],
        c: [['Tiptoe past and borrow the seed', 'end_badger'], ['Wake the badger and ask him politely', 'seed_ask']]
      },
      seed_sing: {
        t: ['I hum the lullaby Grandpa taught me, the one about the lanterns coming home. The glow rises out of the dark, settles into my cupped hands and warms me from my fingers to my nose. It is the flame-seed, and it likes the song.'],
        c: [['Carry it home through the wood', 'end_lantern']]
      },
      seed_ask: {
        t: ['"Please," I say, "our lantern has gone dark and the whole village is waiting." The seed brightens and floats to my hands. It does not feel like taking. It feels like being trusted.'],
        c: [['Carry the seed straight home', 'end_lantern'], ['Invite the whole wood to the festival', 'end_together']]
      },
      end_home: {
        t: ['I get home dripping, and Grandpa wraps me in three blankets without a single question. We sit by the fire with cocoa, and through the window we watch every other lantern glow in the dark.', 'No Moon Lantern this year. But I have never felt so warm, and there is always next Lantern Night.'],
        end: ['Wet but Warm', 'cozy']
      },
      end_help: {
        t: ['My shout carries all the way down the hill. In minutes the whole village arrives with torches, blankets and Mrs. Alder\'s famous soup. They cut me free, and the fox gets more bread than he can carry.', 'We never reach the Whispering Wood, but we spend Lantern Night together on the hillside, singing. The Moon Lantern stays dark. Nobody seems to mind.'],
        end: ['Everyone Came', 'sweet']
      },
      end_reflect: {
        t: ['My fingers break the surface and the golden seed shivers into a hundred ripples. It was only the moon\'s reflection. When the water settles, I look up, and there is the real moon, big and round, smiling at me over the trees.', 'I carry a jar of moonlit pond water home. When I pour it into the Moon Lantern, it glows as bright as the sky. I think that was always the plan.'],
        end: ['Moonlit Water', 'dreamy']
      },
      end_badger: {
        t: ['I take exactly one step before the badger opens one eye and says, "Oh good, breakfast." He thinks I am the delivery girl. By the time I have explained, we are three cups of tea in, and he insists on giving me the seed "for the bother."', 'I carry it home in a teacup. The Moon Lantern lights up like a small sunrise, and the badger is the guest of honor, asleep in the front row.'],
        end: ['Tea with a Badger', 'funny']
      },
      end_lantern: {
        t: ['When I step into the square, the whole village gasps. I lift the seed into the great lantern and it blooms, warm and round and golden, spilling light over every roof and face.', 'Grandpa squeezes my shoulder. "Light is given," he says, and I realize he knew all along what the trees would say. The Moon Lantern glows till dawn, and I do not sleep once.'],
        end: ['The Moon Lantern', 'happy']
      },
      end_together: {
        t: ['I tell the wood about Hollowbrook, the songs, the cocoa, the paper stars. And the wood, to my astonishment, decides to come. Moths lead the way, the heron takes the river path, the fox brings a very proud badger, and the trees whisper their way down the hill.', 'We light the Moon Lantern together, villagers and wildlings side by side. It is the brightest Lantern Night anyone remembers, and the first one that is never quite over.'],
        end: ['Light for Everyone', 'happy']
      }
    }
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'skyship_summer',
    name: 'Skyship Summer',
    description: 'You have inherited a tiny sky-ship and one very important bag of mail. Can you reach the cloud island of Lull by sunset?',
    genre: 'Adventure',
    protagonist: 'guy',
    hero: 'Theo',
    minutes: 8,
    accent: '#8fc7ec',
    cover: 'skyship',
    start: 'start',
    nodes: {
      start: {
        t: [
          'My name is Theo, and my aunt left me two things: a tiny sky-ship called the Dandelion, and a canvas bag of letters addressed to the island of Lull. The bag is tied with a red ribbon. There is a note on it that says, "Deliver by sunset."',
          'The Dandelion bobs at the end of the dock like a bath toy. The sky is clear, but the weathervane is squeaking in a way I do not like.'
        ],
        c: [['Check the weather first', 'weather'], ['Cast off right away', 'liftoff']]
      },
      weather: {
        t: ['I tap the barometer. It hums and points at "Possibly Breezy." The old harbor cat looks at me as if to say that is what it always says. I could wait for the wind to settle, or I could trust the cat and go.'],
        c: [['Wait for the wind to settle', 'end_nap'], ['Go anyway', 'liftoff']]
      },
      liftoff: {
        t: ['The ropes drop away and the Dandelion lifts off the dock as lightly as a seed. The whole harbor shrinks into a toy town below me. The wind smells of warm bread and faraway rain.', 'Ahead I see two routes. To the east, a bright trail of sun-lit sky. To the south, the Cotton Bank, a huge white cloud with a bell ringing somewhere inside it.'],
        c: [['Follow the sun trail', 'sunroute'], ['Cut through the Cotton Bank', 'cotton']]
      },
      sunroute: {
        t: ['A friendly gull glides alongside and tips her postman\'s cap. "Captain Gull, sky mail. You\'re headed for Lull? I know a shortcut. Fifteen minutes faster, if you don\'t mind a little rumble."'],
        c: [['Take the gull\'s shortcut', 'shortcut'], ['Stick to my own chart', 'lull_approach']]
      },
      cotton: {
        t: ['Inside the Cotton Bank everything is white and soft and hushed. I can\'t see the nose of my own ship. The bell rings again, closer now, with a sad little wobble in it.'],
        c: [['Follow the bell', 'bell'], ['Climb above the fog', 'lull_approach']]
      },
      bell: {
        t: ['The bell hangs around the neck of a baby cloud-lamb, no bigger than a pillow, who has wandered away from the herd and cannot find the way back. He bleats at me hopefully. I think I know what my aunt would do.'],
        c: [['Take him back to his herd', 'end_herd'], ['Bring him with me to Lull', 'lull_approach']]
      },
      shortcut: {
        t: ['The shortcut runs through a fat grey cloud that grumbles and flickers. The Dandelion shakes like a leaf. Raindrops the size of marbles start to bounce off the deck. Captain Gull calls, "Almost through!"'],
        c: [['Fly through fast', 'end_storm'], ['Turn back and take the long way', 'lull_approach']]
      },
      lull_approach: {
        t: ['At last, Lull appears: a green island floating on a pillow of cloud, with a candy-colored harbor and a tiny post office that looks exactly like a mailbox. The sun is touching the horizon. I have just enough time.'],
        c: [['Land on the main pier', 'pier'], ['Land on the meadow, it looks softer', 'end_picnic']]
      },
      pier: {
        t: ['A small crowd has gathered. A postmistress with a sleepy smile takes the bag and counts the letters. When she gets to the last one she stops. It has no stamp and no address, only my name in my aunt\'s handwriting.'],
        c: [['Deliver the rest of the mail', 'end_mail'], ['Open the letter with my name on it', 'end_aunt']]
      },
      end_nap: {
        t: ['I wait for the wind to settle, and, being comfortable, I fall asleep in the cockpit. When I wake up it is the middle of the night, the stars are out, and the harbor cat is asleep on my chest.', 'I deliver the mail first thing in the morning. Lull forgives me, as it turns out, for it is an island that does not believe in hurry.'],
        end: ['Slow and Steady', 'cozy']
      },
      end_herd: {
        t: ['The herd is waiting in a pasture of cloud-grass, and the mother lamb nearly knocks me out of the ship with joy. They give me a wool scarf that is soft as a sigh.', 'I miss the sunset, and the letters arrive a day late. But Lull holds a celebration anyway, because a lost lamb is more important than any letter.'],
        end: ['The Lamb Comes Home', 'sweet']
      },
      end_storm: {
        t: ['We burst out the far side with a bang and a rainbow. The Dandelion, the mailbag and I are completely soaked. Lull has not had rain in weeks, and the entire island runs out into the street with umbrellas turned upside down to catch the drops.', 'I am declared the First Official Rain Delivery. The mail is a little damp, but nobody complains.'],
        end: ['Rain Delivery', 'funny']
      },
      end_picnic: {
        t: ['The meadow is soft, golden and covered in blankets. Apparently I have landed in the middle of the Lull Sunset Picnic. Someone hands me a sandwich. Someone else hands me a lemonade. A very old gentleman asks me to sit.', 'I deliver the mail later, after dessert, and nobody is cross. We watch the sun melt into the sea, and I decide this is the best landing I have ever made.'],
        end: ['Sunset Picnic', 'happy']
      },
      end_mail: {
        t: ['One by one, the letters find their owners: a birthday card, a seed catalog, a postcard from a cousin in the clouds. The postmistress stamps the final one and hands me a medal made of a button.', 'As the sun slips out of sight, the Dandelion and I rise into the dark and fly home through the stars. It is, I think, the beginning of a very good summer.'],
        end: ['Special Delivery', 'happy']
      },
      end_aunt: {
        t: ['The letter is short. "Dear Theo, if you are reading this, you made it. The sky was always yours. The Dandelion knows the way home. Love, Aunt Vi."', 'The wind picks up, warm and kind, and the postmistress says nothing. I fold the letter into my pocket, climb back into the ship, and fly into the sunset, not at all alone.'],
        end: ['The Sky Is Yours', 'dreamy']
      }
    }
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'bakery_on_maple_lane',
    name: 'The Bakery on Maple Lane',
    description: 'You are Nora, you have just opened your very own bakery, and the quiet flour delivery boy never says more than "Morning."',
    genre: 'Romance',
    protagonist: 'girl',
    interest: 'Elliot',
    hero: 'Nora',
    minutes: 9,
    accent: '#f49bbd',
    cover: 'bakery',
    start: 'start',
    nodes: {
      start: {
        t: [
          'I am Nora, and my bakery has been open for exactly eight days. It smells like cinnamon, the sign is a little crooked, and every Tuesday at six o\'clock, a boy in a flour-dusted cap delivers twenty sacks and says one word: "Morning."',
          'His name is Elliot. It is stitched on his jacket. I would very much like to hear him say a second word.'
        ],
        c: [['Offer him a fresh cinnamon roll', 'roll'], ['Ask him his name, pretending not to know', 'name'], ['Pretend to be very busy', 'busy']]
      },
      roll: {
        t: ['He looks at the roll as though it might be a trick. "I\'ve never had one," he admits. "Cinnamon makes me sneeze when I smell it, so I always hold my breath." I did not know that. I have been baking in front of him for eight days.'],
        c: [['Watch him take the first bite', 'tasted'], ['Ask him how he would draw it', 'sketches']]
      },
      name: {
        t: ['"Elliot," he says, a little pink in the ears. Then, miraculously, he keeps going. "I\'m new to the route. I like the bread smell. I draw it, sometimes, in a notebook." He turns even pinker. I try not to look as delighted as I am.'],
        c: [['Ask to see the notebook', 'sketches'], ['Invite him to the Saturday market', 'market']]
      },
      busy: {
        t: ['I grab a tray of cookies and spin around to look occupied. The tray, unfortunately, keeps spinning after I stop. A cloud of powdered sugar rises into the air. Elliot, who is directly in its path, looks like a very surprised snowman.'],
        c: [['Burst out laughing', 'bake'], ['Apologize at top speed and flee to the back room', 'end_flee']]
      },
      tasted: {
        t: ['Elliot closes his eyes. He takes one slow bite, then another. He does not sneeze. His whole face softens. "Oh," he says, as if someone has told him a lovely secret. "That\'s what the smell was for."'],
        c: [['Ask what he is smiling about', 'sketches'], ['Ask if he would like to try something else, at the market on Saturday', 'market']]
      },
      sketches: {
        t: ['He pulls out a notebook with a rubber band around it. Page after page is filled with soft pencil drawings: loaves, baguettes, a tiny rolling pin. And then, I realize, pages and pages of my bakery. The crooked sign. The steamy window. Me, tying my apron.'],
        c: [['Tell him they are lovely, and I\'d like to keep drawing together', 'evening'], ['Ask if he would draw me a new shop sign', 'end_sign']]
      },
      market: {
        t: ['Saturday is the busiest day of the week, and the market is already full of striped awnings and the sound of someone playing a fiddle badly. Elliot shows up, hands in his pockets, with a basket of daisies, "for the table."'],
        c: [['Ask him to help at the stall', 'end_sellout'], ['Say I am too busy and ask for a rain check', 'end_raincheck']]
      },
      bake: {
        t: ['I laugh so hard I have to hold the counter. Elliot starts laughing too, a surprisingly big laugh for such a quiet person. We are still laughing when the next batch of rolls begins to rise, and he says, shyly, "Can I help?"'],
        c: [['Toss a little flour at him', 'end_flour'], ['Hand him an apron', 'end_apron']]
      },
      evening: {
        t: ['The sun slips low, painting the shop windows gold. Elliot walks the last of the sacks to the back and comes out with his cap in his hands. "Can I walk you home?" he asks. "If you\'d like. Or you could teach me how to make the cinnamon rolls. Either one."'],
        c: [['Say yes, walk home together', 'end_walk'], ['Say I\'d rather teach him tonight', 'end_midnight']]
      },
      end_flee: {
        t: ['I hide in the back room for a full minute, cheeks burning. When I peek out, the van is gone. But on the order slip, in tidy pencil, is a tiny drawing of a flour-dusted snowman waving. Underneath it says, "See you next Tuesday."', 'I pin the slip above the oven. Tuesday cannot come fast enough.'],
        end: ['See You Next Tuesday', 'funny']
      },
      end_raincheck: {
        t: ['"Of course," says Elliot, with a smile that holds no disappointment, only patience. He sets the daisies on my table and tips his cap. All through the busy day, they smile at me from their little jar.', 'Next Tuesday, he is back. So am I. Some things are worth waiting for, and so are some people.'],
        end: ['Worth Waiting For', 'sweet']
      },
      end_walk: {
        t: ['We walk down Maple Lane as the streetlamps wink on. He carries the last bag of flour, even though it is mine. We do not say much. We do not need to. At my door, he gives me a small drawing he has torn from his notebook: the two of us, hand in hand, outside a crooked-signed shop.', '"Just in case," he says, and I decide that crooked signs are the best kind.'],
        end: ['A Walk Down Maple Lane', 'happy']
      },
      end_midnight: {
        t: ['That night, with the shop lights low, I show Elliot how to roll the dough, spread the butter and sprinkle the cinnamon, which he does, holding his breath and then, quite suddenly, not. He sneezes into his sleeve, and we both lose it.', 'By midnight we have forty rolls, flour on every surface, and a plan to do this every Tuesday. The bakery has never smelled so good.'],
        end: ['Midnight Rolls', 'cozy']
      },
      end_sign: {
        t: ['A week later, my crooked sign is gone, and in its place hangs a beautiful new one: a loaf with a heart-shaped crack, and curly letters. Underneath, in smaller writing, are two names: "Nora" and, right beside it, "Elliot."', 'He blushes when I point it out. "I was hoping that was okay," he says. It is more than okay.'],
        end: ['Two Names on the Sign', 'happy']
      },
      end_sellout: {
        t: ['Elliot turns out to be a natural. He wraps bread with the care of a person tying ribbons on gifts, and everyone who buys from him walks away smiling. By two o\'clock the stall is empty, and the daisies are the only thing left.', 'He tucks one behind my ear without a word. "For the best bakery on Maple Lane," he says. I think I might be the one who is speechless this time.'],
        end: ['Sold Out', 'happy']
      },
      end_flour: {
        t: ['I flick a pinch of flour at him. He stares at me in shock, and then retaliates with a handful twice as large. Within seconds the kitchen is a snowstorm, and we are both gasping with laughter.', 'When the dust settles, he looks at me, white from hair to boots, and says, "Would you like to have dinner sometime? Somewhere without flour?" I tell him I will think about it. I have, for about two seconds.'],
        end: ['Snowstorm in the Kitchen', 'funny']
      },
      end_apron: {
        t: ['I tie the apron strings behind him, and he stands very still, as if he were being measured for a crown. We roll, fold, glaze and bake, shoulder to shoulder, until the shop smells like a warm hug.', 'When we sit down to taste the first batch, he says, "I think I\'d like to deliver flour to you for a very long time." I think I would, too.'],
        end: ['The Apron', 'sweet']
      }
    }
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'letters_at_the_lighthouse',
    name: 'Letters at the Lighthouse',
    description: 'You are Sam, the mail-boat boy, and a bottle on the beach asks a question: is the sea lonely too?',
    genre: 'Romance',
    protagonist: 'guy',
    interest: 'Clara',
    hero: 'Sam',
    minutes: 9,
    accent: '#7fcfe0',
    cover: 'lighthouse',
    start: 'start',
    nodes: {
      start: {
        t: [
          'I\'m Sam, and I deliver the mail by boat to every island between here and the horizon. This morning the mist is thick and pearl-colored, and when I pull up at Lighthouse Rock, a small green bottle is rolling gently on the sand.',
          'Inside it is a note in slanted handwriting: "To whoever finds this: is the sea lonely too?" I read it three times. Whoever wrote it is somewhere nearby.'
        ],
        c: [['Climb the spiral stairs to find the writer', 'stairs'], ['Write a reply and send the bottle back', 'reply'], ['Ask the seagulls, who always know everything', 'gulls']]
      },
      stairs: {
        t: ['The stairs wind up and up. At the top, in the lamp room, a girl my age is polishing the great glass lens, humming. She turns, sees the bottle in my hand, and goes the color of a sunrise. "Oh," she says. "Oh no. You found it."'],
        c: [['Tell her I\'m glad I did', 'admit'], ['Pretend I came to inspect the lamp', 'pretend']]
      },
      reply: {
        t: ['I scribble an answer on the back of a delivery slip: "Sometimes. But it is better with a friend on the shore." I seal the bottle, wade out to my knees and let the tide carry it away. The next morning there is a new bottle in the same spot, with a new note: "Who are you?"'],
        c: [['Keep writing back and forth', 'pen_pals'], ['Go up and meet her instead', 'stairs']]
      },
      gulls: {
        t: ['The gulls stare at me. Then the biggest one snatches the note out of my hand, flaps up the cliff and drops it at the feet of a girl on the lighthouse balcony. She reads it, looks at me, and waves. I think I just delivered my own mail.'],
        c: [['Run up the stairs after the gulls', 'stairs']]
      },
      admit: {
        t: ['"I\'m Clara," she says, and tucks a strand of hair behind her ear. "My father keeps the light, and I keep the lonely thoughts." She shows me a brass telescope pointed at the first evening star. "Would you like to look?"'],
        c: [['Stay for sunset', 'sunset'], ['Offer to take her out on my boat', 'boat']]
      },
      pretend: {
        t: ['"Just checking the lamp," I say, and press the nearest lever, very officially. The great light swings around, and a foghorn the size of a house blasts across the bay. Clara claps her hands over her ears, and we both nearly tumble into the lens.'],
        c: [['Confess everything', 'admit'], ['Keep pretending anyway', 'end_busted']]
      },
      pen_pals: {
        t: ['For weeks, bottles drift back and forth. She tells me about the storm that taught her to count waves. I tell her about the otter who steals my mail. Her handwriting becomes the best part of my morning.', 'One day she writes, "You know my name. May I know yours?" I realize I have never signed a single letter.'],
        c: [['Finally sign my name', 'end_letters'], ['Leave it a mystery until we meet', 'end_mystery']]
      },
      sunset: {
        t: ['The sun sets slowly, painting the water orange and lavender. Clara stands beside me at the rail, and her father starts the great lamp for the night. It turns, slow and gold, across the waves. "It\'s the best part of the day," she says softly.'],
        c: [['Take her hand as the lamp sweeps past', 'end_lamp'], ['Tell her I\'m afraid of storms', 'end_storm_tale']]
      },
      boat: {
        t: ['My little mail boat rocks like a cradle. Clara sits in the bow with her hands trailing in the water, laughing every time a wave tickles her wrist. The sea is calm, the evening is warm, and the gulls trail behind us like a parade.'],
        c: [['Row to the sandbar at low tide', 'end_sandbar'], ['Show her my mail route', 'end_route']]
      },
      end_busted: {
        t: ['The foghorn blasts again. And again. Clara\'s father bursts in, still holding a sandwich, and finds me hugging the control panel. "You\'re the new inspector?" he says. "Then you\'ll want to check the other lamp." There is no other lamp.', 'I am marched around the entire lighthouse before lunch. Clara walks beside me, trying very hard not to laugh. By the end, she\'s laughing so hard she has to hold the railing. I do not mind.'],
        end: ['The Official Inspector', 'funny']
      },
      end_letters: {
        t: ['"Dear Clara," I write, "my name is Sam, and I would like to carry this letter to you in person." I row to the rock the next morning. She is already waiting on the dock, with a bottle in each hand.', 'We sit on the rocks until the tide comes in, reading each other\'s letters out loud. It turns out that handwriting can fall in love before the people do.'],
        end: ['Dear Clara', 'sweet']
      },
      end_mystery: {
        t: ['"Meet me on the dock at dawn," I write, and leave the name off. Dawn comes cold and clear. Clara stands on the planks, holding the bottle, squinting at the one boy in the whole bay who is carrying a bag of mail.', '"It\'s you!" she says. "I knew it! The otter told me." She has been guessing for weeks. We stand there laughing, a mystery solved, and a much better one just starting.'],
        end: ['The Mystery Solved', 'dreamy']
      },
      end_lamp: {
        t: ['The light sweeps across the water, and I take her hand, just as it passes. She does not let go. We stand there as the beam turns, once, twice, ten times, neither of us wanting to be the first to speak.', '"Is the sea lonely?" I ask at last. She squeezes my hand. "Not tonight," Clara says.'],
        end: ['Not Tonight', 'happy']
      },
      end_storm_tale: {
        t: ['"I hate storms," I admit, a little embarrassed. "Out on the water, they\'re so loud." Clara doesn\'t laugh. She points at the great lamp. "That\'s what it\'s for. It isn\'t only a light. It\'s a promise that somebody is watching for you."', 'From that night on, whenever the sky grows dark and the waves turn rough, I look for the golden beam. And I always know exactly who is behind it.'],
        end: ['Somebody Is Watching', 'sweet']
      },
      end_sandbar: {
        t: ['The tide has pulled back to reveal a long, silver sandbar shaped like a smile. We step out barefoot and walk across it, with the sea on both sides, wet sand squishing between our toes. Clara runs ahead, spinning, her arms wide.', 'We stay until the water begins to creep back over our ankles. Then we dash for the boat, drenched, giggling and without a single regret.'],
        end: ['The Sandbar', 'happy']
      },
      end_route: {
        t: ['I show her every island on my route, the otter who steals the mail, the old man with seventeen cats, the tiny post office on stilts. Clara has never been past the rock before. Her eyes grow wider with every stop.', 'At the last island, the postmaster stamps a card with a little compass on it. "Assistant Postmaster," he says, handing it to her. She holds it as though it were a medal. And from that day on, the boat has two sets of oars.'],
        end: ['Two Sets of Oars', 'cozy']
      }
    }
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'the_great_pie_disaster',
    name: 'The Great Pie Disaster',
    description: 'Gran has trusted you with the prize blueberry pie. All you have to do is carry it across town. What could possibly go wrong?',
    genre: 'Comedy',
    protagonist: 'guy',
    hero: 'Benji',
    minutes: 8,
    accent: '#ffc3b0',
    cover: 'pie',
    start: 'start',
    nodes: {
      start: {
        t: [
          'My name is Benji, and I am carrying the most important pie in the history of Bumbleford. It is Gran\'s blueberry masterpiece, and the Pie Fair judging starts in twenty minutes.',
          '"Three rules," says Gran, holding my shoulders. "Don\'t tip it. Don\'t drop it. And do not, under any circumstances, let Mr. Pennywhistle\'s goat see it." I nod bravely. There are three ways to the fair.'
        ],
        c: [['Take the main road', 'main'], ['Take the back alley', 'alley'], ['Ride in Pip\'s wagon', 'wagon']]
      },
      main: {
        t: ['The main road is packed. A juggler is tossing flaming torches, a marching band is warming up, and two ladies are having a loud argument about hats. There is barely room to hold a pie, never mind walk.'],
        c: [['Squeeze through the crowd', 'squeeze'], ['Wait for the crowd to thin out', 'wait']]
      },
      alley: {
        t: ['The alley is quiet and shady and smells of cabbages. Halfway down, standing in the middle of the path, chewing slowly, is a very large goat in a bow tie. It is Mr. Pennywhistle\'s goat. It looks at the pie. The pie looks at me.'],
        c: [['Distract the goat with a cabbage', 'cabbage'], ['Run for it', 'run']]
      },
      wagon: {
        t: ['Pip, the neighborhood kid, has a wagon and a great deal of confidence. "I\'ll have you there in two minutes," she says. She does not mention that the road is a very steep hill, and that her brakes are, as she puts it, "more of a suggestion."'],
        c: [['Hold on tight and trust Pip', 'hill'], ['Ask Pip to slow down', 'slow']]
      },
      squeeze: {
        t: ['I hold the pie high and sidestep between two tubas. A baker\'s elbow catches my arm, and the pie leaps out of my hands, turning slowly in the air, a perfect purple moon, while the whole crowd gasps.'],
        c: [['Catch it with my hat', 'end_hat'], ['Catch it with my face', 'end_face']]
      },
      wait: {
        t: ['I wait. And wait. The crowd does not thin. The marching band starts a second song. By the time the street clears, I can hear the Fair bell ringing, and I have exactly three minutes to cross the whole town.'],
        c: [['Sprint to the fair', 'fair']]
      },
      cabbage: {
        t: ['I hold out a cabbage like a peace offering. The goat takes it gently and begins to munch. Then, to my surprise, he kneels down, and I realize he is offering me a ride. He is wearing a saddle, which I somehow had not noticed.'],
        c: [['Ride the goat to the fair', 'end_goat'], ['Politely walk past and head for the fair', 'fair']]
      },
      run: {
        t: ['I run. The goat runs after me. We pass the bakery, the post office and a very startled man holding a ladder. The goat\'s bow tie flutters in the wind behind him. Ahead of me, bright and splashy, is the town fountain.'],
        c: [['Jump into the fountain', 'end_fountain']]
      },
      hill: {
        t: ['The wagon begins to roll. Then to rumble. Then to scream. We are hurtling down the hill at a speed no pie was meant to travel, with Pip shouting "Whee!" and my hair standing straight up. The fair is at the bottom, and so is a very large haystack.'],
        c: [['Scream and hold the pie to my chest', 'end_hill'], ['Leap into the hay cart as we pass', 'end_hay']]
      },
      slow: {
        t: ['"Fine," says Pip, with a sigh, and drags her heels until the wagon rolls along at the pace of a thoughtful snail. We trundle into the town square, pie perfectly intact. Pip looks at it, then at me, with a hungry eye.'],
        c: [['Give Pip a slice for her trouble', 'end_share'], ['Politely say no and carry on to the fair', 'fair']]
      },
      fair: {
        t: ['I arrive at the judges\' table out of breath, sweaty and, miraculously, holding a flawless pie. Three judges in tall hats peer down at it. The head judge raises one eyebrow. "Well, young man?" she says. "Is this a perfect pie?"'],
        c: [['Say yes, proudly', 'end_win'], ['Admit it has a little dent', 'end_honest']]
      },
      end_hat: {
        t: ['The pie lands, with a splat, right in my hat. It is a perfect catch, if you ignore the purple dripping down my forehead. The crowd erupts in applause, and the baker who bumped me gives a standing ovation.', 'I win Best Dressed Hat at the Fair. Gran is delighted. The pie, sadly, is now mostly hat. We eat it anyway.'],
        end: ['Best Dressed Hat', 'funny']
      },
      end_face: {
        t: ['The pie lands face first. My face, that is. Everything goes dark, sweet and blueberry. When I lift my head, the whole crowd is silent. Then someone starts laughing, and then everyone is.', 'Gran wipes my face with her apron. "Well," she says, "that\'s the first time anyone has tasted the pie from the inside." She enters me in the Funniest Face category instead. I win by a mile.'],
        end: ['Blueberry Face', 'funny']
      },
      end_goat: {
        t: ['The goat trots into the fair as though he owns it. The crowd parts like water. I sit on his back holding the pie like a crown, with the bow tie flapping. Mr. Pennywhistle takes off his hat and bows.', 'The judges award us first prize for Most Dramatic Entrance. The goat eats the winning ribbon. We both consider this a fair trade.'],
        end: ['The Goat Express', 'funny']
      },
      end_fountain: {
        t: ['I leap into the fountain, holding the pie high above my head like a trophy. The goat skids to a stop at the edge, glares, and politely lowers his head to drink. The pie, I notice, is entirely dry.', 'Somehow, I am the only wet thing. The judges applaud, the goat sulks, and Gran says, "At least you kept the pie dry." I think that is the highest compliment I have ever received.'],
        end: ['Fountain Hero', 'funny']
      },
      end_hill: {
        t: ['We hit the haystack at the bottom with a great, soft WHUMP. Hay flies everywhere. Pip is sitting on my shoulders, and I am sitting on the wagon, and the pie is sitting, perfectly unharmed, on top of Pip\'s head.', '"Told you," she says. "Two minutes." The crowd cheers. Gran fans herself with her apron. The pie wins a ribbon, and Pip wins a lifetime ban from the hill.'],
        end: ['Two Minutes Flat', 'happy']
      },
      end_hay: {
        t: ['I leap. The hay cart catches me with a puff, and the pie lands on my stomach, still perfectly level. The wagon continues down the hill with Pip, who is waving with both hands and having the time of her life.', 'The farmer driving the cart glances back at me, deeply unsurprised. "The fair is that way, son," he says. I deliver the pie on a hay cart. It wins "Best Entrance By Vehicle," which is not even a real category, but they invent it.'],
        end: ['Hay Cart Hero', 'funny']
      },
      end_share: {
        t: ['Pip takes her slice with great ceremony and eats it in one bite. "Best pie ever," she says, mouth full. We sit on the curb of the town square, passing the rest of the pie back and forth, until only the plate is left.', 'I miss the Fair, but Gran does not mind a bit. "A pie is for sharing," she says. "The judges can eat their own." And I think she is probably right.'],
        end: ['A Pie Is for Sharing', 'sweet']
      },
      end_win: {
        t: ['"It is the perfect pie," I say, and I mean it. The judges taste it, one by one, and their eyes close in unison. Someone sniffs. A tear rolls down the head judge\'s cheek.', 'Gran wins first prize, for the fifteenth year in a row. She hugs me, and I realize I have delivered the pie, the whole way, without a single disaster. I look around for the goat. He is quietly eating the ribbon.'],
        end: ['The Perfect Pie', 'happy']
      },
      end_honest: {
        t: ['"It has a small dent on the left," I confess. "From the walk." The head judge looks at me, and then, slowly, she smiles. "Honesty," she says. "Delicious." She awards Gran a special ribbon for Most Honest Delivery, and tastes the dented side first.', 'Gran is so proud she gives me the first slice. It is, I must admit, the best pie I have ever had, dent and all.'],
        end: ['Honest and Delicious', 'sweet']
      }
    }
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'the_museum_after_midnight',
    name: 'The Museum After Midnight',
    description: 'You are Juniper, the night-shift apprentice. Every midnight, something in the museum moves. Tonight you intend to find out what.',
    genre: 'Mystery',
    protagonist: 'girl',
    hero: 'Juniper',
    minutes: 8,
    accent: '#d9cdf6',
    cover: 'museum',
    start: 'start',
    nodes: {
      start: {
        t: [
          'I am Juniper, and I have been the night-shift apprentice at the Little Lantern Museum for exactly one week. In that week, five things have moved by themselves: a teacup, two statues, a very large rug, and tonight, the skull of the dinosaur skeleton.',
          'It is just past midnight. The skull is on the floor, six feet from where it belongs, and the hall is as quiet as a held breath. I have a flashlight, a notebook and a snack.'
        ],
        c: [['Check the clock room', 'clock'], ['Follow the muddy little footprints', 'prints'], ['Hide behind the mummy case and watch', 'watch']]
      },
      clock: {
        t: ['The clock room is silent. The great brass clock stands frozen at twelve, and on its glass face a note has been taped: "Back by one. Please do not wind me. Signed, The Curator." Which is odd, because the Curator went home at six.'],
        c: [['Wind the clock anyway', 'wind'], ['Look for footprints near the clock', 'prints']]
      },
      prints: {
        t: ['A trail of tiny muddy prints runs across the marble floor, toward the portrait gallery. They are no bigger than a thumbnail, and each one has five very small toes. Someone small, and extremely busy, has been walking here.'],
        c: [['Follow the prints to the gallery', 'gallery'], ['Measure the prints with my ruler', 'ruler']]
      },
      watch: {
        t: ['I crouch behind the mummy case, with my snack. A long time passes. My foot goes to sleep. Then, at last, a faint rustling comes from the dark. A tiny shape in a paper crown scurries out, and then another, and another, whispering with excitement.'],
        c: [['Jump out and shout "Aha!"', 'end_scare'], ['Keep watching quietly', 'party']]
      },
      wind: {
        t: ['I turn the great brass key, one, two, three times. The clock gives a deep, grateful chime. All around the museum, softly, things start to stir: the stuffed owl blinks, a suit of armor lifts a gauntlet, and a faint tune drifts from somewhere down the hall.'],
        c: [['Follow the music', 'party'], ['Hide and see what wakes up', 'watch']]
      },
      gallery: {
        t: ['The portraits in the gallery watch me pass. One of them, a grand lady in a ruffled collar, clears her throat. "If you are looking for the culprit, dear," she says, "you will want to ask the mice. And please, stand up straighter."'],
        c: [['Go and ask the mice', 'party'], ['Argue with the portrait', 'end_portrait']]
      },
      ruler: {
        t: ['I lay my ruler beside a print. It is exactly two centimeters long. It is a mouse. A very busy mouse, with very clean footprints, and, judging by the trail, a great sense of direction. The tracks lead toward the tea room.'],
        c: [['Follow the tracks to the tea room', 'party'], ['Take my findings to the portrait lady', 'gallery']]
      },
      party: {
        t: ['In the tea room, hundreds of mice are having a ball. A tiny orchestra plays on thimbles and teaspoons. The dinosaur\'s skull is the drum. A mouse in a golden crown, clearly the queen, spots me and stops the music. The whole room freezes.'],
        c: [['Ask if I can join the dance', 'end_dance'], ['Explain that the museum opens in the morning', 'tidy'], ['Take a photo for evidence', 'end_photo']]
      },
      tidy: {
        t: ['The queen listens carefully, nodding. "We never meant to cause trouble," she squeaks. "We only move things to find a better dancing floor." She looks hopeful. The orchestra holds its breath. I think I can make a deal.'],
        c: [['Offer them a weekly party night', 'end_deal'], ['Offer to become their official guardian', 'end_guardian']]
      },
      end_scare: {
        t: ['"AHA!" I shout. Four hundred mice shriek. Four hundred mice scatter. The orchestra drops its teaspoons, the dinosaur skull rolls across the floor, and a whole tray of crumbs flies into the air like confetti.', 'When the dust settles, I am alone in an empty tea room, covered in crumbs. A tiny sign has been left on the floor: "Rude." I feel terrible. I leave a small piece of cheese out as an apology.'],
        end: ['Aha!', 'funny']
      },
      end_portrait: {
        t: ['"I will not be told how to stand by a painting," I say. "I will be told whatever I like," says the portrait. Two hours later we are still arguing. By dawn, the whole gallery has joined in, and the guard finds me shouting at a wall.', 'I win the argument. The portrait lady, to my surprise, is thrilled. "Nobody has talked to me in forty years," she says. She promises to tell me everything, every midnight. The mice, however, remain a mystery.'],
        end: ['A Very Long Argument', 'funny']
      },
      end_dance: {
        t: ['"May I?" I ask, and the queen nods grandly. A teacup is pushed forward for me to stand on. The orchestra strikes up a waltz, and I dance, very carefully, with a very small partner in a very tiny hat.', 'We twirl until the sun comes up. When I leave, I carry the skull back to the dinosaur, and I do not tell a soul. Some secrets are too lovely to report.'],
        end: ['The Midnight Waltz', 'dreamy']
      },
      end_photo: {
        t: ['I raise my camera, and the flash goes off. Four hundred mice blink. The queen blinks. And then, one by one, they all pose, paws on hips, whiskers up, for the best group photo I have ever taken.', 'In the morning, the Curator studies the picture for a very long time. "Well," he says at last. "That explains the rug." He hangs it in the hall, between two paintings, with the title: "Staff Party."'],
        end: ['Staff Photo', 'happy']
      },
      end_deal: {
        t: ['"Every Friday," I say, "from midnight until two. You may use the tea room, and the dinosaur\'s skull, but please put everything back." The queen thinks about it, and then solemnly shakes my finger.', 'From then on, the museum is spotless on Saturday mornings. Nothing is ever out of place again. Except, once a week, a single tiny paper crown, left on my desk with a thank-you note.'],
        end: ['Friday Night Deal', 'happy']
      },
      end_guardian: {
        t: ['"I\'ll protect your party," I say, "and I\'ll keep your secret." The queen takes off her crown and sets it, gently, on my notebook. A hundred tiny voices cheer. I am officially the Guardian of the Little Lantern Museum, by night as well as by day.', 'Every midnight, I lock the doors, light a candle in the tea room, and sit quietly with a crumb of cake. It is, without question, the best job in the world.'],
        end: ['The Guardian', 'sweet']
      }
    }
  }
];
