const Req = {};
function Definer() {
	this.__dependencies__ = [];
};

Definer.prototype.depend = function(...a) {
	if(a.length === 1) {
		this.__dependencies__.push({
			"type": 0, "name": a[0]
		});
	} else {
		this.__dependencies__.push({
			"type": 1,
			"name":      a[0],
			"desc":      a[1],
			"interface": a[2],
			"def":       a[3] || a[0]
		});
	}
	return this;
};

function Giver(deps, impls) {
	this.__impls__ = Object.create(null);
	deps.forEach(e => {
		let impl;
		if(!(e.name in impls)) {
			if(e.name in Req.module.__modules__) {
				impl = Req.module.__modules__[e.name];
			} else if(e.def in Req.module.__modules__) {
				impl = Req.module.__modules__[e.def];
			} else {
				throw new Error("Module not found: " + e.name + (e.desc ? " (" + e.desc + ")" : ""));
			}
		} else {
			impl = impls[e.name];
		}
		if(e.interface) {
			let called = impl();
			Object.keys(e.interface).forEach(key => {
				if(!key in called) {
					throw new Error("Property `" + key + "` not implemented in module `" + e.name + "`");
				} else if(!e.interface[key](called[key])) {
					throw new Error("Implementation failed test for property `" + key + "` in module `" + e.name + "`");
				}
			});
		}
		this.__impls__[e.name] = impl;
	});
}

Giver.prototype.get = function(name) {
	if(!(name in this.__impls__)) throw new Error("Module not found: " + name);
	return this.__impls__[name];
}

Req.module = function(name, definerFunc, runner) {
	var mod = Req.anonymousModule(definerFunc, runner);
	Req.module.__modules__[name] = mod;
	return mod;
}

Req.anonymousModule = function(definerFunc, runner) {
	var definer = new Definer();
	if(typeof definerFunc === "function") {
		definerFunc(definer);
	}
	return function(impls = {}) {
		var giver = new Giver(definer.__dependencies__, impls);
		return runner(giver);
	};
}

Req.module.__modules__ = Object.create(null);

module.exports = exports = Req;