import { Client, CommandInteraction, Intents } from "discord.js";
import dotenv from "dotenv";
import { musicCommands, musicCommandsMapping } from "./music";
import { voiceCommandsMapping, voiceCommands } from "./voice";
import play from "play-dl";

dotenv.config();
const client = new Client({intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});
play.getFreeClientID().then((clientID) => {
    play.setToken({
        soundcloud: {
            client_id: clientID
        }
    });
});
const allCommands = [{"name": "ping", "description": "pong"}, {"name": "pong", "description": "ping"}, ...voiceCommands, ...musicCommands];
const allCommandsMapping = new Map([
    ["ping", (a: CommandInteraction) => a.reply("pong.")], 
    ["pong", (a: CommandInteraction) => a.reply("ping.")], 
    ...voiceCommandsMapping, 
    ...musicCommandsMapping]
);



client.on("ready", async () => {
    console.log(`Logged in ${client.user?.tag}`);

    await client.application?.commands.set([], "917313355419643924");
    await client.application?.commands.set(allCommands);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand())
        return;

    const fn = allCommandsMapping.get(interaction.commandName);
    if (fn) {
        fn(interaction);
    } else {
        interaction.reply({ content: "That is not a valid command", ephemeral: true });
    }
});


// Bot leaves voice channels upon shutdown
// process.on("SIGTERM", () => {
//     shutdown();
// });

// process.on("SIGINT", () => {
//     shutdown();
// });

client.login(process.env.discordToken);

// play.authorization();