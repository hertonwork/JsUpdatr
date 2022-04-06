'use strict';

/**
 * Singleton Class that will keep track of the active function
 * 
 * We need the singleton instance of this to keep track of a function running
 * in order to add it as an action on a list of actions in Depend class
 * 
 * We use the observe method to intercept each property of the state
 */
class Watcher {
    private static instance: Watcher;
    private activeAction: Function | null;

    constructor() {
        this.activeAction = null;
    }

    public static getInstance(): Watcher {
        if (!Watcher.instance) {
            Watcher.instance = new Watcher();
        }

        return Watcher.instance;
    }

    public static getActiveAction(): Function | null {
        const instance = Watcher.getInstance();
        return instance.activeAction;
    }

    public static setActiveAction(action: Function): void {
        const instance = Watcher.getInstance();
        instance.activeAction = action;
    }

    public static resetActiveAction(): void {
        const instance = Watcher.getInstance();
        instance.activeAction = null;
    }

    public static run(update: Function): void {
        function wrappedUpdate() {
            Watcher.setActiveAction(wrappedUpdate);
            update();
            Watcher.resetActiveAction();
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
        this.actions.add(Watcher.getActiveAction());
    }

    envoke(): void {
        this.actions.forEach(action => {
            if (action) action();
        });
    }
}

export {
    Watcher
};