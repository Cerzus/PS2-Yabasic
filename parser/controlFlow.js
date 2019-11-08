'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateGOTO_STATEMENT = function (node) {
    this.addInstruction(node.line, 'GOTO', node.label);
};

Parser.prototype.evaluateGOSUB_STATEMENT = function (node) {
    this.addInstruction(node.line, 'GOSUB', node.label);
};

Parser.prototype.evaluateON_GOTO_STATEMENT = function (node) {
    this.evaluateNode(node.on);
    this.addInstruction(node.line, 'ON_GOTO', node.labels);
};

Parser.prototype.evaluateON_GOSUB_STATEMENT = function (node) {
    this.evaluateNode(node.on);
    this.addInstruction(node.line, 'ON_GOSUB', node.labels);
};

Parser.prototype.evaluateEND_STATEMENT = function (node) {
    this.addInstruction(node.line, 'END');
};;

Parser.prototype.evaluateEXIT_STATEMENT = function (node) {
    this.addInstruction(node.line, 'END');
};

Parser.prototype.evaluateEXECUTE$ = function (node) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'EXECUTE$', node.arguments.length);
};

Parser.prototype.evaluateEXECUTE$_STATEMENT = function (node) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'EXECUTE$', node.arguments.length);
    this.addInstruction(node.line, 'POP');
};

Parser.prototype.evaluateEXECUTE = function (node) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'EXECUTE', node.arguments.length);
};

Parser.prototype.evaluateEXECUTE_STATEMENT = function (node) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'EXECUTE', node.arguments.length);
    this.addInstruction(node.line, 'POP');
};

Parser.prototype.evaluateFUNCTION_OR_ARRAY_STATEMENT = function (node) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'CALL_FUNCTION', this.subroutineOrArray(node.name), node.arguments.length);
    this.addInstruction(node.line, 'POP');
};

Parser.prototype.evaluateSUBROUTINE_STATEMENT = function (node) {
    // add a jump instruction to skip across the subroutine when executing code outside of it
    const skipSubroutineJumpIndex = this.addInstructionPlaceholder();

    // add the subroutine to the list of subroutines in this program
    this.subroutines[node.name] = {
        parameters: node.parameters.map(parameter => {
            const types = {
                'STRING_VARIABLE': 'String',
                'NUMERIC_VARIABLE': 'Number',
                'NUMPARAMS': 'Number',
                'STRING_ARRAY': 'StringArray',
                'NUMERIC_ARRAY': 'NumericArray',
            };
            return types[parameter.type];
        }),
        address: this.instructions.length,
    };

    this.addInstruction(node.line, 'LOCAL_NUMERIC_VARIABLE', this.numericVariable('numparams'));
    this.addInstruction(node.line, 'STORE_NUMERIC_VARIABLE', this.numericVariable('numparams'));

    for (let i = node.parameters.length - 1; i >= 0; i--) {
        const parameter = node.parameters[i];
        switch (parameter.type) {
            case 'STRING_VARIABLE':
                this.addInstruction(parameter.line, 'LOCAL_STRING_VARIABLE', this.stringVariable(parameter.name));
                this.addInstruction(parameter.line, 'STORE_STRING_VARIABLE', this.stringVariable(parameter.name));
                break;
            case 'NUMERIC_VARIABLE':
            case 'NUMPARAMS':
                this.addInstruction(parameter.line, 'LOCAL_NUMERIC_VARIABLE', this.numericVariable(parameter.name));
                this.addInstruction(parameter.line, 'STORE_NUMERIC_VARIABLE', this.numericVariable(parameter.name));
                break;
            case 'STRING_ARRAY':
            case 'NUMERIC_ARRAY':
                this.addInstruction(parameter.line, 'LOCAL_ARRAY_REFERENCE', this.subroutineOrArray(parameter.name));
                this.addInstruction(parameter.line, 'STORE_ARRAY_REFERENCE', this.subroutineOrArray(parameter.name));
                break;
        }
    }

    this.evaluateNodeArray(node.body);

    this.addInstruction(node.line, 'RETURN', false);

    this.insertInstruction(skipSubroutineJumpIndex, node.line, 'JUMP', this.instructions.length);
};

Parser.prototype.evaluateRETURN_STATEMENT = function (node) {
    if (node.value) {
        this.evaluateNode(node.value)
        this.addInstruction(node.line, 'RETURN', true);
    } else {
        this.addInstruction(node.line, 'RETURN', false);
    }
};

