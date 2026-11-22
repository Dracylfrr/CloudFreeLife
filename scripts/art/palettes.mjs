// Ten pastel palettes with friendly color names. No harsh blacks, neons or aggressive reds.
const P = (id, name, description, colors) => ({
  id,
  name,
  description,
  colors: colors.map(([name, hex]) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name, hex }))
});

export const palettes = [
  P('cloud_morning', 'Cloud Morning', 'Soft sky blues, warm cream and a hint of sunrise.', [
    ['Cloud Blue', '#a9d4f5'], ['Morning Mist', '#d3e9f9'], ['Sky Cream', '#fff4de'], ['Butter Glow', '#fff0a8'],
    ['Peach Cream', '#ffd9c2'], ['Rose Milk', '#f9c6d8'], ['Lilac Mist', '#d9c9f2'], ['Mint Leaf', '#bfe8d2']
  ]),
  P('cotton_candy', 'Cotton Candy', 'Fluffy pinks, blues and sweet lilacs.', [
    ['Cotton Pink', '#ffc7dc'], ['Candy Floss', '#f7a9c8'], ['Bubblegum Milk', '#ffd9e8'], ['Sugar Blue', '#b8dcf7'],
    ['Lilac Sugar', '#dac4f3'], ['Cream Soda', '#fff1cf'], ['Berry Haze', '#e7aed0'], ['Sky Candy', '#cfe8fb']
  ]),
  P('lavender_dream', 'Lavender Dream', 'Dreamy purples, lilacs and moonlit pinks.', [
    ['Lavender Cloud', '#d4c6f3'], ['Lilac Whisper', '#e6dcf8'], ['Violet Haze', '#b9a6e8'], ['Plum Milk', '#d9b3e0'],
    ['Orchid Cream', '#f0d2ef'], ['Dream Blue', '#bcd0f2'], ['Rose Mist', '#f6c8dc'], ['Moon Pearl', '#f6f1ff']
  ]),
  P('mint_garden', 'Mint Garden', 'Fresh greens, aqua and a touch of blossom.', [
    ['Mint Leaf', '#bfe8d2'], ['Garden Sage', '#a6d6b8'], ['Fresh Aloe', '#d3f0dd'], ['Pale Turquoise', '#bdeeea'],
    ['Pistachio', '#d7efb6'], ['Blossom Pink', '#f9cfdc'], ['Daisy Yellow', '#fff3b0'], ['Morning Dew', '#e3f6ef']
  ]),
  P('peach_sunset', 'Peach Sunset', 'Warm peaches, apricot and soft evening pinks.', [
    ['Peach Cream', '#ffd9c2'], ['Apricot Glow', '#ffc7a6'], ['Sunset Coral', '#ffb8a6'], ['Rose Gold', '#f6b8b8'],
    ['Butter Glow', '#fff0a8'], ['Dusk Pink', '#f3c2d9'], ['Evening Lilac', '#dcc6ec'], ['Honey Cream', '#ffe8c2']
  ]),
  P('soft_rainbow', 'Soft Rainbow', 'A gentle seven-color rainbow.', [
    ['Strawberry Milk', '#f7b6c8'], ['Tangerine Cream', '#ffcfa6'], ['Lemon Chiffon', '#fff2a8'], ['Fresh Mint', '#bfe8c6'],
    ['Sky Drop', '#b3dcf6'], ['Periwinkle', '#c4c3f0'], ['Grape Soda', '#dcb8ec'], ['Cloud White', '#fbfbff']
  ]),
  P('galaxy_pastel', 'Galaxy Pastel', 'Twilight indigos, nebula pinks and stardust.', [
    ['Twilight Indigo', '#9a9ad8'], ['Nebula Lilac', '#c6b0ec'], ['Stardust Pink', '#f2b8da'], ['Comet Blue', '#a8c8f2'],
    ['Moon Glow', '#fff3c4'], ['Aurora Mint', '#b8ead8'], ['Cosmic Peach', '#ffcfbe'], ['Starlight', '#f3eefc']
  ]),
  P('beach_breeze', 'Beach Breeze', 'Sea glass, warm sand and seashell pinks.', [
    ['Sea Glass', '#b4e6e0'], ['Lagoon Blue', '#a8d8f0'], ['Wave Foam', '#e3f6f6'], ['Warm Sand', '#f6e2bf'],
    ['Shell Pink', '#f9cdc4'], ['Coral Pop', '#ffb8a2'], ['Sun Shell', '#ffefb0'], ['Driftwood', '#e6c9a8']
  ]),
  P('meadow_calm', 'Meadow Calm', 'Grassy greens, buttercups and wildflowers.', [
    ['Meadow Green', '#b9e4b4'], ['Clover', '#a1d4a4'], ['Fresh Grass', '#cdeeb5'], ['Buttercup', '#fff0a0'],
    ['Wild Lilac', '#d8c4f0'], ['Poppy Milk', '#fbc6c0'], ['Sky Patch', '#bfe0f6'], ['Soil Cream', '#ead7bb']
  ]),
  P('moonlight', 'Moonlight', 'Silvery blues, pearl and a pale golden moon.', [
    ['Moon Silver', '#dfe6f5'], ['Night Pearl', '#c6cdea'], ['Midnight Haze', '#a2aadc'], ['Pale Moon', '#fff1bf'],
    ['Lunar Lilac', '#d4c8ee'], ['Mist Blue', '#b8d4ee'], ['Dream Rose', '#f0cbe0'], ['Cloud Veil', '#f4f6fc']
  ]),
  { ...P('castle_twilight', 'Castle Twilight', 'Dusky stone, lantern gold and soft banner pinks.', [
    ['Stone Mist', '#dcd8ec'], ['Lantern Gold', '#ffe8a8'], ['Banner Pink', '#f6b8cf'], ['Moat Blue', '#b4d8f2'],
    ['Ivy Green', '#b4e0b8'], ['Torch Peach', '#ffcfae'], ['Dusk Lilac', '#d4c6f3'], ['Parchment', '#fff4de']
  ]), minAppVersion: '1.1.0' },
  { ...P('ocean_pearl', 'Ocean Pearl', 'Sea foam, pearl pinks and warm shell sand.', [
    ['Sea Foam', '#c4ece6'], ['Pearl Pink', '#fbd3df'], ['Tide Blue', '#aed6f1'], ['Shell Sand', '#f6e3c3'],
    ['Coral Blush', '#ffc4b4'], ['Kelp', '#b2dcb6'], ['Lagoon Lilac', '#d9cbf0'], ['Moon Pearl', '#f7f5fc']
  ]), minAppVersion: '1.1.0' },
  { ...P('sweet_frosting', 'Sweet Frosting', 'Buttercream pinks, vanilla and sprinkle colors.', [
    ['Strawberry Cream', '#ffc9d9'], ['Vanilla Frosting', '#fff4d6'], ['Mint Sprinkle', '#c8efd9'], ['Blueberry Milk', '#c4d8f5'],
    ['Caramel Drizzle', '#f2d2a9'], ['Lemon Drop', '#fff0a8'], ['Lavender Icing', '#dccbf3'], ['Cocoa Cloud', '#e4c9b4']
  ]), minAppVersion: '1.1.1' },
  { ...P('forest_dawn', 'Forest Dawn', 'Mossy greens, acorn browns and soft sunrise peach.', [
    ['Moss Green', '#b7dcaa'], ['Fern', '#9fd0a6'], ['Acorn Brown', '#e3c3a0'], ['Honey Glow', '#ffe9a6'],
    ['Fox Orange', '#ffc7a6'], ['Dawn Peach', '#ffe0cc'], ['Mist Blue', '#c7dff0'], ['Berry Mauve', '#e2bcd2']
  ]), minAppVersion: '1.1.1' }
];
