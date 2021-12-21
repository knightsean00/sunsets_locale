import { Client, Intents } from "discord.js";
import {joinVoiceChannel} from "@discordjs/voice";
import dotenv from "dotenv";
import {musicCommands, } from "./music";

dotenv.config();
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

client.on("ready", async () => {
    console.log(`Logged in ${client.user?.tag}`);

    // await client.application?.commands.set([
    //     {
    //         name: "ping",
    //         description: "pong"
    //     }
    // ]);
});


client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand())
        return;

    console.log(interaction);

    if (interaction.commandName === "ping") {
        await interaction.reply("Pong!");
        const guild = client.guilds.cache.get(interaction.guildId);
        const member = guild?.members.cache.get(interaction.member.user.id);
        const voiceChannel = member?.voice.channel;
        if (voiceChannel && guild) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel?.id,
                guildId: guild?.id,
                adapterCreator: guild?.voiceAdapterCreator
            });
        } else {
            throw new Error("FUCK YOU");
        }

        
    }
});

client.login(process.env.discordToken);