'use strict';

class Input {
    constructor(dualShock2Div, keyboardDiv) {
        this.reset();

        this.keyboardButtonMap = {
            KeyT: 0, KeyF: 1, KeyJ: 2, KeyY: 3,
            KeyW: 4, KeyS: 5, KeyZ: 6, KeyA: 7,
            Digit1: 8, Equal: 9, Digit2: 10, Minus: 11,
            KeyP: 12, Semicolon: 13, Period: 14, KeyL: 15,
            KeyR: 16, KeyG: 17, KeyC: 18, KeyD: 19,
            KeyU: 20, KeyK: 21, KeyN: 22, KeyH: 23,
        };

        window.addEventListener('gamepadconnected', e => {
            if (this.gamepad === null) {
                this.gamepad = e.gamepad;
                this.gamepad.previousAxes = [0, 0];
                this.gamepad.previousButtons = this.gamepad.buttons.map(x => false);
            }
        });

        window.addEventListener('gamepaddisconnected', e => {
            if (e.gamepad.index === this.gamepad.index) {
                this.gamepad = null;
            }
        });

        this.gamepad = null;

        this.dualShock2Div = dualShock2Div;
        this.keyboardDiv = keyboardDiv;

        const keyDownEventListener = e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.onKeyDown(e);
        };
        this.dualShock2Div.addEventListener('keydown', keyDownEventListener);
        this.keyboardDiv.addEventListener('keydown', e => {
            keyDownEventListener(e);

            for (let keyDownListener of this.keyDownListeners) {
                keyDownListener(e.key);
            }
        });

