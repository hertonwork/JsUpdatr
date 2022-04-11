import tap from 'tap';
import { JsUpdatr } from '../dist/index.js'

tap.test('testing JsUpdatr', tap => {
    const state = {
        name: 'bob',
        age: 22
    }
    const result = {};
    JsUpdatr.observe(state);
    JsUpdatr.run(() => {
        result['string'] = state.name;
    })
    state.name = 'jorge'
    tap.equal(state.name, result.string)

    JsUpdatr.run(() => {
        result['number'] = state.age;
    })
    tap.equal(state.age, result.number)
    tap.end()
})