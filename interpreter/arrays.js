'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.getArrayIndex = function (name, numDimensions) {
    if (numDimensions === 0) {
        const expected = this.strings.get('Nothing');
        const found = this.getRealSubroutineOrArrayName(name).endsWith('$') ? this.strings.get('AString') : this.strings.get('ANumber');
        this.throwFatalError('InternalErrorExpectedButFound', expected, found);
    }

    const dimensions = this.getArrayDimensions(numDimensions);

    const array = this.symbolStack.getArrayStore(name)[name];

    if (array.dimensions.length === 0) {
        this.throwError('ArrayParameterHasNotBeenSupplied', this.getRealSubroutineOrArrayName(name));
    }

    if (numDimensions !== array.dimensions.length) {
        this.throwError('IndicesSuppliedExpectedFor', numDimensions, array.dimensions.length, this.getRealSubroutineOrArrayName(name));
    }

    for (let i = 0; i < dimensions.length; i++) {
        const dimension = dimensions[i];

        if (dimension < 0 || dimension >= array.dimensions[i]) {
            this.throwError('IndexOutOfRange', i + 1, dimension);
        }
    }

    let index = 0;
    let factor = 1;
    for (let i = dimensions.length - 1; i >= 0; i--) {
        index += dimensions[i] * factor;
        factor *= array.dimensions[i];
    }

    return index;
};

