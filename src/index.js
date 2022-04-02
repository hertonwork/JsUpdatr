
// watcher Object that will be used to get the current function
// All we need to do is run the code as a param for watcher.run()
const watcher = (function () {
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

function Depend() {
    this.deps = new Set();
}

Depend.prototype = {
    depend: function () {
        if (watcher.activeFunction) {
            this.deps.add(watcher.activeFunction);
        }
    },
    notify: function () {
        this.deps.forEach(callBack => callBack());
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

export {
    watcher,
    observe
};