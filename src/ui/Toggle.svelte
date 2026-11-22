<script lang="ts">
  import { sfx } from '../core/audio';
  interface Props {
    checked: boolean;
    label: string;
    description?: string;
    onchange: (v: boolean) => void;
  }
  let { checked, label, description, onchange }: Props = $props();
</script>

<label class="row">
  <span class="text">
    <span class="label">{label}</span>
    {#if description}<span class="desc">{description}</span>{/if}
  </span>
  <input
    type="checkbox"
    role="switch"
    {checked}
    onchange={(e) => {
      sfx.click();
      onchange(e.currentTarget.checked);
    }}
  />
  <span class="track" aria-hidden="true"><span class="knob"></span></span>
</label>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 14px 4px;
    cursor: pointer;
    position: relative;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .label {
    font-weight: 700;
  }
  .desc {
    color: var(--ink-soft);
    font-size: 0.88rem;
  }
  input {
    position: absolute;
    opacity: 0;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
  }
  .track {
    flex: none;
    width: 50px;
    height: 29px;
    border-radius: 999px;
    background: #dcd8ee;
    position: relative;
    transition: background 0.2s;
    box-shadow: inset 0 1px 3px rgba(80, 70, 140, 0.18);
  }
  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(80, 70, 140, 0.3);
    transition: transform 0.22s var(--ease);
  }
  input:checked ~ .track {
    background: linear-gradient(135deg, #9fd3f2, #b7a8ec);
  }
  input:checked ~ .track .knob {
    transform: translateX(21px);
  }
  input:focus-visible ~ .track {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
</style>
