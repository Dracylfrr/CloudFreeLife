// Story Adventures added in 1.3. Same compact format as adventures.mjs:
//   node   = { t: [paragraphs], c: [[choice text, target id], ...] }
//   ending = { t: [paragraphs], end: [title, mood] }   mood: happy | sweet | funny | dreamy | cozy
// Two girls and two guys; the two romances are guy-and-girl stories, always gentle and all-ages.

export const adventuresNew = [
  // ------------------------------------------------------------------ 7 (girl, mystery)
  {
    id: 'the_missing_lullaby',
    name: 'The Case of the Missing Lullaby',
    description: 'Every night the clock tower rings a lullaby. Tonight it is silent, and the whole village is wide awake. Can you find out why?',
    genre: 'Mystery',
    protagonist: 'girl',
    hero: 'Hana',
    minutes: 12,
    accent: '#a698e0',
    cover: 'lullaby',
    start: 'start',
    nodes: {
      start: {
        t: [
          'I am Hana, and I am the bell-keeper\'s apprentice in the village of Dozing Hill. Every night at nine, the old clock tower plays a lullaby, and every night the whole village falls asleep.',
          'Tonight nine o\'clock came and went in perfect silence. Now the babies are fussing, the owls are yawning and refusing to sleep, and even the cows are standing in the road, looking worried. Somebody has to find out what happened to the lullaby.'
        ],
        c: [['Climb the clock tower and look at the bell', 'tower'], ['Ask the baker, who is always up late', 'baker'], ['Follow a strange, low humming from the meadow', 'meadow']]
      },
      tower: {
        t: [
          'The bell hangs where it always has, big and bronze and quiet. But when I look inside, the clapper is gone. That is the little iron tongue that makes the bell ring. There is only a scratch in the dust, a single gray feather and a few golden crumbs.'
        ],
        c: [['Follow the feather', 'owl'], ['Follow the crumbs', 'baker'], ['Look out of the tower window for more clues', 'window']]
      },
      window: {
        t: [
          'From the tower window I can see the whole village, and it is all awake. Lamps burn in every house. In the square, the animals have gathered in a big, tired circle, as if waiting for someone to tell them what to do.',
          'And then I notice a thin silver line of moonlight shining on the weathervane, where something small and glittery is moving about.'
        ],
        c: [['Climb out to the weathervane', 'magpie_nest'], ['Go down and talk to the animals in the square', 'square']]
      },
      square: {
        t: [
          'The cows, the sheep, two goats and an extremely sleepy goose are all standing in the square. "We cannot sleep without the bell," says the goose. "It is how we know the day is finished."',
          'They are all looking at me. The bell-keeper is away at his sister\'s, which means that tonight I am the bell-keeper.'
        ],
        c: [['Say I will sing them the lullaby myself', 'end_sing'], ['Promise to find the missing clapper', 'baker'], ['Ask if anyone has seen something shiny', 'magpie_nest']]
      },
      baker: {
        t: [
          'The bakery is the only place with its lights on, and it smells like warm cinnamon. Mrs. Crumb is sitting up with her cat, Biscuit, a very round orange cat with a very loud purr.',
          '"Hana, dear!" she says. "Nobody can sleep, so I am baking. Want a bun? There was a trail of my crumbs all the way out the door this evening, which is odd. I never drop crumbs."'
        ],
        c: [['Take a bun and ask about the crumbs', 'bun'], ['Ask Biscuit if he has seen anything', 'cat'], ['Follow the crumb trail outside', 'crumbs']]
      },
      bun: {
        t: [
          'The bun is warm and sweet and I eat it in three bites. Mrs. Crumb thinks. "A trail of crumbs, you say, and a bell that will not ring. Now that you mention it, there were bees at my window earlier, bees at night, humming a very deep note."'
        ],
        c: [['Go and find the bees', 'hive'], ['Ask her for a honey cake to take along', 'cake']]
      },
      cake: {
        t: [
          'Mrs. Crumb wraps a honey cake in a napkin, still warm, and tucks it into my pocket. "If you meet anyone grumpy," she says, "feed them cake. It solves most things." She is right more often than you would think.'
        ],
        c: [['Follow the crumb trail', 'crumbs'], ['Head for the meadow and the humming', 'meadow']]
      },
      cat: {
        t: [
          'Biscuit blinks very slowly, which is how cats say anything. Then he begins to purr. It is a low, round, rumbling purr that fills the whole bakery, and I realize my own eyes have gone heavy. Mrs. Crumb is already nodding in her chair.'
        ],
        c: [['Carry Biscuit to the square and let him purr', 'end_purr'], ['Shake myself awake and keep investigating', 'crumbs']]
      },
      crumbs: {
        t: [
          'The golden crumbs lead down the lane, past the well and under a hedge, in a neat dotted line. At the end of it, among the tall grass, a low and steady humming hangs in the air. It sounds exactly like a bell, if a bell could buzz.'
        ],
        c: [['Walk into the humming', 'hive']]
      },
      meadow: {
        t: [
          'The meadow is silver under the moon. The humming gets louder as I walk, a deep, round note that I know very well. It is the note of the clock tower bell. But it is coming from somewhere low, near the ground, among the clover.'
        ],
        c: [['Tiptoe toward the sound', 'hive'], ['Whisper "hello?" first', 'hive_hello']]
      },
      hive_hello: {
        t: [
          'A hundred tiny voices answer at once, a buzzing cloud of "hello". It turns out the bees are far more polite than they sound. A fat, fluffy bee hovers at my nose. "Are you the bell girl?" she asks. "We have been hoping somebody would come."'
        ],
        c: [['Ask them what they have done with the clapper', 'hive']]
      },
      hive: {
        t: [
          'In the middle of the clover stands an old hollow log, and inside it hangs the bell clapper, as dark and heavy as a bunch of grapes. The bees have wrapped it in wax, and they take turns tapping it with their tiny wings. Bong. Bong. Bong. A bee-sized bell.',
          '"We borrowed it," says the fluffy bee, rather guiltily. "We have never had a song of our own. We heard the tower every night and wanted to learn how."'
        ],
        c: [['Ask them politely to give it back', 'bees_ask'], ['Snatch it and run', 'bees_grab'], ['Sit down and listen to what they play', 'end_bees']]
      },
      bees_ask: {
        t: [
          'The bees go quiet. "We would give it back," says the fluffy bee, "but we would never hear our song again." She looks hopeful. "Could you perhaps teach us the lullaby? Or bring us something sweet?"'
        ],
        c: [['Hum the lullaby for them to learn', 'end_sing_bees'], ['Promise them a honey cake, a big one', 'bees_deal']]
      },
      bees_deal: {
        t: [
          'I promise them the biggest, stickiest honey cake the village has ever baked, delivered tomorrow, with extra honey. They buzz a long, serious conference, and then the fluffy bee nods and the clapper rolls gently out of the log into my hands.',
          'It is heavy and warm and smells of clover. I can finally hear the bell tower calling, as if it knew.'
        ],
        c: [['Run back and fix the bell', 'fix']]
      },
      bees_grab: {
        t: [
          'I snatch the clapper and sprint. Behind me rises a cloud of very offended bees, buzzing like a kettle that has been left on the fire. I run through the clover, over the stile and straight into the pond with a tremendous splash. The clapper sinks.'
        ],
        c: [['Wade in and find it', 'pond'], ['Give up and go home', 'end_spoon']]
      },
      pond: {
        t: [
          'The pond is shallow and cold and full of frogs who find me very funny. I feel around in the mud until my fingers close on something iron. I rise up dripping, with a clapper, a lily pad on my head and a frog sitting on my shoulder who refuses to leave.'
        ],
        c: [['March back to the tower, frog and all', 'fix']]
      },
      owl: {
        t: [
          'The gray feather smells faintly of pine. I follow a hunch to the hollow oak by the church, where Mr. Hoot the owl is perched with his eyes wide open, which is not how owls normally look at this hour.',
          '"It is not my feather," he says at once, which is the sort of thing a person says when it is his feather. "Possibly it is. But I did not take your clapper, and I do not know a thing about a magpie."'
        ],
        c: [['Say "I never said anything about a magpie"', 'owl_clue'], ['Offer him warm milk to calm him down', 'owl_milk']]
      },
      owl_clue: {
        t: [
          'Mr. Hoot sags. "All right. A magpie asked if she could borrow something shiny for her nest. I said she could have whatever she liked from the tower, as long as she was quiet. I thought she meant a spoon." He hangs his head. "She is on the weathervane."'
        ],
        c: [['Climb to the weathervane', 'magpie_nest']]
      },
      owl_milk: {
        t: [
          'Mr. Hoot sips the milk, and with every sip his eyes get a little heavier. "Magpie," he mumbles. "Weathervane. Shiny. So sorry." And then he tips quietly sideways and starts to snore, which is the first snore I have heard all night.'
        ],
        c: [['Tiptoe away to the weathervane', 'magpie_nest']]
      },
      magpie_nest: {
        t: [
          'The weathervane is a long climb, but I am good at climbing. At the top is an enormous nest crammed with sparkles: spoons, buttons, a thimble, a tiny silver key. And right in the middle, gleaming like a star, is the bell clapper.',
          '"Mine," says the magpie, whose name is Pennywhistle. She is about the size of a teapot and twice as proud. "A gift. I did ask."'
        ],
        c: [['Trade her my shiniest button', 'magpie_trade'], ['Offer to polish all her treasures', 'magpie_polish'], ['Shoo her off and grab it', 'magpie_shoo']]
      },
      magpie_trade: {
        t: [
          'I take off the brass button from my coat, the one my grandmother sewed on, which shines like a tiny sun. Pennywhistle gasps. She turns it over and over, and then she hops aside and nudges the clapper toward me with her beak. "A fair trade," she says. "But I will be visiting."'
        ],
        c: [['Climb down and fix the bell', 'fix']]
      },
      magpie_polish: {
        t: [
          'I borrow a handkerchief and rub every spoon and button until the whole nest sparkles like a chandelier. Pennywhistle is so delighted that she gives me the clapper at once, and also, for reasons she cannot explain, a thimble.',
          '"The tower is yours," she says. "I prefer a nest that looks like this." She settles into it like a queen.'
        ],
        c: [['Climb down and fix the bell', 'fix']]
      },
      magpie_shoo: {
        t: [
          'I flap my arms and yell, and Pennywhistle takes off in a squawking fury. She snatches the clapper in her beak and carries it, with great dignity, three villages away. I stand on the weathervane in the moonlight, feeling much worse than a bell-keeper should.'
        ],
        c: [['Go back and sing to the village instead', 'end_sing'], ['Fetch a spoon and a teapot from the bakery', 'end_spoon']]
      },
      fix: {
        t: [
          'I climb the tower, panting, and slot the clapper into the bell, where it settles with a small, satisfied click. The whole tower seems to sigh. The village below is quiet, waiting, with a thousand sleepy faces turned toward me.',
          'It is already half past eleven. The bell needs to be rung, and I have never rung it by myself.'
        ],
        c: [['Ring it as softly as I can', 'end_bell'], ['Ring it with all my might', 'end_loud'], ['Ring it once, then hum along', 'end_hum']]
      },
      end_bell: {
        t: ['One gentle pull of the rope. The bell opens its bronze mouth and the lullaby floats out across the rooftops, slow and golden, exactly as it always has. By the third note, the cows are lying down in the square. By the fifth, the lights in the houses have gone out, one by one, like candles.', 'I sit in the tower, with the rope in my hands, and listen to the whole village falling asleep. It is the best sound I have ever made.'],
        end: ['The Bell-Keeper', 'happy']
      },
      end_loud: {
        t: ['I pull with all my might, and the bell does not play a lullaby. It plays a tremendous BONG that rattles every window in Dozing Hill and sends forty pigeons into the air. For one second everybody in the village sits straight up in bed.', 'Then, one by one, they start to laugh. It is the happiest, silliest midnight in the village\'s history, and nobody is the least bit sleepy until at least three o\'clock.'],
        end: ['The Great Big BONG', 'funny']
      },
      end_hum: {
        t: ['I ring it once, softly, and then I do something I have never done. I hum along. My voice is small, but it fits in the gaps between the notes. The bell carries it out over the roofs, and soon I can hear other voices joining in from open windows, a baby\'s coo, a farmer\'s bass, the goose, trying her best.', 'By the end the whole village is humming together, in the dark, from their beds. Nobody sleeps right away. But everyone is smiling when they do.'],
        end: ['A Village Humming', 'dreamy']
      },
      end_sing: {
        t: ['I stand on the steps of the fountain, in front of all the tired animals and half the sleepy village, and I sing the lullaby. My voice wobbles on the first line and then settles, the way a boat does after the first wave.', 'The goose is the first to fall asleep, standing up. Then the sheep. Then the cows. By the end of the third verse, the only one awake is me, and I do not mind a bit. I am the bell-keeper tonight, with a song instead of a bell.'],
        end: ['Hana Sings', 'sweet']
      },
      end_sing_bees: {
        t: ['I hum the lullaby for the bees, very slowly, one note at a time. They echo each phrase in their deep, buzzing voices, getting it wrong in the sweetest way. By the fifth try it is almost right. By the tenth it is lovely.', 'The fluffy bee flies the clapper to the tower herself, a whole line of bees carrying it between them, and the lullaby that night is played by the bell and sung by a hundred tiny voices underneath it. It is the best the song has ever sounded.'],
        end: ['The Bees\' Chorus', 'sweet']
      },
      end_bees: {
        t: ['I sit down in the clover and listen. The bees tap the clapper, bong, bong, bong, and add their own hum on top, and the sound is so peaceful that my eyes close before I know it. It is not the lullaby, exactly. It is a new one, made of clover and moonlight and bees.', 'I wake at sunrise with a bee asleep on my nose and the clapper still warm beside me. I carry it back to the tower with a honey cake in my pocket, and the village, which slept anyway, has never looked so rested.'],
        end: ['A New Lullaby', 'dreamy']
      },
      end_purr: {
        t: ['I carry Biscuit to the square and set him on the edge of the fountain. He looks around at all the tired faces, sighs like an old man, and begins to purr. It is the loudest purr in the history of purring, and it rolls over the square like a warm wave.', 'Within a minute the goose has collapsed in a heap. The cows go next, and then the sheep, and the babies in their windows, and finally me. We all sleep like stones. In the morning, the clapper turns up in the sewing basket of Mrs. Crumb, who does not remember putting it there.'],
        end: ['The Purr Heard Round the Village', 'cozy']
      },
      end_spoon: {
        t: ['I run to the bakery and borrow a big wooden spoon and a copper teapot from Mrs. Crumb. Back at the tower, I climb up to the dark bell and tap it with the spoon. It does not sound like a lullaby. It sounds like a very musical kitchen.', 'But the village hears the rhythm, soft and slow, ping, ping, pong. And by some magic of tiredness and good intentions, it works. They all fall asleep, one house at a time, to the sound of a teapot being played gently by a girl with a spoon.'],
        end: ['A Very Musical Kitchen', 'funny']
      }
    }
  },

  // ------------------------------------------------------------------ 8 (guy, comedy)
  {
    id: 'rainy_day_radio',
    name: 'Rainy Day Radio',
    description: 'You run the smallest radio station in the world from a lighthouse-shaped shed. Today it will not stop raining, and everything that can go wrong is going wrong.',
    genre: 'Comedy',
    protagonist: 'guy',
    hero: 'Otis',
    minutes: 11,
    accent: '#8fc7ec',
    cover: 'radio',
    start: 'start',
    nodes: {
      start: {
        t: [
          'My name is Otis, and I am the entire staff of Radio Puddle, the smallest radio station in the world. It lives in a shed behind the post office, and it broadcasts to forty-one listeners, three of whom are cows.',
          'It has been raining since breakfast. The roof leaks in four places, the microphone is wearing a tiny raincoat, and in exactly five minutes I am supposed to go on air with the Big Rainy Day Special. I have no idea what the special is.'
        ],
        c: [['Put the kettle on and think', 'kettle'], ['Check the guest list', 'guests'], ['Just flip the switch and see what happens', 'live']]
      },
      kettle: {
        t: [
          'I fill the kettle and set it on the little stove. While it heats, I stare at the schedule. It says: "12:00. Rainy Day Special. Surprise guest!" in my own handwriting. I do not remember writing it. I have no idea who the surprise is.',
          'A drip lands on my head from the ceiling. Then another. A leak has found the exact spot above my chair.'
        ],
        c: [['Put a bucket under the leak', 'bucket'], ['Move my chair and ignore it', 'guests'], ['Make a song out of the drips', 'drip_song']]
      },
      bucket: {
        t: [
          'I find a bucket. The drip hits it with a loud plink. Then I find a second bucket for a second leak, and a pot for a third, and a hat for a fourth. Soon the whole shed is plinking and plonking in a gentle rainy rhythm.',
          '"Oh," I say, listening. "That is actually quite nice."'
        ],
        c: [['Put a microphone near the buckets', 'drip_song'], ['Go on air with a very wet shed', 'live']]
      },
      drip_song: {
        t: [
          'I line up the buckets by size and tap each one with a spoon, and the leaks do the rest. Plink, plonk, ploop, a song. I record a minute of it and play it back, and it is lovely, like a very small orchestra made of weather.',
          'The clock says one minute to noon.'
        ],
        c: [['Go live with the Drip Orchestra', 'live_drip'], ['Wait for the surprise guest', 'guests']]
      },
      guests: {
        t: [
          'The guest list is on a sticky note on the microphone. It says: "Mr. Pickle, 12:00." Mr. Pickle is not a person. Mr. Pickle is the postmaster\'s parrot, who lives next door and who has been trying to get on the radio for six years.',
          'I peek out. Mr. Pickle is standing in the rain on the windowsill, glaring. He is soaked, and he is carrying a rolled-up piece of paper in his claw.'
        ],
        c: [['Let Mr. Pickle in', 'pickle_in'], ['Tell him he cannot come in until he dries off', 'pickle_out'], ['Pretend I did not see him', 'live']]
      },
      pickle_out: {
        t: [
          'I tell Mr. Pickle through the window that he must dry off first. He shakes himself like a dog, spraying me with a lot of rain, and says in a very clear voice, "RUDE." Then he hops in anyway and lands on the microphone stand.'
        ],
        c: [['Hand him a towel', 'pickle_in'], ['Go on air immediately', 'live_pickle']]
      },
      pickle_in: {
        t: [
          'Mr. Pickle steps onto the desk and shakes out his feathers, takes the scroll from his claw and unrolls it with great dignity. It is a list. It says: "PIECES OF WISDOM, by Mr. Pickle." There are eleven items, and the first is "Rain is wet."',
          '"On air in thirty seconds," I say. "Are you ready?" Mr. Pickle looks at the microphone with the expression of a bird who has been waiting for this moment his whole life.'
        ],
        c: [['Let him read the wisdom', 'live_pickle'], ['Ask him to say something nice about the rain', 'live_pickle']]
      },
      live: {
        t: [
          'I flip the switch. The red light comes on. Somewhere in the village, forty-one people (and three cows) sit up and listen.',
          '"Good afternoon, Radio Puddle," I say, in my best radio voice, which is a little deeper than my regular one and ends up sounding like a frog. "It is raining. It is, in fact, raining quite a lot. Here is... a very long pause."'
        ],
        c: [['Fill the silence by telling a joke', 'joke'], ['Fill it by playing a record', 'record'], ['Fill it by reading the weather', 'weather']]
      },
      live_drip: {
        t: [
          'I flip the switch and play the Drip Orchestra, a full minute of plinks and plonks and gentle puddle music. In the village, forty-one listeners stop what they are doing and just listen. Somebody\'s kettle whistles in the background, perfectly in tune.',
          'When it ends, I say softly, "That was the roof." The phone on my desk begins to ring and does not stop.'
        ],
        c: [['Answer the phone', 'phone']]
      },
      live_pickle: {
        t: [
          'The red light goes on. "Good afternoon," I say. "With me today is Mr. Pickle, the postmaster\'s parrot, who has some wisdom for you."',
          'Mr. Pickle leans toward the microphone. He clears his throat. He says, in a voice like a cello, "RAIN. IS. WET." And then, thrilled with himself, "RAIN. IS. WET. ALSO. THERE. IS. A. BISCUIT."'
        ],
        c: [['Let him go on', 'phone'], ['Ask him what kind of biscuit', 'biscuit']]
      },
      biscuit: {
        t: [
          '"Ginger," says Mr. Pickle, with great feeling, "in the postmaster\'s bag." The phone starts to ring. Then it rings again. By the time I look up, the shed is surrounded by neighbors in raincoats, all wanting to know whether there is a biscuit and, if so, how many.'
        ],
        c: [['Share the biscuit story on air', 'phone']]
      },
      joke: {
        t: [
          '"Why did the cloud go to the party?" I say. "Because it heard it was going to be a... shower?" A long silence follows. Then, faintly, from the other end of the village, a cow moos. It sounds like a very tired laugh.',
          'The phone rings. It is my grandmother. "That was terrible," she says. "Do another."'
        ],
        c: [['Do another joke', 'phone'], ['Hang up and play a record', 'record']]
      },
      record: {
        t: [
          'I reach for the record player and drop the needle on whatever is on top. It turns out to be a recording of someone gargling. I realize this about four seconds into it. It is called, according to the label, "Morning Routines of the Cave Frog."',
          'I cannot find the stop button. Somewhere out there, forty-one people are listening to frogs gargle.'
        ],
        c: [['Pull the plug out of the wall', 'plug'], ['Lean into it and call it avant-garde', 'phone']]
      },
      plug: {
        t: [
          'I yank the plug, and the record player stops. Unfortunately, so does everything else in the shed: the lights, the microphone, the kettle. The only thing still working is the rain, which continues to leak onto my head with great enthusiasm.'
        ],
        c: [['Light a candle and keep talking anyway', 'end_candle'], ['Run to the fuse box in the rain', 'end_fuse']]
      },
      weather: {
        t: [
          '"Today\'s weather," I say, looking out of the window. "It is raining. Tomorrow\'s weather: probably also raining. The day after that: the same, with a chance of... more rain." I look at the paper in my hand. "I think I have been reading yesterday\'s forecast. Sorry."',
          'The phone rings.'
        ],
        c: [['Answer it', 'phone']]
      },
      phone: {
        t: [
          'The phone has not stopped ringing since the show started. It is the whole village, calling in. They want requests, jokes, advice, biscuits. Mrs. Dumpling wants a song about her cabbage. Mr. Fenn wants to know if it is going to rain tomorrow, which is a strange question to ask a man in a leaky shed.',
          'And on line three, a small voice says, "Is this the radio? Can I say hello?" It is a very small child, and she is whispering.'
        ],
        c: [['Put her on the air', 'child'], ['Take Mrs. Dumpling\'s cabbage song request', 'cabbage'], ['Let the parrot answer', 'end_parrot']]
      },
      child: {
        t: [
          '"Hello, radio," says the small voice. "I am four. It is raining. I am wearing my boots inside." There is a long pause, and I can hear her smiling. "That is all. I just wanted to tell somebody."',
          'It is the nicest thing anyone has said on Radio Puddle in six years.'
        ],
        c: [['Tell her she is the best guest we have had', 'end_boots'], ['Ask her to say hello to the cows', 'end_cows']]
      },
      cabbage: {
        t: [
          'I have never written a song about a cabbage, but I try. "Oh, the cabbage is round, and the cabbage is green, the roundest, the greenest cabbage I have seen." It goes on for three verses, and by the end Mrs. Dumpling is crying with joy and a dozen listeners have requested cabbage songs of their own.'
        ],
        c: [['Take another request', 'phone'], ['End the show on a high note', 'end_cabbage']]
      },
      end_candle: {
        t: ['I light the stub of a candle and put it beside the microphone, which still works on a tiny battery. "Radio Puddle," I say, softly, "is now coming to you by candlelight." Without the machines humming, my voice sounds smaller and warmer.', 'I tell the story of the rainy day, the bucket orchestra, the biscuit and the frog record, to forty-one listeners who have all turned off their lights too. It is the cosiest show I have ever done.'],
        end: ['Radio by Candlelight', 'cozy']
      },
      end_fuse: {
        t: ['I run out into the rain in my slippers. The fuse box is in a bush behind the post office, and the bush, it turns out, has a family of ducks living in it. They quack in offense as I fumble through the leaves.', 'I fix the fuse. I also get completely soaked and make friends with seven ducks, who follow me back and sit under the desk for the rest of the show. They get the biggest laugh of the day, mostly by doing nothing at all.'],
        end: ['Seven Ducks and a Fuse', 'funny']
      },
      end_parrot: {
        t: ['I hold the phone to Mr. Pickle, who has been waiting for this his whole life. "HELLO," he says to the caller, and then, "THIS IS RADIO PUDDLE. I AM IN CHARGE." The caller laughs so hard that she drops the phone. So do the next six.', 'By the end of the afternoon, Mr. Pickle is the most popular voice in the village. The postmaster says he has never seen the bird so happy. Neither have I. I let him present the closing theme.'],
        end: ['Mr. Pickle Takes Over', 'funny']
      },
      end_boots: {
        t: ['"You are the best guest we have had," I tell her, and I mean it. "Thank you for telling us about your boots." She giggles and says goodbye in her tiny voice, and I play a soft, silly song for her, all about rain and boots and inside.', 'Afterward, forty-one listeners and a goose phone in to say how much it made their day. I sit back in my chair, with a bucket plinking beside me, and decide that it is the best radio show I have ever done.'],
        end: ['Boots Inside', 'sweet']
      },
      end_cows: {
        t: ['"Say hello to the cows," I ask her, and she shouts "HELLO COWS!" into the phone, so loudly that I have to hold it away from my ear. And far across the fields, one at a time, the cows answer. Moo. Moo. Moooo.', 'It is the best radio moment of my career, and it is entirely thanks to a four-year-old in her boots. Radio Puddle has never been so loved. The ratings, if there were any, would be through the roof, though the roof, to be fair, is already leaking.'],
        end: ['The Cows Say Hello', 'happy']
      },
      end_cabbage: {
        t: ['I end the show with the cabbage song, one last time, with everybody who is listening joining in. Down the street, in kitchens and barns and living rooms, forty-one people and three cows hum the cabbage tune, a little off key and perfectly happy.', 'The rain keeps falling. The buckets keep plinking. And the smallest radio station in the world signs off, as it always does, with the same line. "This has been Radio Puddle. Stay dry if you like. We will be here either way."'],
        end: ['The Cabbage Song', 'dreamy']
      }
    }
  },

  // ------------------------------------------------------------------ 9 (girl, romance)
  {
    id: 'letters_over_the_garden_wall',
    name: 'Letters Over the Garden Wall',
    description: 'A moss-covered wall separates your garden from the one next door. One morning there is a note tucked between the stones, and it is addressed to you.',
    genre: 'Romance',
    protagonist: 'girl',
    hero: 'Wren',
    interest: 'Felix',
    minutes: 12,
    accent: '#f49bbd',
    cover: 'gardenwall',
    start: 'start',
    nodes: {
      start: {
        t: [
          'My name is Wren, and I have spent the whole spring working on my garden. It is a small one, with a crooked apple tree, a bench, and a long old stone wall at the back, covered in moss and ivy.',
          'On the other side of the wall is another garden, which has been empty for years. This morning, as I water the foxgloves, I notice something white tucked between two stones. It is a folded piece of paper. On the front, in careful handwriting, it says: "To whoever is growing the sweet peas."'
        ],
        c: [['Open the note', 'note'], ['Put it back and pretend I did not see it', 'back'], ['Peek over the wall first', 'peek']]
      },
      back: {
        t: [
          'I push the paper back into the gap, brush the moss over it and go inside to make tea. I last about eleven minutes. When I come out again, the paper is gone, and in its place is a second, slightly larger note. This one says, "I think you saw the first one."'
        ],
        c: [['Laugh and open it', 'note'], ['Write a reply instead', 'reply_first'], ['Ignore the second note too', 'end_shy']]
      },
      peek: {
        t: [
          'I drag the garden bench to the wall and stand on it. On the other side, a tall boy with ink on his fingers is on his knees in the dirt, planting something very carefully. He looks up, startled, and a trowel falls out of his hand.',
          '"Oh," he says. "You are the sweet pea person."'
        ],
        c: [['Say hello and ask his name', 'meet'], ['Duck down out of sight', 'back']]
      },
      meet: {
        t: [
          '"Felix," he says, wiping his hands on his trousers, which only makes them worse. "I just moved in. My grandmother left me the house, and the garden. I do not know anything about gardens." He waves vaguely at the weeds. "I have been trying to grow tomatoes for two weeks, and nothing has happened."',
          '"Tomatoes?" I say. "In April?" He looks at me with open and honest hope. "Is that bad?"'
        ],
        c: [['Offer to help him with the garden', 'help'], ['Tell him he needs sunshine and patience', 'patience']]
      },
      note: {
        t: [
          'The note says: "Dear neighbor, I am new here. I do not know the first thing about gardens, but I can see yours from my window, and I think it is the nicest one for miles. The sweet peas especially. Would you be willing to tell me what I am doing wrong? Yours, F."',
          'There is a small, hasty drawing at the bottom: a tomato plant, rather sad and drooping, with a question mark above it.'
        ],
        c: [['Write back with advice', 'reply_first'], ['Climb the wall and talk to him', 'meet']]
      },
      reply_first: {
        t: [
          'I tear a page from my gardening journal and write back: "Dear F. Tomatoes need a lot of sun and not too much water. Do not plant them in April. Also, you are doing nothing wrong. You are just early." I fold it into a paper boat, for some reason, and tuck it into the wall.',
          'The answer arrives by lunchtime. It is a paper airplane.'
        ],
        c: [['Read the airplane', 'airplane']]
      },
      airplane: {
        t: [
          'The airplane says: "Thank you! I have moved the tomatoes to the window. I am told that is called hardening off. Is it going to be all right? Also, I have made too many scones, and it feels wrong to eat them alone. Are scones allowed over walls?"'
        ],
        c: [['Say scones are always allowed', 'scones'], ['Say I will bring jam', 'scones']]
      },
      scones: {
        t: [
          'We meet at the wall at four o\'clock. I stand on my bench and he stands on a stack of two flowerpots, which makes us exactly the same height. The scones are slightly burned on the bottom. They are the best scones I have ever eaten, and I do not tell him why.',
          'We talk for two hours. He is a bookbinder, which explains the ink. He likes the smell of old paper and the sound of rain on glass. By the end, I know the names of his grandmother\'s three cats.'
        ],
        c: [['Invite him over to see the garden properly', 'garden'], ['Ask what he is planting in the empty bed', 'bed']]
      },
      help: {
        t: [
          'I fetch my gloves and a spare trowel and climb over the wall, which is rather dignified, until my skirt catches on the ivy. Felix catches my elbow, and we stand there for a second, blushing for no reason either of us can explain.',
          '"Right," I say, a bit too brightly. "Let me show you what a garden is."'
        ],
        c: [['Show him how to weed', 'weeds'], ['Show him how to plant sweet peas', 'bed']]
      },
      patience: {
        t: [
          '"Sunshine and patience," Felix repeats solemnly, writing it on the back of his hand. "Anything else?" I think. "Tea," I say. "Gardens run on tea." He laughs, and he has the kind of laugh that makes you want to say something funnier just to hear it again.'
        ],
        c: [['Invite him over for tea', 'garden'], ['Offer to help him tomorrow', 'help']]
      },
      weeds: {
        t: [
          'It takes us all afternoon to clear a single bed. Felix pulls up a dandelion and holds it like a trophy. "Is this one weed?" he asks. "Two," I say. "That is a weed and a flower." He thinks about this for a long time, and then he plants it back in the ground, very gently, and says, "I am going to call it a flower."'
        ],
        c: [['Ask him to dinner', 'garden'], ['Plant something together', 'bed'], ['Ask about his poor tomatoes', 'end_tomatoes']]
      },
      bed: {
        t: [
          'We sow the sweet peas along the wall, side by side, one seed at a time. Felix measures the spaces with a ruler. I tell him it does not matter. He says it does, to him, and I find I do not mind at all. By sunset, our hands are both covered in soil.',
          '"Do you think they will grow?" he asks. "They always do," I say, "when somebody is waiting for them."'
        ],
        c: [['Say something about waiting', 'wait'], ['Just smile and pass him the watering can', 'garden']]
      },
      wait: {
        t: [
          '"I have never been very good at waiting," Felix says, looking not at the seeds but at me. "But this might be worth it." I hand him the watering can, mostly so my hands will stop shaking. He waters the sweet peas. The sun goes down. A blackbird starts to sing.'
        ],
        c: [['Stay a little longer', 'garden']]
      },
      garden: {
        t: [
          'That evening he comes round to my side, through the little gate I did not know was in the wall, hidden behind a bush. He sits on my bench and admires the crooked apple tree. I make tea. We share a blanket because the evening is cool, and neither of us mentions it.',
          'The sky turns the color of apricots. Somewhere in the garden, the first of the sweet peas begins to unfurl.'
        ],
        c: [['Tell him I hope he stays', 'end_stay'], ['Ask if he will write to me, even when he lives next door', 'end_letters'], ['Hold his hand', 'end_hand'], ['Just sit quietly and watch the evening', 'end_quiet']]
      },
      end_shy: {
        t: ['I do not answer the second note. Or the third, which appears on Thursday, or the fourth, which has a small drawing of a snail and the words "No pressure." I keep the notes in my apron pocket and tell myself I am busy with the garden, which is true.', 'In December, when the garden is bare and the wall is frosted white, I finally take out a pencil. "Dear F," I write. "Sorry it took so long. Would you like some tea?" The reply comes in under a minute. It says "Yes. Always. Yes." And I discover that some of the best things are worth being a little late for.'],
        end: ['Late, But Not Too Late', 'dreamy']
      },
      end_tomatoes: {
        t: ['"Ah," says Felix, brightening, "about the tomatoes." We carry the pots out into the sun together, the sad little plants and all, and I show him how to water them, and how to talk to them, which he turns out to be very good at. He reads them poetry.', 'By August the tomatoes are so many and so enormous that we cannot eat them all. We leave baskets on the doorsteps of the whole street, with a note: "From the garden wall." Every one of our neighbors guesses it is us. Nobody minds. Several leave jam.'],
        end: ['Too Many Tomatoes', 'funny']
      },
      end_quiet: {
        t: ['We do not say anything at all. It is the sort of evening that does not need it. The light slides down the wall, the blackbird finishes its song, and the sweet peas, in their new bed, curl slowly toward the dark. Felix sits beside me on the bench, quite still, as if he too were afraid of breaking something.', 'At some point I realize I am leaning against his shoulder. At some later point I realize he has not moved in an hour so as not to wake me. It is the most comfortable silence I have ever shared with anyone.'],
        end: ['A Quiet Evening', 'cozy']
      },
      end_stay: {
        t: ['"I hope you stay," I say. It comes out much smaller than I meant it to. Felix is quiet for a long moment. Then he says, "I have not been somewhere I wanted to stay in a long time." He turns toward me, and the light catches the soil on his cheek, and I decide not to mention it.', 'We sit on the bench until the stars come out. In the morning there are two sets of boots by the back door, and the tomatoes, in the window, have finally put out a single, brave green leaf.'],
        end: ['Two Pairs of Boots', 'sweet']
      },
      end_letters: {
        t: ['"Will you write to me?" I ask. "Even though I live fifteen steps away?" Felix grins. "Especially," he says. "Letters are better. You can keep them." He leaves that night through the little gate, and in the morning there is a paper boat in the wall.', 'It says, in his careful handwriting, "Dear Wren. Good morning. I just wanted to say it properly." I keep every note, tied with string, in a tin under the bench. By autumn the tin is full.'],
        end: ['The Letter Tin', 'dreamy']
      },
      end_hand: {
        t: ['I do not say anything. I just put my hand on the bench between us, and after a moment, a very shy hand, with ink on its fingers, comes to rest on top of it. Neither of us looks at the other. We both look at the apple tree, very hard, as if it had said something fascinating.', 'The sweet peas climb the wall all summer, side by side, from both gardens. By August they have met at the top and tangled together so completely that nobody could tell which side they started on.'],
        end: ['Sweet Peas Meet at the Top', 'happy']
      }
    }
  },

  // ------------------------------------------------------------------ 10 (guy, romance + adventure)
  {
    id: 'last_train_to_starlight_bay',
    name: 'The Last Train to Starlight Bay',
    description: 'You have one ticket, one suitcase and one night to reach the sea. The seat across from you is taken by a girl with a lantern and a very good map.',
    genre: 'Romance',
    protagonist: 'guy',
    hero: 'Jonah',
    interest: 'Elsie',
    minutes: 13,
    accent: '#7a7bd8',
    cover: 'starlightbay',
    start: 'start',
    nodes: {
      start: {
        t: [
          'I am Jonah, and I am running down the platform with a suitcase that is too big and a ticket that is, according to the conductor, "technically valid." The last train to Starlight Bay is already moving. I leap, and the door closes behind me, and I land in the aisle with my suitcase on top of me.',
          'It is very late. The carriage is quiet and gold-lit, with seats like little velvet boats. There is only one other passenger, a girl about my age, with a lantern at her feet and a map spread across her knees. She looks up. "That was impressive," she says. "Are you hurt?"'
        ],
        c: [['Say I am fine and sit across from her', 'sit'], ['Say I am fine and find a seat far away', 'far'], ['Make a joke about my entrance', 'joke']]
      },
      far: {
        t: [
          'I find a seat three rows back and pretend to read the timetable. After a minute, I hear a soft click and look up. The girl has moved her lantern to the seat beside her and is holding up a flask. "I am Elsie," she says. "You look like someone who could use some cocoa. And I am quite bad at staying quiet."'
        ],
        c: [['Move over and take the cocoa', 'sit'], ['Say thank you but I want to be alone', 'alone']]
      },
      alone: {
        t: [
          'I say thank you, but no. She nods, perfectly friendly, and goes back to her map. I watch the dark countryside slide past the window. After a while there is nothing to see but my own reflection and a few far lights. It is a very long way to Starlight Bay. I find that I am looking at her map more than at the window.'
        ],
        c: [['Ask what she is looking for', 'sit'], ['Close my eyes and sleep', 'end_sleep']]
      },
      joke: {
        t: [
          '"I wanted to arrive in style," I say, lifting my head from the carpet. She laughs, a short, surprised laugh, and I decide it is the best sound I have heard all week. "You did," she says. "Would you like some company? My name is Elsie."'
        ],
        c: [['Sit across from her', 'sit']]
      },
      sit: {
        t: [
          '"Jonah," I say, shaking her hand, which is warm from the flask. She hands me a cup of cocoa and I realize I have not eaten anything since breakfast. "Where are you going?" I ask. "Starlight Bay," she says, as if it were obvious. "I am going to see the Star Tide."',
          'I have never heard of the Star Tide. Elsie looks at me with delight. "Oh, you will like this," she says, and turns the map around so I can see.'
        ],
        c: [['Ask what the Star Tide is', 'tide'], ['Ask why she is traveling alone', 'alone_why'], ['Ask to look at the map', 'map']]
      },
      alone_why: {
        t: [
          '"My grandfather used to take me," Elsie says. She is quiet for a moment, and her thumb moves along the edge of the map. "He passed on last winter. I promised I would go this year anyway." She looks up and smiles, a little wobbly. "It is better with company, I think. He always said that."'
        ],
        c: [['Say I would be glad to be her company', 'tide'], ['Tell her about my own reasons for going', 'mine']]
      },
      mine: {
        t: [
          'I did not plan to say it, but it comes out. I am going to Starlight Bay because I have a job at the lighthouse starting on Monday, and I have never lived anywhere but the city. I am scared that I will be bad at it, and scared that I will be lonely, and scared that the sea will be too big.',
          'Elsie listens without interrupting, the way people do when they have been scared themselves. "The sea is very big," she says. "That is the best thing about it."'
        ],
        c: [['Ask about the Star Tide', 'tide']]
      },
      map: {
        t: [
          'The map is old and beautifully drawn, covered in tiny handwritten notes, a river here, a favorite bench there, a circle around a stretch of beach. In the margins are little stars. "My grandfather drew it," says Elsie. "Every year he added something."'
        ],
        c: [['Ask what the circle is', 'tide'], ['Ask what the stars mean', 'stars_meaning']]
      },
      stars_meaning: {
        t: [
          '"Each star is a night we saw something wonderful," Elsie says. "There are thirty-one. Last year was the last." She lifts her chin. "This year I am going to draw the thirty-second."'
        ],
        c: [['Ask about the Star Tide', 'tide']]
      },
      tide: {
        t: [
          '"On one night a year," says Elsie, leaning forward, "when the moon is new and the tide is at its lowest, a thin silver light shines up from the water. The old fishermen say the stars fall in. Nobody really knows. But the whole bay glows, from shore to horizon, for about an hour."',
          'The train rocks gently. Outside, the dark countryside has given way to the first hints of the sea, a smell of salt, a long pale line that might be the horizon. "Tonight is the night," she says.'
        ],
        c: [['Offer to go with her to the beach', 'beach'], ['Say I have to be at the lighthouse early', 'lighthouse']]
      },
      lighthouse: {
        t: [
          '"The lighthouse," says Elsie, and her eyes light up. "That is the best place to watch the Star Tide. The top of the tower." She raises one eyebrow. "If somebody could get us up there, we would not have to share the beach with anybody."',
          'I have been the keeper of that lighthouse for approximately zero hours. But I have, in my suitcase, a key.'
        ],
        c: [['Take her to the lighthouse', 'tower'], ['Say we should wait for Monday and ask properly', 'wait']]
      },
      wait: {
        t: [
          '"Sensible," says Elsie, though she looks a little crestfallen. "My grandfather would have said the same." I feel dreadful. We look at each other for a moment. And I find that I cannot, in the end, be sensible about a girl who has drawn thirty-one stars on a map.'
        ],
        c: [['Change my mind and take her to the lighthouse', 'tower'], ['Walk her to the beach instead', 'beach'], ['Hold firm: we will ask the old keeper on Monday', 'end_monday']]
      },
      beach: {
        t: [
          'Starlight Bay station is a single wooden platform with one lamp. The conductor tips his hat as we step off, and the train rolls away into the dark with a long, tired whistle. The beach is a five-minute walk down a path lined with sea grass.',
          'We arrive just as the water begins to pull back. The sand is damp and silver under the sky, with a thousand stars overhead and no moon at all.'
        ],
        c: [['Wait with her at the edge of the water', 'edge'], ['Spread her map on the sand and add a star', 'star']]
      },
      tower: {
        t: [
          'The lighthouse is tall and white and extremely cold. We climb a hundred and forty steps in the dark, with only her lantern for light, and she counts them out loud. At the top is a round room full of glass, with the great lamp sleeping in the middle and the whole bay spread out below.',
          'The sea is dark, and perfectly still, and utterly enormous.'
        ],
        c: [['Light the great lamp for her', 'lamp'], ['Turn off the lantern and watch in the dark', 'dark']]
      },
      lamp: {
        t: [
          'I know exactly one thing about the great lamp, because the old keeper showed me on a visit: how to wake it. I turn the brass key and the lens begins to slowly turn, and a long white beam sweeps out across the water, over and over, like a hand waving hello.',
          '"Oh," says Elsie softly. "That is the loveliest thing I have ever seen." And then the sea begins to glow.'
        ],
        c: [['Watch the Star Tide together', 'glow']]
      },
      dark: {
        t: [
          'She blows out the lantern, and we stand in the dark, shoulder to shoulder, with the sea below. For a long moment there is nothing at all. Then, far out, a single pale gleam, like a coin dropped in the water. Then another. Then a hundred.',
          'The whole bay is lighting up from the horizon toward the shore, a slow silver tide of tiny sparks.'
        ],
        c: [['Watch the Star Tide together', 'glow']]
      },
      edge: {
        t: [
          'We stand at the edge of the water and take off our shoes. The sea is bitterly cold on my toes, and Elsie laughs and shrieks and does not step back. We wait. The stars wheel overhead. At some point, her shoulder is against mine, and neither of us has noticed how.'
        ],
        c: [['Ask if I can draw the first star on her map', 'star'], ['Wait in silence for the tide', 'glow'], ['Challenge her to a stone-skipping contest', 'end_stones']]
      },
      star: {
        t: [
          'Elsie lays the map on the sand and hands me her grandfather\'s pencil, a stub no longer than my thumb. "You can draw the star," she says, "if you promise to make it a good one." I think for a long time. I draw it small and slightly wobbly, with a tiny face in the middle, looking up at the sky.',
          'She laughs, delighted. And then the sea begins to glow.'
        ],
        c: [['Watch the Star Tide together', 'glow']]
      },
      glow: {
        t: [
          'It begins at the horizon: a thin silver line, as fine as a thread. Then it spreads, inch by inch, across the water, until the whole bay is shining like a field of tiny stars. Every wave, as it breaks, sends up a spray of sparks. The beach glows, the sky glows, and Elsie\'s face, turned upward, is silver and astonished.',
          '"Thirty-two," she whispers. For a while neither of us says anything at all.'
        ],
        c: [['Tell her it is the most beautiful thing I have seen', 'end_true'], ['Tell her I am glad I caught the train', 'end_train'], ['Say nothing, and take her hand', 'end_hand']]
      },
      end_sleep: {
        t: ['I close my eyes just for a moment. When I open them, the train has stopped, the carriage is empty, and a sleepy conductor is shaking my shoulder. "Starlight Bay," he says. "End of the line, son." The sky outside is pale gray. The Star Tide, whatever it was, is over.', 'On the seat across from me, there is a folded note: "You looked tired. Good luck at the lighthouse. Elsie." Underneath is a small drawing of a star with a tiny face. I keep it for years, and I do, in the end, go back to see the tide.'],
        end: ['The Star I Missed', 'cozy']
      },
      end_monday: {
        t: ['We do the sensible thing, and it turns out to be a lovely one. We spend the night at the little inn, where the landlady gives us a very large breakfast, and on Monday morning I introduce myself to the old keeper and ask, properly, whether a guest might see the lamp.', 'He is delighted. He takes us to the top himself, and he tells Elsie that her grandfather once sat in the very same spot. She does not say anything. She just holds the rail very tightly and smiles. The Star Tide has gone for this year, but next year it will come again, and by then she already has a standing invitation.'],
        end: ['A Proper Invitation', 'cozy']
      },
      end_stones: {
        t: ['"Stone-skipping," says Elsie slowly. "You are on." We gather armfuls of flat pebbles and take turns at the water\x27s edge. I manage three hops. She manages seven, and then eleven, and then a stone that seems to skip off the edge of the world. "I was taught by an expert," she says, rather smug.', 'We are so busy competing, and laughing, and arguing about the rules, that we nearly miss the Star Tide. It sneaks up behind us, silver and silent, lapping at our ankles. We turn, and gasp, and forget the score entirely. It ends up as the second-best moment of the night, and the first, we agree, was the contest.'],
        end: ['Eleven Hops', 'funny']
      },
      end_true: {
        t: ['"It is the most beautiful thing I have ever seen," I say, and I am not looking at the sea. Elsie turns, and for a second her face is perfectly serious. Then she smiles, slowly, and the light of the tide moves in her eyes. "Me too," she says. "Though I think you are looking at the wrong thing."', 'We stay until the glow fades and the first pink of the dawn arrives. On Monday I start at the lighthouse. On Tuesday, Elsie brings cocoa. By the end of the month she has stopped pretending she is only visiting.'],
        end: ['The Wrong Thing to Look At', 'sweet']
      },
      end_train: {
        t: ['"I am so glad I caught that train," I tell her. "I nearly did not. I was one second too late." Elsie laughs. "You were not late," she says. "You were exactly on time." She nudges my shoulder with hers, and we watch the sea spark and shimmer until the moon rises.', 'It is the best night of my whole life. At the lighthouse, on Monday, the old keeper looks at me and the sparkle still in my eyes and says, "Ah. You have seen it, then." And he does not say another word, but gives me an extra biscuit.'],
        end: ['Exactly On Time', 'happy']
      },
      end_hand: {
        t: ['I do not say anything. I just find her hand in the dark, cold and sandy and warm underneath, and she holds mine as if she had been waiting to. The Star Tide pours across the bay in a river of light, and for the whole hour, we do not let go.', 'In the morning, Elsie unrolls the map and adds one small star to the corner, and next to it, in her grandfather\'s pencil, she draws a second figure beside the first. "Thirty-two," she says. "With company."'],
        end: ['Thirty-Two, With Company', 'dreamy']
      }
    }
  }
];
