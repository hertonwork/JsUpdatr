'use strict';
class JsUpdatr {
    constructor() {
        this.activeAction = null;
    }
    static destroyInstance() {
        if (JsUpdatr.instance) {
            delete JsUpdatr.instance;
        }
    }
    static getInstance() {
        if (!JsUpdatr.instance) {
            JsUpdatr.instance = new JsUpdatr();
        }
        return JsUpdatr.instance;
    }
    static getActiveAction() {
        const instance = JsUpdatr.getInstance();
        return instance.activeAction;
    }
    static setActiveAction(action) {
        const instance = JsUpdatr.getInstance();
        instance.activeAction = action;
    }
    static resetActiveAction() {
        const instance = JsUpdatr.getInstance();
        instance.activeAction = null;
    }
    static run(update) {
        function wrappedUpdate() {
            JsUpdatr.setActiveAction(wrappedUpdate);
            update();
            JsUpdatr.resetActiveAction();
        }
        wrappedUpdate();
    }
    static observe(state) {
        Object.keys(state).forEach(prop => {
            let internal = state[prop];
            const dep = new Depend();
            Object.defineProperty(state, prop, {
                get() {
                    dep.depend();
                    return internal;
                },
                set(newVal) {
                    const changed = (internal !== newVal);
                    internal = newVal;
                    if (changed)
                        dep.envoke();
                }
            });
        });
        return state;
    }
}
class Depend {
    constructor() {
        this.actions = new Set();
    }
    depend() {
        this.actions.add(JsUpdatr.getActiveAction());
    }
    envoke() {
        this.actions.forEach(action => {
            if (action)
                action();
        });
    }
}
export { JsUpdatr };
//# sourceMappingURL=index.js.map