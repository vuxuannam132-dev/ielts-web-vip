import confetti from 'canvas-confetti';

export const triggerFireworks = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

export const triggerBurst = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
};
