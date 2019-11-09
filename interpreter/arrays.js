'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.popArrayIndex = function (id, numDimensions) {
    if (numDimensions === 0) {
        const expected = this.strings.get('Nothing');
        const found = this.strings.get('A' + this.symbolStack.getArrayType(id));
        this.throwFatalError('InternalErrorExpectedButFound', expected, found);
    }

    const dimensions = this.getArrayDimensions(numDimensions);

    const array = this.symbolStack.getArray(id);

    if (array.dimensions.length === 0) {
        this.throwError('ArrayParameterHasNotBeenSupplied', this.symbolStack.getArrayName(id));
    }

    if (numDimensions !== array.dimensions.length) {
        this.throwError('IndicesSuppliedExpectedFor', numDimensions, array.dimensions.length, this.symbolStack.getArrayName(id));
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

Interpreter.prototype.instructionSTORE_ARRAY_ELEMENT = function (id, numArguments) {
    const array = this.symbolStack.getArray(id);

    if (array === undefined || array.address) {
        this.throwError('IsNeitherArrayNorSubroutine', this.symbolStack.getArrayName(id));
    }

    const value = this.popStringOrNumber();
    const index = this.popArrayIndex(id, numArguments);

    array.values[index] = value;
};

Interpreter.prototype.loadArray = function (id, numArguments) {
    const array = this.symbolStack.getArray(id);

    if (array === undefined || array.address) {
        this.throwError('IsNeitherArrayNorSubroutine', this.symbolStack.getArrayName(id));
    }

    if (numArguments === 0) {
        this.instructionLOAD_ARRAY_REFERENCE(id);
    } else {
        const index = this.popArrayIndex(id, numArguments);

        if (this.symbolStack.getArrayType(id) === 'String') {
            this.pushString(array.values[index]);
        } else {
            this.pushNumber(array.values[index]);
        }
    }
};

Interpreter.prototype.instructionLOAD_ARRAY_REFERENCE = function (id) {
    const array = this.symbolStack.getArray(id);

    if (array === undefined || array.address) {
        this.throwError('ArrayNotDefined', this.symbolStack.getArrayName(id));
    }

    if (this.symbolStack.getArrayType(id) === 'String') {
        this.pushStringArray(array);
    } else {
        this.pushNumericArray(array);
    }
};

Interpreter.prototype.instructionDIM = function (id, numDimensions) {
    const store = this.symbolStack.getArrayStore(id);
    const array = store[id];

    if (array !== undefined && array.address) {
        this.throwError('ArrayConflictsWithUserSubroutine', this.symbolStack.getArrayName(id));
    }

    let dimensions = this.getArrayDimensions(numDimensions);

    if (numDimensions > 10) {
        this.throwError('ArrayHasMoreThan10Dimensions');
    }

    // if the array already exists, the number of dimensions must be the the same and the dimensions cannot shrink
    if (array !== undefined) {
        if (numDimensions !== array.dimensions.length) {
            this.queueError('CannotChangeDimensionsOfFromTo', this.symbolStack.getArrayName(id), (array.dimensions || []).length, numDimensions);
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
    if (numberOfElements > (this.symbolStack.getArrayType(id) === 'String' ? 100000 : 1000000)) {
        this.throwFatalError('OutOfMemory');
    }

    const defaultValue = this.symbolStack.getArrayType(id) === 'String' ? '' : 0;

    // if the array does not exist, create a new array filled with default values
    if (array === undefined) {
        store[id] = {
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

Interpreter.prototype.instructionCALL_ARRAY_PUSH_INDICES = function (id, numArguments) {
    for (let i = 0; i < numArguments; i++) {
        this.valuesStackPush({ ...this.valuesStackPeek(numArguments - 1) });
    }

    this.loadArray(id, numArguments);
};
