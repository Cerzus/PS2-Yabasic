'use strict';

Interpreter.prototype.queueMessage = function (type, stringName, ...parameters) {
    this.errorQueue.push([
        type,
        this.instructions[this.programCounter - 1][0],
        this.strings.get(stringName, ...parameters),
    ]);
};

Interpreter.prototype.queueWarning = function (stringName, ...parameters) {
    this.queueMessage('Warning', stringName, ...parameters);
};

Interpreter.prototype.queueError = function (stringName, ...parameters) {
    this.queueMessage('Error', stringName, ...parameters);
    this.errorsFound = true;
};

Interpreter.prototype.throwError = function (stringName, ...parameters) {
    this.queueError(stringName, ...parameters);
    throw new YabasicRuntimeError();
};

Interpreter.prototype.throwFatalError = function (stringName, ...parameters) {
    this.queueMessage('FatalError', stringName, ...parameters);
    this.errorsFound = true;
    throw new YabasicRuntimeError();
};

Interpreter.prototype.valuesStackPop = function () {
    return this.valuesStack[--this.valuesStackLength];
};

Interpreter.prototype.valuesStackPeek = function (numberOfItemsBack = 0) {
    return this.valuesStack[this.valuesStackLength - 1 - numberOfItemsBack];
};

Interpreter.prototype.valuesStackExtract = function (numberOfItemsBack) {
    const value = this.valuesStack[this.valuesStackLength - 1 - numberOfItemsBack];

    for (let i = numberOfItemsBack; i >= 1; i--) {
        this.valuesStack[this.valuesStackLength - 1 - i] = this.valuesStack[this.valuesStackLength - i];
    }

    this.valuesStackLength--;

    return value;
};

Interpreter.prototype.valuesStackPush = function (value) {
    this.valuesStack[this.valuesStackLength++] = value;
};

Interpreter.prototype.popValue = function () {
    return this.valuesStackPop()[0];
    // return this.valuesStack.pop()[0];
};

Interpreter.prototype.popStringOrNumber = function () {
    const value = this.valuesStackPop();
    // const value = this.valuesStack.pop();
    if (value[1] !== 'Number' && value[1] !== 'String') {
        const expected = this.strings.get('AString') + this.strings.get('Or') + this.strings.get('ANumber');
        return this.queueExpectedButFoundError(expected, value[1])[0];
    }
    return value[0];
};

Interpreter.prototype.popStringOrNumberWithType = function () {
    const value = this.valuesStackPop();
    // const value = this.valuesStack.pop();
    if (value[1] === 'StringArray') {
        return this.queueExpectedButFoundError(this.strings.get('AString'), value[1]);
    } else if (value[1] === 'NumericArray') {
        return this.queueExpectedButFoundError(this.strings.get('ANumber'), value[1]);
    } else {
        return value;
    }
};

Interpreter.prototype.popString = function () {
    const value = this.valuesStackPop();
    // const value = this.valuesStack.pop();
    if (value[1] !== 'String') {
        return this.queueExpectedButFoundError(this.strings.get('AString'), value[1])[0];
    } else {
        return value[0];
    }
};

Interpreter.prototype.queueExpectedButFoundError = function (expected, found) {
    switch (found) {
        case 'String':
            found = this.strings.get('A' + found);
            this.pushString('');
            break;
        case 'Number':
            found = this.strings.get('A' + found);
            this.pushNumber(0);
            break;
        case 'StringArray':
            found = this.strings.get('AReferenceToA') + this.strings.get(found);
            this.pushString('');
            break;
        case 'NumericArray':
            found = this.strings.get('AReferenceToA') + this.strings.get(found);
            this.pushNumber(0);
            break;
    }
    this.queueError('InternalErrorExpectedButFound', expected, found);
    return this.valuesStackPeek();
    // return this.valuesStack[this.valuesStack.length - 1];
};

Interpreter.prototype.popNumber = function () {
    const value = this.valuesStackPop();
    // const value = this.valuesStack.pop();
    if (value[1] !== 'Number') {
        return this.queueExpectedButFoundError(this.strings.get('ANumber'), value[1])[0];
    } else {
        return value[0];
    }
};

Interpreter.prototype.pushString = function (value) {
    // this.valuesStack.push([value, 'String']);
    this.valuesStackPush([value, 'String']);
};

Interpreter.prototype.pushNumber = function (value) {
    // this.valuesStack.push([value, 'Number']);
    this.valuesStackPush([value, 'Number']);
};

Interpreter.prototype.pushBoolean = function (value) {
    // this.valuesStack.push([value, 'Boolean']);
    this.valuesStackPush([value, 'Boolean']);
};

Interpreter.prototype.pushStringArray = function (value) {
    // this.valuesStack.push([value, 'StringArray']);
    this.valuesStackPush([value, 'StringArray']);
};

Interpreter.prototype.pushNumericArray = function (value) {
    // this.valuesStack.push([value, 'NumericArray']);
    this.valuesStackPush([value, 'NumericArray']);
};

Interpreter.prototype.scopeVariableName = function (name) {
    if (this.localVariables.indexOf(name) >= 0) {
        return this.localScopeName(name);
    }

    if (this.staticVariables.indexOf(name) >= 0) {
        return this.staticScopeName(name);
    }

    return name;
};

Interpreter.prototype.localScopeName = function (name) {
    return this.currentSubroutineLevel + '/' + name;
};

Interpreter.prototype.staticScopeName = function (name) {
    return this.subroutineName + '/' + name;
};

Interpreter.prototype.escapeStringForRegExp = function (string) {
    return string.replace(/([\!\$\(\)\*\+\,\-\.\/\:\?\[\\\]\^\{\|\}])/g, '\\$1');
};

Interpreter.prototype.splitString = function (string, separator, removeEmptyStrings, limit) {
    let tokens = string.split(separator ? new RegExp(`[${this.escapeStringForRegExp(separator)}]`) : null, limit || -1);

    if (removeEmptyStrings) {
        tokens = tokens.filter(x => x !== '');
    }

    return tokens;
};

Interpreter.prototype.numberToInt = function (number) {
    // ~~? 2.64: TODO, 2.66: TODO 
    return ~~Math.min(Math.max(-this.EXP2E31, number), this.EXP2E31 - 1);
};

