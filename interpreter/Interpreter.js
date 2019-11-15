'use strict';

class YabasicRuntimeError { }

class Interpreter {
    ////////////
    // PUBLIC //
    ////////////

    constructor() {
        this.version = 2.66;
        this.fps = 50;
        this.cpuUsage = 1;
        this.maxInstructionsPerFrame = 140000000;
        this.resolution = {
            width: 640,
            height: 512,
        };

        this.EXP2E31 = Math.pow(2, 31);

        const white = '#b4b4b4';
        const darkWhite = '#858c9a';
        const lightGrey = '#484e68';
        const darkGrey = '#343850';

        this.textScreen = new TextScreen(white, lightGrey);
        this.graphicsScreen = new GraphicsScreen(this.resolution.width, this.resolution.height);

        // message
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.fontFamily = 'Verdana';
        div.style.letterSpacing = '0.075em';
        div.style.boxSizing = 'border-box';
        div.style.top = 45;
        div.style.width = 500;
        div.style.margin = '0 auto';
        div.style.left = 0;
        div.style.right = 0;
        div.style.color = darkWhite;
        div.style.background = darkGrey;
        div.style.padding = 4;
        div.style.borderRadius = '12px';
        div.style.display = 'none';
        this.messageDiv = div;

        // message header
        var div = document.createElement('div');
        div.style.height = 39;
        div.style.lineHeight = '35px';
        div.style.textAlign = 'center';
        this.messageDiv.append(div);
        this.messageHeaderDiv = div;

        // message container
        var div = document.createElement('div');
        div.style.background = lightGrey;
        div.style.borderRadius = '12px';
        div.style.paddingBottom = 6;
        this.messageDiv.append(div);
        const messageContainerDiv = div;

        // message body
        var div = document.createElement('div');
        div.style.padding = '11px 4px 16px';
        div.style.wordBreak = 'break-word';
        div.style.lineHeight = '19px';
        messageContainerDiv.append(div);
        this.messageBodyDiv = div;

        // Ok button
        var div = document.createElement('div');
        div.style.background = darkGrey;
        div.style.width = 72;
        div.style.lineHeight = '27px';
        div.style.margin = '0 auto';
        div.style.textAlign = 'center';
        div.style.cursor = 'pointer';
        div.innerHTML = 'Ok';
        div.addEventListener('click', () => {
            this.hideMessage();
        });
        messageContainerDiv.append(div);
        this.okButtonDiv = div;

        // overlay
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = 0;
        div.style.bottom = 0;
        div.style.left = 0;
        div.style.right = 0;
        div.style.opacity = 0.8;
        div.style.backgroundImage = 'url("data/vignette.png")';
        div.style.backgroundPosition = '50%';
        div.style.backgroundSize = '120% 100%';
        div.style.pointerEvents = 'none';
        this.overlayDiv = div;

        // screen
        var div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = this.resolution.width;
        div.style.height = this.resolution.height;
        div.style.fontFamily = 'Lucida Console';
        div.style.fontSize = '16.6px';
        div.append(this.graphicsScreen.getDomElement());
        div.append(this.textScreen.getDomElement());
        div.append(this.messageDiv);
        div.append(this.overlayDiv);
        const screenDiv = div;

        // dualshock 2
        var div = document.createElement('div');
        div.tabIndex = 0;
        div.style.opacity = 0.5;
        div.style.transition = 'opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
        div.style.display = 'inline-block';
        div.style.width = '50%';
        div.style.height = 150;
        div.style.backgroundImage = 'url("data/dualshock2 (1).png")';
        div.style.backgroundPosition = '50%';
        div.style.backgroundSize = '50%';
        div.style.backgroundRepeat = 'no-repeat';
        div.style.outline = 0;
        const dualShock2Div = div;

        // keyboard
        var div = document.createElement('div');
        div.tabIndex = 0;
        div.style.opacity = 0.5;
        div.style.transition = 'opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
        div.style.display = 'inline-block';
        div.style.width = '50%';
        div.style.height = 150;
        div.style.backgroundImage = 'url("data/keyboard (1).png")';
        div.style.backgroundPosition = '50%';
        div.style.backgroundSize = '80%';
        div.style.backgroundRepeat = 'no-repeat';
        div.style.outline = 0;
        const keyboardDiv = div;

        // input
        var div = document.createElement('div');
        div.append(dualShock2Div);
        div.append(keyboardDiv);
        const inputDiv = div;

        // dom element 
        var div = document.createElement('div');
        div.style.display = 'inline-block';
        div.style.verticalAlign = 'top';
        div.style.userSelect = 'none';
        div.append(screenDiv);
        div.append(inputDiv);
        this.domElement = div;

        this.runTimeoutId = null;

        this.strings = new Strings();
        this.asciiTable = new AsciiTable();
        this.formatter = new Formatter();
        this.input = new Input(dualShock2Div, keyboardDiv);
        this.programName = 'NEW-A';

        this.parserWorker = new Worker('worker.js');
        this.parserWorker.onmessage = this.onParserWorkerMessage.bind(this);
    }

    getDomElement() {
        return this.domElement;
    }

