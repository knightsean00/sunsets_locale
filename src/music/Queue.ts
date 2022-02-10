import Song from "./Song";
import SongType from "./SongType";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { timeRemaining } from "./Time";
import urlReg from "./UrlRegEx";
import play, { SoundCloudPlaylist } from "play-dl";
import ytpl from "ytpl";


export default class Queue {
    public songs: Array<Song>;

    public constructor(songs: Array<Song>) {
        this.songs = songs;
    }

    /**
     * Enqueues a song 
     * 
     * @param query 
     * @param type 
     */
    public async enqueue(interaction: CommandInteraction): Promise<void> {
        const song = await Song.createFromQuery(interaction);
        if (song) {
            this.songs.push(song);
            interaction.editReply(`Added ${song.title} to queue.`);
        }
    }

    /**
     * Clears the queue. If a song is currently playing, it still remains on the queue.
     */
    public clear(): void {
        if (this.songs.length > 0) {
            const nowPlaying = this.songs[0];
            this.songs = [nowPlaying];
        } else {
            this.songs = [];
        }
    }

    /**
     * Gets the next song to play and shifts the queue by one
     * 
     * @returns the new now playing song
     */
    public next(): Song | undefined {
        this.songs = this.songs.slice(1);
        return this.nowPlaying();
    }

    /**
     * Skips to the song at the specified index without disrupting the order of the songs before it.
     * 
     * @param interaction contains an index for modification
     */
    public seek(interaction: CommandInteraction): void {
        const idx = interaction.options.getInteger("index", true);
        if (idx < 0 || idx >= this.songs.length) {
            interaction.reply("Invalid song index");
            return undefined;
        }

        this.songs = [this.songs[0], this.songs[idx], ...this.songs.slice(1,idx), ...this.songs.slice(idx + 1)];
        interaction.reply(`Seeked to ${this.songs[1].title}.`);
    }
    
    /**
     * Skips to the song at the index and removes all songs before it.
     * 
     * @param interaction contains an index for modification
     */
    public skip(interaction: CommandInteraction): void {
        const idx = interaction.options.getInteger("index", false) ?? 1;
        if (idx < 0 || idx >= this.songs.length) {
            interaction.reply("Invalid song index.");
            return undefined;
        } 

        this.songs = [this.songs[0], ...this.songs.slice(idx)];
        interaction.reply(`Skipped to ${this.songs[1].title}.`);
    }


    /**
     * Removes the Song at the specified index
     * @param interaction contains an index for modification
     */
    public remove(interaction: CommandInteraction): void {
        const idx = interaction.options.getInteger("index", false) ?? 1;
        if (idx <= 0 || idx >= this.songs.length) {
            interaction.reply("Invalid song index.");
            return undefined;
        } 

        const song = this.songs.splice(idx, 1)[0];
        interaction.reply(`Removed ${song.title} from the queue.`);
    }

    /**
     * Gets the song that is currently playing
     * 
     * @returns the first index song or undefined if the queue is empty
     */
    public nowPlaying(): Song | undefined {
        return this.songs[0];
    }

    /**
     * Creates Song(s) from a playlist query
     * 
     * @param query user query to look up
     * @throws an error if no playlists matching the query are found
     */
    public async enqueueFromPlaylistQuery(interaction: CommandInteraction): Promise<void> {
        const query = interaction.options.getString("query", true);
        const sc = interaction.options.getBoolean("soundcloud", false) ?? false;

        // Probably use regex here
        if (urlReg.test(query)) {
            const type = await play.validate(query);
            if (!type || type === "search") {
                interaction.editReply(`Could not find playlist with ${query}.`);
                return ;
            }
            if (type.endsWith("track") || type.endsWith("video")) {
                interaction.editReply(`Please use the /play command with ${query} as the query.`);
                return ;
            }

            if (type === "yt_playlist") {
                const url = query;
                await this.enqueueYouTubePlaylist(interaction, url);
                return ;
            } else if (type === "so_playlist") {
                const playlist = await play.soundcloud(query) as SoundCloudPlaylist;
                await this.enqueueSoundCloudPlaylist(interaction, playlist);
                return ;
            }
        }

        if (sc) {
            const res = (await play.search(query, {source: { soundcloud: "playlists"}}));
            if (res.length === 0) {
                interaction.editReply(`Unable to find playlists under "${query}""`);
                return ;
            }
            const playlist = res[0];
            await this.enqueueSoundCloudPlaylist(interaction, playlist);
        } else {
            const res = await (play.search(query, {source: { youtube: "playlist"}}));
            if (res.length === 0 || !res[0].url) {
                interaction.editReply(`Unable to find playlist under "${query}""`);
                return ;
            }
            const playlist = res[0];
            await this.enqueueYouTubePlaylist(interaction, playlist.url as string);
        }
    }

