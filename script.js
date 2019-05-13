'use strict'

let doNTimes = (f, n) => {
    for (let i = 0; i < n; ++i) f();
}

let doNTimesWithIteration = (f, n) => {
    for (let i = 0; i < n; ++i) f(i);
}

let random = (min, max) => Math.random() * (+max - +min) + +min;
let randomInt = (min, max) => parseInt(random(min, max));

let Task = (function() {
    return function() {
        let number = 0;
        return {
            make: (power, processorCombination) => {
                ++number;
                return { power, processorCombination, number, processor: undefined };
            }
        };
    };
})();

let ProcessorHTML = (function() {
    return function() {
        let create = (number, power) => {
            return '<div class="proc-idle">'
                +'<div>Процесор №'+number+'</div>'
                +'<form>'
                    +'Потужність: '
                    +'<input class="inp" type="number" value="'+power+'" name="power" min="0"><br>'
                +'</form><div>Вільний</div>'
            +'</div>';
        };
        let getPower = (element) => element.children[1].children[0].value;
        let setTask = (processorElement, task) => {
            processorElement.setAttribute('class', 'proc-active');
            processorElement.lastChild.remove();
            processorElement.insertAdjacentHTML('beforeend', '<div>Обробка №'+task+'</div>');
        }
        return {
            create, getPower, setTask
        };
    };
})();

let TaskHTML = (function() {
    return function() {
        let create = (power, number) => {
            return '<div class="task-idle">'
                +'<div class="">Задача №'+number+', Z('
                    +'<input class="inp" type="number" name="power" value="'+power+'" min="10" size="10">'
                +')</div>'
            +'</div>';
        };
        let setAsActive = (taskElement) => taskElement.setAttribute('class', 'task-active');
        return { create, setAsActive };
    };
})();

let Checkbox = (function() {
    return function() {
        let create = (isChecked) => {
            return '<div class="column"><input type="checkbox" '+ (isChecked ? 'checked' : '') +'></div>';
        };
        return { create };
    };
})();

let TaskQueuePusher = (function() {
    return (runTimeSeconds, taskProbabilityGetter, addNew) => {
        let runTimeMiliSeconds = 1000 * +runTimeSeconds;
        let taskProbability = taskProbabilityGetter();
        let eachMiliSecondDo = () => {
            if (!(Math.random() > taskProbability)) {
                addNew();
            }
        };
        let start = () => {
            let intervalCounter = 0;
            let timerHandler = () => {
                if (intervalCounter >= runTimeMiliSeconds) {
                    clearInterval(timerHandler);
                } else {
                    eachMiliSecondDo();
                    ++intervalCounter;
                }
            };
            let addTaskTimer = setInterval(timerHandler, 1);
        }
        return { start };
    };
})();

let CombinationArray = function(n) {
    let pow2 = Math.pow(2, n);
    let array = new Array(pow2);
    for (let c = 0; c < pow2; ++c) {
        let combination = [];
        for (let i = 0, leftover = c; i < n; ++i) {
            if (leftover % 2) combination.push(i);
            leftover >>= 1;
        }
        array[c] = combination;
    }
    return array;
};

let CheckboxSetter = () => {
    return (checkedIndices, collection, getter) => {
        for (let element of collection) {
            getter(element).checked = false;
        }
        for (let checkedIndex of checkedIndices) {
            getter(collection[checkedIndex]).checked = true;
        }
    }
};

let TaskCheckboxSetter = () => {
    let checkboxSetter = CheckboxSetter();
    return (checkedIndices, root) => {
        checkboxSetter(checkedIndices, root.children, (element) => element.firstChild);
    }
}

let TaskCreator = (taskQueueElement, processorCount, getProcessorCombination) => {
    let taskHTML = TaskHTML();
    let checkbox = Checkbox();
    let taskCheckboxSetter = TaskCheckboxSetter();
    return (task) => {
        let power = task.power;
        let processors = getProcessorCombination(task.processorCombination);
        let number = task.number;
        taskQueueElement.insertAdjacentHTML('beforeend', taskHTML.create(power, number));
        let currentTaskElement = taskQueueElement.lastChild;
        currentTaskElement.insertAdjacentHTML('beforeend', "<div></div>");
        let checkboxesElement = currentTaskElement.lastChild;
        for (let i = 0; i < processorCount; ++i) {
            checkboxesElement.insertAdjacentHTML('beforeend', checkbox.create(false));
        }
        taskCheckboxSetter(processors, checkboxesElement);
    };
}

let TaskQueueCreator = (function() {
    return function(runTimeSeconds, taskProbabilityGetter, initTaskCount, 
        minPowerGetter, maxPowerGetter, taskCountSetter, taskCreator, randomProcessorCombination,
        getProcessorCombination, schedulerMode) {
        let queue = [];
        let taskCount = 0;
        let taskWrapper = Task();
        let randomPower = (() => {
            let minPower = minPowerGetter();
            let maxPower = maxPowerGetter();
            return () => randomInt(minPower, maxPower+1);
        })();
        let enqueueNew = () => queue.push(taskWrapper.make(randomPower(), randomProcessorCombination()));
        let addNew = () => {
            enqueueNew();
            ++taskCount;
            taskCountSetter(taskCount);
        };        
        let init = () => {
            doNTimes(enqueueNew, initTaskCount);
            doNTimesWithIteration((i) => taskCreator(queue[i]), initTaskCount);
        }
        let pusher = TaskQueuePusher(runTimeSeconds, taskProbabilityGetter, addNew);
        let getQueue = () => queue;
        let scheduler = (processors) => SchedulerCreatorMaker(schedulerMode, getQueue, processors, getProcessorCombination);


        let fullPower = 0;
        let usedPower = 0;
        let timeLeft = runTimeMiliSeconds;
        let start = (data) => {
            pusher.start();
            while (!(timeLeft <= 0)) {
                
                timeoutForRunningTasks();
            }
            return { fullPower, usedPower };
        }
        return {
            init, start
        };
    };
})();

