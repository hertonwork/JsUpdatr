
// watcher 
// 


/**
 * @typedef {Object} - Object that will be used to get the current function
 * @property {function} activeFunction - an active function that will be trying to access a property
 * @function {function} run - All we need to do is run the code as a param for watcher.run()
 */
const watcher: {
    activeFunction: Function | null,
    run: Function
} = (function () {
    return {
        activeFunction: null,
        run(update: Function) {
            function wrappedUpdate() {
                watcher.activeFunction = wrappedUpdate;
                update();
                watcher.activeFunction = null;
            }
            wrappedUpdate();
        }
    }
})()

class Depend {
    deps: Set<Function | null>;

    constructor() {
        this.deps = new Set();
    }

    depend() {
        this.deps.add(watcher.activeFunction);
    }

    notify() {
        this.deps.forEach(callBack => {
            if (callBack) callBack();
        });
    }
}


function observer(obj: object) {
    Object.keys(obj).forEach(prop => {
        let internal = obj[prop];
        const dep = new Depend();
        Object.defineProperty(obj, prop, {
            get() {
                dep.depend()
                return internal
            },
            set(newVal) {
                const changed = (internal !== newVal);
                internal = newVal;
                if (changed) dep.notify()
            }
        })
    })
    return obj;
}

export {
    watcher,
    observer
};