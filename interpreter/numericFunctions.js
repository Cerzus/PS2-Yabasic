'use strict';

//////////////////////
// UTILIY FUNCTIONS //
//////////////////////

Interpreter.prototype.mouseInfoFromString = function (string) {
    let result = {
        mousex: 0,
        mousey: 0,
        mouseb: 0,
        mousemod: 0,
    };

    if (!string.startsWith('MB')) return result;
    string = string.substring(2);

    var match = string.match(/^[-+]?\d+/);
    if (match === null) return result;

    let mouseb = match[0];
    string = string.substring(mouseb.length);
    mouseb = parseInt(mouseb);
    mouseb = (mouseb >= -Math.pow(2, 63) && mouseb < Math.pow(2, 63)) ? mouseb : 0;
    result.mouseb = (mouseb + this.EXP2E31) % Math.pow(2, 32) - this.EXP2E31;

    if (string[0] !== 'd') {
        result.mouseb *= -1;
    }
    if (string[1] !== '+') return result;
    string = string.substring(2);

    var match = string.match(/^[-+]?[^\D:]+/);
    if (match === null) return result;

    let mousemod = match[0];
    string = string.substring(mousemod.length);
    mousemod = parseInt(mousemod);
    mousemod = (mousemod >= -Math.pow(2, 63) && mousemod < Math.pow(2, 63)) ? mousemod : 0;
    result.mousemod = (mousemod + this.EXP2E31) % Math.pow(2, 32) - this.EXP2E31;

    if (string[0] !== ':') return result;
    string = string.substring(1);

    var match = string.match(/^[-+]?[^\D,]+/);
    if (match === null) return result;

    const mousex = match[0].substring(0, 4);
    string = string.substring(mousex.length);
    result.mousex = parseInt(mousex);

    if (string[0] !== ',') return result;
    string = string.substring(1);

    var match = string.match(/^[-+]?\d+/);
    if (match === null) return result;

    result.mousey = parseInt(match[0].substring(0, 4));

    return result;
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionSIN = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.sin(a));
};

Interpreter.prototype.instructionASIN = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.asin(a));
};

Interpreter.prototype.instructionCOS = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.cos(a));
};

Interpreter.prototype.instructionACOS = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.acos(a));
};

Interpreter.prototype.instructionTAN = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.tan(a));
};

Interpreter.prototype.instructionATAN_1 = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.atan(a));
};

Interpreter.prototype.instructionATAN_2 = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(Math.atan2(a, b));
};

Interpreter.prototype.instructionEXP = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.exp(a));
};

Interpreter.prototype.instructionLOG = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.log(a));
};

Interpreter.prototype.instructionSQRT = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.sqrt(a));
};

Interpreter.prototype.instructionSQR = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(a * a);
};

Interpreter.prototype.instructionINT = function () {
    const a = this.popStringOrNumber();
    if (this.version < 2.66) {
        this.pushNumber(this.numberToInt(a));
    } else {
        this.pushNumber(Math.sign(a) * Math.floor(Math.abs(a)));
    }
};

Interpreter.prototype.instructionFRAC = function () {
    const a = this.popStringOrNumber();
    if (this.version < 2.66) {
        this.pushNumber(a - this.numberToInt(a));
    } else {
        this.pushNumber(a - Math.sign(a) * Math.floor(Math.abs(a)));
    }
};

Interpreter.prototype.instructionABS = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.abs(a));
};

Interpreter.prototype.instructionSIG = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(Math.sign(a));
};

Interpreter.prototype.instructionMOD = function () {
    const divisor = this.popStringOrNumber();
    const dividend = this.popStringOrNumber();
    this.pushNumber(dividend - divisor * this.numberToInt(dividend / divisor));
};

Interpreter.prototype.instructionMIN = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(Math.min(a, b));
};

Interpreter.prototype.instructionMAX = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(Math.max(a, b));
};

Interpreter.prototype.instructionLEN = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(a.length);
};

Interpreter.prototype.instructionVAL = function () {
    const a = parseFloat(this.popStringOrNumber());
    this.pushNumber(isNaN(a) ? 0 : a);
};

Interpreter.prototype.instructionASC = function () {
    const a = this.popStringOrNumber();
    this.pushNumber(a ? a.charCodeAt(0) : 0);
};

