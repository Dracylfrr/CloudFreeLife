<script lang="ts">
  interface Props {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    label: string;
    format?: (v: number) => string;
    onchange: (v: number) => void;
    onrelease?: () => void;
  }
  let { value, min = 0, max = 1, step = 0.01, label, format = (v) => `${Math.round(v * 100)}%`, onchange, onrelease }: Props = $props();
  const pct = $derived(((value - min) / (max - min)) * 100);
</script>

<label class="slider">
  <span class="top"><span class="label">{label}</span><span class="val">{format(value)}</span></span>
  <input
    type="range"
    {min}
    {max}
    {step}
    {value}
    style="--pct:{pct}%"
    oninput={(e) => onchange(Number(e.currentTarget.value))}
    onchange={() => onrelease?.()}
  />
</label>

<style>
  .slider {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 4px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
  }
  .val {
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--g1) 0, var(--g2) var(--pct), var(--track) var(--pct));
    outline-offset: 6px;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--g2);
    box-shadow: 0 3px 8px rgba(100, 85, 170, 0.3);
    transition: transform 0.15s;
  }
  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.12);
  }
</style>
