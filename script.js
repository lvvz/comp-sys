'use strict'

var Task = (function() {
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

var Processor = (function() {
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

var Task = (function() {
    return function() {
        let create = (n) => {
            return '<div class="task-idle">'
                +'<div class="">Задача №'+(n+1)+', Z('
                    +'<input class="inp" type="number" name="power" value="300" min="10" size="10">'
                +')</div>'
            +'</div>';
        };
        return {
            create
        };
    };
})();

var Checkbox = (function() {
    return function() {
        let create = (isChecked) => {
            return '<div class="column"><input type="checkbox" '+ (isChecked ? 'checked' : '') +'></div>';
        };
        return {
            create
        };
    };
})();

var TaskQueueRunner = (function() {
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

var CombinationArray = function(n) {
    let pow2 = Math.pow(2, n);
    let array = new Array(pow2);
    for (let c = 0; c < pow2; ++c) {
        let combination = [];
        for (let i = 0, leftover = c; i < n; ++i) {
            if (leftover % 2) combination.push(i);
            leftover = leftover >> 1;
        }
        array[c] = combination;
    }
    return array;
};

let taskRenderer = (power, processors) => {

}

let random = (min, max) => Math.random() * (+max - +min) + +min;
let randomInt = (min, max) => parseInt(random(min, max));
var TaskQueueCreator = (function() {
    return function(runTimeSeconds, taskProbability, initTaskCount, processorCount, minPower, maxPower) {
        let queue = [];
        let taskWrapper = Task();
        let randomPower = () => randomInt(minPower, maxPower+1);
        let randomProcessorCombination = () => 1 + randomInt(0, Math.pow(2, processorCount));
        let enqueueNew = () => queue.push({
            task: taskWrapper.make(randomPower(), randomProcessorCombination()),
            processor: undefined
        });
        let combinations = CombinationArray(processorCount);
        //console.log(combinations);
        let renderNew = (i) => {
            let task = queue[i].task;
            taskRenderer(task.power, combinations[task.processorCombination]);
        } 
        let taskQueueInit = () => {
            for (let i = 0; i < initTaskCount; ++i) {
                enqueueNew();
            }
            for (let i = 0; i < initTaskCount; ++i) {
                renderNew(i);
            }
        }
        let runner = TaskQueueRunner(runTimeSeconds, taskProbability, enqueueNew);
        let taskQueueStart = () => runner.start();
        return {
            taskQueueInit, taskQueueStart
        };
    };
})();

var Model = (function() {
    return function(taskQueueElement, ProcessorsElement, initTaskCount, initProcessorCount) {
        return {

        };
    };
})();