let TaskQueueCreatorMaker = 
    (runTimeSeconds, taskProbability, initTaskCount, minPowerGetter, maxPowerGetter, taskCountSetter, schedulerMode) => 
    (taskCreator, randomProcessorCombination, getProcessorCombination) => 
    TaskQueueCreator(runTimeSeconds, taskProbability, initTaskCount, minPowerGetter, maxPowerGetter, taskCountSetter,
         taskCreator, randomProcessorCombination, getProcessorCombination, schedulerMode);

let ProcessorCreator = () => (power) => { return { power, task: undefined }; };

let ProcessorsCreator = (processorsInfo) => {
    let processorsElement = processorsInfo.processorsElement;
    let processorHTML = ProcessorHTML();
    let minPower = processorsInfo.minProcessorPower;
    let maxPower = processorsInfo.maxProcessorPower;
    let create = (number) => {
        let power = randomInt(minPower, maxPower);
        processorsElement.insertAdjacentHTML('beforeend', processorHTML.create(number, power));
    };
    let getPower = (element) => processorHTML.getPower(element);
    return { create, getPower };
};

let Model = (function() {
    return function(taskQueueElement, processorsInfo, taskQueueCreatorMaker) {
        let processorsElement = processorsInfo.processorsElement;
        let initProcessorCount = processorsInfo.initProcessorCount;
        let combinations = CombinationArray(initProcessorCount);
        let getProcessorCombination = (combinationIndex) => combinations[combinationIndex];
        let taskCreator = TaskCreator(taskQueueElement, initProcessorCount, getProcessorCombination);
        let randomProcessorCombination = (() => {
            let pow2 = Math.pow(2, initProcessorCount);
            return () => randomInt(1, pow2);
        })();
        let taskQueueCreator = taskQueueCreatorMaker(taskCreator, randomProcessorCombination, getProcessorCombination);

        let processorsCreator = ProcessorsCreator(processorsInfo);
        let appendNewProcessors = () => doNTimesWithIteration((i) => processorsCreator.create(i+1), initProcessorCount);

        let cleanTaskQueue = () => taskQueueElement.innerHTML = "";
        let cleanProcessors = () => processorsElement.innerHTML = "";
        let clean = () => { cleanProcessors(); cleanTaskQueue(); }

        let processorCreator = ProcessorCreator();
        let makeProcessors = () => {
            let processors = [];
            for (let processorElement of processorsElement.children) {
                processors.push(processorCreator(processorsCreator.getPower(processorElement)));
            }
            return processors;
        }
        let init = () => {
            appendNewProcessors();
            let processors = makeProcessors();
            taskQueueCreator.init();
            return { processors };
        }
        let start = (data) => {
            taskQueueCreator.start(data);
            //clean();
            return report;
        };

        return { init, start };
    };
})();

let Reporter = (report) => {
    let fullPower = report.fullPower;
    let usedPower = report.usedPower;
    let averageUsedPower = usedPower / n;
    let show = () => {  
        alert('Використано потужності: '+usedPower
                +'\nСередня використана потужність: '+averageUsedPower
                +'\nДоступно: '+fullPower
                +"\nККД = "+(100*averageUsedPower/fullPower)
                +"%\nККД' = "+(100*averageUsedPower/fullPower)
                +'%');
    }
    return { show };
}

let ModelRunner = (model, runTimes) => {
    let init = () => model.init();
    let start = (modelData) => {
        model.start(modelData);
        init();
        return {
            fullPower: -1111111,
            usedPower: +2222222
        }
    };
    return {
        init, start
    };
};

let ModelWrapper = () => {
    let getEvaluatingProcessorsIndices = () => {

    };
    let getFastestIdleTaskForShedulingProcessorToo = () => {

    };
    let assignTaskToProcessor = () => {

    };
    let getQueue = () => {

    };
    let managedToAssignTaskToAnyProcessor = () => {

    };
    let getFastestIdleTaskForEvaluatingProcessors = () => {

    };
    return {
        getEvaluatingProcessorsIndices,
        getFastestIdleTaskForShedulingProcessorToo,
        assignTaskToProcessor,
        getQueue,
        managedToAssignTaskToAnyProcessor,
        getFastestIdleTaskForEvaluatingProcessors
    }
}

let Schedulers = (modelWrapper) => { 
    let JIESP = () => {
        for (let processorIndex of modelWrapper.getEvaluatingProcessorsIndices()) {
            if (!modelWrapper.processorIsBusy(processorIndex)) {
                let fastestIdleTaskIndex = modelWrapper.getFastestIdleTaskForShedulingProcessorToo();
                modelWrapper.assignTaskToProcessor(fastestIdleTaskIndex, processorIndex);
            }
        }
    }
    return {
        'FIFO': () => {
            for (let taskIndex in modelWrapper.getQueue()) {
                if (!modelWrapper.managedToAssignTaskToAnyProcessor(taskIndex)) {
                    break;
                }
            }
        },
        'JSP': () => {
            for (let processorIndex of modelWrapper.getEvaluatingProcessorsIndices()) {
                if (!modelWrapper.processorIsBusy(processorIndex)) {
                    let fastestIdleTaskIndex = modelWrapper.getFastestIdleTaskForEvaluatingProcessors();
                    modelWrapper.assignTaskToProcessor(fastestIdleTaskIndex, processorIndex);
                }
            }
        },
        'JIESP': JIESP,
        'JOESP': JIESP
    };
};

let SchedulerCreatorMaker = (mode, modelWrapper) => Schedulers(modelWrapper)[mode]();