// Reusable Text Animation Library
export interface TextAnimationConfig {
  speed?: number;
  maxIterations?: number;
  characters?: string;
  useOriginalCharsOnly?: boolean;
}

export const DEFAULT_CYBER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';

export class TextScrambler {
  private config: Required<TextAnimationConfig>;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: TextAnimationConfig = {}) {
    this.config = {
      speed: config.speed ?? 50,
      maxIterations: config.maxIterations ?? 10,
      characters: config.characters ?? DEFAULT_CYBER_CHARS,
      useOriginalCharsOnly: config.useOriginalCharsOnly ?? false,
    };
  }

  scramble(
    text: string,
    onUpdate: (displayText: string) => void,
    onComplete?: () => void
  ): () => void {
    if (this.intervalId) clearInterval(this.intervalId);

    const availableChars = this.config.useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).join('')
      : this.config.characters;

    let iteration = 0;

    this.intervalId = setInterval(() => {
      const displayText = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (iteration >= this.config.maxIterations) return char;
          if (Math.random() < 0.1 * iteration) return char;
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join('');

      onUpdate(displayText);

      if (iteration >= this.config.maxIterations) {
        onUpdate(text);
        this.stop();
        onComplete?.();
      }

      iteration++;
    }, this.config.speed);

    return () => this.stop();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export function createRevealAnimation(
  text: string,
  duration: number,
  chars: string = DEFAULT_CYBER_CHARS
): (onUpdate: (text: string) => void, onComplete?: () => void) => () => void {
  return (onUpdate, onComplete) => {
    const length = text.length;
    let frame = 0;
    const totalFrames = duration * 30;

    const intervalId = setInterval(() => {
      const progress = frame / totalFrames;
      const resolveThreshold = Math.floor(progress * length);

      const output = text
        .split('')
        .map((char, i) => {
          if (i < resolveThreshold) return char;
          return Math.random() < 0.1 ? ' ' : chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      onUpdate(output);
      frame++;

      if (frame > totalFrames + 12) {
        onUpdate(text);
        clearInterval(intervalId);
        onComplete?.();
      }
    }, 40);

    return () => clearInterval(intervalId);
  };
}