    build(file, onBuildFinished) {
        this.audio = new Audio('data/beep.wav');
        this.audio.preload = 'auto';
        this.audio.onloadeddata = () => {
            this.parserWorker.postMessage({
                type: 'grammarFile',
                file,
            });

            this.onBuildFinished = onBuildFinished;
        }
    }

    start(source, onAbstractSyntaxTreeCreated) {
        this.isWaitingForRuntimeCompilation = false;
        this.runtimeCompiledSource = null;

        this.errorQueue = [];
        this.errorsFound = false;

        this.programCounter = 0; // has to be here because it is used to add the correct header to compilation error messages

        this.parserWorker.postMessage({
            type: 'source',
            version: this.version,
            source,
            compilingAtRuntime: false,
        });

        this.stop();
        this.textScreen.reset();
        this.textScreen.show();
        this.showMessage(this.strings.get('Parsing'), this.strings.get('ParsingProgramPleaseWait'), false);

        console.clear();

        this.onAbstractSyntaxTreeCreated = onAbstractSyntaxTreeCreated;
    }

    /////////////
    // PRIVATE //
    /////////////

    onParserWorkerMessage(e) {
        switch (e.data.type) {
            case 'parserGenerated':
                this.onBuildFinished();
                delete this.onBuildFinished;
                break;
            case 'abstractSyntaxTreeCreated':
                this.onAbstractSyntaxTreeCreated(e.data.abstractSyntaxTree);
                delete this.onAbstractSyntaxTreeCreated;
                break;
            case 'parsingDone':
                this.onParsingDone(e.data.compiledSource);
                break;
            case 'errorFound':
                this.onCompilationError(e.data.error);
                break;
        }
    }

    onCompilationError(error) {
        if (error.message.constructor === Array) {
            var message = this.strings.get(...error.message);
        } else if (this.isWaitingForRuntimeCompilation) {
            var message = this.strings.get('ParseErrorAt', error.found !== null ? this.asciiTable.toTextScreenString(error.found) : null);
        } else {
            var message = this.strings.get('ParseErrorAt', error.found);
        }

        this.errorQueue.push({ type: 'ParseError', line: error.location.start.line, message });

        if (this.isWaitingForRuntimeCompilation) {
            this.errorsFound = true;
        } else {
            this.showErrorMessage();
        }
    }