Interpreter.prototype.instructionDEC = function (hasBase) {
    const base = hasBase ? this.numberToInt(this.popStringOrNumber()) : 16;
    const string = this.popStringOrNumber();

    if (base !== 2 && base !== 16) {
        this.throwError('CannotConvertBaseNumbers', base);
    }

    if (string === '') {
        this.pushNumber(0);
    } else if (base === 2 && !/^[01]+$/.test(string) || base === 16 && !/^[a-f0-9]+$/i.test(string)) {
        if (this.version < 2.66) {
            this.throwError('NotAHexNumber', string);
        } else {
            this.throwError('NotABaseNumber', base, string);
        }
    } else {
        this.pushNumber(parseInt(string, base));
    }
};

Interpreter.prototype.instructionINSTR_2 = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(a.indexOf(b) + 1);
};

Interpreter.prototype.instructionINSTR_3 = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const c = ~~this.popStringOrNumber();
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(a.indexOf(b, c - 1) + 1);
};

Interpreter.prototype.instructionRINSTR_2 = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(a.lastIndexOf(b) + 1);
};

Interpreter.prototype.instructionRINSTR_3 = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const c = ~~this.popStringOrNumber();
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber((a.lastIndexOf(b, c - 1) + 1) || (c > 0 ? 1 : 0));
};

Interpreter.prototype.instructionMOUSEX_0 = function () {
    this.pushNumber(0);
};

Interpreter.prototype.instructionMOUSEX_1 = function () {
    this.pushNumber(this.mouseInfoFromString(this.popStringOrNumber()).mousex);
};

Interpreter.prototype.instructionMOUSEY_0 = function () {
    this.pushNumber(0);
};

Interpreter.prototype.instructionMOUSEY_1 = function () {
    this.pushNumber(this.mouseInfoFromString(this.popStringOrNumber()).mousey);
};

Interpreter.prototype.instructionMOUSEB_0 = function () {
    this.pushNumber(0);
};

Interpreter.prototype.instructionMOUSEB_1 = function () {
    this.pushNumber(this.mouseInfoFromString(this.popStringOrNumber()).mouseb);
};

Interpreter.prototype.instructionMOUSEMOD_0 = function () {
    this.pushNumber(0);
};

Interpreter.prototype.instructionMOUSEMOD_1 = function () {
    this.pushNumber(this.mouseInfoFromString(this.popStringOrNumber()).mousemod);
};

Interpreter.prototype.instructionAND = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(this.numberToInt(a) & this.numberToInt(b));
};

Interpreter.prototype.instructionOR = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(this.numberToInt(a) | this.numberToInt(b));
};

Interpreter.prototype.instructionEOR = function () {
    const b = this.popStringOrNumber();
    const a = this.popStringOrNumber();
    this.pushNumber(this.numberToInt(a) ^ this.numberToInt(b));
};

Interpreter.prototype.instructionSPLIT = function (hasSeparator, removeEmptyStrings) {
    const separator = hasSeparator ? this.popString() : '\t ';
    const array = this.popValue();
    const string = this.popString();

    if (array.dimensions !== null && array.dimensions.length > 1) {
        this.throwError('OneDimArray');
    }

    const tokens = this.splitString(string, separator, removeEmptyStrings);

    if (array.dimensions !== null && array.dimensions.length === 1) {
        array.dimensions.length = 1;
        array.dimensions[0] = tokens.length + 1;
        array.values.length = tokens.length + 1;
        array.values[0] = '';
        for (let i = 0; i < tokens.length; i++) {
            array.values[i + 1] = tokens[i];
        }
    }

    this.pushNumber(tokens.length);
};

// TODO: add bug
Interpreter.prototype.instructionARDIM = function () {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    this.pushNumber(this.popValue().dimensions.length);
};

// TODO: add bug
Interpreter.prototype.instructionARSIZE = function () {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const right = this.numberToInt(this.popNumber());
    const dimensions = this.popValue().dimensions;

    if (right < 1 || right > dimensions.length) {
        this.throwError('OnlyIndicesBetweenOneAndAreAllowed', dimensions.length);
    }

    this.pushNumber(dimensions[right - 1] - 1);
};

Interpreter.prototype.instructionRAN_0 = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    this.pushNumber(~~(Math.random() * this.EXP2E31) / this.EXP2E31);
};

Interpreter.prototype.instructionRAN_1 = function () {
    const a = this.popStringOrNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    this.pushNumber(~~(Math.random() * this.EXP2E31) * a / (this.EXP2E31 - 1));
};
