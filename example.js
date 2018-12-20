const Req = require("./index.js");

Req.module("hello", null, $ => {
	return "Hello!"; // Simple module that supplies "Hello!" string
})

var main = Req.module("main", $ => $.depend("hello"), $ => {
	var hello = $.get("hello")() // Get "Hello!" string from module
	console.log(hello);
})

main();

// Example 2. Interfaces

Req.module("helloPrinter", $ => $.depend(
	"helloStringer",
	"Supplies a string of value 'Hello!'",
	{
		getHelloString: fn => fn() === "Hello!"
			// If the function returns Hello, it's a correct implementation
	}), $ => {

	var hs = $.get("helloStringer")();
	console.log(hs.getHelloString());
})

Req.module("main2", $ => $.depend("helloPrinter"), $ => {
	// Since there is no module called "helloStringer",
	// the dependant must supply it's own implementation.
	$.get("helloPrinter")({
		helloStringer: Req.anonymousModule(null, $ => {
			return {
				getHelloString: () => "Hello!"
			};
		})
	})
})(); // run module