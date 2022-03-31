
// watcher Object that will be used to get the current function
// All we need to do is run the code as a param for watcher.run()
const watcher = (function() {
    return {
        run(update) {
            function wrappedUpdate() {
                watcher.activeFunction = wrappedUpdate;
                update();
                watcher.activeFunction = null;
            }
            wrappedUpdate();
        },
        activeFunction: null
    }
})()

class Depend {
    constructor() {
        this.deps = new Set();
    }
    depend() {
        if (watcher.activeFunction) {
            this.deps.add(watcher.activeFunction);
        }
    }
    notify() {
        this.deps.forEach(func => func());
    }
}

function observe(obj) {
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

export default {
    watcher,
    observe
};