'use strict';

class TextScreen {
    constructor(color, backgroundColor) {
        this.htmlEscapeCharacters = {
            ' ': '&nbsp;',
            // '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            // '"': '&#34;',
            // "'": '&#39;'
        };

        // dom element
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.width = 'inherit';
        div.style.height = 'inherit';
        div.style.top = 0;
        div.style.left = 0;
        div.style.background = backgroundColor;
        div.style.color = color;
        div.style.paddingLeft = 11;
        div.style.paddingRight = 28;
        div.style.boxSizing = 'border-box';
        div.style.paddingTop = 4;
        div.style.lineHeight = '23px';
        this.domElement = div;

        this.asciiTable = new AsciiTable();
        // this.reset();
    }

    getDomElement() {
        return this.domElement;
    }

    hide() {
        this.domElement.style.visibility = 'hidden';
    }

    show() {
        this.domElement.style.visibility = 'visible';
    }

    reset() {
        this.printBuffer = [''];
        this.currentLineLength = 0;
        this.previousPrintType = null;
        this.domElement.innerHTML = '';
    }

    update() {
        this.domElement.innerHTML = this.printBuffer.map(x => x.replace(/[ <>]/g, c => this.htmlEscapeCharacters[c])).join('<br>');
    }

    print(string) {
        for (let i = 0; i < string.length; i++) {
            const character = string[i];
            switch (character) {
                case '\n':
                    this.addNewLineToPrintBuffer();
                    break;
                case '\t':
                    this.addTabToPrintBuffer();
                    break;
                case '\r':
                    this.addCarriageReturnToPrintBuffer();
                    break;
                default:
                    this.addCharacterToPrintBuffer(character);
            }
        }
    }

    replaceLastCharacter(character) {
        let currentLineIndex = this.printBuffer.length - 1;

        while (this.printBuffer[currentLineIndex].length === 0) {
            currentLineIndex--;
        }

        if (currentLineIndex >= 0) {
            this.printBuffer[currentLineIndex] =
                this.printBuffer[currentLineIndex]
                    .substring(0, this.printBuffer[currentLineIndex].length - 1) + character;
        }
    }

    backspace() {
        let currentLineIndex = this.printBuffer.length - 1;

        if (this.currentLineLength === 0 && currentLineIndex > 0) {
            this.printBuffer.pop();
            currentLineIndex--;
            this.currentLineLength = this.printBuffer[currentLineIndex].length;
        }

        if (this.currentLineLength > 0) {
            this.currentLineLength--;
            this.printBuffer[currentLineIndex] =
                this.printBuffer[currentLineIndex].
                    substring(0, this.printBuffer[currentLineIndex].length - 1);
        }
    }

    addCharacterToPrintBuffer(character) {
        const currentLineIndex = this.printBuffer.length - 1;
        character = this.asciiTable.toTextScreenString(character);

        if (this.currentLineLength === this.printBuffer[currentLineIndex].length) {
            this.printBuffer[currentLineIndex] += character;
        } else {
            this.printBuffer[currentLineIndex] =
                this.printBuffer[currentLineIndex].substring(0, this.currentLineLength) +
                character +
                this.printBuffer[currentLineIndex].substring(this.currentLineLength + character.length);
        }

        this.currentLineLength += character.length;

        if (this.currentLineLength === 60) {
            this.addNewLineToPrintBuffer();
        }
    }

    addNewLineToPrintBuffer() {
        this.printBuffer.push('');
        this.currentLineLength = 0;

        if (this.printBuffer.length === 21) {
            this.printBuffer.shift();
        }
    }

    addTabToPrintBuffer() {
        const numberOfSpaces = this.currentLineLength % 8 || 8;

        for (let i = 0; i < numberOfSpaces; i++) {
            this.addCharacterToPrintBuffer(' ');
        }
    }

    addCarriageReturnToPrintBuffer() {
        this.currentLineLength = 0;
    }
}
