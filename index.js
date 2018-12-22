const Req = {};
function Definer() {
	this.__dependencies__ = [];
}

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
				let r;
				try {
					r = require(e.name);
				} catch(err) {
					if(!err.message.startsWith("Cannot find module")) {
						throw new Error("An error occured while loading " + e.name + ":" + err.toString());
					}
					else {
						try {
							r = require(e.def);
						} catch(err2) {
							if(!err2.message.startsWith("Cannot find module")) {
								throw new Error("An error occured while loading " + e.name + ":" + err2.toString());
							} else {
								throw new Error("Module not found: " + e.name + (e.desc ? " (" + e.desc + ")" : ""));
							}
						}
					}
				}
				impl = r.__Is_Req_Module__ ? r : Req.anonymousModule(null, () => r);
			}
		} else {
			impl = impls[e.name];
		}
		if(e.interface) {
			let called = impl();
			Object.keys(e.interface).forEach(key => {
				if(!(key in called)) {
					throw new Error("Property `" + key + "` not implemented in module `" + e.name + "`");
				} else if(!e.interface[key](called[key])) {
					throw new Error("Implementation failed test for property `" + key + "` in module `" + e.name + "`");
				}
			});
		}
		this.__impls__[e.name] = impl;
	});
}

Giver.prototype.get = function(name, deps) {
	if(!(name in this.__impls__)) throw new Error("Module not found: " + name);
	var impl = this.__impls__[name];
	if(impl.__Req_Deprecate__) {
		Req.warn(name, impl.__Req_Deprecate__());
		let t = impl.__Req_Deprecate_Target__;
		if(t) {
			if(typeof t === "string") impl = Req.get(t);
			else impl = t;
		}
	}
	if(deps) return impl(deps);
	else return impl;
}

Req.get = function(name, deps) {
	var impl;
	if(name in Req.module.__modules__) impl = Req.module.__modules__[name];
	else {
		try {
			impl = require(name);
		} catch(err) {
			throw new Error("Module not found: " + name);
		}
	}
	if(impl.__Req_Deprecate__) {
		Req.warn(name, impl.__Req_Deprecate__());
		let t = impl.__Req_Deprecate_Target__;
		if(t) {
			if(typeof t === "string") impl = Req.get(t);
			else impl = t;
		}
	}
	if(deps) return impl(deps);
	else return impl;
}
Req.module = function(name, definerFunc, runner) {
	var mod = Req.anonymousModule(definerFunc, runner);
	mod.moduleName = name;
	Req.module.__modules__[name] = mod;
	return mod;
}

Req.anonymousModule = function(definerFunc, runner) {
	var definer = new Definer();
	if(typeof definerFunc === "function") {
		definerFunc(definer);
	}
	var m = function Module(impls = {}) {
		var giver = new Giver(definer.__dependencies__, impls);
		return runner(giver);
	};
	// Metadata
	m.__Is_Req_Module__ = true;
	m.moduleName = null;
	return m;
}

Req.deprecate = function(mod, func, repl) {
	mod.__Req_Deprecate__ = func;
	mod.__Req_Deprecate_Target__ = repl;
}

Req.warn = function(name, msg) {
	console.warn("Req: [WARN] " + name + ": " + msg);
}
Req.module.__modules__ = Object.create(null);

module.exports = exports = Req;