Interpreter.prototype.getArrayDimensions = function (numDimensions) {
    const dimensions = [];

    for (let i = 0; i < numDimensions; i++) {
        const dimension = this.valuesStackPeek(numDimensions - 1 - i);
        if (dimension.type !== 'Number') {
            this.throwError('OnlyNumericalIndicesAllowedForArrays');
        }
        // ~~? 2.64: TODO, 2.66: TODO 
        dimensions[i] = ~~dimension.value;
    }
    this.valuesStackLength -= numDimensions;

    return dimensions;
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionSTORE_ARRAY_ELEMENT = function (name, numArguments) {
    const array = this.symbolStack.getArrayStore(name)[name];

    if (array === undefined || array.address) {
        this.throwError('IsNeitherArrayNorSubroutine', this.getRealSubroutineOrArrayName(name));
    }

    const value = this.popStringOrNumber();
    const index = this.getArrayIndex(name, numArguments);

    array.values[index] = value;
};

Interpreter.prototype.instructionSTORE_LOCAL_ARRAY_REFERENCE = function (arrayName) {
    if (this.symbolStack.arraysScope[arrayName]) {
        this.throwError('AlreadyDefinedWithinSub', this.getRealSubroutineOrArrayName(arrayName));
    }

    this.symbolStack.arraysScope[arrayName] = 'LOCAL';

    const value = this.popValue();

    this.symbolStack.getArrayStore(arrayName)[arrayName] = {
        dimensions: value.dimensions,
        values: value.values,
    };
};

Interpreter.prototype.loadArray = function (name, numArguments) {
    const array = this.symbolStack.getArrayStore(name)[name];

    if (array === undefined || array.address) {
        this.throwError('IsNeitherArrayNorSubroutine', this.getRealSubroutineOrArrayName(name));
    }

    if (numArguments === 0) {
        this.instructionLOAD_ARRAY_REFERENCE(name, this.getRealSubroutineOrArrayName(name).endsWith('$') ? 'StringArray' : 'NumericArray');
    } else {
        const index = this.getArrayIndex(name, numArguments); // keep on separate line

        if (this.getRealSubroutineOrArrayName(name).endsWith('$')) {
            this.pushString(array.values[index]);
        } else {
            this.pushNumber(array.values[index]);
        }
    }
};

Interpreter.prototype.instructionLOAD_ARRAY_REFERENCE = function (name, type) {
    const array = this.symbolStack.getArrayStore(name)[name];

    if (array === undefined || array.address) {
        this.throwError('ArrayNotDefined', this.getRealSubroutineOrArrayName(name));
    }

    this.valuesStackPush({ value: array, type });
};

Interpreter.prototype.instructionDIM = function (name, numDimensions) {
    const store = this.symbolStack.getArrayStore(name);
    const array = store[name];

    if (array !== undefined && array.address) {
        this.throwError('ArrayConflictsWithUserSubroutine', this.getRealSubroutineOrArrayName(name));
    }

    let dimensions = this.getArrayDimensions(numDimensions);

    if (numDimensions > 10) {
        this.throwError('ArrayHasMoreThan10Dimensions');
    }

    // if the array already exists, the number of dimensions must be the the same and the dimensions cannot shrink
    if (array !== undefined) {
        if (numDimensions !== array.dimensions.length) {
            this.queueError('CannotChangeDimensionsOfFromTo', this.getRealSubroutineOrArrayName(name), (array.dimensions || []).length, numDimensions);
        } else {
            dimensions = dimensions.map((dimension, i) => Math.max(dimension, array.dimensions[i] - 1));
        }
    }

    dimensions = dimensions.map((dimension, i) => {
        dimension = (dimension + 1) % this.EXP2E31;

        if (dimension < 2) {
            this.throwError('ArrayIndexLessThanEqualToZero', i + 1);
        }

        return dimension;
    });

    // multiply all dimensions together to get the total number of elements
    const numberOfElements = dimensions.length > 0 ? dimensions.reduce((acc, curr) => acc * curr) : 0;

    // TODO: check better
    // if (numberOfElements > (arrayName.endsWith('$') ? 100000 : 1000000)) {
    if (numberOfElements > (this.getRealSubroutineOrArrayName(name).endsWith('$') ? 100000 : 1000000)) {
        this.throwFatalError('OutOfMemory');
    }

    const defaultValue = this.getRealSubroutineOrArrayName(name).endsWith('$') ? '' : 0;

    // if the array already exsists, create a new array filled with default values
    if (array === undefined) {
        store[name] = {
            dimensions,
            values: new Array(numberOfElements).fill(defaultValue),
        };
    }

    // ...otherwise, if the new dimensions are bigger than the current, copy the old values and fill the rest with default values
    // make sure not to replace the values or dimensions arrays, so local and static array reference will stay linked
    else if (numberOfElements > array.values.length) {
        const oldValues = array.values.slice();
        const oldDimensions = array.dimensions.slice();

        for (let i = 0; i < numDimensions; i++) {
            array.dimensions[i] = dimensions[i];
        }

        array.values.length = numberOfElements;

        let oldIndex = 0;
        let newIndex = 0;

        (function arrayCopyAndFillWithDefault(n = 0) {
            const dimensionOld = oldDimensions[n];
            const dimension = dimensions[n];
            let i = 0;

            if (n === numDimensions - 1) {
                for (; i < dimensionOld; i++) {
                    array.values[newIndex++] = oldValues[oldIndex++];
                }
                for (; i < dimension; i++) {
                    array.values[newIndex++] = defaultValue;
                }
            }
            else {
                for (; i < dimensionOld; i++) {
                    arrayCopyAndFillWithDefault(n + 1);
                }
                for (; i < dimension; i++) {
                    arrayFillWithDefault(n + 1);
                }
            }

            function arrayFillWithDefault(n) {
                const dimension = dimensions[n];

                if (n === numDimensions - 1) {
                    for (let i = 0; i < dimension; i++) {
                        array.values[newIndex++] = defaultValue;
                    }
                } else {
                    for (let i = 0; i < dimension; i++) {
                        arrayFillWithDefault(n + 1);
                    }
                }
            }
        })();
    }
};

Interpreter.prototype.instructionCALL_ARRAY_PUSH_INDICES = function (name, numArguments) {
    for (let i = 0; i < numArguments; i++) {
        this.valuesStackPush({ ...this.valuesStackPeek(numArguments - 1) });
    }

    this.loadArray(name, numArguments);
};
