'use strict';

class Keyboard {
    constructor(domElement) {
        this.domElement = domElement;
        this.keyDownListeners = [];
    }

    getButton() {
        return this.button;
    }

    connect() {
        if (!this.isConnected) {
            console.log('keyboard connected');
            this.isConnected = true;
            this.button = null;

            this.keydownEventListener = e => {
                e.preventDefault();
                e.stopImmediatePropagation();

                this.button = e.key;

                for (let listener of this.keyDownListeners) {
                    console.log('key:', e.key);
                    listener(e.key);
                }
            };

            this.domElement.addEventListener('keydown', this.keydownEventListener);
        }
    }

    disconnect() {
        if (this.isConnected) {
            console.log('keyboard disconnected');
            this.isConnected = false;
            this.domElement.removeEventListener('keydown', this.keydownEventListener);
            this.keyDownListeners = [];
        }
    }

    addKeyDownListener(callback) {
        return this.keyDownListeners.push(callback);
    }

    removeKeyDownListener(index) {
        this.keyDownListeners = this.keyDownListeners.splice(index, 1);
    }
}
