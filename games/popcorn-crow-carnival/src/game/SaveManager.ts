import type { SaveData } from "./types";

const defaults = (): SaveData => ({
  highScore: 0,
  topScores: [],
  settings: { muted: false },
});
const isScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export class SaveManager {
  private readonly desktop = "__TAURI_INTERNALS__" in window;
  async load(): Promise<SaveData> {
    let data: Partial<SaveData> | null;
    if (this.desktop) {
      const { invoke } = await import("@tauri-apps/api/core");
      data = await invoke<SaveData>("load_save");
    } else {
      const raw = localStorage.getItem("popcorn-crow-save");
      if (!raw) return defaults();
      try {
        data = JSON.parse(raw);
      } catch {
        return defaults();
      }
    }
    if (!data || typeof data !== "object") return defaults();
    const topScores = Array.isArray(data.topScores)
      ? data.topScores
          .filter(isScore)
          .sort((a, b) => b - a)
          .slice(0, 5)
      : [];
    const highScore = Math.max(
      isScore(data.highScore) ? data.highScore : 0,
      topScores[0] ?? 0,
    );
    if (highScore > (topScores[0] ?? 0)) topScores.unshift(highScore);
    return {
      highScore,
      topScores: topScores.slice(0, 5),
      settings: { muted: data.settings?.muted === true },
    };
  }
  async save(data: SaveData): Promise<void> {
    if (this.desktop) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_game", { data });
    } else localStorage.setItem("popcorn-crow-save", JSON.stringify(data));
  }
}
