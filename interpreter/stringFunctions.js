'use strict';

Interpreter.prototype.weekdays = 'Mon Tue Wed Thu Fri Sat Sun'.split(' ');
Interpreter.prototype.months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.modifyStringVariable = function (replaceStringPart, hasIndex, name, hasLength) {
    this.instructionLOAD_STRING_VARIABLE(name);

    const oldString = this.popString();
    const replacementString = this.popString();
    // ~~? 2.64: TODO, 2.66: TODO 
    const length = hasLength ? ~~this.popNumber() : Math.max(oldString.length, replacementString.length);
    // ~~? 2.64: TODO, 2.66: TODO 
    const index = hasIndex ? ~~this.popNumber() : null;

    this.pushString(replaceStringPart(oldString, replacementString, length, index));
    this.instructionSTORE_STRING_VARIABLE(name);
};

Interpreter.prototype.modifyStringArray = function (replaceStringPart, hasIndex, name, numArguments, hasLength) {
    const replacementString = this.popString();
    if (hasLength) {
    // ~~? 2.64: TODO, 2.66: TODO 
    var length = ~~this.popNumber();
    }
    // ~~? 2.64: TODO, 2.66: TODO 
    const index = hasIndex ? ~~this.popNumber() : null;
    const oldString = this.popString();
    if (!hasLength) {
        var length = Math.max(oldString.length, replacementString.length);
    }

    this.pushString(replaceStringPart(oldString, replacementString, length, index));
    this.instructionSTORE_ARRAY(name, numArguments);
};

Interpreter.prototype.replaceStringLeft = function (oldString, replacementString, length) {
    length = Math.min(length, replacementString.length, oldString.length);
    return replacementString.substring(0, length) + oldString.substring(length);
};

Interpreter.prototype.replaceStringRight = function (oldString, replacementString, length) {
    return (
        oldString.substring(0, oldString.length - length) +
        replacementString.substring(length - oldString.length, length) +
        oldString.substring(oldString.length + replacementString.length - length)
    );
};

Interpreter.prototype.replaceStringMid = function (oldString, replacementString, length, index) {
    if (index > -replacementString.length) {
        replacementString = replacementString.substring(Math.min(1 - index, length), Math.min(length, 1 + oldString.length - index));
        return (
            oldString.substring(0, index - 1) +
            replacementString +
            oldString.substring(replacementString.length + Math.max(0, index - 1))
        );
    } else {
        replacementString = oldString.substring(Math.min(1 - index, length), Math.min(length, 1 + oldString.length - index));
        return (
            oldString.substring(0, index - 1) +
            replacementString +
            oldString.substring(replacementString.length + Math.max(0, index - 1))
        );
    }
};

Interpreter.prototype.getFirstTokenAndPushTheRest = function (string, separator, removeEmptyStrings) {
    const regExpSeparator = this.escapeStringForRegExp(separator);

    if (removeEmptyStrings) {
        string = string.replace(new RegExp(`^[${regExpSeparator}]+`), '');
    }

    const tokens = this.splitString(string, separator, removeEmptyStrings, 2);
    const token = tokens.length ? this.splitString(string, separator, removeEmptyStrings, 2)[0] : '';
    string = string.substring(token.length)
        .replace(new RegExp('^[' + regExpSeparator + ']' + (removeEmptyStrings ? '+' : '{1}')), '');

    this.pushString(string);

    return token;
}

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionLEFT$_VARIABLE = function (name) {
    this.modifyStringVariable(this.replaceStringLeft, false, name);
};

Interpreter.prototype.instructionLEFT$_ARRAY = function (name, numArguments) {
    this.modifyStringArray(this.replaceStringLeft, false, name, numArguments);
};

Interpreter.prototype.instructionRIGHT$_VARIABLE = function (name) {
    this.modifyStringVariable(this.replaceStringRight, false, name);
};

Interpreter.prototype.instructionRIGHT$_ARRAY = function (name, numArguments) {
    this.modifyStringArray(this.replaceStringRight, false, name, numArguments);
};

Interpreter.prototype.instructionMID$_VARIABLE = function (name, hasLength) {
    this.modifyStringVariable(this.replaceStringMid, true, name, hasLength);
};

Interpreter.prototype.instructionMID$_ARRAY = function (name, numArguments, hasLength) {
    this.modifyStringArray(this.replaceStringMid, true, name, numArguments, hasLength);
};

Interpreter.prototype.instructionLEFT$ = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const length = ~~this.popStringOrNumber();
    const string = this.popStringOrNumber();
    this.pushString(string.substring(0, length));
};

Interpreter.prototype.instructionRIGHT$ = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const length = ~~this.popStringOrNumber();
    const string = this.popStringOrNumber();
    this.pushString(string.substring(string.length - length));
};

