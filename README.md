# Req
A package manager to eliminate the need for recursive dependencies, and allow for flexibility with dependencies

# Installation

```sh
$ npm install @firecubez/req
```

# Usage

```js
const Req = require("@firecubez/req");
Req.module("hello", null, $$ => {
  return {string: "Hello, world!\n"};
})

Req.module("helloname", $$ =>
  $$.depend(
    "hello",
    "a module which provides 'Hello, world!'"
  ),
  $$ => {
    const hello = $$.get("hello", {});
    return {
      withname: name => hello.string + name
    }
  })

const main = Req.module("main", $$ =>
  $$.depend(
    "helloname",
    "a module which puts names next to 'Hello, world!'",
    {
      withname: f => typeof f === "function"
    }
  ),
  $$ => {
    // ...
  }
)
```

Here's where it gets interesting. For the function:

```js
$$ => {
  const helloname = $$.get("helloname", {})
  helloname.withname("Req")
}

// ...

main()
// > Hello, world!
//   Req
```

As expected, but:

```js
$$ => {
  const helloname = $$.get("helloname", {
    hello: {
      string: "Hey there "
    }
  })
  helloname.withname("Req")
}

// ...

main()
// > Hey there Req
```

## What happened?

We have overridden the `hello` dependency of `helloname` in the second example with a "mock" dependency. This can be useful when creating tests.

# API

## Req

The `Req` object exposes 4 methods:

* `get(name)`: Get a module by its name using the following procedure:
  - Check the internal module storage for the module.
  - If not found, check if the module exists using Node's `require`.
  **Returns:** The found module
  **Throws:** If the module isn't found.
* `module(name, definerFunc, runner)`: Create a named module and save it in the internal module storage.
  **Parameters:**
  - `name`: The module name
  - `definerFunc`: A function which takes a `Definer` and calls it's `depend` method.
  - `runner`: A function which takes a `Giver` and runs the module code, returning the exports
  **Returns:** The newly created module
* `anonymousModule(definerFunc, runner)`: Same as `module`, but does not save in internal storage since no name is provided
* `deprecate(mod, func[, repl])`: Deprecate a module
  **Parameters:**
  - `mod`: The module to deprecate
  - `func`: A function which is called when it is attempted to use the deprecated method. It should return a warning message to be printed by Req (configurable by setting `Req.warn` function)
  - `repl`: The module to use instead of this module (can be a name or the module itself)

## Definer

A definer object is passed to `Req.module` / `req.anonymousModule` for modules to declare dependencies

* `depend(name[, desc[, interface[, def]]])`: Declares a dependency.
  **Parameters:**
  - `name`: The dependency name to be referenced in `Giver.get`
  - `desc`: A description method for detail in error messages
  - `interface`: Asserts, at `Giver.get` time, that the dependency exposes certain properties. For each property in `interface`:
    + It must be a function
    + If the dependency doesn't expose a property of the same name, an error is thrown
    + The function is run on the dependency's property of the same name. If it returns false, an error is thrown
  - `def`: A fallback dependency to be used if a dependency of the specified name isn't found. The dependency is still accessible with `Giver.get` under the same name as specified in the first argument.
  **Returns:** `this` (for chaining)

## Giver

A giver object is passed to `Req.module` / `req.anonymousModule` for modules to use their dependencies

* `get(name)`: Get a dependency module using the following procedure:
  - Check if the module `get`ing this module overwrote the specified name
  - If not, check the current module's dependencies
  - If not there, check the dependencies for the *default* module name specified in `Definer.depend`
  - If not there, check the internal module storage for the specified and default name
  - If not there, check with Node's `require` for both the specified and default name
  - If not there, throw an error
  **Returns:** The actual module with the specified name (NOT the object it returns). Will always be a function with `__Is_Req_Module__ === true`
  **Throws:** If the dependency doesn't exist
* `get(name, impl)`: Get a dependency's exposed properties / return value
  **Returns:** The dependency's return value with `impl` containing overridden dependencies.
  **Throws:** If the dependency with the specified name doesn't exist or`impl` does not pass the tests described in `Definer.depend`
  **Alias for:** `get(name)(impl)`

## Module

A module is a function with the `__Is_Req_Module__` property set to `true`.

A module exposes the following properties:

* `internal __Is_Req_Module__`: `true`. Can be used to detect whether a function is a module or not
* `internal __Req_Deprecate__`: A function that is called when this module is used. Most of the time you don't want to touch this
* `internal __Req_Deprecate_Target__`: The new version of this module that isn't deprecated. You also don't want to touch this
* `moduleName`: The name of the module, `null` if it is an anonymous module