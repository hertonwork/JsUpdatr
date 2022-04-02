## Updatr Js simple Observer

This is a very simple observer that can be used to bind an input value to an element anywhere on the DOM.


```html
// Example Usage
<script type="module">
    import { watcher, observe } from 'https://cdn.jsdelivr.net/gh/hertonwork/updatr@v1/src/index.min.js'
    // As an example, let's say we have an object coming from the backend and set as state
    observe(document.state)
    // Query all elements with the attribute called h.
    // For example <dd h="text"></dd>
    // The attribute value is the key of the attribute we wanna watch and show on the page
    document.querySelectorAll('[h]').forEach(element => {
        watcher.run(() => {
            element.textContent = document.state[element.attributes.h.value];
        })
    })
    // Allowing model to change the data will trigger the event and update whoever is watching it
    // For example <input id="test" type="text" name="test" data-model="text">
    document.querySelectorAll('[data-model]').forEach(element => {
        element.value = document.state[element.dataset.model];
        element.addEventListener('input', () => {
            document.state[element.dataset.model] = element.value;
        });
    })
</script>
```

### Support or Contact

Check out our [documentation](https://github.com/hertonwork/updatr#readme) 

## License

[MPL-2.0](https://opensource.org/licenses/MPL-2.0)
