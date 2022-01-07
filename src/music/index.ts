import { getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { join } from "../voice";
import { MusicManager } from "./MusicManager";

const guildMap: Map<string, MusicManager> = new Map([]);

async function play(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    let connection = getVoiceConnection(guildId);
    if (!connection) {
        await join(interaction, false);
        connection = getVoiceConnection(guildId) as VoiceConnection;
    }

    if (!guildMap.has(guildId)) {
        guildMap.set(guildId, new MusicManager(connection, interaction, () => guildMap.delete(guildId)));
    } 

    const manager = guildMap.get(guildId) as MusicManager;
    await interaction.deferReply();
    manager.enqueue(interaction);
}

async function playlist(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    let connection = getVoiceConnection(guildId);
    if (!connection) {
        await join(interaction, false);
        connection = getVoiceConnection(guildId) as VoiceConnection;
    }

    if (!guildMap.has(guildId)) {
        guildMap.set(guildId, new MusicManager(connection, interaction, () => guildMap.delete(guildId)));
    } 

    const manager = guildMap.get(guildId) as MusicManager;
    await interaction.deferReply();
    manager.enqueuePlaylist(interaction);
}


/**
 * Returns true if the bot is currently within a voice connection in the guild
 * @param interaction 
 */
function connectionCheck(interaction: CommandInteraction): boolean {
    const guildId = interaction.guildId;
    const connection = getVoiceConnection(guildId);
    if (!connection) {
        interaction.reply("I am not currently in a voice channel.");
        return false;
    }

    if (!guildMap.has(guildId)) {
        interaction.reply("I am not currently playing any music.");
        return false;
    } 

    return true;
}


async function stop(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.stop(interaction);
    }
}

async function seek(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.seek(interaction);
    }
}

async function skip(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.skip(interaction);
    }
}

function queue(interaction: CommandInteraction): void {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.sendQueue(interaction);
    }
}

function pause(interaction: CommandInteraction) {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.pause(interaction);
    }
}

function resume(interaction: CommandInteraction): void {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.resume(interaction);
    }
}

function remove(interaction: CommandInteraction): void {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        manager.remove(interaction);
    }
}

function nowPlaying(interaction: CommandInteraction): void {
    const guildId = interaction.guildId;
    if (connectionCheck(interaction)) {
        const manager = guildMap.get(guildId) as MusicManager;
        const res = manager.nowPlaying();
        if (res) {
            interaction.reply({embeds: [res]});
        } else {
            interaction.reply("Nothing is currently playing.");
        }
    }
}

export const musicCommands = [
    {
        "name": "play",
        "description": "Searches and queues the provided Song.",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.STRING,
                "name": "query",
                "description": "Query to be searched and played.",
                "required": true
            },
            {
                "type": ApplicationCommandOptionTypes.BOOLEAN,
                "name": "soundcloud",
                "description": "Searches SoundCloud for the song instead of YouTube.",
                "required": false
            }
        ]
    },
    {
        "name": "playlist",
        "description": "Searches and queues the provided playlist query.",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.STRING,
                "name": "query",
                "description": "Name of the playlist to be enqueued.",
                "required": true
            },
            {
                "type": ApplicationCommandOptionTypes.BOOLEAN,
                "name": "soundcloud",
                "description": "Searches SoundCloud for the playlist instead of YouTube.",
                "required": false
            }
        ]
    },
    {
        "name": "stop",
        "description": "Stops the currently playing song and clears the queue.",
    },
    {
        "name": "seek",
        "description": "Seeks for the given song index.",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.INTEGER,
                "name": "index",
                "description": "The position in the queue of the song to be seeked to.",
                "required": true
            }
        ]
    },
    {
        "name": "skip",
        "description": "Skips to given index, or if no index is provided, simply skips the currently playing song.",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.INTEGER,
                "name": "index",
                "description": "The position in the queue of the song to be skipped to.",
                "required": false
            }
        ]
    },
    {
        "name": "queue",
        "description": "Returns the current music queue."
    },
    {
        "name": "pause",
        "description": "Pauses the music replay.",
    },
    {
        "name": "resume",
        "description": "Resumes the music replay.",
    },
    {
        "name": "remove",
        "description": "Resumes then song at the given index from the queue.",
        "options": [
            {
                "type": ApplicationCommandOptionTypes.INTEGER,
                "name": "index",
                "description": "The position in the queue of the song to be removed.",
                "required": false
            }
        ]
    },
    {
        "name": "np",
        "description": "Gives information about the song that is currently playing.",
    },
];

export const musicCommandsMapping: Map<string, (a: CommandInteraction) => void> = new Map([
    ["play", play],
    ["playlist", playlist],
    ["stop", stop],
    ["seek", seek],
    ["skip", skip],
    ["queue", queue],
    ["pause", pause],
    ["resume", resume],
    ["remove", remove],
    ["np", nowPlaying],
]);