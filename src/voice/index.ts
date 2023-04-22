import { GuildMember, CommandInteraction } from "discord.js";
import { joinVoiceChannel, getVoiceConnection, getVoiceConnections } from "@discordjs/voice";

/**
 * Joins the voice channel of the requested user
 * 
 * @param interaction interaction between user and client that contains information about
 *                      user voicestate.
 */
export async function join(interaction: CommandInteraction, reply = true): Promise<void> {
    const member = interaction.member as GuildMember;
    const channel = member.voice.channel;

    if (channel && channel.guild.id) {
        await joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        if (reply)
            interaction.reply("I'm here!");
    } else {
        interaction.reply("You are not currently in a voice channel.");
    }
}

/**
 * Disconnects from guild voice channel
 * 
 * @param interaction interaction between user and client that contains information about
 *                      user guildId.
 */
export async function dc(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId as string;
    const connection = getVoiceConnection(guildId);
    if (connection) {
        await connection.destroy();
        interaction.reply("Goodbye.");
    } else {
        interaction.reply("I am not currently in a voice channel.");
    }
}

/**
 * Disconnects from every voice connection that the client is a part of.
 */
// export async function shutdown(): Promise<void> {
//     getVoiceConnections().forEach(connection => connection.destroy());
// }

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