Interpreter.prototype.instructionMID$_2 = function () {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const index = this.numberToInt(this.popStringOrNumber()) - 1;
    const string = this.popStringOrNumber();
    if (!this.errorsFound) {
        this.pushString(string.substring(index));
    }
};

Interpreter.prototype.instructionMID$_3 = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const length = ~~this.popStringOrNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const index = ~~this.popStringOrNumber() - 1;
    const string = this.popStringOrNumber();
    if (!this.errorsFound) {
        this.pushString(string.substring(index, index + length));
    }
};

Interpreter.prototype.instructionSTR$_1 = function () {
    const number = this.popStringOrNumber();
    const format = number > -1e6 && number < 1e6 && Math.abs(number % 1) === 0 ? '%.10g' : '%.6g';
    this.pushString(this.formatter.toString(number, format));
};

Interpreter.prototype.instructionSTR$_2 = function () {
    const format = this.popStringOrNumber();
    const number = this.popStringOrNumber();
    this.pushString(this.formatter.toString(number, format));
};

Interpreter.prototype.instructionCHR$ = function () {
    const value = this.popStringOrNumber();

    if (value < 0 || value >= 256) {
        this.throwError('CantConvertToChar', value);
    }

    // ~~? 2.64: TODO, 2.66: TODO 
    this.pushString(~~value ? String.fromCharCode(value) : '');
};

Interpreter.prototype.instructionUPPER$ = function () {
    const string = this.popStringOrNumber();
    this.pushString(this.asciiTable.toUpperCase(string));
};

Interpreter.prototype.instructionLOWER$ = function () {
    const string = this.popStringOrNumber();
    this.pushString(this.asciiTable.toLowerCase(string));
};

Interpreter.prototype.instructionLTRIM$ = function () {
    const string = this.popStringOrNumber();
    this.pushString(this.asciiTable.trimStart(string));
};

Interpreter.prototype.instructionRTRIM$ = function () {
    const string = this.popStringOrNumber();
    this.pushString(this.asciiTable.trimEnd(string));
};

Interpreter.prototype.instructionTRIM$ = function () {
    const string = this.popStringOrNumber();
    this.pushString(this.asciiTable.trim(string));
};

Interpreter.prototype.instructionDATE$ = function () {
    const now = new Date;
    const weekday = (now.getDay() + 6) % 7;
    const month = now.getMonth();

    this.pushString([
        weekday,
        month + 1,
        now.getDate(),
        now.getFullYear(),
        this.weekdays[weekday],
        this.months[month],
    ].join('-'));
};

Interpreter.prototype.instructionTIME$ = function () {
    const now = new Date;

    this.pushString([
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
    // ~~? 2.64: TODO, 2.66: TODO 
    ~~((now.getTime() - this.programStartedTime) / 1000),
    ].join('-'));
};

Interpreter.prototype.instructionSPLIT$_VARIABLE = function (hasSeparator, removeEmptyStrings, name) {
    this.instructionLOAD_STRING_VARIABLE(name);

    const string = this.popString();
    const separator = hasSeparator ? this.popString() : '\t ';

    const token = this.getFirstTokenAndPushTheRest(string, separator, removeEmptyStrings);
    this.instructionSTORE_STRING_VARIABLE(name);
    this.pushString(token);
};

Interpreter.prototype.instructionSPLIT$_ARRAY = function (hasSeparator, removeEmptyStrings, name, numArguments) {
    const separator = hasSeparator ? this.popString() : '\t ';
    const string = this.popString();

    const token = this.getFirstTokenAndPushTheRest(string, separator, removeEmptyStrings);
    this.instructionSTORE_ARRAY(name, numArguments);
    this.pushString(token);
};

Interpreter.prototype.instructionHEX$ = function () {
    const decimal = this.popStringOrNumber();

    if (this.version < 2.66) {
        if (decimal < 0) {
            this.throwError('CantConvertNegativeNumberToHexadecimal');
        }
    // numberToInt? 2.64: TODO, 2.66: TODO 
    this.pushString(this.numberToInt(decimal).toString(16));
    } else {
        if (isFinite(decimal)) {
            this.pushString((Math.sign(decimal) * Math.floor(Math.abs(decimal))).toString(16));
        } else {
            this.isStuck = true;
            this.endFrame = true;
        }
    }
};

Interpreter.prototype.instructionBIN$ = function () {
    const decimal = this.popStringOrNumber();

    if (isFinite(decimal)) {
        this.pushString((Math.sign(decimal) * Math.floor(Math.abs(decimal))).toString());
    } else {
        this.isStuck = true;
        this.endFrame = true;
    }
};

