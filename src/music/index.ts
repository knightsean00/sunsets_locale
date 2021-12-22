import { getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { join } from "../voice";
import { MusicSubscription } from "./MusicSubscriber";
import SongType from "./SongType";

const guildMap: Map<string, MusicSubscription> = new Map([]);

async function play(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    let connection = getVoiceConnection(guildId);
    if (!connection) {
        await join(interaction);
        connection = getVoiceConnection(guildId) as VoiceConnection;
    }

    if (!guildMap.has(guildId)) {
        guildMap.set(guildId, new MusicSubscription(connection, interaction));
    } 

    const subscription = guildMap.get(guildId) as MusicSubscription;
    const sc = interaction.options.getBoolean("SoundCloud");
    let songType = SongType.YouTube;
    if (sc) {
        songType = SongType.SoundCloud;
    }
    
    subscription.enqueue(interaction, interaction.options.getString("query", true), songType);
}

/**
 * Returns true if the bot is currently within a voice connection in the guild
 * @param interaction 
 */
function connectionCheck(interaction: CommandInteraction): boolean {
    const guildId = interaction.guildId;
    const connection = getVoiceConnection(guildId);
    if (!connection) {
        interaction.reply("I am not currently in a voice channel");
        return false;
    }

    if (!guildMap.has(guildId)) {
        interaction.reply("I am not currently playing any music");
        return false;
    } 

    return true;
}

async function seek(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const subscription = guildMap.get(guildId) as MusicSubscription;
        subscription.seek(interaction);
    }
}

async function skip(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const subscription = guildMap.get(guildId) as MusicSubscription;
        subscription.skip(interaction);
    }
}

function queue(interaction: CommandInteraction): void {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const subscription = guildMap.get(guildId) as MusicSubscription;
        subscription.sendQueue(interaction);
    }
}

export const musicCommands = [
    {
        "name": "play",
        "description": "Searches and queues the provided Song",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.STRING,
                "name": "query",
                "description": "Name of the song to be played",
                "required": true
            },
            {
                "type": ApplicationCommandOptionTypes.BOOLEAN,
                "name": "soundcloud",
                "description": "Searches SoundCloud for the song instead of YouTube",
                "required": false
            }
        ]
    },
    {
        "name": "seek",
        "description": "Seeks for the given song index",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.INTEGER,
                "name": "index",
                "description": "The position in the queue of the song to be seeked to",
                "required": true
            }
        ]
    },
    {
        "name": "skip",
        "description": "Skips to given index, or if no index is provided, simply skips the currently playing song",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.STRING,
                "name": "index",
                "description": "The position in the queue of the song to be skipped to",
                "required": false
            }
        ]
    },
    {
        "name": "queue",
        "description": "Returns the current music queue"
    }
];

export const musicCommandsMapping: Map<string, (a: CommandInteraction) => void> = new Map([
    ["play", play],
    ["seek", seek],
    ["skip", skip],
    ["queue", queue],
]);