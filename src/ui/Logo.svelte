<script lang="ts">
  let { size = 48 }: { size?: number } = $props();
</script>

<!-- Cloud-Freelife mark: a soft cloud with a paintbrush and a pastel paint mark. -->
<svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
  <defs>
    <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#bfe4f7" />
      <stop offset="0.55" stop-color="#d8cdf5" />
      <stop offset="1" stop-color="#f6cfe3" />
    </linearGradient>
    <linearGradient id="lg-handle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffd3b8" />
      <stop offset="1" stop-color="#ffbf9c" />
    </linearGradient>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="116" fill="url(#lg-bg)" />
  <path d="M74 408 C 120 372, 168 442, 222 406 C 262 380, 292 420, 330 402" fill="none" stroke="#ffb7d1" stroke-width="26" stroke-linecap="round" />
  <path d="M96 424 C 140 392, 182 452, 232 424" fill="none" stroke="#fff0a8" stroke-width="12" stroke-linecap="round" opacity="0.9" />
  <g fill="#fbfcff">
    <circle cx="170" cy="286" r="66" />
    <circle cx="252" cy="226" r="86" />
    <circle cx="340" cy="276" r="72" />
    <rect x="116" y="272" width="300" height="102" rx="51" />
  </g>
  <ellipse cx="216" cy="300" rx="9" ry="11" fill="#6f6a92" />
  <ellipse cx="296" cy="300" rx="9" ry="11" fill="#6f6a92" />
  <ellipse cx="190" cy="326" rx="17" ry="10" fill="#ffc0d6" opacity="0.8" />
  <ellipse cx="322" cy="326" rx="17" ry="10" fill="#ffc0d6" opacity="0.8" />
  <path d="M240 322 q16 18 32 0" fill="none" stroke="#6f6a92" stroke-width="6" stroke-linecap="round" />
  <g transform="translate(34 -4) rotate(38 356 300)">
    <rect x="337" y="96" width="38" height="196" rx="19" fill="url(#lg-handle)" />
    <rect x="337" y="120" width="38" height="14" fill="#c9b8f2" opacity="0.85" />
    <rect x="333" y="282" width="46" height="46" rx="9" fill="#dfe6f3" />
    <path d="M335 326 C 333 364, 350 388, 356 404 C 362 388, 379 364, 377 326 Z" fill="#ffa6c9" />
  </g>
</svg>
