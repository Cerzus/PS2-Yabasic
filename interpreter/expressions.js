'use strict';

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionNEGATE = function () {
    const right = this.popNumber();
    this.pushNumber(-right);
};

Interpreter.prototype.instructionADD_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushNumber(left + right);
};

Interpreter.prototype.instructionSUBTRACT = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushNumber(left - right);
};

Interpreter.prototype.instructionMULTIPLY = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushNumber(left * right);
};

Interpreter.prototype.instructionDIVIDE = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    if (right === 0) {
        this.pushNumber(Number.MAX_VALUE);
    } else {
        this.pushNumber(left / right);
    }
};

Interpreter.prototype.instructionPOWER = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushNumber(Math.pow(left, right));
};

Interpreter.prototype.instructionADD_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushString(left + right);
};

Interpreter.prototype.instructionEQUALS_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushBoolean(left === right);
};

Interpreter.prototype.instructionNOT_EQUALS_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushBoolean(left !== right);
};

Interpreter.prototype.instructionGREATER_THAN_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushBoolean(left > right);
};

Interpreter.prototype.instructionLESS_THAN_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushBoolean(left < right);
};

Interpreter.prototype.instructionGREATER_THAN_OR_EQUALS_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushBoolean(left >= right);
};

Interpreter.prototype.instructionLESS_THAN_OR_EQUALS_NUMERIC = function () {
    const right = this.popNumber();
    const left = this.popNumber();
    this.pushBoolean(left <= right);
};

Interpreter.prototype.instructionEQUALS_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushBoolean(left === right);
};

Interpreter.prototype.instructionNOT_EQUALS_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushBoolean(left !== right);
};

Interpreter.prototype.instructionGREATER_THAN_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushBoolean(left > right);
};

Interpreter.prototype.instructionLESS_THAN_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushBoolean(left < right);
};

Interpreter.prototype.instructionGREATER_THAN_OR_EQUALS_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushBoolean(left >= right);
};

Interpreter.prototype.instructionLESS_THAN_OR_EQUALS_STRING = function () {
    const right = this.popString();
    const left = this.popString();
    this.pushBoolean(left <= right);
};

Interpreter.prototype.instructionLOGICAL_NOT = function () {
    const right = this.popValue();
    this.pushBoolean(!right);
};

Interpreter.prototype.instructionLOGICAL_AND = function () {
    const right = this.popValue();
    const left = this.popValue();
    this.pushBoolean(left && right);
};

Interpreter.prototype.instructionLOGICAL_OR = function () {
    const right = this.popValue();
    const left = this.popValue();
    this.pushBoolean(left || right);
};
