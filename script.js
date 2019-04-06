'use strict'
    
var app_mode = undefined;
var schedule_processors = undefined;

var DOMWrapper = (function() {
    return function(wrapper_id) {
        var _element = document.getElementById(wrapper_id);
        return {
            get: () => _element,
            appendHTML: (html) => _element.insertAdjacentHTML('beforeend', html),
            getChildren: () => _element.children
        };
    };
})();

var MultipleElementsWrapper = (function() {
    return function(wrapper_id, html_creator) {
        var _root = DOMWrapper(wrapper_id);
        var _addNew = () => _root.appendHTML(html_creator());
        return {
            addNew: _addNew,
            getRoot: () => _root.get(),
            getAll: () => _root.getChildren(),
            createN: (n) => {
                for (var i = 0; i < n; ++i) {
                    _addNew();
                }
            }
        };
    };
})();

var MultipleElementsWrapperWithCounter = (function() {
    return function(wrapper_id, html_creator) {
        var _n = 0;
        var _root = MultipleElementsWrapper(wrapper_id, () => { 
            var html = html_creator(_n);
            ++_n;
            return html;
        });
        return {
            addNew: () => _root.addNew(),
            getRoot: () => _root.getRoot(),
            getAll: () => _root.getAll(),
            createN: (n) => _root.createN(n),
            getN: () => _n
        };
    };
})();

var ProcessorsWrapper = (function() {
    return function(wrapper_id) {
        var _html_creator = (_n) => {
            var proc_html 
            ='<div class="proc-idle">'
                +'<div>Процесор №'+(_n+1)+'</div>'
                +'<form>'
                    +'Потужність: '
                    +'<input class="inp" type="number" name="power" value="1" min="0"><br>'
                +'</form><div><p>Вільний</p><p></p></div>'
            +'</div>';
            return proc_html;
        };
        var _root = MultipleElementsWrapperWithCounter(wrapper_id, _html_creator);
        var _getPower = (proc) => proc.children[1].children[0].value;
        function _fullPower() {
            var result = 0;
            for (var proc of _root.getAll()) {
                result = (+result) + Math.abs(+_getPower(proc));
            }
            return result;
        }
        return {
            getPower: _getPower,
            fullPower: _fullPower,
            getRoot: () => _root.getRoot(),
            getAll: () => _root.getAll(),
            create: (n) => _root.createN(n)
        };
    };
})();

