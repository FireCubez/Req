# reqpack

reqpack is a command-line utility to pack files that use Req.

# Installation

```sh
$ npm install @firecubez/reqpack -g
```

# Usage

Your source directory should have files that look like this:

```js
Req.module(...)
```

No requiring `Req`, just a module declaration.

Then, to bundle everything up, run the following:

```sh
$ reqpack ./sourceDir bundled.js
```

The output file has a dependency on Req, so make sure to supply it.

# Note
---
This is one of the only ways to actually use Req in a *useful* manner without having a single source file (which defeats the purpose). Since each time you `require("@firecubez/req")`, you load a *different* instance which doesn't have any modules from before.

This can be fixed by accessing the internal module storage (`Req.module.__modules__`) which is discouraged, or using reqpack.