    /**
     * Enqueues all of the songs beloning to a given playlist of soundcloud tracks.
     * 
     * @param interaction interaction that contains query as an option and is reply-able.
     * @param playlist playlist to get Song information from.
     */
    private async enqueueSoundCloudPlaylist(interaction: CommandInteraction, playlist: SoundCloudPlaylist) {
        const query = interaction.options.getString("query", true);
        
        await playlist.fetch();

        const tracks = await playlist.all_tracks();

        const results = tracks.map(track => new Song(query,
            SongType.SoundCloud,
            track.name,
            track.url,
            track.durationInMs,
            track.thumbnail
        ));
        this.songs.push(...results);
        if (playlist.tracksCount !== 0) {
            interaction.editReply(`Added ${playlist.tracksCount} songs to the queue.`);
        } else {
            interaction.editReply(`Requested playlist ${query} was empty.`);
        }
    }
    
    /**
     * Given an interaction and YouTubePlaylist, adds all of the YouTube Videos as Songs to the queue.
     * 
     * @param interaction interaction that contains query as an option and is reply-able.
     * @param url playlist url.
     */
    private async enqueueYouTubePlaylist(interaction: CommandInteraction, url: string): Promise<void> {
        const query = interaction.options.getString("query", true);
        const oldLength = this.songs.length;
        
        const res = await ytpl(url, {pages: Infinity});
        const results = res.items.map(video => new Song(query, 
            SongType.YouTube,
            video.title,
            video.shortUrl,
            (video.durationSec ?? 0) * 1000,
            video.bestThumbnail.url ?? "https://images-na.ssl-images-amazon.com/images/I/71e7DkexvHL._AC_SX425_.jpg"
        ));
        this.songs.push(...results);
        
        if (this.songs.length - oldLength > 0) 
            interaction.editReply(`Added ${this.songs.length - oldLength} songs to the queue.`);
        else
            interaction.editReply(`Requested playlist ${query} was empty.`);
    }


    /**
     * Creates a MessageEmbed that represents this queue object given a streamTime
     * @param streamTime time that the current song has been streaming.
     */
    public getQueue(streamTime: number): MessageEmbed {
        let output = "";

        if (this.songs.length === 0) {
            output += "There is nothing in queue.";
        } else {
            let runningTime = this.songs[0].duration;
            output += `Now playing ${this.songs[0].title} with ${timeRemaining(streamTime, runningTime)} remaining`;
            if (this.songs.length === 1) {
                output += "\n\nNo other songs in queue.";
            } else {
                output += "\n\nUp next.";
                let idx = 1;
                while (idx < this.songs.length && output.length + this.songs[idx].title.length + 15 < 1800) {
                    output += `\n${idx}) ${this.songs[idx].title} ${timeRemaining(streamTime, runningTime)}`;
                    runningTime += this.songs[idx].duration;
                    idx++;
                }
            }
        }
        const embedQueue = new MessageEmbed();
        embedQueue.setColor("#FF6AD5");
        embedQueue.setTitle("Queue");
        embedQueue.setThumbnail(this.nowPlaying()?.thumbnail ?? "https://images-na.ssl-images-amazon.com/images/I/71e7DkexvHL._AC_SX425_.jpg");
        embedQueue.setDescription(output);
        return embedQueue;
    }
}