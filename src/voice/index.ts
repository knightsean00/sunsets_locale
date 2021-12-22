import { GuildMember, CommandInteraction } from "discord.js";
import { joinVoiceChannel, getVoiceConnection, getVoiceConnections } from "@discordjs/voice";

/**
 * Joins the voice channel of the requested user
 * 
 * @param interaction interaction between user and client that contains information about
 *                      user voicestate.
 */
export async function join(interaction: CommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const channelID = member.voice.channelId;
    const guildId = interaction.guildId;
    const adapterCreator = interaction.guild?.voiceAdapterCreator;

    if (channelID && guildId && adapterCreator) {
        await joinVoiceChannel({
            channelId: channelID,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild?.voiceAdapterCreator,
        });
        // interaction.reply({ content: "I'm here!", ephemeral: true });
    } else {
        interaction.reply({ content: "You are not currently in a voice channel", ephemeral: true });
    }
}

/**
 * Disconnects from guild voice channel
 * 
 * @param interaction interaction between user and client that contains information about
 *                      user guildId.
 */
export async function dc(interaction: CommandInteraction): Promise<void> {
    const connection = getVoiceConnection(interaction.guildId);
    if (connection) {
        await connection.destroy();
        interaction.reply({ content: "Goodbye", ephemeral: true });
    } else {
        interaction.reply({ content: "I am not currently in a voice channel", ephemeral: true});
    }
}

/**
 * Disconnects from every voice connection that the client is a part of.
 */
export async function shutdown(): Promise<void> {
    getVoiceConnections().forEach(connection => connection.destroy());
}

export const voiceCommands = [
    {
        "name": "join",
        "description": "Joins the voice channel of the person who made the request."
    },
    {
        "name": "dc",
        "description": "Disconnects from the voice channel that the sunsets_locale is currently connected to."
    }
];

export const voiceCommandsMapping: Map<string, (a: CommandInteraction) => void> = new Map([
    ["join", join],
    ["dc", dc]
]);