Parser.prototype.evaluateLOCAL_STATEMENT = function (node) {
    for (let item of node.items) {
        switch (item.type) {
            case 'STRING_VARIABLE':
                this.addInstruction(item.line, 'LOCAL_STRING_VARIABLE', this.stringVariable(item.name));
                break;
            case 'NUMERIC_VARIABLE':
            case 'NUMPARAMS':
                this.addInstruction(item.line, 'LOCAL_NUMERIC_VARIABLE', this.numericVariable(item.name));
                break;
            case 'STRING_FUNCTION_OR_ARRAY':
            case 'NUMERIC_FUNCTION_OR_ARRAY':
                this.evaluateArgumentNodes(item.arguments);
                this.addInstruction(item.line, 'LOCAL_ARRAY', this.subroutineOrArray(item.name), item.arguments.length);
                break;
        }
    }
};

Parser.prototype.evaluateSTATIC_STATEMENT = function (node) {
    for (let item of node.items) {
        switch (item.type) {
            case 'STRING_VARIABLE':
                this.addInstruction(item.line, 'STATIC_STRING_VARIABLE', this.stringVariable(item.name));
                break;
            case 'NUMERIC_VARIABLE':
            case 'NUMPARAMS':
                this.addInstruction(item.line, 'STATIC_NUMERIC_VARIABLE', this.numericVariable(item.name));
                break;
            case 'STRING_FUNCTION_OR_ARRAY':
            case 'NUMERIC_FUNCTION_OR_ARRAY':
                this.evaluateArgumentNodes(item.arguments);
                this.addInstruction(item.line, 'STATIC_ARRAY', this.subroutineOrArray(item.name), item.arguments.length);
                break;
        }
    }
};

Parser.prototype.evaluateLABELLED_STATEMENT = function (node) {
    // link the label to the next instruction
    this.instructionLabels[node.label] = this.instructions.length;

    if (node.label.indexOf('/') === -1) {
        this.dataLabels[node.label] = this.data.length;
    }

    if (node.statement !== null) {
        this.evaluateNode(node.statement);
    }
};

Parser.prototype.evaluateIF_STATEMENT = function (node) {
    this.evaluateNode(node.test);

    // this is where the instruction to jump across the consequent statements if the test fails will be inserted
    const consequentJumpInstructionIndex = this.addInstructionPlaceholder();

    this.evaluateNodeArray(node.consequent);

    if (node.alternate.length > 0) {
        // this is where the instruction to jump across the alternate statements if the test succeeds will be inserted
        const alternateJumpInstructionIndex = this.addInstructionPlaceholder();

        this.insertInstruction(consequentJumpInstructionIndex, node.line, 'JUMP_IF_FALSE', this.instructions.length);
        this.evaluateNodeArray(node.alternate);
        this.insertInstruction(alternateJumpInstructionIndex, node.line, 'JUMP', this.instructions.length);
    } else {
        this.insertInstruction(consequentJumpInstructionIndex, node.line, 'JUMP_IF_FALSE', this.instructions.length);
    }
};

Parser.prototype.evaluateREPEAT_STATEMENT = function (node) {
    const continueLoopDestinationIndex = this.instructions.length;

    this.evaluateNodeArray(node.body);
    this.evaluateNode(node.test);
    this.addInstruction(node.line, 'JUMP_IF_FALSE', continueLoopDestinationIndex);
};

Parser.prototype.evaluateWHILE_STATEMENT = function (node) {
    const continueLoopDestinationIndex = this.instructions.length;

    this.evaluateNode(node.test);

    const exitLoopInstructionIndex = this.addInstructionPlaceholder();

    this.evaluateNodeArray(node.body);
    this.addInstruction(node.line, 'JUMP', continueLoopDestinationIndex);
    this.insertInstruction(exitLoopInstructionIndex, node.line, 'JUMP_IF_FALSE', this.instructions.length);
};

Parser.prototype.evaluateFOR_STATEMENT = function (node) {
    this.evaluateNode(node.start);
    this.evaluateNode(node.end);

    if (node.step) {
        this.evaluateNode(node.step);
    } else {
        this.addInstruction(node.line, 'NUMBER', 1);
    }

    // this is where the check to exit the loop prematurely will be inserted
    const exitLoopInstructionIndex = this.addInstructionPlaceholder();

    // this is where the loop continues after each iteration
    const continueLoopDestinationIndex = this.instructions.length;

    this.evaluateNodeArray(node.body);

    this.evaluateNode(node.start);
    this.evaluateNode(node.end);

    if (node.step) {
        this.evaluateNode(node.step);
    } else {
        this.addInstruction(node.line, 'NUMBER', 1);
    }

    this.addInstruction(node.line, 'FOR_CONDITIONAL_CONTINUE', this.numericVariable(node.variable.name), continueLoopDestinationIndex);

    this.insertInstruction(exitLoopInstructionIndex, node.line, 'FOR_CONDITIONAL_EXIT', this.numericVariable(node.variable.name), this.instructions.length);
};
