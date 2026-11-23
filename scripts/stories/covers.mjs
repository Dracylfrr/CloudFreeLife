// Story and adventure covers (400 x 300), in the same soft style as the book covers.
const LINE = '#6e6a8e';
const S = `stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
const head = (id, a, b) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
const star = (x, y, r, fill = '#fff6cf') => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    const rad = i % 2 ? r * 0.46 : r;
    pts.push(`${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${S} stroke-width="2"/>`;
};
const cloud = (x, y, s = 1, face = false) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" ${S}><path d="M-70 24a26 26 0 0 1 8-50a34 34 0 0 1 62-14a30 30 0 0 1 46 22a24 24 0 0 1-6 42z"/>${face ? `<g stroke="none" fill="${LINE}"><circle cx="-14" cy="6" r="4.5"/><circle cx="22" cy="6" r="4.5"/></g><path d="M-4 16q8 9 16 0" fill="none"/>` : ''}</g>`;
const moon = (x, y, r = 28) => `<path d="M${x} ${y - r}a${r} ${r} 0 1 0 ${r} ${r * 1.55}a${r * 1.2} ${r * 1.2} 0 0 1-${r}-${r * 1.55}z" fill="#fff3c4" ${S}/>`;
const hills = (c1 = '#a9dcb4', c2 = '#c2e8c4', y = 210) =>
  `<path d="M-10 ${y}Q100 ${y - 50} 200 ${y - 5}T410 ${y - 20}V310H-10z" fill="${c1}" ${S}/><path d="M-10 ${y + 40}Q120 ${y - 5} 240 ${y + 42}T410 ${y + 30}V310H-10z" fill="${c2}" ${S}/>`;
const sun = (x, y, r = 24) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffe9a8" ${S}/>`;
const dots = (list, fill = '#fff') => `<g fill="${fill}" opacity=".85">${list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;

// Some shapes override the default stroke width; keep only the last declaration per tag.
const fixDup = (svg) =>
  svg.replace(/<[^>]+>/g, (tag) => {
    const all = tag.match(/ stroke-width="[^"]*"/g);
    if (!all || all.length < 2) return tag;
    const last = all[all.length - 1];
    let seen = 0;
    return tag.replace(/ stroke-width="[^"]*"/g, (m) => (++seen === all.length ? last : ''));
  });

const raw = {
  cloud:
    head('c1', '#bfe4f7', '#e8dcfa') +
    `${sun(330, 60)}${cloud(90, 70, 0.5)}${cloud(200, 140, 1.5, true)}
<g stroke="#8fc7ec" stroke-width="5" stroke-linecap="round" opacity=".9"><path d="M170 215v26M200 222v34M230 215v26"/></g>
${hills('#a9dcb4', '#c2e8c4', 236)}<g fill="#fff2bd" ${S} stroke-width="2"><circle cx="90" cy="262" r="6"/><circle cx="310" cy="268" r="6"/><circle cx="240" cy="276" r="5"/></g>${star(60, 150, 8)}</svg>`,
  owl:
    head('c2', '#6f74b8', '#b59ad8') +
    `${moon(318, 62)}${star(60, 50, 9)}${star(150, 36, 7)}${star(360, 150, 8)}
<path d="M-10 250Q100 215 200 245T410 232V310H-10z" fill="#8d8ed0" ${S}/>
<g ${S}><rect x="40" y="200" width="320" height="16" rx="8" fill="#e9c7a3"/><ellipse cx="200" cy="164" rx="50" ry="56" fill="#ffdcc8"/><path d="M158 122l-6-30l30 18zM242 122l6-30l-30 18z" fill="#ffdcc8"/><circle cx="180" cy="152" r="16" fill="#fff"/><circle cx="220" cy="152" r="16" fill="#fff"/><path d="M200 164l-8 12h16z" fill="#ffc3b0"/></g>
<g fill="${LINE}"><circle cx="182" cy="154" r="6"/><circle cx="218" cy="154" r="6"/></g>
<g fill="#fff6a0" opacity=".95" ${S} stroke-width="1.6"><circle cx="90" cy="150" r="7"/><circle cx="116" cy="128" r="6"/><circle cx="304" cy="140" r="7"/><circle cx="276" cy="112" r="6"/><circle cx="70" cy="110" r="5"/></g></svg>`,
  tea:
    head('c3', '#fde6ef', '#fff2d8') +
    `<g fill="none" stroke-width="12"><path d="M30 260a170 170 0 0 1 340 0" stroke="#f6b8cf"/><path d="M44 260a156 156 0 0 1 312 0" stroke="#ffdcc8"/><path d="M58 260a142 142 0 0 1 284 0" stroke="#fff2bd"/><path d="M72 260a128 128 0 0 1 256 0" stroke="#c6ecda"/></g>
${hills('#c2e8c4', '#a9dcb4', 245)}
<g ${S}><ellipse cx="200" cy="212" rx="90" ry="14" fill="#fff"/><path d="M150 140h100q2 60-50 66q-52-6-50-66z" fill="#ffd3e2"/><path d="M250 156q40-4 34 28q-6 22-38 20" fill="none"/><path d="M178 120q-8-14 4-26M206 118q-8-14 4-26M232 120q-8-14 4-26" fill="none" stroke-width="3"/><rect x="146" y="132" width="108" height="12" rx="6" fill="#fff"/></g>${star(60, 90, 8)}${star(344, 100, 9)}</svg>`,
  garden:
    head('c4', '#4f5a9e', '#8d8ed0') +
    `${moon(310, 60, 26)}${star(70, 50, 8)}${star(170, 40, 6)}${star(240, 80, 7)}${star(40, 130, 6)}
<path d="M-10 230Q100 200 200 228T410 214V310H-10z" fill="#7aa8a0" ${S}/>
<g ${S}><path d="M196 250q-6-40 4-70" fill="none"/><g fill="#fff"><ellipse cx="200" cy="150" rx="14" ry="34"/><ellipse cx="176" cy="164" rx="14" ry="30" transform="rotate(-40 176 164)"/><ellipse cx="224" cy="164" rx="14" ry="30" transform="rotate(40 224 164)"/><ellipse cx="156" cy="186" rx="12" ry="26" transform="rotate(-65 156 186)"/><ellipse cx="244" cy="186" rx="12" ry="26" transform="rotate(65 244 186)"/></g><circle cx="200" cy="184" r="14" fill="#fff2bd"/></g>
<g ${S}><ellipse cx="300" cy="252" rx="20" ry="16" fill="#e3e0f0"/><circle cx="290" cy="236" r="9" fill="#e3e0f0"/><circle cx="310" cy="236" r="9" fill="#e3e0f0"/></g>
<g fill="#fff6a0" ${S} stroke-width="1.6"><circle cx="90" cy="160" r="6"/><circle cx="120" cy="200" r="5"/><circle cx="330" cy="150" r="6"/></g></svg>`,
  whale:
    head('c5', '#bfe4f7', '#a4d2f2') +
    `${sun(70, 56)}${cloud(300, 66, 0.5)}
<path d="M-10 150Q60 135 130 150T270 150T410 150V310H-10z" fill="#7fcfe0" ${S}/>
<g ${S}><path d="M50 210q10-76 110-86q90-6 150 40q26 20 40 8q-2 40-30 52q-20 12-60 14q-100 14-170-4q-40-10-40-24z" fill="#a4d2f2"/><path d="M110 206q80 10 170-4q-30 28-90 30q-54 0-80-26z" fill="#fff8ec"/><path d="M336 162q30-30 52-10q-12 8-14 30q-18-4-38-20z" fill="#a4d2f2"/><circle cx="116" cy="170" r="6" fill="${LINE}"/><path d="M92 190q14 10 28 6" fill="none"/></g>
<g ${S} stroke-width="2.2" fill="none"><path d="M120 120q-10-22 0-40M132 118q8-22 22-32M108 116q-14-16-26-26"/></g>
<g fill="#fff" ${S} stroke-width="2"><circle cx="270" cy="252" r="8"/><circle cx="296" cy="268" r="5"/><circle cx="60" cy="262" r="7"/></g></svg>`,
  mushroom:
    head('c6', '#e6e0f8', '#d6edf8') +
    `${dots([[40, 40, 5], [110, 70, 4], [180, 30, 6], [260, 60, 4], [340, 40, 6], [370, 110, 4], [70, 140, 5], [310, 150, 5]], '#fff')}
<path d="M-10 230Q100 190 200 228T410 208V310H-10z" fill="#fff" ${S}/><path d="M-10 262Q120 232 240 266T410 252V310H-10z" fill="#f2f0fb" ${S}/>
<g ${S}><rect x="168" y="168" width="48" height="76" rx="14" fill="#fff8ec"/><path d="M118 176a74 66 0 0 1 148 0z" fill="#f6b8cf"/><g fill="#fff" stroke-width="2"><circle cx="160" cy="146" r="10"/><circle cx="196" cy="134" r="12"/><circle cx="232" cy="150" r="9"/></g><rect x="186" y="204" width="14" height="40" rx="6" fill="#e9c7a3"/><path d="M118 176q-4-16 6-24" fill="none" opacity="0"/></g>
<g ${S}><rect x="296" y="196" width="26" height="42" rx="8" fill="#fff8ec"/><path d="M280 202a30 26 0 0 1 60 0z" fill="#bfe4f7"/></g><g ${S}><rect x="78" y="208" width="22" height="32" rx="8" fill="#fff8ec"/><path d="M64 214a26 22 0 0 1 52 0z" fill="#c6ecda"/></g></svg>`,
  lantern:
    head('c7', '#6f74b8', '#f0b8c8') +
    `${star(50, 50, 8)}${star(340, 40, 10)}${star(220, 30, 6)}${moon(70, 110, 22)}
<path d="M-10 240Q100 200 200 236T410 218V310H-10z" fill="#4f5a9e" ${S}/>
<g ${S}><path d="M200 28v30" fill="none"/><path d="M200 58c-52 0-62 70-14 92c20 8 8 8 28 0c48-22 38-92-14-92z" fill="#ffe9a8"/><rect x="178" y="146" width="44" height="14" rx="5" fill="#e9c7a3"/><path d="M200 160v22" fill="none"/><circle cx="200" cy="186" r="9" fill="#ffd3e2"/></g>
<g ${S}><path d="M90 150c-22 0-26 30-6 40c8 4 4 4 12 0c20-10 16-40-6-40z" fill="#ffd3e2"/><path d="M310 140c-22 0-26 30-6 40c8 4 4 4 12 0c20-10 16-40-6-40z" fill="#c6ecda"/></g>
<g ${S} stroke-width="2.4"><path d="M296 250l16-30l16 30z" fill="#a9dcb4"/><path d="M60 258l18-34l18 34z" fill="#a9dcb4"/></g></svg>`,
  skyship:
    head('c8', '#bfe4f7', '#fde6ef') +
    `${sun(330, 60, 26)}${cloud(80, 70, 0.55)}${cloud(310, 220, 0.8)}${cloud(80, 250, 0.9)}
<g ${S}><path d="M120 150c0-50 40-76 80-76s80 26 80 76c0 24-30 34-80 34s-80-10-80-34z" fill="#ffd3e2"/><path d="M160 98c-10 28-10 56 0 80M200 78v104M240 98c10 28 10 56 0 80" fill="none" stroke-width="2.2"/><path d="M164 196l-6 30h84l-6-30z" fill="#e9c7a3"/><rect x="152" y="226" width="96" height="22" rx="10" fill="#f8e4c2"/><path d="M250 236l36-14v28z" fill="#fff2bd"/><path d="M96 200l-20 16M96 214l-20-4" fill="none"/></g>
<g ${S}><path d="M214 198h4" fill="none"/></g>${star(40, 160, 8)}${star(366, 130, 7)}</svg>`,
  bakery:
    head('c9', '#fff0e0', '#fde6ef') +
    `${cloud(310, 54, 0.4)}
<path d="M-10 250H410V310H-10z" fill="#f8e4c2" ${S}/>
<g ${S}><rect x="70" y="120" width="260" height="130" rx="4" fill="#ffdcc8"/><path d="M56 124L200 60L344 124z" fill="#f6b8cf"/><path d="M82 124h236" fill="none"/><rect x="170" y="176" width="60" height="74" rx="28" fill="#e9c7a3"/><rect x="92" y="150" width="56" height="56" rx="6" fill="#dff0fb"/><rect x="252" y="150" width="56" height="56" rx="6" fill="#dff0fb"/><path d="M92 178h56M120 150v56M252 178h56M280 150v56" fill="none" stroke-width="2"/><rect x="150" y="100" width="100" height="26" rx="8" fill="#fff2bd"/><path d="M164 114h72" fill="none" stroke-dasharray="2 8"/></g>
<g ${S}><path d="M104 244q-6-10 2-14M124 244q-6-10 2-14" fill="none" stroke-width="2"/><path d="M324 142c-14-12-30 6-12 20c6 4 6 4 12 14c6-10 6-10 12-14c18-14 2-32-12-20z" fill="#f6b8cf" transform="translate(-4 -64) scale(.7)"/></g>${star(36, 90, 8)}</svg>`,
  lighthouse:
    head('c10', '#bfe4f7', '#fff0d8') +
    `${sun(70, 56)}${cloud(316, 60, 0.5)}
<path d="M-10 190Q60 176 130 190T270 190T410 190V310H-10z" fill="#7fcfe0" ${S}/><path d="M-10 236Q80 214 170 238T410 226V310H-10z" fill="#a4d2f2" ${S}/>
<g ${S}><path d="M120 250q10-26 40-26h80q30 0 40 26z" fill="#e3e0f0"/><path d="M176 224l10-120h28l10 120z" fill="#fff"/><path d="M180 188h40l3-26h-46zM186 130h28l2-18h-32z" fill="#f6b8cf" stroke-width="2.4"/><rect x="180" y="84" width="40" height="22" rx="4" fill="#ffe9a8"/><path d="M172 84h56l-28-26z" fill="#d9cdf6"/><path d="M180 224v-26a20 20 0 0 1 40 0v26z" fill="#e9c7a3" stroke-width="2.2"/></g>
<path d="M230 94l110-24v50z" fill="#fff2bd" opacity=".55"/>
<g fill="none" ${S} stroke-width="2.4"><path d="M320 140q10-12 20 0M350 120q8-10 16 0"/></g></svg>`,
  pie:
    head('c11', '#ffe9d6', '#fde6ef') +
    `${cloud(80, 56, 0.5)}${sun(334, 54, 22)}
<path d="M-10 240H410V310H-10z" fill="#e9c7a3" ${S}/><path d="M-10 270H410" stroke="${LINE}" stroke-width="2.2" fill="none"/>
<g ${S}><ellipse cx="200" cy="188" rx="110" ry="30" fill="#f8e4c2"/><path d="M96 180q-4-38 36-52q38-14 68-14t68 14q40 14 36 52q-30 18-104 18T96 180z" fill="#d9cdf6"/><path d="M104 168q96-20 192 0" fill="none" stroke-width="2.4"/><g fill="#8d8ed0" stroke-width="1.8"><circle cx="150" cy="150" r="8"/><circle cx="190" cy="140" r="9"/><circle cx="236" cy="146" r="8"/><circle cx="214" cy="164" r="7"/><circle cx="168" cy="166" r="7"/></g><path d="M120 150l8-12M142 128l10-6M262 126l10 6M280 142l10 10" fill="none" stroke-width="2.4"/></g>
<g ${S} stroke-width="2.4"><path d="M312 232q-4-30 10-44q16 0 20 14q4 22-4 30z" fill="#f8e4c2"/><path d="M322 188l-4-16M336 192l8-14" fill="none"/><circle cx="324" cy="204" r="2.4" fill="${LINE}"/></g>${star(46, 140, 8)}</svg>`,
  museum:
    head('c12', '#6f74b8', '#c9b3e6') +
    `${moon(330, 56, 22)}${star(60, 50, 8)}${star(160, 34, 6)}${star(250, 66, 7)}
<path d="M-10 262H410V310H-10z" fill="#8d8ed0" ${S}/>
<g ${S}><rect x="76" y="124" width="248" height="138" rx="4" fill="#e3e0f0"/><path d="M60 128L200 62L340 128z" fill="#d9cdf6"/><g fill="#fff"><rect x="96" y="144" width="26" height="118" rx="3"/><rect x="146" y="144" width="26" height="118" rx="3"/><rect x="228" y="144" width="26" height="118" rx="3"/><rect x="278" y="144" width="26" height="118" rx="3"/></g><path d="M180 262v-40a20 20 0 0 1 40 0v40z" fill="#e9c7a3"/><circle cx="200" cy="110" r="14" fill="#ffe9a8"/></g>
<g ${S} stroke-width="2.2"><ellipse cx="60" cy="278" rx="14" ry="10" fill="#fff8ec"/><circle cx="50" cy="268" r="5" fill="#fff8ec"/><circle cx="68" cy="268" r="5" fill="#fff8ec"/><path d="M44 266l6-8l6 8z" fill="#fff2bd"/></g><g fill="#fff6a0">${dots([[330, 150, 3], [350, 110, 2.5]], '#fff6a0')}</g></svg>`
};

export const storyCovers = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, fixDup(v)]));
