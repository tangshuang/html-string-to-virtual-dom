# HTML String Template Virtual DOM

A Virtual DOM library which is based on HTML string template.

## Install

```
npm install --save hst-virtual-dom
```

## Usage

```
// ES6 module, npm package
import VirtualDOM from 'hst-virtual-dom'
```

```
// browser, window['VirtualDOM']
<script src="VirtualDOM.browser.js"></script>
```

```
let vdom = new VirtualDOM({
  template: `
    <div id="{{id}}">
      <p>{{text}}</p>
      <p><a href="javascript:" onclick="{{:click}}">click me to refresh content</a></p>
      <p><input onkeyup="{{:input}}" value=""></p>
      <ul>
        <@foreach target="cats" key="name" value="color">
          <li>{{name}}'s color is {{color}}</li>
        </@foreach>
      </ul>
      <@if condition="{{isShow}}">
        <p>this will be show.</p>
      </@if>
      <p><a href="javascript:" onclick="{{:toggle}}">toggle</a></p>
    </div>
  `,
  data: {
    id: 'my-test',
    text: 'this is my first VirtualDOM demo.',
    cats: {
      caf: 'red',
      sam: 'yellow',
    },
    isShow: true,
  },
  events: {
    input(e) {
      e.target.value = 'xxx'
    },
    click(e) {
      e.preventDefault()
      vdom.update({
        text: 'this is new content ' + Date.now(),
      })
    },
    toggle(e) {
      e.preventDefault()
      vdom.update({
        isShow: !vdom.data.isShow,
      })
    },
  },
  selector: '#app',
})
vdom.render()
```

## Options

When you use `new` to initialize a vdom, you should pass options:

### template

HTML string template.

#### Interpolation

Use `{{value}}` in template string, `value` is the property name of `data`, the value should be string or number.

#### Events Interpolation

Use `{{:eventHandler}}` in template string, `eventHandler` is the property name of `events`, the value should be a function.

#### \@foreach tag

I create a new tag whose name is `@foreach`, like:

```
<@foreach target="myObj" key="i" value="v">...</@foreach>
```

**target**

The property name of `data`. The property value can be array or object. If array key will be index, if object key will be property name.

**key**

The interpolation name inner. As you know, `Array.forEach((v, i) => {})`, `i` and `v` is dynamic values, you can use `{{i}}` and `{{v}}` in the tag.

**value**

The same usage with `key`, stands for value.

#### \@if

`@if` tag is a special tag which control the content to be show in dom.

```
<@if condition="1 < 2">
  <span>show</span>
</@if>
```

**condition**

The condition to be use. There can be interpolations in condition. ie. `condition="{{a}} > {{b}}"`.

### data

`data` option is used to be rendered for interpolation.
