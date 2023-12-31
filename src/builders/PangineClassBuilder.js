function PangineClassBuilder(c) {
	
	// Function Maker
	class PangineFunctionMaker {
    	constructor(name, func) {
	        var stuff = (func instanceof Function) ? func : function() { return func; }
	
	        Object.defineProperty(stuff, "name", { value: name });
	        Object.defineProperty( c.prototype, name, { value: stuff });
	
	        return stuff;
	    }
	}

	
	// Property Maker
	class PanginePropertyMaker {
	    constructor(name, value, attributes={set:undefined, enumerable:false, configurable:false}) {
	        var func = (value instanceof Function) ? value : function() { return value; };
	        
	        Object.defineProperty(func, "name", { value: name });
	        Object.defineProperty(c.prototype, name, {
	            get: func,
	            set: attributes.set,
	            enumerable: attributes.enumerable,
	            configurable: attributes.configurable
	        });
	
	        return func;
	    }
	}


	// Class Maker
	class PangineClassMaker {
	    constructor(name, value) {
	        var cl = PangineClassBuilder(
				(value instanceof Function) ? value : class { constructor() { return value; } } 
			);

	        Object.defineProperty(cl, "name", { value: name });
	        Object.defineProperty(c.prototype, name, { 
				get() {
					cl.prototype.parent = this;
					return cl;
				}
			});
	
	        return cl;
	    }
	}

	
	Object.defineProperties(c, {
	    "Function": { value: PangineFunctionMaker }, "function": { value: PangineFunctionMaker },
	    "Func": { value: PangineFunctionMaker }, "func": { value: PangineFunctionMaker}
	});


	Object.defineProperties(c, {
	    "Property": { value: PanginePropertyMaker }, "property": { value: PanginePropertyMaker },
	    "Prop": { value: PanginePropertyMaker }, "prop": { value: PanginePropertyMaker }
	});


	Object.defineProperties(c, {
	    "Class": { value: PangineClassMaker }, "class": { value: PangineClassMaker }
	});

	
	return c;
}


module.exports = PangineClassBuilder;
