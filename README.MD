# HTML String Template Virtual DOM

A Virtual DOM library which is based on HTML string template.

## Install

```
npm install --save hst-virtual-dom
```

Or use in browser directly:

```
<script src="dist/VirtualDOM.browser.js"></script>
<script>
window['VirtualDOM'] = window['VirtualDOM']['default']
</script>
```

## Usage


```
import VirtualDOM from 'hst-virtual-dom'

let vdom = new VirtualDOM({
  template: `
    <div id="{id}">
      <p>{text}</p>
      <p><a href="javascript:" onclick="{click}">click me to refresh content</a></p>
      <p><input onkeyup="{input}" value=""></p>
      <ul>
        <foreach data="{cats}" key="name" value="color">
          <li>{name}'s color is {color}</li>
        </foreach>
      </ul>
      <if condition="{isShow}">
        <p>this will be show.</p>
      </if>
      <p><a href="javascript:" onclick="{toggle}">toggle</a></p>
    </div>
  `,
  state: {
    id: 'my-test',
    text: 'this is my first VirtualDOM demo.',
    cats: {
      caf: 'red',
      sam: 'yellow',
    },
    isShow: true,
  },
  methods: {
    input(e) {
      e.target.value = 'xxx'
    },
    click(e) {
      e.preventDefault()
      this.update({
        text: 'this is new content ' + Date.now(),
      })
    },
    toggle(e) {
      e.preventDefault()
      this.update({
        isShow: !vdom.state.isShow,
      })
    },
  },
  selector: '#app',
})
```

## Options

When you use `new` to initialize a vdom, you should pass options:

### template

HTML string template. Support interpolations.

### state

`state` option is used to be rendered for interpolation. Almost data types are supported, even object and array.

```
{
  template: `<foreach data={cats} key="name" value="age">{name} {age}</foreach>`,
  state: {
    cats: { 
      tom: 3,
      lily: 5,
    },
  },
}
```

Here `cats` is an object which is passed into `foreach`'s `data` attribute.

### methods

Functions. 

`this` in methods functions are point to the VirtualDOM instance.

NOTICE: state properties and method properties will be used in template's interpolations. So you should make every property name unique in the whole scope.

### directives

*optional*

Directive defination functions. 

`this` in directives defination functions are point to the VirtualDOM instance. 

Read more in *Directives*.

### selector

*optional*

DOM element container, the element which vdom mounts to.

If you do not give selector, you may want to create a virtual dom instance step by step:

```
let vdom = new VirtualDOM({ template, state })
vdom.create() // notice: you should run .create by your self.
vdom.mount('#app') // look here, you pass selector to .mount method
vdom.update({ name: 'xxx' })
vdom.destroy()
```

## Interpolation

Use `{value}` in template string, `value` is the property name of `state` or `methods`, as mentioned, all types of data supported, even functions.
However, data in `state` should not be function. Properties of `methods` should be function so that `this` can be used in `methods`.

Simple JS expression is supported, i.e.

```
{ a + 1 }
```

But it is not recommended. We use `Function` which use `eval` to implement this, so there may be some security problem. The best practice in interpolations is use single words, like `{age}` `{name}`, this is the best way. You may have impulse to use `{user.name}` `{books[0].count}`, it is ok, but not recommend because of security issues. To implement this, you should use `foreach` directive instead. 

Interpolation can only be used in textNode or tag attribute value. Tag name, JS complex expression are not supported. And to be more like React, you can do like this:

```
<a href={link} onClick={onClick}>{text}</a>
```

Which has no space in interpolations. Double quotes should always be there if there are some spaces in interpolations.

## Directives

**What's a directive?**

A directive is a angular-directive-like html tag in html string template. For example, `<my-directive></my-directive>`.

**How to define a directive?**

You can define a directive in `options.directives`. For example:

```
let vdom = new VirtualDOM({
  template: `
    <my-directive></my-directive>
  `,
  directives: {
    'my-directive': function(vnode) {
      // defination code...
      // must return a vtree
    },
  },
})
```

## defination function

Defination function is a function which define the directive's behavior. 

It has only one parameter: `vnode`.

```
// person.js
import { createVirtualDOM } from 'hst-virtual-dom'
export default function(vnode) {
  let { attrs } = vnode
  let { name, age } = attrs
  let { vtree } = createVirtualDOM({
    template: `
      <div class="my-container">
        <div>{name} {age}</div>
      </div>
    `,
  })
  // here I use createVirtualDOM helper to get a vtree quickly
  return vtree
}
```

```
import personCreator from './person'
let vdom = new VirtualDOM({
  template: `
    <person name="tom" age="12"></person>
  `,
  directives: {
    'person': personCreator,
  },
})
```

*@return*

The function must return an array which is made up with vtree.
If you want to know more about this, you can read the source code of `foreach` directive.

## default directives

Now we have 3 default directives, `for` `foreach` and `if`.

### for

```
<for start="1" end="10" current="i">{i}</for>
```

With this code, it will print [1-10] numbers in screen.

If start is bigger then end, for example start="10" end="1", the loop will start from 10 to 1.

### foreach

```
<foreach data="{items}" key="i" value="v">
  {i} => {v}
</foreach>
```

`items` is a property of `data`. It can be an array or an object.

### if...else

```
<if condition="{ a < b }">
  <span>show</span>
<else />
  <span>hide</span>
</if>
```

Notice `/` in else tag.

Condition attribute can contains interpolations and string, i.e.

```
<if condition="{a} < 2"></if>
```

## Properties and Methods

After a instance created, you can get these properties and methods from it:

### vtree

An array. The VNodes Tree (which is the same structure as DOM structure) of this instance.

### vnodes

Flat structure VNodes list. All VNodes are in this array. You can use `Array.prototype.filter` method to pick out what you want.

It is easy to find out some nodes which has certain class:

```
let mynodes = vdom.vnodes.filter(vnode => Array.isArray(vnode.class) && vnode.class.indexOf('my-className') > -1)
let myelements = mynodes.map(vnode => vnode.$dom)
```

### create()

Create virtual dom in memory. after `.create()`, this.vtree and this.vnodes exist.

### mount(selector)

Create true DOM nodes in document.

NOTICE: if you have passed selector in constructor, `.create()` and `.mount(selector)` are auto run.

### update(state)

Use new state to update view. The `state` will be merged into old state.

In fact, you can use new template to re-render, like:

```
vdom.template = 'my new tempalte: <div>{text}</div>'
vdom.update()
```

### destroy()

Destroy real DOM elements in document. 
Remember: instance will not be destroyed.

## Development

If you want to modify the source code and build for browser using, you can run `npm run build` after you modify.

## MIT License

Copyright 2017 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.