    onParsingDone(compiledSource) {
        if (this.isWaitingForRuntimeCompilation) {
            this.runtimeCompiledSource = compiledSource;
        } else {
            if (compiledSource === null) {
                return;
            }

            this.hideMessage();

            this.instructions = compiledSource.instructions;
            this.data = compiledSource.data;

            this.numberOfDataItems = this.data.length;

            this.symbolStack = new SymbolStack(compiledSource.symbolTable);
            this.symbolStack.setGlobalVariables({
                PI: 3.14159265359,
                pi: 3.14159265359,
                EULER: 2.71828182864,
                euler: 2.71828182864,
            });
            this.symbolStack.setGlobalSubroutinesAndArrays({
                docu$: {
                    dimensions: [compiledSource.documentation.length],
                    values: compiledSource.documentation,
                },
                ...compiledSource.subroutines,
            });
            this.symbolStack.setGlobalInstructionLabels(compiledSource.instructionLabels);
            this.symbolStack.setGlobalDataLabels(compiledSource.dataLabels);

            this.logInstructions();
            console.log('Symbol stack', this.symbolStack);

            this.readControls = false;
            this.screenWidth = 80;
            this.screenHeight = 20;
            this.fontHeight = 10;
            this.textAlign = 'lb';
            this.windowWidth = 100;
            this.windowHeight = 100;
            this.windowOrigin = 'lt';
            this.library = 'main';
            this.colors = [
                [0, 0, 0],
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5],
            ];
            this.lineToX = null;
            this.lineToY = null;
            this.font = '';
            this.streamError = { id: 0, message: [''] };
            this.streams = new Array(16).fill(false);

            this.graphicsScreen.reset(...this.colors[0]); // need to do this here because the graphics screen might be shown before being opened (e.g. on a setrgb runtime error)

            this.dataIndex = 0;
            this.valuesStack = [];
            this.valuesStackLength = 0;

            this.callStack = []; // holds RETURN information for both subroutine calls and GOSUBs

            // this.delayStartTime = null; // used for WAIT, PAUSE, BELL, BEEP
            this.waitStartTime = null; // used for WAIT, PAUSE
            this.bellStartTime = null; // used for BELL, BEEP

            this.inputBuffer = '';
            this.inputPrompt = null;
            this.waitingForInput = null;
            this.ioStream = 0; // used for INPUT

            this.isScreenCleared = false;
            this.isWindowOpened = false;
            this.hideTextScreen = false;

            this.previousPrintType = null;

            this.isStuck = false; // used to simulate an infinite loop crash

            this.input.reset();
            this.input.addKeyDownListener(key => {
                if (key === 'Escape') {
                    this.userHalt();
                }
            });

            this.programStartedTime = (new Date).getTime();
            this.requestFrame();
        }
    }

    requestFrame(milliseconds) {
        this.runTimeoutId = setTimeout(this.executeFrame.bind(this), milliseconds);
    }

    executeFrame() {
        const now = Date.now();
        const msPerFrame = 1000 / this.fps;
        const startOfFrameTime = this.programStartedTime + msPerFrame * ~~((now - this.programStartedTime) / msPerFrame);
        const endOfFrameTime = startOfFrameTime + msPerFrame;
        const endOfAllowedRunTime = Math.min(endOfFrameTime, now + msPerFrame * Math.min(Math.max(0, this.cpuUsage), 1));

        let running = this.programCounter < this.instructions.length;
        this.endFrame = false;

        try {
            let n = 0;
            do {
                // run a maximum of one hundred instructions before checking if enough time has passed to take a break
                for (let i = 0; i < 100 && !this.endFrame && running; i++) {
                    const instruction = this.instructions[this.programCounter++]; // cannot cache instructions, because COMPILE might add more

                    switch (instruction.type) {
                        case 'instructionNUMBER':
                            this.instructionNUMBER(instruction.arguments[0]);
                            break;
                        case 'instructionLOAD_NUMERIC_VARIABLE':
                            this.instructionLOAD_NUMERIC_VARIABLE(instruction.arguments[0]);
                            break;
                        case 'instructionSTORE_NUMERIC_VARIABLE':
                            this.instructionSTORE_NUMERIC_VARIABLE(instruction.arguments[0]);
                            break;
                        case 'instructionCALL_FUNCTION_OR_ARRAY':
                            this.instructionCALL_FUNCTION_OR_ARRAY(instruction.arguments[0], instruction.arguments[1]);
                            break;
                        case 'instructionSTORE_ARRAY_ELEMENT':
                            this.instructionSTORE_ARRAY_ELEMENT(instruction.arguments[0], instruction.arguments[1]);
                            break;
                        default:
                            this[instruction.type](...instruction.arguments);
                    }

                    running = this.programCounter < this.instructions.length && !this.errorsFound;
                }
                n++;
            }
            while (!this.endFrame && running && (Date.now() < endOfAllowedRunTime) && n < this.maxInstructionsPerFrame);
        } catch (e) {
            if (e.constructor !== YabasicRuntimeError) {
                throw e;
            }
        }

        if (this.isStuck) {
            this.stop();
            return;
        }

        if (this.hideTextScreen) {
            this.graphicsScreen.update();
            this.textScreen.hide();
        } else {
            this.textScreen.update();
            this.textScreen.show();
        }

        if (this.errorsFound) {
            this.showErrorMessage();
        }

        // start+select
        else if ((this.input.getPort1() & 9) === 9) {
            this.userHalt();
        }
        else if (running) {
            this.requestFrame(endOfFrameTime - Date.now());
        } else {
            console.log(Date.now() - this.programStartedTime)
            this.stop();
            this.showMessage(this.strings.get('ExecutionComplete'), this.strings.get('ProgramCompletedExecution'));
        }
    }

    userHalt() {
        this.stop();
        this.showMessage(this.strings.get('ExecutionComplete'), this.strings.get('UserHaltedExecution'));
    }

    stop() {
        if (this.runTimeoutId !== null) {
            clearTimeout(this.runTimeoutId);
            this.runTimeoutId = null;

            this.textScreen.update();
            this.graphicsScreen.update();

            if (this.valuesStackLength > 0) {
                console.error('values left in stack!', this.valuesStack.slice(0, this.valuesStackLength));
            }
        }
    }

    showErrorMessage() {
        const latestErrorType = this.errorQueue[this.errorQueue.length - 1].type;

        if (this.programCounter > 0 && latestErrorType !== 'FatalError') {
            this.queueError('ProgramStoppedDueToError');
        }

        this.stop();

        let message = '';
        let previousLine;
        for (let i = 0; i < this.errorQueue.length && message.length <= 252; i++) {
            const error = this.errorQueue[i];
            const line = error.line;
            if (line !== previousLine || error.type === 'Dump') {
                message += '---' + this.strings.get(error.type + 'In', this.programName, line) + error.message + '\n';
            } else if (line === previousLine) {
                message += '---' + this.strings.get(error.type) + ': ' + error.message + '\n';
            }
            previousLine = line;
        }

        if (latestErrorType === 'FatalError') {
            message += this.strings.get('ImmediateExitDueToFatalError');
        }

        this.showMessage(
            this.strings.get(this.programCounter > 0 ? 'RunTimeErrorAtLine' : 'CompilationErrorAtLine', previousLine),
            message.substring(0, 252) + '\n'
        );
    }

    showMessage(header, body, showOkButton = true) {
        this.messageHeaderDiv.innerHTML = header;
        this.messageBodyDiv.innerHTML = body.replace(/\n/g, '<br>');
        this.messageDiv.style.display = 'initial';
        this.okButtonDiv.style.visibility = showOkButton ? 'visible' : 'hidden';
    }

    hideMessage() {
        this.messageDiv.style.display = 'none';
    }

    logInstructions() {
        console.log('Instructions: ', this.instructions.map(instruction => {
            return [instruction.line, instruction.type.substring(11), ...instruction.arguments];
        }));
    }
}
