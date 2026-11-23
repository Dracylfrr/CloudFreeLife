// Pastel Puzzle levels: a finished picture is cut into tiles and scrambled; swap two tiles at a time
// until the picture is whole again. Each level folder carries its own picture (a colored scene).
import { cloudCastle, rainbowMeadow } from './pages_cloud.mjs';
import { sunnyBeach, cozyCottage } from './pages_peaceful.mjs';
import { ringedPlanet } from './pages_cosmic.mjs';
import { happyWhale } from './pages_ocean.mjs';
import { sleepyBear } from './pages_forest.mjs';
import { cupcakeTower } from './pages_treats.mjs';
import { foxInLeaves, bunnyGarden, owlMoon } from './pages_forest.mjs';
import { turtleReef } from './pages_ocean.mjs';
import { birthdayCake } from './pages_extra.mjs';
import { lakesideSunrise } from './pages_peaceful.mjs';

const levels = [
  { folder: '01_cloud_castle', name: 'Cloud Castle', description: 'A castle in the clouds, in six pieces.', objective: 'Swap the pieces until the castle is whole.', columns: 3, rows: 2, scene: cloudCastle },
  { folder: '02_rainbow_hills', name: 'Rainbow Hills', description: 'A big rainbow over soft hills.', objective: 'Put the rainbow back together.', columns: 3, rows: 3, scene: rainbowMeadow },
  { folder: '03_sunny_beach', name: 'Sunny Beach', description: 'Sand, sea and a striped umbrella.', objective: 'Rebuild the beach, piece by piece.', columns: 4, rows: 3, scene: sunnyBeach },
  { folder: '04_happy_whale', name: 'Happy Whale', description: 'A whale with a very big smile.', objective: 'Bring the whale back together.', columns: 4, rows: 3, scene: happyWhale },
  { folder: '05_sleepy_bear', name: 'Sleepy Bear', description: 'A cuddly bear and his honey pot.', objective: 'Twenty pieces make one sleepy bear.', columns: 5, rows: 4, scene: sleepyBear },
  { folder: '06_cupcake_party', name: 'Cupcake Party', description: 'Three cupcakes and a lot of bunting.', objective: 'The biggest puzzle: twenty-four pieces.', columns: 6, rows: 4, scene: cupcakeTower },
  { folder: '07_ringed_planet', name: 'Ringed Planet', description: 'A dreamy planet in a purple sky.', objective: 'Put the planet back in its orbit.', columns: 5, rows: 4, scene: ringedPlanet },
  { folder: '08_cozy_cottage', name: 'Cozy Cottage', description: 'A cottage with a smoking chimney.', objective: 'Rebuild the cottage, one swap at a time.', columns: 6, rows: 4, scene: cozyCottage },
  { folder: '09_fox_in_leaves', name: 'Fox in Leaves', description: 'A fox curled up in autumn leaves.', objective: 'Twelve pieces make one cozy fox.', columns: 4, rows: 3, scene: foxInLeaves },
  { folder: '10_bunny_garden', name: 'Bunny Garden', description: 'A bunny among the carrots.', objective: 'Hop the pieces back where they belong.', columns: 5, rows: 4, scene: bunnyGarden },
  { folder: '11_turtle_reef', name: 'Turtle Reef', description: 'A slow, friendly turtle on the reef.', objective: 'Take it slowly, like the turtle does.', columns: 5, rows: 4, scene: turtleReef },
  { folder: '12_owl_moon', name: 'Owl and Moon', description: 'A sleepy owl under a big moon.', objective: 'Sixteen pieces for one night owl.', columns: 4, rows: 4, scene: owlMoon },
  { folder: '13_birthday_cake', name: 'Birthday Cake', description: 'A cake with candles and sprinkles.', objective: 'A small, sweet puzzle: nine pieces.', columns: 3, rows: 3, scene: birthdayCake },
  { folder: '14_lakeside_sunrise', name: 'Lakeside Sunrise', description: 'Morning light over a still lake.', objective: 'The biggest picture: thirty pieces.', columns: 6, rows: 5, scene: lakesideSunrise }
];

export const puzzleLevels = levels.map((l) => {
  const svg = l.scene().svg('color');
  return {
    folder: l.folder,
    picture: svg,
    manifest: (version) => ({
      id: l.folder.replace(/^\d+_/, ''),
      name: l.name,
      description: l.description,
      minigame: 'pastel_puzzle',
      thumbnail: 'picture.svg',
      version,
      minAppVersion: '1.1.1',
      objective: l.objective,
      picture: 'picture.svg',
      columns: l.columns,
      rows: l.rows
    })
  };
});
