<script lang="ts" module>
  export const ICONS: Record<string, string> = {
    home: 'M3 11l9-7.5 9 7.5v9a1 1 0 0 1-1 1h-5v-6.5h-6V21H4a1 1 0 0 1-1-1z',
    book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z M4 20.5A2.5 2.5 0 0 0 6.5 23H19v-5',
    bookOpen: 'M12 6.5C10.5 5 8 4.5 3 4.5v14c5 0 7.5.5 9 2 1.5-1.5 4-2 9-2v-14c-5 0-7.5.5-9 2z M12 6.5v14',
    compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z',
    pencil:'M16.5 3.5l4 4L8 20l-5 1 1-5z M13.5 6.5l4 4',
    brush: 'M19.4 3.2a2 2 0 0 1 2.8 2.8L12.5 15.7l-2.8-2.8z M9.6 14c-2.6-.2-4.6 1.4-4.6 3.9 0 1.6-.9 2.7-2 3.1 3.2 1.2 7.4.7 8.8-1.9.9-1.6.4-3.2-.6-4.4',
    image: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 16l-5-5-9 9',
    gamepad: 'M7 8h10a5 5 0 0 1 4.9 6l-.6 3a2.5 2.5 0 0 1-4.3 1.2L15 16H9l-2 2.2A2.5 2.5 0 0 1 2.7 17l-.6-3A5 5 0 0 1 7 8z M8 10.5v3 M6.5 12h3 M16 11.5h.01 M18 13.5h.01',
    cloudDown: 'M7 18a4 4 0 0 1-.6-7.9 5.5 5.5 0 0 1 10.7-1A4.5 4.5 0 0 1 17 18 M12 11v8 M9 16l3 3 3-3',
    sliders: 'M4 7h9 M17 7h3 M4 17h3 M11 17h9 M15 5v4 M9 15v4',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v6 M12 7.5h.01',
    undo: 'M9 14L4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
    redo: 'M15 14l5-5-5-5 M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
    zoomIn: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3 M11 8v6 M8 11h6',
    zoomOut: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3 M8 11h6',
    fit: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
    hand: 'M8 13V6a1.5 1.5 0 0 1 3 0v5 M11 10.5V4.5a1.5 1.5 0 0 1 3 0V11 M14 10.5V6a1.5 1.5 0 0 1 3 0v8.5a6.5 6.5 0 0 1-6.5 6.5h-.4a5.2 5.2 0 0 1-4.1-2L3.5 15.5a1.5 1.5 0 0 1 2.4-1.8L8 15.5',
    pipette: 'M20.5 3.5a2.1 2.1 0 0 0-3 0L14 7l-1-1-2 2 1 1-7 7v3h3l7-7 1 1 2-2-1-1 3.5-3.5a2.1 2.1 0 0 0 0-3z',
    eraser: 'M20 20H9l-5.3-5.3a1.5 1.5 0 0 1 0-2.1l8.9-8.9a1.5 1.5 0 0 1 2.1 0l5.3 5.3a1.5 1.5 0 0 1 0 2.1L12 20 M8 8l8 8',
    bucket: 'M5 11l6-7 8 8-6.5 7.2a1.5 1.5 0 0 1-2.1.1z M19.5 15.5c1 1.4 1.8 2.4 1.8 3.3a1.8 1.8 0 0 1-3.6 0c0-.9.8-1.9 1.8-3.3z',
    marker: 'M4 20l1.2-4.2 10-10 3 3L8.2 18.8z M14 7l3 3 M3 21.5h9',
    crayon: 'M5 19.5l2-6L17.5 3l3.5 3.5L10.5 17z M7 13.5l3.5 3.5 M4 21h6',
    spray: 'M7 9.5h6V21H7z M8 9.5V6.5h4v3 M10 3.5v3 M16 5.5h.01 M18.5 3.5h.01 M19.5 7h.01 M16.5 8.5h.01 M20 10.5h.01 M16.5 12h.01',
    paintball: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M18.7 5.3l-2.1 2.1 M7.4 16.6l-2.1 2.1',
    trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
    copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
    edit: 'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
    download: 'M12 4v11 M7 11l5 5 5-5 M5 20h14',
    play: 'M7 4.5l12 7.5-12 7.5z',
    pause: 'M8 5v14 M16 5v14',
    plus: 'M12 5v14 M5 12h14',
    x: 'M6 6l12 12 M18 6L6 18',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    chevronLeft: 'M15 5l-7 7 7 7',
    chevronRight: 'M9 5l7 7-7 7',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
    volume: 'M4 9.5v5h4l5 4v-13l-5 4z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11',
    mute: 'M4 9.5v5h4l5 4v-13l-5 4z M17 9.5l4 5 M21 9.5l-4 5',
    external: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    folder: 'M3 6.5a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    frame: 'M4 4h16v16H4z M8.5 8.5h7v7h-7z',
    ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M5.6 5.6l12.8 12.8',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2.2 2.2L15.5 10',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z',
    cloud: 'M7 18a4.5 4.5 0 0 1-.5-8.97 6 6 0 0 1 11.6-.8A4.8 4.8 0 0 1 17 18z',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z M12 12h.01',
    star: 'M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8z',
    grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
    flag: 'M5 21V4 M5 4h12l-2 4 2 4H5',
    moon: 'M20 14.5A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z',
    stop: 'M7 7h10v10H7z',
    skipBack: 'M18 5v14l-9-7z M6 5v14',
    skipForward: 'M6 5v14l9-7z M18 5v14',
    headphones: 'M4 15v-3a8 8 0 0 1 16 0v3 M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2z M20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z',
    list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01'
  };
</script>

<script lang="ts">
  interface Props {
    name: string;
    size?: number;
    stroke?: number;
    class?: string;
  }
  let { name, size = 22, stroke = 1.9, class: cls = '' }: Props = $props();
  const d = $derived(ICONS[name] ?? ICONS.sparkle);
</script>

<svg
  class={cls}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path {d} />
</svg>
