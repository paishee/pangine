var { ws } = require('../../../../index.js');

const { Soup } = require('stews');
const Player = require('./Player.js');
const CoolError = require('./CoolError.js');
const ID = require('./ID.js');


class Lobby {
    constructor(parent, ctx=null, settings={ playerValues:{}, values:{}, idLength:4 }) {

		if (!settings.playerValues) settings.playerValues = {};
		if (!settings.values) settings.values = {};
		if (!settings.idLength) settings.idLength = 4;
        if (!ctx) ctx = ws.ctx;

		
        this.parent = parent
        this.players = new Soup(Object);
		this.playerValues = Soup.from(settings.playerValues);
		this.id = new ID(settings.idLength)();
		this.values = new Soup(settings.values);
		this.ctx = ctx;
		this.home = null;

		
        var self = this;

		
		var locked = false
		Object.defineProperty(this, "locked", {
			get() { 
				return locked;
			},
			set(to) {
				locked = to;
				
				if (to == true) parent.events.lockLobby.fire(self);
				else if (to == false) parent.events.unlockLobby.fire(self);
			}
		});

		
        this.Player = new Proxy( class Player {
            constructor(user) {
				if (self.locked) throw new CoolError("Lobby Locked", "Player attempted to join a locked lobby.");
                
				let player = new Player(self, ...Array.from(arguments));
				self.players.push(user.id, player);
				parent.events.playerJoin.fire(player, self);
				return player;
			}
		}, {
			set(target, prop, value) {
				target[prop] = value;
				parent.events.updatePlayer.fire(prop, self);
			}
		});

		
		this.Value = new Proxy( class Value {
            constructor(name, content) {
                self.values.push(name, content)
                parent.events.createLobbyValue.fire(self.values[name], self);
                
                return self.values[name];
        	}
		}, {
			set(target, prop, value) {
				target[prop] = value;
				parent.events.updateLobbyValue.fire(prop, target, self);
			}
		});

		
		this.PlayerValue = new Proxy( class PlayerValue {
            constructor(name, content) {
                self.playerValues.push(name, content)

				self.players.forEach( (k, v) => {
					if (!v.values.has(name)) v.push(name, content);
				});
				
                parent.events.createMultiPlayerValue.fire(self.PlayerValues[name], self);
                
                return self.playerValues[name];
        	}
		}, {
			set(target, prop, value) {
				target[prop] = value;
				parent.events.updateMultiPlayerValue.fire(prop, target, self);
			}
		});


		this.Signal = class Signal {
			constructor(name) {
				this.name = name
				parent.events.createSignal.fire(this, lobby);
			}

			throw() {
				parent.signals.push(this.name, Array.from(arguments));
				parent.events.throwSignal.fire(this, lobby);
			}

			catch() {
				let content = parent.signals.get(this.name);
				parent.events.catchSignal.fire(this, content, lobby);
				parent.signals.delete(this.name);
				return content;
			}
		}

		
		let host = (ctx.author) ? ctx.author : ctx.user;
		this.host = new this.Player(host);

		
		return new Proxy(this, {
			get(target, prop) {
				if (target.values.has(prop)) return target.values.get(prop);
				else return target[prop];
			},

			set(target, prop, value) {
				if (target.values.has(prop)) return target.values.set(prop, value);
				else return target[prop] = value;
			},

			delete(target, prop) {
				if (target.values.has(prop)) return target.values.delete(prop);
				else return delete target[prop];
			}
		});
    }

	close() {
		this.parent.lobbies.delete(this.id);
	}

	
	lock() {
		this.lock = true;
	}

		
	unlock() {
		this.lock = false;
	}
	
}


// Function Maker
class LobbyFunctionMaker {
    constructor(name, func) {
        var stuff = (func instanceof Function) ? func : function() { return func; }

        Object.defineProperty(stuff, "name", { value: name });
        Object.defineProperty( Lobby.prototype, name, { value: stuff });

        return stuff;
    }
}


Object.defineProperties(Lobby, {
    "Function": { value: LobbyFunctionMaker }, "function": { value: LobbyFunctionMaker },
    "Func": { value: LobbyFunctionMaker }, "func": { value: LobbyFunctionMaker}
});



// Property Maker
class LobbyPropertyMaker {
    constructor(name, value, attributes={set:undefined, enumerable:false, configurable:false}) {
        var func = (value instanceof Function) ? value : function() { return value; };
        
        Object.defineProperty(func, "name", { value: name });
        Object.defineProperty(Lobby.prototype, name, {
            get: func,
            set: attributes.set,
            enumerable: attributes.enumerable,
            configurable: attributes.configurable
        });

        return func;
    }
}


Object.defineProperties(Lobby, {
    "Property": { value: LobbyPropertyMaker }, "property": { value: LobbyPropertyMaker },
    "Prop": { value: LobbyPropertyMaker }, "prop": { value: LobbyPropertyMaker }
});


module.exports = Lobby
