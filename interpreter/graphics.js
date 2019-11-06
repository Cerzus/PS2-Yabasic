'use strict';

Interpreter.prototype.setWindowOriginXAndY = function () {
    switch (this.windowOrigin[0]) {
        case 'l':
            this.windowOriginX = 0;
            break;
        case 'c':
            // ~~? 2.64: TODO, 2.66: TODO 
            this.windowOriginX = ~~(this.windowWidth / 2);
            break;
        case 'r':
            this.windowOriginX = this.windowWidth;
            break;
    }

    switch (this.windowOrigin[1]) {
        case 't':
            this.windowOriginY = 0;
            break;
        case 'c':
            // ~~? 2.64: TODO, 2.66: TODO 
            this.windowOriginY = ~~(this.windowHeight / 2);
            break;
        case 'b':
            this.windowOriginY = this.windowHeight;
            break;
    }
};

Interpreter.prototype.isInBounds = function (x, y) {
    return x > -1024 && x < this.resolution.width + 2014 && y > -1024 && y < this.resolution.height + 1024;
};

Interpreter.prototype.numberToWindowX = function (x) {
    return this.windowOriginX < this.windowWidth ?
        // ~~? 2.64: TODO, 2.66: TODO 
        ~~x + this.windowOriginX :
        // ~~? 2.64: TODO, 2.66: TODO 
        this.windowOriginX - ~~x;
};

Interpreter.prototype.numberToWindowY = function (y) {
    return this.windowOriginY < this.windowHeight ?
        // ~~? 2.64: TODO, 2.66: TODO 
        ~~y + this.windowOriginY :
        // ~~? 2.64: TODO, 2.66: TODO 
        this.windowOriginY - ~~y;
};

// TODO: find out how empty windoworigin string works
Interpreter.prototype.setWindowOrigin = function (origin) {
    origin = origin.toLowerCase();
    // if (/^([lcr][tcb]?)?$/.test(origin)) {
    if (/^[lcr][tcb]$/.test(origin)) {
        this.windowOrigin = origin;
        this.setWindowOriginXAndY();
        return;
    } else {
        this.throwError('InvalidWindowOrigin');
    }
}

Interpreter.prototype.getTextAlignment = function (string) {
    string = string.toLowerCase();
    if (/^[lcr][tcb]$/.test(string)) {
        return string;
    } else {
        this.throwError('InvalidTextAlignment');
    }
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionOPEN_WINDOW = function (hasFont) {
    if (!this.isWindowOpened) {
        if (hasFont) {
            var font = this.popString();
        }

        // ~~? 2.64: TODO, 2.66: TODO 
        const height = ~~this.popNumber();
        if (height < 1) {
            this.throwError('WinHeightLessThanOne');
        }

        // ~~? 2.64: TODO, 2.66: TODO 
        const width = ~~this.popNumber();
        if (width < 1) {
            this.throwError('WinWidthLessThanOne');
        }

        if (width > this.resolution.width || height > this.resolution.height) {
            this.throwError('WinSizeTooLarge', this.resolution.width, this.resolution.height);
        }

        this.windowWidth = width;
        this.windowHeight = height;
        this.font = font;
        this.isWindowOpened = true;
        this.setWindowOriginXAndY();
        this.graphicsScreen.reset(...this.colors[0]);
        this.hideTextScreen = true;
    } else {
        for (let i = 0; i < (hasFont ? 3 : 2); i++) {
            this.popValue();
        }

        this.queueWarning('WindowAlreadyOpen');
    }
};

Interpreter.prototype.instructionCLOSE_WINDOW = function () {
    if (this.isWindowOpened) {
        this.isWindowOpened = false;
        this.hideTextScreen = false;
    } else {
        this.queueWarning('NoWindowToClose');
    }
};

Interpreter.prototype.instructionCLEAR_WINDOW = function () {
    if (this.isWindowOpened) {
        this.graphicsScreen.clearWindow(...this.colors[0]);
        this.hideTextScreen = true;
    } else {
        this.queueWarning('NoWindowToClear');
    }
};

Interpreter.prototype.instructionWINDOW_ORIGIN = function () {
    this.setWindowOrigin(this.popString());
};

Interpreter.prototype.instructionSETDRAWBUF = function () {
    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    // ~~? 2.64: TODO, 2.66: TODO 
    const buffer = ~~this.popNumber();

    if (buffer < 0 || buffer > 1) {
        this.throwError('BufferMustBeZeroOrOne');
    }

    this.hideTextScreen = true;

    this.graphicsScreen.setDrawBuf(buffer);
};

Interpreter.prototype.instructionSETDISPBUF = function () {
    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    // ~~? 2.64: TODO, 2.66: TODO 
    const buffer = ~~this.popNumber();

    if (buffer < 0 || buffer > 1) {
        this.throwError('BufferMustBeZeroOrOne');
    }

    this.hideTextScreen = true;

    this.endFrame = true;

    this.graphicsScreen.setDispBuf(buffer);
};

Interpreter.prototype.instructionSETRGB = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const b = ~~this.popNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const g = ~~this.popNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const r = ~~this.popNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const n = ~~this.popNumber();

    if (n < 0 || n > 3) {
        this.throwError('ColourNumberMustBeBetween', 0, 3);
    }

    this.hideTextScreen = true;

    this.colors[n] = [
        // ~~? 2.64: TODO, 2.66: TODO 
        Math.min(Math.max(0, ~~r / 255), 1),
        // ~~? 2.64: TODO, 2.66: TODO 
        Math.min(Math.max(0, ~~g / 255), 1),
        // ~~? 2.64: TODO, 2.66: TODO 
        Math.min(Math.max(0, ~~b / 255), 1),
    ];
};

