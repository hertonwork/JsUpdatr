'use strict';

/**
 * Singleton Class that will keep track of the active function
 * 
 * We need the singleton instance of this to keep track of a function running
 * in order to add it as an action on a list of actions in Depend class
 * 
 * We use the observe method to intercept each property of the state
 */
class JsUpdatr {
    private static instance?: JsUpdatr;
    private activeAction: Function | null;

    constructor() {
        this.activeAction = null;
    }

    public static destroyInstance(): void {
        if (JsUpdatr.instance) {
            delete JsUpdatr.instance;
        }
    }

    public static getInstance(): JsUpdatr {
        if (!JsUpdatr.instance) {
            JsUpdatr.instance = new JsUpdatr();
        }

        return JsUpdatr.instance;
    }

    public static getActiveAction(): Function | null {
        const instance = JsUpdatr.getInstance();
        return instance.activeAction;
    }

    public static setActiveAction(action: Function): void {
        const instance = JsUpdatr.getInstance();
        instance.activeAction = action;
    }

    public static resetActiveAction(): void {
        const instance = JsUpdatr.getInstance();
        instance.activeAction = null;
    }

    public static run(update: Function): void {
        function wrappedUpdate() {
            JsUpdatr.setActiveAction(wrappedUpdate);
            update();
            JsUpdatr.resetActiveAction();
        }
        wrappedUpdate();
    }

    public static observe(state: Object): Object {
        Object.keys(state).forEach(prop => {
            let internal = state[prop];
            const dep = new Depend();
            Object.defineProperty(state, prop, {
                get() {
                    dep.depend()
                    return internal
                },
                set(newVal) {
                    const changed = (internal !== newVal);
                    internal = newVal;
                    if (changed) dep.envoke()
                }
            })
        })

        return state;
    }
}

/**
 * Depend Class is used to keep track of actions
 * 
 * When we try to access an attrbute from the watched instance
 * we keep track of the actions to run/envoke them when there is a change
 */
class Depend {
    actions: Set<Function | null>;

    constructor() {
        this.actions = new Set();
    }

    depend(): void {
        this.actions.add(JsUpdatr.getActiveAction());
    }

    envoke(): void {
        this.actions.forEach(action => {
            if (action) action();
        });
    }
}

export {
    JsUpdatr
};