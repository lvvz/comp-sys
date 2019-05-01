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
                return { power, processorCombination, number }
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
        return {
            create, getPower
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
        return {
            create
        };
    };
})();

let Checkbox = (function() {
    return function() {
        let create = (isChecked) => {
            return '<div class="column"><input type="checkbox" '+ (isChecked ? 'checked' : '') +'></div>';
        };
        return {
            create
        };
    };
})();

let TaskQueueRunner = (function() {
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
        return {
            start
        };
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

let TaskCreator = (taskQueueElement, processorCount) => {
    let taskHTML = TaskHTML();
    let checkbox = Checkbox();
    let taskCheckboxSetter = TaskCheckboxSetter();
    let combinations = CombinationArray(processorCount);
    return (task) => {
        let power = task.power;
        let processors = combinations[task.processorCombination];
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
        minPowerGetter, maxPowerGetter, taskCountSetter, render, randomProcessorCombination,
        schedulerMode) {
        let queue = [];
        let taskCount = 0;
        let taskWrapper = Task();
        let randomPower = (() => {
            let minPower = minPowerGetter();
            let maxPower = maxPowerGetter();
            return () => randomInt(minPower, maxPower+1);
        })();
        let enqueueNew = () => queue.push({
            task: taskWrapper.make(randomPower(), randomProcessorCombination()),
            processor: undefined
        });
        let addNew = () => {
            enqueueNew();
            ++taskCount;
            taskCountSetter(taskCount);
        };
        //console.log(combinations);
        
        let init = () => {
            doNTimes(enqueueNew, initTaskCount);
            for (let i = 0; i < initTaskCount; ++i) {
                render(queue[i].task);
            }
        }
        let runner = TaskQueueRunner(runTimeSeconds, taskProbabilityGetter, addNew);
        let getQueue = () => queue;
        let schedulerCreator = SchedulerCreatorMaker(schedulerMode);
        let scheduler = schedulerCreator(getQueue);
        let start = (data) => {
            runner.start();
            let processors = data.processors;
            let report = scheduler(processors);
            return report;
        }
        return {
            init, start
        };
    };
})();

let TaskQueueCreatorMaker = 
    (runTimeSeconds, taskProbability, initTaskCount, minPowerGetter, maxPowerGetter, taskCountSetter) => 
    (render, randomProcessorCombination) => 
    TaskQueueCreator(runTimeSeconds, taskProbability, initTaskCount, minPowerGetter, maxPowerGetter, taskCountSetter,
         render, randomProcessorCombination);

let Processor = () => (power) => { return { power, task: undefined }; };

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
        let taskCreator = TaskCreator(taskQueueElement, initProcessorCount);
        let randomProcessorCombination = (() => {
            let pow2 = Math.pow(2, initProcessorCount);
            return () => randomInt(1, pow2);
        })();
        let taskQueueCreator = taskQueueCreatorMaker(taskCreator, randomProcessorCombination);

        let processorCreator = ProcessorsCreator(processorsInfo);
        let appendNewProcessors = () => doNTimesWithIteration((i) => processorCreator.create(i+1), initProcessorCount);

        let cleanTaskQueue = () => taskQueueElement.innerHTML = "";
        let cleanProcessors = () => processorsElement.innerHTML = "";
        let clean = () => { cleanProcessors(); cleanTaskQueue(); }

        let makeProcessors = () => {
            let processors = [];
            for (let processorElement of processorsElement.children) {
                processors.push(processorCreator.getPower(processorElement));
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
            let report = taskQueueCreator.start(data);
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
    let start = () => {
        model.start();
        init();
    };
    return {
        init, start
    };
};

let Schedulers = (getQueue, processors) => { 
    return {
    'FIFO': () => {

    },
    'JSP': () => {

    },
    '': () => {

    },
    '': () => {

    }
};
};

let SchedulerCreatorMaker = (mode) => (getQueue) => (processors) => Schedulers(getQueue, processors)[mode]();