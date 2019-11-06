'use strict';

class DualShock2 {
    constructor(domElement) {
        this.domElement = domElement;

        this.BUTTON_NAMES = [
            'select', 'l3', 'r3', 'start',
            'up', 'right', 'down', 'left',
            'l2', 'r2', 'l1', 'r1',
            'triangle', 'circle', 'cross', 'square',
            'la_up', 'la_right', 'la_down', 'la_left',
            'ra_up', 'ra_right', 'ra_down', 'ra_left',
        ];

        this.keymap = {
            KeyE: 0, KeyF: 1, KeyJ: 2, KeyO: 3,
            KeyW: 4, KeyS: 5, KeyZ: 6, KeyA: 7,
            Digit1: 8, Equal: 9, Digit2: 10, Minus: 11,
            KeyP: 12, Semicolon: 13, Period: 14, KeyL: 15,
            KeyR: 16, KeyG: 17, KeyC: 18, KeyD: 19,
            KeyU: 20, KeyK: 21, KeyN: 22, KeyH: 23,
        };
    }

    getButton() {
        return this.button;
    }

    connect() {
        this.button = null;

        this.keydownEventListener = e => {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (e.code in this.keymap) {
                this.button = this.BUTTON_NAMES[this.keymap[e.code]];
            }
        };

        this.domElement.addEventListener('keydown', this.keydownEventListener);

        this.keyupEventListener = e => {
            if (e.code in this.keymap && this.button === this.BUTTON_NAMES[this.keymap[e.code]]) {
                this.button = null;
            }
        };

        document.addEventListener('keyup', this.keyupEventListener);
    }

    disconnect() {
        this.domElement.removeEventListener('keydown', this.keydownEventListener);
        document.removeEventListener('keyup', this.keyupEventListener);
    }
}