        const keyUpEventListener = e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.onKeyUp(e);
        };
        this.dualShock2Div.addEventListener('keyup', keyUpEventListener);
        this.keyboardDiv.addEventListener('keyup', keyUpEventListener);

        const resetButton = () => {
            this.previousKeyDownEvent = {};
            if (this.button.type === 'KEYBOARD') {
                this.button = {};
            }
        };
        this.dualShock2Div.addEventListener('focus', () => {
            this.simulateDualShock2 = true;
            resetButton();
            this.dualShock2Div.style.opacity = 1;
        });
        this.keyboardDiv.addEventListener('focus', () => {
            this.simulateDualShock2 = false;
            resetButton();
            this.keyboardDiv.style.opacity = 1;
        });

        this.dualShock2Div.addEventListener('blur', () => {
            resetButton();
            this.port1 = new Array(this.gamepadButtonMap.length).fill(false);
            this.dualShock2Div.style.opacity = 0.5;
        });
        this.keyboardDiv.addEventListener('blur', () => {
            resetButton();
            this.keyboardDiv.style.opacity = 0.5;
        });
    }

    reset() {
        this.keyDownListeners = [];
        this.button = {};
        this.previousKeyDownEvent = {};
        this.port1 = new Array(this.gamepadButtonMap.length).fill(false);
        this.port2 = new Array(this.gamepadButtonMap.length).fill(false);

        if (this.gamepad) {
            this.gamepad.previousAxes = [0, 0];
            this.gamepad.previousButtons = this.gamepad.buttons.map(x => false);
        }
    }

    getPort1() {
        this.updateGamepadState();
        const result = this.gamepadButtonMap.reduce((result, buttonIndex, i) => {
            if (this.simulateDualShock2 && this.port1[this.gamepadButtonMap[i]] || this.gamepad !== null && this.gamepad.buttons[i].pressed) {
                result += 1 << buttonIndex;
            }
            return result;
        }, 0);
        if (this.gamepad !== null) {
            this.gamepad.previousButtons = this.gamepad.buttons.map(x => x.pressed);
        }
        return result;
    }

    // TODO: add support for two controllers
    getPort2() {
        return 0;
    }

    getLatestButton() {
        const analogSticks = [
            [1, 'la_left', 1, 'la_right', 2],
            [0, 'la_up', 3, 'la_down', 4],
            [3, 'ra_left', 1, 'ra_right', 2],
            [2, 'ra_up', 3, 'ra_down', 4],
        ];

        this.updateGamepadState();

        if (this.gamepad !== null) {
            for (let i = 0; i < this.gamepadButtonMap.length; i++) {
                if (this.gamepad.buttons[i].pressed && !this.gamepad.previousButtons[i]) {
                    this.setButtonGamepad(this.buttonNames[this.gamepadButtonMap[i]]);
                }
                else if (this.button.value === this.buttonNames[this.gamepadButtonMap[i]] && !this.gamepad.buttons[i].pressed && this.gamepad.previousButtons[i]) {
                    this.button = {};
                }
            }
            this.gamepad.previousButtons = this.gamepad.buttons.map(x => x.pressed);

            const previousAxes = this.gamepad.previousAxes;
            for (let i = 0; i < analogSticks.length; i++) {
                const index = ~~(i / 2);
                const oppositeAxis = analogSticks[i][0];
                const nameNegative = analogSticks[i][1];
                const idNegative = analogSticks[i][2];
                const namePositive = analogSticks[i][3];
                const idPositive = analogSticks[i][4];

                if (Math.abs(this.gamepad.axes[i]) >= Math.abs(this.gamepad.axes[oppositeAxis])) {
                    if (Math.abs(this.gamepad.axes[i]) > this.analogStickThreshold) {
                        if (this.gamepad.axes[i] < 0 && previousAxes[index] !== idNegative) {
                            this.setButtonGamepad(nameNegative);
                            previousAxes[index] = idNegative;
                        } else if (this.gamepad.axes[i] > 0 && previousAxes[index] !== idPositive) {
                            this.setButtonGamepad(namePositive);
                            previousAxes[index] = idPositive;
                        }
                    } else if (previousAxes[index] === idNegative || previousAxes[index] === idPositive) {
                        if (this.button.value === nameNegative || this.button.value === namePositive) {
                            this.button = {};
                        }
                        previousAxes[index] = 0;
                    }
                }
            }
        }

        return this.button.value || null;
    }

    updateGamepadState() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
        if (gamepads) {
            let i = 0;
            while (gamepads[i] === null) {
                i++;
            }
            if (i < gamepads.length) {
                const gamepad = gamepads[i];
                if (gamepad.connected) {
                    const previousAxes = this.gamepad.previousAxes;
                    const previousButtons = this.gamepad.previousButtons;
                    this.gamepad = gamepad;
                    this.gamepad.previousAxes = previousAxes;
                    this.gamepad.previousButtons = previousButtons;
                }
            }
        }
    }

    setButtonKeyboard(value) {
        this.button = {
            type: 'KEYBOARD',
            value,
        };
    }

    setButtonGamepad(value) {
        this.button = {
            type: 'GAMEPAD',
            value,
        };
    }

    onKeyDown(e) {
        if (this.simulateDualShock2) {
            if (e.code in this.keyboardButtonMap) {
                if (e.key !== this.previousKeyDownEvent.key) {
                    this.setButtonKeyboard(this.buttonNames[this.keyboardButtonMap[e.code]]);
                    this.previousKeyDownEvent = e;
                }

                const index = this.keyboardButtonMap[e.code];
                if (index <= this.port1.length) {
                    this.port1[index] = true;
                }
            }
        } else {
            if (/^[a-z]$/i.test(e.key)) {
                if (e.key !== this.previousKeyDownEvent.key) {
                    this.setButtonKeyboard(e.key);
                    this.previousKeyDownEvent = e;
                }
            } else if (/^Key[A-Z]$/.test(e.code)) {
                if (e.code !== this.previousKeyDownEvent.code || e.shiftKey !== this.previousKeyDownEvent.shiftKey) {
                    this.setButtonKeyboard(e.shiftKey ? e.code.substring(3) : e.code.substring(3).toLowerCase());
                    this.previousKeyDownEvent = e;
                }
            } else if (e.key.length === 1 && !/^Key[A-Z]$/.test(e.code)) {
                if (e.key !== this.previousKeyDownEvent.key) {
                    this.setButtonKeyboard(e.key);
                    this.previousKeyDownEvent = e;
                }
            } else if (e.key in this.recognizedKeyboardKeys) {
                if (e.key !== this.previousKeyDownEvent.key) {
                    this.setButtonKeyboard(this.recognizedKeyboardKeys[e.key]);
                    this.previousKeyDownEvent = e;
                }
            } else if (e.key === 'Dead') {
                if (e.code !== this.previousKeyDownEvent.code || e.shiftKey !== this.previousKeyDownEvent.shiftKey) {
                    switch (e.code) {
                        case 'Quote':
                            this.setButtonKeyboard(e.shiftKey ? '"' : '\'');
                            this.previousKeyDownEvent = e;
                            break;
                        case 'Backquote':
                            this.setButtonKeyboard(e.shiftKey ? '~' : '`');
                            this.previousKeyDownEvent = e;
                            break;
                    }
                }
            }
        }
    }

    onKeyUp(e) {
        this.previousKeyDownEvent = {};

        if (e.key === 'ContextMenu') {
            // possible in FireFox
            this.button = {};
        } else if (this.simulateDualShock2) {
            if (e.code in this.keyboardButtonMap && this.button.value === this.buttonNames[this.keyboardButtonMap[e.code]]) {
                this.button = {};
            }

            const index = this.keyboardButtonMap[e.code];
            if (index >= 0 && index <= this.port1.length) {
                this.port1[index] = false;
            }
        } else {
            if (/^Key[A-Z]$/.test(e.code)) {
                if (this.button.value === e.code.substring(3) || this.button.value === e.code.substring(3).toLowerCase()) {
                    this.button = {};
                }
            } else if (e.key.length === 1 && this.button.value === e.key) {
                this.button = {};
            } else if (e.key in this.recognizedKeyboardKeys && this.button.value === this.recognizedKeyboardKeys[e.key]) {
                this.button = {};
            } else if (e.key === 'Dead') {
                switch (e.code) {
                    case 'Quote':
                        if (this.button.value === (e.shiftKey ? '"' : '\'')) {
                            this.button = {};
                        }
                        break;
                    case 'Backquote':
                        if (this.button.value === (e.shiftKey ? '~' : '`')) {
                            this.button = {};
                        }
                        break;
                }
            }
        }
    }

    addKeyDownListener(callback) {
        return this.keyDownListeners.push(callback) - 1;
    }

    removeKeyDownListener(index) {
        this.keyDownListeners.splice(index, 1);
    }
}

Input.prototype.buttonNames = [
    'select', 'l3', 'r3', 'start',
    'up', 'right', 'down', 'left',
    'l2', 'r2', 'l1', 'r1',
    'triangle', 'circle', 'cross', 'square',
    'la_up', 'la_right', 'la_down', 'la_left',
    'ra_up', 'ra_right', 'ra_down', 'ra_left',
];

Input.prototype.recognizedKeyboardKeys = {
    F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4', F5: 'f5',
    F6: 'f6', F7: 'f7', F8: 'f8', F9: 'f9', F10: 'f10',
    Tab: 'tab', Backspace: 'backspace', Enter: 'enter',
    ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left',
    Insert: 'ins', Delete: 'del', Home: 'home', End: 'end',
    PageUp: 'scrnup', PageDown: 'scrndown',
};

// maps 
Input.prototype.gamepadButtonMap = [
    14, 13, 15, 12,
    10, 11, 8, 9,
    0, 3, 1, 2,
    4, 6, 7, 5,
];

Input.prototype.analogStickThreshold = 0.5;
