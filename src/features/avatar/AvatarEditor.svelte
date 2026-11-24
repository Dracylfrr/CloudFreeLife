<script lang="ts">
  import { tick } from 'svelte';
  import { settings, updateSettings } from '../../core/settings';
  import { sfx } from '../../core/audio';
  import { confirmDialog, promptDialog, toast } from '../../core/feedback';
  import Button from '../../ui/Button.svelte';
  import Slider from '../../ui/Slider.svelte';
  import Avatar from './Avatar.svelte';
  import MyAvatar from './MyAvatar.svelte';
  import PictureCropper from './PictureCropper.svelte';
  import { get } from 'svelte/store';
  import { avatarEditorOpen, avatarEditorTab, closeAvatarEditor, hasAvatar } from './state';
  import { FRAMES, type FrameDef } from './frames';
  import { KIND_LABEL, counts, frameStatus } from './unlocks';
  import { checkPictureFile, loadPicture, pictureUrl, removePicture, savePicture } from './picture';
  import {
    ACCENT_COLORS, BACKGROUNDS, SCENES, SCENE_LABEL, BODIES, BODY_LABEL, CHINS, CHIN_LABEL, EARRINGS, EARRINGS_LABEL, EARS, EARS_LABEL, EYE_COLORS, EYE_SHAPES, EYE_SHAPE_LABEL, GLASSES, GLASSES_LABEL, HAIR_ACCS, HAIR_ACC_LABEL,
    HAIR_COLORS, HAIR_STYLES, HAIR_STYLE_LABEL, HATS, HAT_LABEL, LIMITS, MAX_LOOKS, MAX_LOOK_NAME, MOUTHS, MOUTH_LABEL, OUTFITS, OUTFIT_COLORS, OUTFIT_LABEL, SKIN_TONES,
    cleanLookName, presetFor, styleDefaults, type AvatarBase, type AvatarConfig, type SavedLook, type Swatch
  } from './avatar';

  type Tab = 'face' | 'hair' | 'body' | 'clothes' | 'extras' | 'frame' | 'picture' | 'looks';
  const TABS: { id: Tab; label: string }[] = [
    { id: 'face', label: 'Face' },
    { id: 'hair', label: 'Hair' },
    { id: 'body', label: 'Body' },
    { id: 'clothes', label: 'Clothes' },
    { id: 'extras', label: 'Extras' },
    { id: 'frame', label: 'Frame' },
    { id: 'picture', label: 'Picture' },
    { id: 'looks', label: 'My looks' }
  ];

  let dialog = $state<HTMLDivElement | undefined>();
  let opener: HTMLElement | null = null;
  let tab = $state<Tab>('face');
  let chosen = $state<File | null>(null);
  let pictureError = $state('');
  const avatar = $derived($settings.avatar);
  const frame = $derived($settings.avatarFrame);
  const havePicture = $derived($settings.avatarPicture > 0);
  const usingPicture = $derived($settings.avatarMode === 'picture' && havePicture);
  const started = $derived(hasAvatar($settings));

  // Focus moves into the editor when it opens and goes back to what opened it when it closes.
  $effect(() => {
    if ($avatarEditorOpen) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      chosen = null;
      pictureError = '';
      const want = get(avatarEditorTab);
      if (want && TABS.some((t) => t.id === want)) tab = want as Tab;
      avatarEditorTab.set(null);
      void loadPicture();
      void tick().then(() => dialog?.focus());
    }
  });

  const plain = $derived(FRAMES.filter((f) => f.group === 'Plain rings'));
  const soft = $derived(FRAMES.filter((f) => f.group === 'Soft themes'));
  const earned = $derived(FRAMES.filter((f) => f.group === 'Earned'));
  const KINDS = ['stories', 'endings', 'levels'] as const;
  const unlockedCount = $derived(earned.filter((f) => frameStatus(f, $counts).unlocked).length);
  function chooseFrame(f: FrameDef) {
    if (!frameStatus(f, $counts).unlocked) return;
    updateSettings({ avatarFrame: f.id });
    sfx.click();
  }

  function close() {
    chosen = null;
    closeAvatarEditor();
    opener?.focus();
    opener = null;
  }
  function begin(base: AvatarBase) {
    updateSettings({ avatar: presetFor(base), avatarMode: 'drawn' });
    sfx.pop(1.2);
  }
  function change(patch: Partial<AvatarConfig>) {
    if (!avatar) return;
    updateSettings({ avatar: { ...avatar, ...patch }, avatarMode: 'drawn' });
    sfx.click();
  }
  function resetShape() {
    if (avatar) change(styleDefaults());
  }
  async function remove() {
    const ok = await confirmDialog({ title: 'Remove your avatar?', message: 'Your drawn avatar, picture and frame go back to empty. Your saved looks stay.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    await removePicture();
    updateSettings({ avatar: null, avatarFrame: 'none', avatarMode: 'drawn' });
  }
  function key(e: KeyboardEvent) {
    if ($avatarEditorOpen && e.key === 'Escape' && !chosen) {
      e.preventDefault();
      close();
    }
  }

  // ---- pictures
  function pickFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    const problem = checkPictureFile(f);
    pictureError = problem ?? '';
    if (!problem) chosen = f;
  }
  async function pictureDone(png: Uint8Array) {
    if (!avatar) updateSettings({ avatar: presetFor('girl') }); // so there is a drawn look to go back to
    chosen = null;
    try {
      await savePicture(png);
      toast('Your picture is your avatar now.', 'success', 3000);
    } catch (err) {
      console.error(err);
      toast("Couldn't save that picture. Please try again.", 'error');
    }
  }
  async function dropPicture() {
    const ok = await confirmDialog({ title: 'Delete your picture?', message: 'The picture is removed from this app and your drawn avatar comes back. Your original file is not touched.', confirmLabel: 'Delete picture', danger: true });
    if (ok) await removePicture();
  }

  // ---- saved looks
  async function saveLook() {
    if (!avatar) return;
    if ($settings.avatarLooks.length >= MAX_LOOKS) {
      toast(`You can keep ${MAX_LOOKS} looks. Delete one to make room.`, 'info');
      return;
    }
    const name = await promptDialog({ title: 'Save this look', message: 'Give it a name so you can find it again.', confirmLabel: 'Save look', input: { value: `Look ${$settings.avatarLooks.length + 1}`, maxLength: MAX_LOOK_NAME } });
    if (name === null) return;
    const look: SavedLook = { id: Math.random().toString(36).slice(2, 10), name: cleanLookName(name), avatar: { ...avatar }, frame };
    updateSettings({ avatarLooks: [...$settings.avatarLooks, look] });
    sfx.pop(1.2);
  }
  function useLook(l: SavedLook) {
    updateSettings({ avatar: { ...l.avatar }, avatarFrame: l.frame, avatarMode: 'drawn' });
    sfx.pop(1.1);
  }
  async function deleteLook(l: SavedLook) {
    const ok = await confirmDialog({ title: `Delete "${l.name}"?`, message: 'This saved look will be removed. Your current avatar is not changed.', confirmLabel: 'Delete', danger: true });
    if (ok) updateSettings({ avatarLooks: $settings.avatarLooks.filter((x) => x.id !== l.id) });
  }
</script>

<svelte:window onkeydown={key} />

{#snippet swatches(label: string, list: Swatch[], current: string, onpick: (c: string) => void)}
  <div class="row">
    <h3>{label}</h3>
    <div class="sw" role="radiogroup" aria-label={label}>
      {#each list as s (s.color)}
        <button class="dot" class:on={current === s.color} style="--c:{s.color}" role="radio" aria-checked={current === s.color} aria-label={s.name} title={s.name} onclick={() => onpick(s.color)}></button>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet chips(label: string, list: readonly string[], names: Record<string, string>, current: string, onpick: (v: string) => void)}
  <div class="row">
    <h3>{label}</h3>
    <div class="chips" role="radiogroup" aria-label={label}>
      {#each list as v (v)}
        <button class="chip" class:on={current === v} role="radio" aria-checked={current === v} onclick={() => onpick(v)}>{names[v]}</button>
      {/each}
    </div>
  </div>
{/snippet}

{#if $avatarEditorOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" onclick={(e) => e.target === e.currentTarget && !chosen && close()}>
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="avatar-title" tabindex="-1" bind:this={dialog}>
      <header>
        <h2 id="avatar-title">{started ? 'Your avatar' : 'Choose your avatar'}</h2>
        <button class="x" aria-label="Close" onclick={close}>×</button>
      </header>

      {#if !started}
        <p class="lead">Pick a starting look. You can change everything about it afterwards: face, hair, body, clothes, accessories and frame. Or use a picture of your own.</p>
        <div class="starters">
          {#each ['girl', 'boy'] as const as b}
            <button class="starter" onclick={() => begin(b)}>
              <Avatar avatar={presetFor(b)} size={124} />
              <strong>{b === 'girl' ? 'Girl' : 'Boy'}</strong>
            </button>
          {/each}
        </div>
        <div class="own">
          <label class="file">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp" onchange={pickFile} aria-label="Choose a picture from your computer" />
            <span>Use a picture from my computer</span>
          </label>
          {#if pictureError}<p class="err" role="alert">{pictureError}</p>{/if}
        </div>
        {#if chosen}
          <PictureCropper file={chosen} ondone={pictureDone} oncancel={() => (chosen = null)} />
        {/if}
      {:else}
        <div class="body">
          <div class="view">
            <MyAvatar size={168} />
            {#if havePicture && avatar}
              <div class="starts" role="group" aria-label="What to show">
                <button class:on={!usingPicture} onclick={() => updateSettings({ avatarMode: 'drawn' })}>Drawn</button>
                <button class:on={usingPicture} onclick={() => updateSettings({ avatarMode: 'picture' })}>My picture</button>
              </div>
            {/if}
            {#if avatar}
              <div class="starts" role="group" aria-label="Start again from">
                <button onclick={() => change({ ...presetFor('girl') })}>Girl look</button>
                <button onclick={() => change({ ...presetFor('boy') })}>Boy look</button>
              </div>
            {/if}
          </div>

          <div class="main">
            <div class="tabs" role="tablist" aria-label="What to change">
              {#each TABS as t (t.id)}
                <button class="tab" class:on={tab === t.id} role="tab" aria-selected={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
              {/each}
            </div>

            <div class="pane" role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
              {#if tab === 'frame'}
                <p class="note">A frame goes around your avatar or your picture.</p>
                <div class="frames">
                  <button class="frame" class:on={frame === 'none'} aria-pressed={frame === 'none'} onclick={() => updateSettings({ avatarFrame: 'none' })}>
                    {@render preview('none')}
                    <span>No frame</span>
                  </button>
                </div>
                <h3 class="grp">Plain rings</h3>
                <div class="frames">
                  {#each plain as f (f.id)}
                    <button class="frame" class:on={frame === f.id} aria-pressed={frame === f.id} onclick={() => chooseFrame(f)}>
                      {@render preview(f.id)}
                      <span>{f.label}</span>
                    </button>
                  {/each}
                </div>
                <h3 class="grp">Soft themes</h3>
                <div class="frames">
                  {#each soft as f (f.id)}
                    <button class="frame" class:on={frame === f.id} aria-pressed={frame === f.id} onclick={() => chooseFrame(f)}>
                      {@render preview(f.id)}
                      <span>{f.label}</span>
                    </button>
                  {/each}
                </div>
                <h3 class="grp">Earned themes <span class="tally">{unlockedCount} of {earned.length} unlocked</span></h3>
                <p class="note">These unlock as you read stories, find adventure endings and finish game levels. There is no hurry.</p>
                {#each KINDS as k (k)}
                  <h4 class="kind">{KIND_LABEL[k].total}: <strong>{$counts[k]}</strong></h4>
                  <div class="frames">
                    {#each earned.filter((f) => f.unlock?.kind === k) as f (f.id)}
                      {@const st = frameStatus(f, $counts)}
                      <button class="frame" class:on={frame === f.id} class:locked={!st.unlocked} aria-pressed={frame === f.id} aria-disabled={!st.unlocked} title={st.unlocked ? f.label : `Locked. ${st.task} to unlock (${st.counter}).`} onclick={() => chooseFrame(f)}>
                        <span class="pv">{@render preview(f.id)}{#if !st.unlocked}<i class="lock" aria-hidden="true">🔒</i>{/if}</span>
                        <span>{f.label}</span>
                        {#if st.unlocked}
                          <small class="done">Unlocked</small>
                        {:else}
                          <small>{st.task}</small>
                          <span class="meter" role="progressbar" aria-label={st.counter} aria-valuemin="0" aria-valuemax={st.need} aria-valuenow={st.have}><i style="width:{st.percent}%"></i></span>
                          <small class="count">{st.counter}</small>
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/each}
              {:else if tab === 'picture'}
                {#if chosen}
                  <PictureCropper file={chosen} ondone={pictureDone} oncancel={() => (chosen = null)} />
                {:else}
                  <p class="note">Use a picture from your computer as your avatar. You choose it in the usual window, then move, zoom and turn it inside the circle. The picture is copied into this app only; nothing is sent anywhere and your original file is never changed.</p>
                  <div class="actions">
                    <label class="file big">
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp" onchange={pickFile} aria-label="Choose a picture from your computer" />
                      <span>{havePicture ? 'Choose a different picture' : 'Choose a picture from my computer'}</span>
                    </label>
                  </div>
                  {#if pictureError}<p class="err" role="alert">{pictureError}</p>{/if}
                  {#if havePicture}
                    <div class="picture-now">
                      <Avatar avatar={null} size={72} pictureUrl={$pictureUrl} {frame} />
                      <div>
                        <strong>{usingPicture ? 'Your picture is showing.' : 'Your picture is saved.'}</strong>
                        <p class="muted">{usingPicture ? 'Your drawn avatar is kept, and you can bring it back at any time.' : 'Your drawn avatar is showing.'}</p>
                        <div class="actions">
                          {#if usingPicture}
                            <Button variant="soft" size="sm" onclick={() => updateSettings({ avatarMode: 'drawn' })}>Use my drawn avatar</Button>
                          {:else}
                            <Button variant="soft" size="sm" onclick={() => updateSettings({ avatarMode: 'picture' })}>Use my picture</Button>
                          {/if}
                          <Button variant="ghost" size="sm" onclick={dropPicture}>Delete picture</Button>
                        </div>
                      </div>
                    </div>
                  {/if}
                {/if}
              {:else if tab === 'looks'}
                <p class="note">Save how your avatar looks right now, and come back to it any time. You can keep {MAX_LOOKS} looks.</p>
                <div class="actions"><Button variant="primary" icon="plus" onclick={saveLook}>Save this look</Button></div>
                {#if $settings.avatarLooks.length === 0}
                  <p class="muted">No saved looks yet.</p>
                {:else}
                  <ul class="looks">
                    {#each $settings.avatarLooks as l (l.id)}
                      <li>
                        <Avatar avatar={l.avatar} size={54} frame={l.frame} />
                        <strong>{l.name}</strong>
                        <span class="sp"></span>
                        <Button variant="soft" size="sm" onclick={() => useLook(l)}>Use</Button>
                        <Button variant="ghost" size="sm" title="Delete {l.name}" onclick={() => deleteLook(l)}>Delete</Button>
                      </li>
                    {/each}
                  </ul>
                {/if}
              {:else if avatar}
                {#if tab === 'face'}
                  <Slider label="Head width" value={avatar.headW} min={LIMITS.headW.min} max={LIMITS.headW.max} step={1} format={(v) => `${Math.round(v)}%`} onchange={(v) => change({ headW: v })} />
                  <Slider label="Head height" value={avatar.headH} min={LIMITS.headH.min} max={LIMITS.headH.max} step={1} format={(v) => `${Math.round(v)}%`} onchange={(v) => change({ headH: v })} />
                  {@render chips('Chin', CHINS, CHIN_LABEL, avatar.chin, (v) => change({ chin: v as AvatarConfig['chin'] }))}
                  {@render chips('Eye shape', EYE_SHAPES, EYE_SHAPE_LABEL, avatar.eyeShape, (v) => change({ eyeShape: v as AvatarConfig['eyeShape'] }))}
                  <Slider label="Eye size" value={avatar.eyeSize} min={LIMITS.eyeSize.min} max={LIMITS.eyeSize.max} step={1} format={(v) => `${Math.round(v)}%`} onchange={(v) => change({ eyeSize: v })} />
                  <Slider label="Space between the eyes" value={avatar.eyeGap} min={LIMITS.eyeGap.min} max={LIMITS.eyeGap.max} step={1} format={(v) => `${Math.round(v)}%`} onchange={(v) => change({ eyeGap: v })} />
                  {@render swatches('Eye color', EYE_COLORS, avatar.eyes, (c) => change({ eyes: c }))}
                  {@render chips('Mouth', MOUTHS, MOUTH_LABEL, avatar.mouth, (v) => change({ mouth: v as AvatarConfig['mouth'] }))}
                  {@render chips('Ears', EARS, EARS_LABEL, avatar.ears, (v) => change({ ears: v as AvatarConfig['ears'] }))}
                  {@render swatches('Skin', SKIN_TONES, avatar.skin, (c) => change({ skin: c }))}
                  <div class="actions"><Button variant="ghost" size="sm" onclick={resetShape}>Reset head, eyes and neck</Button></div>
                {:else if tab === 'hair'}
                  {@render chips('Hair style', HAIR_STYLES, HAIR_STYLE_LABEL, avatar.hairStyle, (v) => change({ hairStyle: v as AvatarConfig['hairStyle'] }))}
                  {@render swatches('Hair color', HAIR_COLORS, avatar.hair, (c) => change({ hair: c }))}
                {:else if tab === 'body'}
                  {@render chips('Body type', BODIES, BODY_LABEL, avatar.body, (v) => change({ body: v as AvatarConfig['body'] }))}
                  <Slider label="Neck length" value={avatar.neckLen} min={LIMITS.neckLen.min} max={LIMITS.neckLen.max} step={0.5} format={(v) => (v < 0.5 ? 'Short' : v > 9 ? 'Long' : 'Medium')} onchange={(v) => change({ neckLen: v })} />
                  <Slider label="Neck width" value={avatar.neckWidth} min={LIMITS.neckWidth.min} max={LIMITS.neckWidth.max} step={0.25} format={(v) => (v < 7 ? 'Slim' : v > 9.5 ? 'Thick' : 'Average')} onchange={(v) => change({ neckWidth: v })} />
                {:else if tab === 'clothes'}
                  {@render chips('Clothes', OUTFITS, OUTFIT_LABEL, avatar.outfit, (v) => change({ outfit: v as AvatarConfig['outfit'] }))}
                  {@render swatches('Clothes color', OUTFIT_COLORS, avatar.outfitColor, (c) => change({ outfitColor: c }))}
                  {@render chips('Background scene', SCENES, SCENE_LABEL, avatar.scene, (v) => change({ scene: v as AvatarConfig['scene'] }))}
                  {#if avatar.scene === 'color'}{@render swatches('Background color', BACKGROUNDS, avatar.background, (c) => change({ background: c }))}{/if}
                {:else if tab === 'extras'}
                  {@render chips('Hat', HATS, HAT_LABEL, avatar.hat, (v) => change({ hat: v as AvatarConfig['hat'] }))}
                  {#if avatar.hat !== 'none'}{@render swatches('Hat color', ACCENT_COLORS, avatar.hatColor, (c) => change({ hatColor: c }))}{/if}
                  {@render chips('Glasses', GLASSES, GLASSES_LABEL, avatar.glasses, (v) => change({ glasses: v as AvatarConfig['glasses'] }))}
                  {#if avatar.glasses !== 'none'}{@render swatches(avatar.glasses === 'sun' || avatar.glasses === 'heart' ? 'Lens color' : 'Frame color', ACCENT_COLORS, avatar.glassesColor, (c) => change({ glassesColor: c }))}{/if}
                  {@render chips('Earrings', EARRINGS, EARRINGS_LABEL, avatar.earrings, (v) => change({ earrings: v as AvatarConfig['earrings'] }))}
                  {#if avatar.earrings !== 'none'}{@render swatches('Earring color', ACCENT_COLORS, avatar.earringColor, (c) => change({ earringColor: c }))}{/if}
                  {@render chips('Hair accessory', HAIR_ACCS, HAIR_ACC_LABEL, avatar.hairAcc, (v) => change({ hairAcc: v as AvatarConfig['hairAcc'] }))}
                  {#if avatar.hairAcc !== 'none'}{@render swatches('Accessory color', ACCENT_COLORS, avatar.hairAccColor, (c) => change({ hairAccColor: c }))}{/if}
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <footer>
        {#if started}<Button variant="ghost" size="sm" onclick={remove}>Remove avatar</Button>{/if}
        <span class="spacer"></span>
        <Button variant="primary" onclick={close}>{started ? 'Done' : 'Not now'}</Button>
      </footer>
    </div>
  </div>
{/if}

{#snippet preview(id: string)}
  <Avatar avatar={avatar} size={64} frame={id} pictureUrl={usingPicture ? $pictureUrl : null} />
{/snippet}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(70, 64, 120, 0.34);
    backdrop-filter: blur(4px);
    animation: fade 0.2s ease-out;
  }
  .panel {
    width: min(920px, 100%);
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    padding: 20px 24px 18px;
    border-radius: var(--radius-xl);
    background: var(--panel-solid);
    color: var(--ink);
    box-shadow: var(--shadow-l);
    border: 1px solid rgb(var(--w) / 0.85);
    outline: none;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  header h2 {
    font-size: 1.35rem;
  }
  .x {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--ink-soft);
  }
  .x:hover {
    background: var(--lilac);
  }
  .lead {
    color: var(--ink-soft);
    margin-bottom: 14px;
  }
  .starters {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    padding: 6px 0 12px;
  }
  .starter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 18px 26px 14px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    transition:
      transform 0.2s var(--ease),
      box-shadow 0.2s var(--ease);
  }
  .starter:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-l);
  }
  .starter strong {
    font-size: 1.05rem;
  }
  .own {
    text-align: center;
    margin: 6px 0 12px;
  }
  .body {
    display: grid;
    grid-template-columns: 210px 1fr;
    gap: 22px;
    align-items: start;
  }
  .view {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .starts {
    display: flex;
    gap: 6px;
  }
  .starts button {
    padding: 5px 11px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.78rem;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .starts button:hover {
    color: var(--ink);
  }
  .starts button.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .main {
    min-width: 0;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }
  .tab {
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.86rem;
    color: var(--ink-soft);
  }
  .tab:hover {
    color: var(--ink);
    background: var(--lilac);
  }
  .tab.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .pane {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 300px;
  }
  .row h3,
  .grp {
    font-size: 0.82rem;
    color: var(--ink-soft);
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }
  .grp {
    margin: 8px 0 0;
  }
  .sw,
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .dot {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--c);
    border: 3px solid rgb(var(--w) / 0.95);
    box-shadow:
      0 0 0 1.5px var(--line),
      var(--shadow-s);
    transition: transform 0.15s var(--ease);
  }
  .dot:hover {
    transform: scale(1.1);
  }
  .dot.on {
    box-shadow:
      0 0 0 3px var(--lavender-deep),
      var(--shadow-s);
  }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.84rem;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .chip:hover {
    color: var(--ink);
  }
  .chip.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .frames {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }
  .frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 6px 8px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
    border: 2px solid transparent;
    font-weight: 800;
    font-size: 0.78rem;
    color: var(--ink-soft);
  }
  .frame:hover {
    color: var(--ink);
    box-shadow: var(--shadow-m);
  }
  .frame.on {
    border-color: var(--lavender-deep);
    color: var(--ink);
  }
  .note {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .tally {
    margin-left: 8px;
    font-weight: 700;
    color: var(--ink-faint);
  }
  .kind {
    font-size: 0.82rem;
    color: var(--ink-soft);
    margin: 8px 0 0;
  }
  .kind strong {
    color: var(--ink);
    font-size: 0.95rem;
  }
  .frame small {
    font-weight: 700;
    font-size: 0.68rem;
    line-height: 1.2;
    text-align: center;
    color: var(--ink-faint);
  }
  .frame small.done {
    color: var(--c-green2);
  }
  .frame small.count {
    color: var(--ink-soft);
  }
  .frame.locked {
    cursor: default;
  }
  .frame.locked .pv :global(.av) {
    filter: grayscale(0.85) opacity(0.55);
  }
  .pv {
    position: relative;
    display: inline-block;
    line-height: 0;
  }
  .lock {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-style: normal;
    font-size: 1.1rem;
    line-height: 1;
  }
  .meter {
    width: 100%;
    height: 5px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
  }
  .meter i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--nav-a), var(--lavender-deep));
  }
  .muted {
    color: var(--ink-soft);
    font-size: 0.88rem;
  }
  .err {
    color: var(--c-rose);
    font-weight: 700;
    margin-top: 8px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .file {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 18px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.9rem;
    color: var(--nav-ink);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    box-shadow: var(--shadow-s);
    cursor: pointer;
  }
  .file.big {
    padding: 11px 24px;
    font-size: 1rem;
  }
  .file input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }
  .file:focus-within {
    outline: 3px solid var(--lavender-deep);
    outline-offset: 2px;
  }
  .picture-now {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 12px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .looks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .looks li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .sp {
    flex: 1;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
  .spacer {
    flex: 1;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @media (max-width: 720px) {
    .body {
      grid-template-columns: 1fr;
    }
    .view {
      position: static;
    }
  }
</style>
