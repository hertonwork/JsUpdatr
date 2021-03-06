## JsUpdatr Js simple Observer

This is a very simple observer that can be used to bind an input value to an element anywhere on the DOM.


```html
// Example Usage
<script type="module">
    import { JsUpdatr } from 'https://cdn.jsdelivr.net/gh/hertonwork/jsUpdatr@v2/src/index.min.js';
    // As an example, let's say we have an object coming from the backend and set as state
    JsUpdatr.observe(document.state)
    const modelExist = (model) => document.state.hasOwnProperty(model);

    // Finding elements that will be used to control the data or "model"
    // Watch for user input on them and set the state
    document.querySelectorAll('[data-model]').forEach(element => {
        element.value = document.state[element.dataset.model];
        element.addEventListener('input', () => {
            document.state[element.dataset.model] = element.value;
        });
    })

    // Finding elements that will be used to show the data or "view" and add to the watch list
    document.querySelectorAll('[data-watch]').forEach(element => {
        if (modelExist(element.dataset.watch)) JsUpdatr.run(() => {
            element.textContent = document.state[element.dataset.watch];
        })
    })
    // Finding element attributes that will be set based on the model data and add to the watch list
    // Example: data-watch-attributes="smallest:min,largest:max" 
    // Where max and min are the attributes and smallest anj largest are the models
    document.querySelectorAll('[data-watch-attributes]').forEach(element => {
        let attributes = element.dataset.watchAttributes.split(',');
        attributes.forEach(attributesSet => {
            let [model, attribute] = attributesSet.split(':');
            if (modelExist(model) && attribute) {
                JsUpdatr.run(() => {
                    element.setAttribute(attribute, document.state[model]);
                })
            }
        });
    })
</script>
```

### Support or Contact

Check out our [example page](https://hertonwork.github.io/JsUpdatr) 

## License

[MPL-2.0](https://opensource.org/licenses/MPL-2.0)
