// Who speaks in each bundled story, and what kind of voice suits them. Used by generate-content.mjs.
//
//   id      a short lowercase id (never "narrator")
//   name    how the story names them ("Tilly", "the bear", "Mr. Pickle"); a name that starts with a small
//           letter ("the bear") is found whatever its capital letters
//   gender  'f' or 'm': picks from the female or the male voices
//   trait   gentle | warm | wise | jolly | proper | bright: picks the voice that suits them best
//   aka     other words the story uses for them
//
// Voices are chosen from these, so no two characters in a story share one, and a reader can change
// any of them in the app. The narrator is chosen by the reader, not here.
const f = (id, name, trait, aka) => ({ id, name, gender: 'f', trait, ...(aka ? { aka } : {}) });
const m = (id, name, trait, aka) => ({ id, name, gender: 'm', trait, ...(aka ? { aka } : {}) });

export const casts = {
  // ---- Cozy Stories
  cloud_who_lost_its_rain: [f('pebble', 'Pebble', 'gentle', ['the little cloud']), m('wind', 'the Wind', 'gentle'), f('sun', 'the Sun', 'warm'), m('frog', 'the frog', 'wise')],
  lantern_for_the_little_owl: [f('olive', 'Olive', 'gentle', ['the little owl']), f('dot', 'Dot', 'bright', ['the firefly'])],
  night_train_to_moonwater: [f('tilly', 'Tilly', 'gentle'), m('bear', 'the bear', 'jolly'), m('mole', 'the mole', 'proper'), f('owl', 'the owl', 'proper'), f('marigold', 'Marigold', 'bright')],
  library_on_lantern_lane: [f('hester', 'Hester Quill', 'wise', ['Hester', 'Miss Quill']), f('pim', 'Pim', 'bright'), m('barnaby', 'Barnaby', 'wise', ['the tortoise']), m('rowan', 'Rowan', 'warm', ['the fox'])],
  where_the_rain_keeps_its_umbrellas: [m('wick', 'Wick', 'gentle'), f('tansy', 'Aunt Tansy', 'warm', ['Tansy'])],
  the_star_gardener: [f('luma', 'Luma', 'bright'), m('marlow', 'Marlow', 'wise'), f('star', 'the star', 'gentle')],
  tilly_and_the_snowbound_express: [f('tilly', 'Tilly', 'gentle'), m('bear', 'the bear', 'jolly'), f('owl', 'the owl', 'proper'), m('heron', 'the heron', 'proper', ['the conductor', 'conductor']), f('marigold', 'Marigold', 'bright')],
  tilly_and_the_midsummer_run: [f('tilly', 'Tilly', 'gentle'), m('bear', 'the bear', 'jolly'), m('mole', 'the mole', 'proper'), f('marigold', 'Marigold', 'bright')],

  // ---- Story Adventures (told by the hero; these are the people they talk to)
  the_lantern_trail: [m('grandpa', 'Grandpa', 'wise'), m('badger', 'the badger', 'jolly'), f('heron', 'the heron', 'proper')],
  skyship_summer: [f('gull', 'Captain Gull', 'jolly', ['the gull'])],
  bakery_on_maple_lane: [m('elliot', 'Elliot', 'warm')],
  letters_at_the_lighthouse: [f('clara', 'Clara', 'warm')],
  the_great_pie_disaster: [f('gran', 'Gran', 'wise', ['Grandma']), f('pip', 'Pip', 'bright')],
  the_museum_after_midnight: [f('portrait', 'the portrait', 'proper', ['portrait'])],
  the_missing_lullaby: [f('goose', 'the goose', 'jolly', ['goose']), f('bee', 'the fluffy bee', 'bright', ['fluffy bee']), m('pennywhistle', 'Pennywhistle', 'jolly', ['the magpie'])],
  rainy_day_radio: [m('pickle', 'Mr. Pickle', 'proper', ['Pickle']), f('caller', 'the small voice', 'bright', ['small voice'])],
  letters_over_the_garden_wall: [m('felix', 'Felix', 'warm')],
  last_train_to_starlight_bay: [f('elsie', 'Elsie', 'bright')]
};
