
'use strict'

let LimitedDisplayList = (() => {
    // static things

    function _init(create_info) {
        
    }

    return {
        make: _init
    };
})();

let wrapper_name = '';
let wrapper_element = document.getElementById(wrapper_name);

let create_callable = (() => {

});

let make_inactive = ((element_number=0) => {

});

let add_next = (() => {

});

let tasks_list = LimitedDisplayList.make({
    visible_items_count: 10,
    wrapper_element: wrapper_element,
    make_inactive: make_inactive,
    create_callable: create_callable
});



let timeouts = [1,2,3,4,5];



