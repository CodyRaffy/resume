import { COMBO_THRESHOLDS } from '../config/GameConfig';

const HIGH_SCORE_KEY = 'jacksonRobotRun_highScore';
const STATS_KEY = 'jacksonRobotRun_stats';

export class ScoreManager {
  private score: number = 0;
  private combo: number = 0;
  private collected: number = 0;
  private distanceAccumulator: number = 0;

  addDistance(points: number): void {
    this.distanceAccumulator += points;
    // Only add 1 score point per 10 distance ticks (so score isn't crazy fast)
    if (this.distanceAccumulator >= 10) {
      this.score += 1;
      this.distanceAccumulator -= 10;
    }
  }

  addCollectible(basePoints: number): void {
    this.combo++;
    this.collected++;
    const multiplier = this.getMultiplier();
    this.score += basePoints * multiplier;
  }

  resetCombo(): void {
    this.combo = 0;
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  getCollected(): number {
    return this.collected;
  }

  getMultiplier(): number {
    let multiplier = 1;
    for (const threshold of COMBO_THRESHOLDS) {
      if (this.combo >= threshold.combo) {
        multiplier = threshold.multiplier;
      }
    }
    return multiplier;
  }

  saveHighScore(): void {
    try {
      const currentHigh = ScoreManager.getHighScore();
      if (this.score > currentHigh) {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.score));
      }

      // Save stats
      const stats = ScoreManager.getStats();
      stats.totalGames = (stats.totalGames || 0) + 1;
      stats.totalScore = (stats.totalScore || 0) + this.score;
      stats.totalCollected = (stats.totalCollected || 0) + this.collected;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // localStorage not available (private browsing, etc.)
    }
  }

  static getHighScore(): number {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  }

  static getStats(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
    } catch {
      return {};
    }
  }
}
