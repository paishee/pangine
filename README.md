# Pangine
<a href="https://www.npmjs.com/package/pangine"><img src="https://img.shields.io/npm/v/pangine?style=flat&color=red&logo=npm&logoColor=white" alt="version" />
<a href="https://www.npmjs.com/package/pangine"><img src="https://img.shields.io/npm/dt/pangine?style=flat&color=green&logo=docusign&logoColor=white" alt="downloads" />
<a href="https://npmjs.com/package/willclient"><img src="https://img.shields.io/badge/willclient-v1.0.1-blue?style=flat&color=blue&logo=discord&logoColor=white" alt="willclient"></a>
<a href="https://npmjs.com/package/stews"><img src="https://custom-icon-badges.demolab.com/badge/Stews-v1.8.0-orange.svg?logo=stew&logoColor=white" alt="stews"></a>
<img src="https://github.com/paigeroid/pangine/actions/workflows/publish-shit.yml/badge.svg" alt="publish">
  
Pangine is a Discord.JS multiplayer minigame framework using WillClient and Stews that includes built in:
- Lobby & player management
- Values & script signals
- Storage management
- Events

<br><br>

```console
npm i pangine
```
```console
npm i paigeroid/pangine
```

<br><br>


### Lobby & Player Management
Using Pangine in this command it creates a new lobby and sends an embed that says how many players are in the lobby
```js
// src/commands/create.js

var { wc } = require('path to index.js');
var { game } = wc.pangine.Instances;


// creates a refresh function for the embed
new game.Lobby.Function("refresh", function() {
	return new wc.Embed({
		title: "Untilted Game",
		description: `Use the command '\`/join ${this.id}\`' to join in the game`,

		fields: [
			{ name: "** **", value: "** **" },
			{ name: "Players", value: `- <@${this.players.join(">\n- <@")}>`},
			{ name: "** **", value: "** **" },
		],

		color: wc.colors.blurple,
		footer: `id: ${this.id}`
	});
});


// command that creates the lobby
wc.slashCommand("create", "creates a new lobby", async (ctx, cmd) => {
	let lobby = new game.Lobby(ctx);

	let embed = lobby.refresh();

	lobby.home = await ctx.reply({ embeds: [embed] });
});
```
In this command it lets players join the lobby
```js
// src/commands/join.js

var { wc } = require('path to index.js');
var { game } = wc.pangine.Instances;


let options = [{
	name: "id",
	description: "lobby id to join",
	required: true,
	type: "str"	
}];


wc.slashCommand({ name: "join", desc: "joins a lobby", options: options }, async (ctx, cmd) => {
	let id = cmd.args[0].value;

	if (!game.lobbies.has(id)) return wc.reply("There is no lobby with that ID", { ephemeral: true });
	let lobby = game.lobbies.get(id);

	if (lobby.players.has(ctx.author.id)) return wc.reply("You're already in that lobby", { ephemeral: true });
	new lobby.Player(ctx.author);

	let embed = lobby.refresh();

	lobby.home.edit({ embeds: [embed] });
});
```
In this command it lets players leave the lobby
```js
// src/commands/leave.js

var { wc } = require('path to index.js');
var { game } = wc.pangine.Instances;


let options = [{
	name: "id",
	description: "lobby id to leave",
	required: true,
	type: "str"
}];


wc.slashCommand({ name: "leave", desc: "leaves a lobby", options: options }, async (ctx, cmd) => {
	let id = cmd.args[0].value;

	if (!game.lobbies.has(id)) return wc.reply("There is no lobby with that ID", { ephemeral: true });
	let lobby = game.lobbies.get(id);

	if (!lobby.players.has(ctx.author.id)) return wc.reply("You're not in that lobby", { ephemeral: true });
	let player = lobby.players.get(ctx.author.id)

	player.leave();

	let embed = lobby.refresh();

	lobby.home.edit({ embeds: [embed] });
});
```

<br>

### Values
This example creates a new lobby with the starter player value for score as 0 and a lobby value for day also as 0.<br><br>

starter player values are values that are added to a player every time that a player is added to the lobby. <br>
lobby values are values that are values that are inside of the lobby
```js
let lobby = new game.Lobby(ctx, {
	starterPlayerValues: { // values that get created everytime a player is added to the lobby
		score: 0
	},

	values: { // values for the lobby
		day: 0
	}
});

console.log(lobby.day); // 0

lobby.day += 1;

console.log(lobby.day); // 1

lobby.players.forEach( (id, player) => {
	console.log(player.score); // 0
	console.log(player.values.score); // 0

	player.score += 1;

	console.log(player.score); // 1
});
```
You can also create values like this:
```js

new lobby.Value("name", content); // values in the lobby that can be called using lobby.name

new lobby.StarterPlayerValue("name", content); // new starter player value added to every new player that joins and can be called using player.name

new player.Value("name", content); // values in a single player that can be called using player.name
```

<br>

### Events
This event is called once a player joins a lobby
```js
// src/events/join.js

var { wc } = require('path to index.js');
var { game } = wc.pangine.Instances;

game.on("playerJoin", (player, lobby) => {
	console.log(`${player.user.username} joined lobby ${lobby.id}`);
});
```

<br>

### Script Signals
Script signals are signals that can be thrown and caught between different places. Once a signal is caught it'll delete from storage.
```js
// src/commands/throw.js

var { wc } = require('path to index.js');
var { game } = wc.pangine.Instances;


let options = [{
	name: "id",
	description: "lobby id to leave",
	required: true,
	type: "str"
}];


wc.slashCommand({ name: "throw",  desc: "throws a new script signal", options: options }, async (ctx, cmd) => {
	let id = cmd.args[0].value;

	if (!game.lobbies.has(id)) return wc.reply("There is no lobby with that ID", { ephemeral: true });
	let lobby = game.lobbies.get(id);

	let button = new wc.Button({ id: `throw:${lobby.id}`, label: "Click me to throw lobby ID", style: "primary" });
	let row = new wc.ActionRow([button]);

	lobby.home = await ctx.reply({ components: [row] });

	// creates a new signal with the name "throw"
	let signal = new lobby.Signal("throw");

	// whenever the button is pressed it throws the signal
	wc.buttonAction(`throw:${lobby.id}`, (ctx) => { signal.throw(ctx, lobby) });
});
```
This event catches that signal when it's thrown and responds to it;
```js
// src/events/catch.js

var { wc } = require('path to index.js');
var { game } = wc.pangine.Instances;

game.on("throwSignal", (signal) => {
	let [ctx, lobby] = signal.catch(); // catches the signal

	ctx.reply(`I caught lobby ${lobby.id}!`); // responds
});
```