var TasksWrapper = (function() {
    return function(wrapper_id, processors) {
        var _html_creator = (n) => {
            return '<div class="task-idle">'
                +'<div class="">Задача №'+(n+1)+', Z('
                    +'<input class="inp" type="number" name="power" value="300" min="10" size="10">'
                +')</div>'
            +'</div>';
        };
        var _root = MultipleElementsWrapperWithCounter(wrapper_id, _html_creator);
        var _n = 0;
        var _cbox_buf = [];
        var _getMatrixIgnoreScheduleProc = function() {
            var matrix = [];
            for (var task of _root.getAll()) {
                var c = 0;
                var row = [];
                var planning_procs = []
                for (var chb_w of task.children) {
                    if (c != 0) {
                        for (var chb of chb_w.children) {
                            if (chb.checked) {
                                if (processors.getPower(processors.getAll()[c-1]) <= 0) {
                                } else {
                                    row.push(c);
                                }
                            }
                        }
                    }
                    ++c;
                }
                matrix.push(row);
            }
            return matrix;
        }
        var _getMatrixAllProc = function() {
            var matrix = [];
            for (var task of _root.getAll()) {
                var c = 0;
                var row = [];
                var planning_procs = []
                for (var chb_w of task.children) {
                    if (c != 0) {
                        for (var chb of chb_w.children) {
                            if (chb.checked) {
                                row.push(c);
                            }
                        }
                    }
                    ++c;
                }
                matrix.push(row);
            }
            return matrix;
        }

        var _getMatrix = (app_mode == 2) ? _getMatrixIgnoreScheduleProc : _getMatrixAllProc;
        function _initCheckBoxes(n) {
            _cbox_buf = _getMatrix();
        }

        function _randNum(min, max) {
            return Math.random() * (+max - +min) + +min;
        }

        function _randChBoxBuf() {
            var r = parseInt(_randNum(0, _cbox_buf.length-1));
            return r;
        }
        
        return {
            getMatrix: _getMatrix,
            initCheckBoxes: _initCheckBoxes,
            getComplexity: (task) => task.children[0].children[0].value,
            getRoot: () => _root.getRoot(),
            getAll: () => _root.getAll(),
            clearAll: () => {
                //var r = _root.getRoot();
                //r.innerHTML = '';
                /*for (var t of _root.getAll()) {
                    t.remove();
                }*/
                /*while (r.children.length != 0) {
                    console.log('aaaaaaaa');
                    r.removeChild(r.firstChild);
                }*/
                //_n = 0;
            },
            initCheckBoxes: _initCheckBoxes,
            init: (n, check_mode) => {
                for (var i = 0; i < n; ++i) {
                    _root.getRoot().insertAdjacentHTML('beforeend', _html_creator(_n));
                    var curr = _root.getRoot().lastChild;
                    curr.num = _n;
                    if (check_mode == 'all-checked') {
                        for (var proc of processors.getAll()) {
                            curr.insertAdjacentHTML('beforeend', '<div class="column"><input type="checkbox" checked></div>');
                        }
                    } else {
                        for (var proc of processors.getAll()) {
                            curr.insertAdjacentHTML('beforeend', '<div class="column"><input type="checkbox"></div>');
                        }
                    }
                    
                    ++_n;
                }
            },
            create: (n) => {
                for (var i = 0; i < n; ++i) {
                    _root.getRoot().insertAdjacentHTML('beforeend', _html_creator(_n));
                    var curr = _root.getRoot().lastChild;
                    
                    curr.num = _n;
                    
                    for (var proc of processors.getAll()) {
                        curr.insertAdjacentHTML('beforeend', '<div class="column"><input type="checkbox"></div>');
                    }
                    
                    var _chbox_row = _cbox_buf[_randChBoxBuf()];
                    //console.log(_chbox_row);
                    var c = 0;
                    var row_i = 0;
                    for (var chb of curr.children) {
                        if (c != 0) {
                            if (_chbox_row[row_i] == c) {
                                chb.children[0].checked = true;
                                ++row_i;
                            }
                        }
                        ++c;
                    }
                    ++_n;
                }
            }
        };
    };
})();