Interpreter.prototype.instructionTEXT = function (alignment) {
    alignment = alignment ? this.getTextAlignment(this.popString()) : this.textAlign;

    const string = this.asciiTable.toGraphicsScreenString(this.popString());
    const y = this.numberToWindowY(this.popNumber());
    const x = this.numberToWindowX(this.popNumber());

    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    this.hideTextScreen = true;

    let text = string.split('\n');

    this.graphicsScreen.text(text, x, y, this.colors[1], alignment);
};

Interpreter.prototype.instructionDOT = function (clear) {
    const y = this.numberToWindowY(this.popNumber());
    const x = this.numberToWindowX(this.popNumber());

    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    this.hideTextScreen = true;

    this.graphicsScreen.dot(x, y, this.colors[clear ? 0 : 1]);
};

Interpreter.prototype.instructionNEW_CURVE = function () {
    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    this.lineToX = null;
    this.linetoY = null;
};

Interpreter.prototype.instructionLINE = function (clear) {
    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    const y2 = this.numberToWindowY(this.popNumber());
    const x2 = this.numberToWindowX(this.popNumber());
    const y1 = this.numberToWindowY(this.popNumber());
    const x1 = this.numberToWindowX(this.popNumber());

    if (this.lineToX !== null && this.lineToY !== null) {
        this.lineToX = x2;
        this.lineToY = y2;
    }

    this.hideTextScreen = true;

    if (this.isInBounds(x1, y1) && this.isInBounds(x2, y2)) {
        this.graphicsScreen.line(x1, y1, x2, y2, this.colors[clear ? 0 : 1]);
    }
};

Interpreter.prototype.instructionLINE_TO = function (clear) {
    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    const y = this.numberToWindowY(this.popNumber());
    const x = this.numberToWindowX(this.popNumber());

    this.hideTextScreen = true;

    if (this.lineToX !== null && this.lineToY !== null) {
        if (this.isInBounds(this.lineToX, this.lineToY) && this.isInBounds(x, y)) {
            this.graphicsScreen.line(this.lineToX, this.lineToY, x, y, this.colors[clear ? 0 : 1]);
        }
    }

    this.lineToX = x;
    this.lineToY = y;
};

Interpreter.prototype.instructionTRIANGLE = function (clear, fill) {
    const y3 = this.numberToWindowY(this.popNumber());
    const x3 = this.numberToWindowX(this.popNumber());
    const y2 = this.numberToWindowY(this.popNumber());
    const x2 = this.numberToWindowX(this.popNumber());
    const y1 = this.numberToWindowY(this.popNumber());
    const x1 = this.numberToWindowX(this.popNumber());

    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    this.hideTextScreen = true;

    if (this.isInBounds(x1, y1) && this.isInBounds(x2, y2) && this.isInBounds(x3, y3)) {
        this.graphicsScreen.triangle(x1, y1, x2, y2, x3, y3, this.colors[clear ? 0 : 1], fill);
    }
};

Interpreter.prototype.instructionCIRCLE = function (clear, fill) {
    // ~~? 2.64: TODO, 2.66: TODO 
    const r = ~~this.popNumber();
    const y = this.numberToWindowY(this.popNumber());
    const x = this.numberToWindowX(this.popNumber());

    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    this.hideTextScreen = true;

    if (r >= 0 && r <= 640) {
        this.graphicsScreen.circle(x, y, r, this.colors[clear ? 0 : 1], fill);
    }
};

Interpreter.prototype.instructionRECTANGLE = function (clear, fill) {
    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    const y2 = this.numberToWindowY(this.popNumber());
    const x2 = this.numberToWindowX(this.popNumber());
    const y1 = this.numberToWindowY(this.popNumber());
    const x1 = this.numberToWindowX(this.popNumber());

    this.hideTextScreen = true;

    if (this.isInBounds(x1, y1) && this.isInBounds(x2, y2)) {
        this.graphicsScreen.rectangle(x1, y1, x2, y2, this.colors[clear ? 0 : 1], fill);
    }
};

Interpreter.prototype.instructionGTRIANGLE = function () {
    const y3 = this.numberToWindowY(this.popNumber());
    const x3 = this.numberToWindowX(this.popNumber());
    const y2 = this.numberToWindowY(this.popNumber());
    const x2 = this.numberToWindowX(this.popNumber());
    const y1 = this.numberToWindowY(this.popNumber());
    const x1 = this.numberToWindowX(this.popNumber());

    if (!this.isWindowOpened) {
        this.throwError('NoWindowToDraw');
    }

    this.hideTextScreen = true;

    if (this.isInBounds(x1, y1) && this.isInBounds(x2, y2) && this.isInBounds(x3, y3)) {
        this.graphicsScreen.gtriangle(x1, y1, x2, y2, x3, y3, this.colors[1], this.colors[2], this.colors[3]);
    }
};

