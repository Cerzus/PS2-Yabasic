'use strict';

Interpreter.prototype.queueMessage = function (type, stringName, ...parameters) {
    this.errorQueue.push({
        type,
        line: this.instructions[this.programCounter - 1].line,
        message: this.strings.get(stringName, ...parameters),
    });
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
    return this.valuesStackPop().value;
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
};

Interpreter.prototype.popStringOrNumber = function () {
    const value = this.valuesStackPop();

    if (value.type === 'Number' || value.type === 'String') {
        return value.value;
    }

    const expected = this.strings.get('AString') + this.strings.get('Or') + this.strings.get('ANumber');
    return this.queueExpectedButFoundError(expected, value.type).value;
};

Interpreter.prototype.popStringOrNumberWithType = function () {
    const value = this.valuesStackPop();

    if (value.type === 'Number' || value.type === 'String') {
        return value;
    }

    if (value.type === 'StringArray') {
        return this.queueExpectedButFoundError(this.strings.get('AString'), value.type);
    }

    if (value.type === 'NumericArray') {
        return this.queueExpectedButFoundError(this.strings.get('ANumber'), value.type);
    }
};

Interpreter.prototype.popString = function () {
    const value = this.valuesStackPop();

    if (value.type === 'String') {
        return value.value;
    }

    return this.queueExpectedButFoundError(this.strings.get('AString'), value.type).value;
};

Interpreter.prototype.popNumber = function () {
    const value = this.valuesStackPop();

    if (value.type === 'Number') {
        return value.value;
    }
    
    return this.queueExpectedButFoundError(this.strings.get('ANumber'), value.type).value;
};

Interpreter.prototype.pushString = function (value) {
    this.valuesStackPush({ value, type: 'String' });
};

Interpreter.prototype.pushNumber = function (value) {
    this.valuesStackPush({ value, type: 'Number' });
};

Interpreter.prototype.pushBoolean = function (value) {
    this.valuesStackPush({ value, type: 'Boolean' });
};

Interpreter.prototype.pushStringArray = function (value) {
    this.valuesStackPush({ value, type: 'StringArray' });
};

Interpreter.prototype.pushNumericArray = function (value) {
    this.valuesStackPush({ value, type: 'NumericArray' });
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

Interpreter.prototype.getRealSubroutineOrArrayName = function (name) {
    return this.symbolStack.symbolTable.subroutinesAndArrays[name];
};

