import {    
    VoiceConnection, 
    AudioPlayer, 
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer, 
    VoiceConnectionState, 
    VoiceConnectionStatus, 
    entersState, 
    VoiceConnectionDisconnectReason
} from "@discordjs/voice";

import Queue from "./Queue";
import Song from "./Song";
import SongType from "./SongType";

import { promisify } from "node:util";
import { CommandInteraction, TextChannel, MessageEmbed } from "discord.js";
import { formatSec } from "./Time";

const wait = promisify(setTimeout);

/**
 * A MusicSubscription exists for each active VoiceConnection. Each subscription has its own audio player and queue.
 */

export class MusicSubscription {
    public voiceConnection: VoiceConnection;
    public audioPlayer: AudioPlayer;
    public audioResource: AudioResource | undefined;
    public queue: Queue;
    public channel: TextChannel;

    public constructor(voiceConnection: VoiceConnection, interaction: CommandInteraction) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = new Queue([]);
        this.channel = interaction.channel as TextChannel;
        this.audioResource = undefined;

        this.voiceConnection.on("stateChange", async (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    /**
                     * With this error code, we do not try to manually reconnect, but rather wait and see if the connection
                     * recovers itself if the reason was because the bot was moved voice channels.
                     * This is also the code for being kicked. So determine which is was and if it was kicked, destroy the connection
                     */
                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5000);
                    } catch {
                        this.voiceConnection.destroy();
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    // The disconnect is recoverable, retry up to 5 times.

                    await wait((this.voiceConnection.rejoinAttempts + 1) * 5000);
                    this.voiceConnection.rejoin();                
                } else {
                    // the disconnect MAY be recoverable, but it exceeded 5 attempts
                    this.queue.clear();
                    this.voiceConnection.destroy();
                }

            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                // empty queue and shut down subscriber
                this.audioPlayer.stop(true);

            } else if (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling) {
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
                        this.voiceConnection.destroy();
                    } 
                } 
            }
        });

        this.audioPlayer.on("stateChange", (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                /**
                 *  When the Idle state is entered from a non-Idle state, it means the audio has finished playing.
                 *  Now we need to process the queue to start playing the next song if its availible.
                 */
                this.queue.next();
                this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                /**
                 *  When entering Playing state, a new track has started playing
                 */ 
                const embed = this.nowPlaying();
                if (embed)
                    this.channel.send({embeds: [embed]});
            }
        });

        voiceConnection.subscribe(this.audioPlayer);
    }

    /**
     * Adds a new Song to the queue.
     * 
     * @param query 
     * @param songType 
     */
    public async enqueue(interaction: CommandInteraction, query: string, songType: SongType) {
        if (songType === SongType.YouTube) {
            await this.queue.enqueue(query, songType);
            interaction.reply(`Added ${this.queue.songs[this.queue.songs.length - 1].title} to queue.`);
        }
        
        this.processQueue();
    }

    /**
     * Seeks to the song in the queue whose index is specified by the interaction
     * 
     * @param interaction
     */
    public seek(interaction: CommandInteraction) {
        this.queue.seek(interaction);
        // this.audioPlayer.stop(true);
        this.processQueue();
    }

    /**
     * Skips to the song in the queue whose index is specified in the interaction
     * 
     * @param interaction
     */
    public skip(interaction: CommandInteraction) {
        this.queue.skip(interaction);
        // this.audioPlayer.stop(true);
        this.processQueue();
    }


    /**
     * Starts playing the next song in the Queue if it exists.
     */
    private async processQueue(): Promise<void> {
        // If the queue is empty, or the audio player is playing something else, return
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.songs.length === 0) {
            return;
        }
        
        const nextSong: Song | undefined = this.queue.nowPlaying();
        // parallelism stuff. Even tho we check above that the length is not 0, we might have another call remove the last song.
        if(nextSong == undefined) {
            return;
        }
        try {
            // Try to convert the Song into an AudioResource
            const resource = await nextSong.createAudioResource();
            this.audioResource = resource;
            this.audioPlayer.play(this.audioResource);
        } catch (error) {
            console.log(error);
            return this.processQueue();
        }
    }

    /**
     * Sends a message to the channel this bot was originally invoked from describing the song currently playing.
     */
    public nowPlaying(): MessageEmbed | undefined {
        const song = this.queue.nowPlaying();

        if (song) {
            const embed = new MessageEmbed();
            embed.setColor("#FF6AD5");
            embed.setTitle(song.title);
            embed.setURL(song.url);
            embed.setThumbnail(song.thumbnail);
            embed.setDescription(`Duration ${formatSec(song.duration)}`);
            return embed;
        } 
    }

    public sendQueue(interaction: CommandInteraction): void {
        if (this.audioResource) {
            interaction.reply({embeds: [this.queue.getQueue(this.audioResource.playbackDuration)]});
        } else {
            interaction.reply("No songs are currently queued.");
        }
    }
}