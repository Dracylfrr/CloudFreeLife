<script lang="ts">
  // A soft, rounded drop-down. It is the real <select> underneath, so keyboard use,
  // screen readers and the system picker all work; only the look is Cloud-Freelife's.
  interface Option {
    value: string;
    label: string;
  }
  interface Props {
    label: string;
    value: string;
    options: Option[];
    onchange: (value: string) => void;
    disabled?: boolean;
  }
  let { label, value, options, onchange, disabled = false }: Props = $props();
</script>

<label class="sel">
  <span class="lab">{label}</span>
  <span class="box">
    <select {value} {disabled} onchange={(e) => onchange((e.currentTarget as HTMLSelectElement).value)}>
      {#each options as o (o.value)}
        <option value={o.value} selected={o.value === value}>{o.label}</option>
      {/each}
    </select>
    <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
  </span>
</label>

<style>
  .sel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .lab {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .box {
    position: relative;
    display: block;
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    padding: 9px 36px 9px 14px;
    border-radius: 14px;
    border: 2px solid var(--line);
    background: var(--panel-solid);
    color: var(--ink);
    font-weight: 700;
    cursor: pointer;
    text-overflow: ellipsis;
  }
  select:hover:not(:disabled) {
    border-color: var(--lavender-deep);
  }
  select:disabled {
    opacity: 0.5;
    cursor: default;
  }
  select option {
    background: var(--panel-solid);
    color: var(--ink);
  }
  .chev {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--ink-soft);
  }
</style>
