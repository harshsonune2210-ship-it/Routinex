import confetti from 'canvas-confetti';

export function fireTacticalConfetti() {
  // Dual-cannon emerald & gold particle blast
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#10b981', '#34d399', '#f59e0b', '#ffffff', '#059669'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (e) {}
}

export function fireMilestoneBurst() {
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#38bdf8', '#a855f7'],
    });
  } catch (e) {}
}
