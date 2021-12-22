import Song from "./Song";
import SongType from "./SongType";
import youtube from "@yimura/scraper";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { timeRemaining } from "./Time";

const yt = new youtube.Scraper();

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
    public async enqueue(query:string, type:SongType=SongType.YouTube) {
        switch(type) {
        case SongType.YouTube: {
            try {
                this.songs.push(await Song.createFromYT(query));
            } catch (err) {
                console.log(err);
            }
            break;
        }
        case SongType.SoundCloud: {
            try {
                this.songs.push(await Song.createFromSC(query));
            } catch (err) {
                console.log(err);
            }
            break;
        }
        default: {
            throw new Error(`Undefined song type ${type}`);
        }
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
     * @param interaction 
     * @param idx 
     */
    public seek(interaction: CommandInteraction): Song | undefined {
        const idx = interaction.options.getInteger("index", true);
        if (idx < 0 || idx >= this.songs.length) {
            interaction.reply({ content: "Invalid song index", ephemeral: true });
            return undefined;
        }

        this.songs = [this.songs[idx], ...this.songs.slice(1,idx), ...this.songs.slice(idx + 1)];
        interaction.reply({ content: `Seeked to ${this.songs[0].title}`, ephemeral: true });
        return this.songs[0];
    }
    
    /**
     * Skips to the song at the index and removes all songs before it.
     * 
     * @param idx must be an integer
     */
    public skip(interaction: CommandInteraction): Song | undefined {
        const idx = interaction.options.getInteger("Song Index", false) ?? 1;
        if (idx < 0 || idx >= this.songs.length) {
            interaction.reply({ content: "Invalid song index", ephemeral: true });
            return undefined;
        } 

        this.songs = this.songs.slice(idx);
        interaction.reply({ content: `Skipped to ${this.songs[0].title}`, ephemeral: true });
        return this.songs[0];
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
     * Creates a Song from a YouTube query
     * 
     * @param query user query to look up
     * @throws an error if no playlists matching the query are found
     */
    public async enqueueFromYTPlaylist(query:string) {
        const res = await yt.search(query, {searchType: "PLAYLIST"});
        if (res.playlists.length === 0) {
            throw new Error(`No playlist matching ${query} found.`);
        }
        return this.songs.push(...(res.playlists[0].preview.map(info => new Song(query, SongType.YouTube, info.title, info.link, info.duration, info.thumbnail))));
    }

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