
'use strict'

function Scheduler(schedule, perform) {
    return (tasks, procs) => {
        let tasks_to_perform = undefined;
        return {
            schedule: (tasks, procs) => tasks_to_perform = schedule(tasks, procs),
            perform: (tasks, procs) => perform(tasks, procs, tasks_to_perform)
        };
    };
}

function fifo_schedule(tasks, procs) {
    let tasks_to_perform = [];
    for (let task of tasks) {
        let first_idle_proc = undefined;
        for (let task_proc_i in task.procs) {
            if (procs[task_proc_i].busy == false) {
                first_idle_proc = task_proc_i;
                break;
            }
        }
        if (first_idle_proc == undefined) {
            break;
        } else {
            tasks_to_perform.push(task.complexity / first_idle_proc.power);
        }
    }
    return tasks_to_perform;
}

function make_timeout_array(tasks_to_perform, procs) {
    let timeout_array = tasks_to_perform;
    /*function addTimeout(previous_value, current_value, current_index, array) {
        let current_timeout = current_value.taskComplexity / 
    }
    tasks_to_perform.reduce(addTimeout);*/
    return timeout_array;
}
function make_timer_array(timeout_array) {
    function make_timer_array_aux(current_timeout, next_timeout) {
        return setTimeout(() => {
            
        });
    }
}
function fifo_perform(tasks, procs, tasks_to_perform) {
    let timeout_array = make_timeout_array(tasks_to_perform, procs);
    let byTimeout = (a, b) => a.timeout - b.timeout;
    timeout_array.sort(byTimeout);
    let timer = setTimeout(() => {

    }, timeout_array)
}

let FIFOScheduler = Scheduler(fifo_schedule, fifo_perform);

let tasks = [];
let procs = [];
let fifo_scheduler = FIFOScheduler(tasks, procs);