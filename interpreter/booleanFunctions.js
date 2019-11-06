'use strict';

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionGLOB = function () {
    const b = this.popString();
    const a = this.popString();

    const regExpString = this.escapeStringForRegExp(b).replace(/\\\*/g, '.*').replace(/\\\?/g, '.');

    this.pushBoolean(RegExp(`^${regExpString}$`, 's').test(a));
};