var ParallelExecutionModel = (function() {
    return function(tasks_wrapper, procs_wrapper, display=true) {
        var full_power = 10 * 1000 * procs_wrapper.fullPower();
        var used_power = 0;
        var schedule_time = 4;
        function setProcAsActive(proc, task, row_i) {
            proc.setAttribute('class', 'proc-active');
            proc.lastChild.remove();
            proc.insertAdjacentHTML('beforeend', 
                '<div><p>Обробка</p><p>№'+(tasks_wrapper.getAll()[row_i].num+1)+'</p></div>');
        }
        function setTaskAsBeingRunOnProc(task, proc_num, row_i) {
            task.setAttribute('class', 'task-active');
            tasks_wrapper.getAll()[row_i].proc = proc_num;
        }
        function fifo_schedule() {
            var matrix = tasks_wrapper.getMatrix();
            var row_i = 0;
            for (var task of tasks_wrapper.getAll()) {
                if (task.getAttribute('class') != 'task-active') {
                    var row = matrix[row_i];
                    if (row.length != 0) {
                        var col_i = 0;
                        var proc_i = 0;
                        var activated = false;
                        for (var proc of procs_wrapper.getAll()) {
                            if (row[col_i] == proc_i+1) {
                                if (proc.getAttribute('class') != 'proc-active') {
                                    setProcAsActive(proc, task, row_i);
                                    setTaskAsBeingRunOnProc(task, row[col_i], row_i);
                                    activated = true;
                                    break;
                                }
                                ++col_i;
                            }
                            ++proc_i;
                        }
                        if (!activated) break;
                    } else break;
                }
                ++row_i;
            }
        }
        function setProcAsScheduling(proc_i) {
            procs_wrapper.getAll()[proc_i-1].setAttribute('class', 'proc-wait');
            procs_wrapper.getAll()[proc_i-1].lastChild.remove();
            procs_wrapper.getAll()[proc_i-1].insertAdjacentHTML('beforeend', '<div><p>Планування</p></div>');
        }
        function planned_schedule() {
            var matrix = tasks_wrapper.getMatrix();
            var row_i = 0;
            for (var task of tasks_wrapper.getAll()) {
                if (task.getAttribute('class') != 'task-active') {
                    var row = matrix[row_i];
                    if (row.length != 0) {
                        var col_i = 0;
                        var proc_i = 0;
                        var proc_max_power = undefined;
                        var proc_max_power_number = undefined;
                        for (var proc of procs_wrapper.getAll()) {
                            if (row[col_i] == proc_i+1) {
                                if (proc.getAttribute('class') != 'proc-active' 
                                    && proc.getAttribute('class') != 'proc-wait') {
                                    var current_proc_power = procs_wrapper.getPower(proc);
                                    if (proc_max_power == undefined || proc_max_power < current_proc_power) {
                                        proc_max_power = current_proc_power;
                                        proc_max_power_number = proc_i+1;
                                    }
                                }
                                ++col_i;
                            }
                            ++proc_i;
                        }
                        if (proc_max_power_number == undefined) break;
                        else {
                            setProcAsActive(procs_wrapper.getAll()[proc_max_power_number-1], task, row_i);
                            setTaskAsBeingRunOnProc(task, proc_max_power_number, row_i);
                        }
                    } else {
                        break;
                    }
                }
                ++row_i;
            }
        }
        var schedule = (app_mode == 1) ? fifo_schedule : planned_schedule;
        function releaseProc(proc) {
            proc.setAttribute('class', 'proc-idle');
            proc.lastChild.remove();
            proc.insertAdjacentHTML('beforeend', '<div><p>Вільний</p><p></p></div>');
        }
        function removeFirstTask() {
            if (tasks_wrapper.getAll().length != 0) {
                tasks_wrapper.getRoot().firstChild.remove();
            }
        }
        function releaseTaskProc(proc) {
            releaseProc(procs_wrapper.getAll()[proc-1]);
            schedule();
        }
        var proc_promise_func_maker = function(proc, timeout, complexity) { 
            return function(resolve, reject) {
                setTimeout(() => {
                    used_power = (+used_power) + (+complexity);
                    releaseTaskProc(proc);
                    resolve();
                }, timeout);
            }; 
        }
        function makeParallelPromisesNoScheduleProc() {
            schedule();
            var parallel_execution_promises = [];
            var i = 0;
            for (var task of tasks_wrapper.getAll()) {
                if (task.getAttribute('class') != 'task-active') break;
                var _proc = tasks_wrapper.getAll()[i].proc;
                let complexity = tasks_wrapper.getComplexity(task);
                let power = procs_wrapper.getPower(procs_wrapper.getAll()[_proc-1]);
                var timeout = complexity / power;
                parallel_execution_promises.push(new Promise(proc_promise_func_maker(_proc, timeout, complexity)));
                ++i;
            }
            return parallel_execution_promises;
        }
        var scheduler_proc_promise_func_maker = function(proc_i, timeout, complexity) {
            return function(resolve, reject) {
                var t1 = setTimeout(() => {
                    used_power = (+used_power) + (+complexity);
                    setProcAsScheduling(proc_i);
                    var t2 = setTimeout(() => {
                        releaseTaskProc(proc_i);
                        resolve();
                    }, schedule_time);
                }, timeout);
            }; 
        }
        function makeParallelPromisesWithScheduleProc() {
            schedule();
            var parallel_execution_promises = [];
            var i = 0;
            for (var task of tasks_wrapper.getAll()) {
                if (task.getAttribute('class') != 'task-active') break;
                var _proc = tasks_wrapper.getAll()[i].proc;
                let complexity = tasks_wrapper.getComplexity(task);
                let power = procs_wrapper.getPower(procs_wrapper.getAll()[_proc-1]);
                var timeout = complexity / power;
                if (schedule_processors.indexOf(_proc) != -1) {
                    parallel_execution_promises.push(new Promise(scheduler_proc_promise_func_maker(_proc, timeout, complexity)));
                } else {
                    parallel_execution_promises.push(new Promise(proc_promise_func_maker(_proc, timeout, complexity)));
                }
                ++i;
            }
            return parallel_execution_promises;
        }
        
        var makeParallelPromises = app_mode == 3 ? makeParallelPromisesWithScheduleProc : makeParallelPromisesNoScheduleProc;
        
        async function runAll() {
            var task_probability = document.getElementById('prob').value;
            var work_finished = false;

            var work_time_secs = 10;
            (async() => setTimeout(() => {
                work_finished = true;
            }, work_time_secs * 1000))();

            async function runScheduled() {
                var parallel_execution_promises = makeParallelPromises();
                for (var p of parallel_execution_promises) {
                    await p;
                    removeFirstTask();
                };
                return Promise.resolve();
            }

            async function runCurrentTasks() {
                await runScheduled();
                if (!work_finished) {
                    if (tasks_wrapper.getAll().length == 0) {
                        var added = false;
                        var interval = setInterval(async() => {
                            if (Math.random() < task_probability) {
                                tasks_wrapper.create(1);
                                clearInterval(interval);
                                if (!work_finished) {
                                    await runCurrentTasks();
                                }
                            }
                            //console.log(work_finished);
                        }, 1);
                    } else await runCurrentTasks();
                }
            }

            var task_creator = (async() => setTimeout(function addTask() {
                if (!work_finished) {
                    if (Math.random() < task_probability) {
                        tasks_wrapper.create(1);
                    }
                    setTimeout(addTask, 1);
                }
            }, 1))();

            await runCurrentTasks();
            await task_creator;
        }
        async function _runTimes(n) {
            tasks_wrapper.initCheckBoxes();
            await runAll();
            tasks_wrapper.clearAll();
            for (var i = 1; i < n; ++i) {
                tasks_wrapper.create(10);
                await runAll();
                tasks_wrapper.clearAll();
            }
            let average_used_power = used_power / n;
            alert('Використано потужності: '+used_power
                +'\nСередня використана потужність: '+average_used_power
                +'\nДоступно: '+full_power
                +"\nККД = "+(100*average_used_power/full_power)
                +"%\nККД' = "+(100*average_used_power/full_power)
                +'%');
        }
        return {
            run: () => runAll(),
            runTimes: (n) => _runTimes(n)
        };
    };
})();



    var tasks_id = 'task-column';
    var processors_id = 'proc-column';
    var processors = ProcessorsWrapper(processors_id);
    processors.create(5);
    var tasks = TasksWrapper(tasks_id, processors);
    tasks.init(10, 'all-checked');
    var model = ParallelExecutionModel(tasks, processors);
 document.getElementById("run").addEventListener("click", () => {

//   //  //////  //////   //////
//   //  //      //  //   //
///////  /////   /////    /////
//   //  //      //  //   // 
//   //  //////  //   //  //////

     app_mode = document.getElementById('menu').value;

//   //  //////  //////   //////
//   //  //      //  //   //
///////  /////   /////    /////
//   //  //      //  //   // 
//   //  //////  //   //  //////
     if (app_mode != 1) {
         var c = 1;
         schedule_processors = [];
         for (var proc of processors.getAll()) {
             if (processors.getPower(proc) <= 0) {
                 schedule_processors.push(c);
                 if (app_mode == 2) {
                     proc.setAttribute('class', 'proc-wait');
                 }
             }
             ++c;
         }
     }
     model.runTimes(1);
 });