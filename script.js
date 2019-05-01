'use strict'

let doNTimes = (f, n) => {
    for (let i = 0; i < n; ++i) f();
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
        let create = (n) => {
            return '<div class="proc-idle">'
                +'<div>Процесор №'+(n+1)+'</div>'
                +'<form>'
                    +'Потужність: '
                    +'<input class="inp" type="number" name="power" value="1" min="0"><br>'
                +'</form><div>Вільний</div>'
            +'</div>';
        };
        return {
            create
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
    return (runTimeSeconds, taskProbability, enqueueNew) => {
        let runTimeMiliSeconds = 1000 * +runTimeSeconds;
        let eachMiliSecondDo = () => {
            if (!(Math.random() > taskProbability)) {
                enqueueNew();
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
    let combinations = CombinationArray(initProcessorCount);
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
    return function(runTimeSeconds, taskProbability, initTaskCount, minPower, maxPower, render, randomProcessorCombination) {
        let queue = [];
        let taskWrapper = Task();
        let randomPower = () => randomInt(minPower, maxPower+1);
        let enqueueNew = () => queue.push({
            task: taskWrapper.make(randomPower(), randomProcessorCombination()),
            processor: undefined
        });
        //console.log(combinations);
        
        let init = () => {
            doNTimes(enqueueNew, initTaskCount);
            for (let i = 0; i < initTaskCount; ++i) {
                render(queue[i].task);
            }
        }
        let runner = TaskQueueRunner(runTimeSeconds, taskProbability, enqueueNew);
        let start = () => runner.start();
        return {
            init, start
        };
    };
})();

let TaskQueueCreatorMaker = 
    (runTimeSeconds, taskProbability, initTaskCount, minPower, maxPower) => 
    (render, randomProcessorCombination) => 
    TaskQueueCreator(runTimeSeconds, taskProbability, initTaskCount, minPower, maxPower, render, randomProcessorCombination);

let Processor = () => (power) => { return { power, task: undefined }; };

let Processors = () => {}

let ProcessorCreator = (processorsElement) => {
    let processorHTML = ProcessorHTML();
    return (processor) => {

    };
};

let Model = (function() {
    return function(taskQueueElement, processorsElement, initProcessorCount, taskQueueCreatorMaker) {
        let taskCreator = TaskCreator(taskQueueElement, initProcessorCount);
        let randomProcessorCombination = (() => {
            let pow2 = Math.pow(2, initProcessorCount);
            return () => randomInt(1, pow2);
        })();
        let taskQueueCreator = taskQueueCreatorMaker(taskCreator, randomProcessorCombination);

        let processorCreator = ProcessorCreator(processorsElement);
        /*let createNewProcessor = () => {
            undefined
        }
        let appendNewProcessor = () => processorsElement.appendChild(createNewProcessor());*/
        let appendNewProcessors = () => doNTimes(()=>{}, initProcessorCount);

        let cleanTaskQueue = () => taskQueueElement.innerHTML = "";
        let cleanProcessors = () => processorsElement.innerHTML = "";
        let clean = () => {
            cleanProcessors();
            cleanTaskQueue();
        }

        appendNewProcessors();
        taskQueueCreator.init();
        let report = taskQueueCreator.start();
        //clean();
        return report;
    };
})();

let Reporter = () => (fullPower, usedPower) => {
    let averageUsedPower = usedPower / n;
    alert('Використано потужності: '+usedPower
            +'\nСередня використана потужність: '+averageUsedPower
                    +'\nДоступно: '+fullPower
                    +"\nККД = "+(100*averageUsedPower/fullPower)
                    +"%\nККД' = "+(100*averageUsedPower/fullPower)
                    +'%');
}