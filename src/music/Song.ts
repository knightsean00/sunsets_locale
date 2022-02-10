import youtube, { Video,}  from "@yimura/scraper";
import SongType from "./SongType";
import { AudioResource, createAudioResource,} from "@discordjs/voice";
import play, {YouTubeStream, SoundCloudStream, search, SoundCloudTrack } from "play-dl";
import { CommandInteraction } from "discord.js";
import urlReg from "./UrlRegEx";
import ytdl from "ytdl-core";

const yt = new youtube.Scraper();

export default class Song {
    public query: string;
    public type: SongType;
    public title: string;
    public url: string;
    public duration: number;
    public thumbnail: string;
    
    public constructor(query:string, type: SongType, title: string, url: string, duration: number, thumbnail: string) {
        this.query = query;
        this.type = type;
        this.title = title;
        this.url = url;
        this.duration = duration;
        this.thumbnail = thumbnail;
    }

    public static async createFromQuery(interaction: CommandInteraction): Promise<Song | undefined> {
        const query = interaction.options.getString("query", true);
        const sc = interaction.options.getBoolean("soundcloud", false) ?? false;

        // Probably use regex here
        if (urlReg.test(query)) {
            const type = await play.validate(query);
            if (!type || type === "search" || type.endsWith("album")) {
                interaction.editReply(`Could not find ${query}.`);
                return undefined;
            }
            if (type.endsWith("playlist")) {
                interaction.editReply(`Please use the /playlist command with ${query} as the query.`);
                return undefined;
            }

            if (type === "yt_video") {
                const info = await play.video_info(query);
                return new Song(query, 
                    SongType.YouTube, 
                    info.video_details.title ?? "unknown",
                    info.video_details.url,
                    info.video_details.durationInSec * 1000,
                    info.video_details.thumbnails[0].url
                );
            } else if (type === "so_track") {
                const info = await play.soundcloud(query) as SoundCloudTrack;
                return new Song(query,
                    SongType.SoundCloud,
                    info.name,
                    info.url,
                    info.durationInMs,
                    info.thumbnail
                );
            }
        }

        if (sc) {
            const res = (await play.search(query, {source: { soundcloud: "tracks"}}));
            if (res.length === 0) {
                interaction.editReply(`Unable to find tracks under "${query}""`);
                return undefined;
            }
            const info = res[0];
            return new Song(
                query,
                SongType.SoundCloud,
                info.name,
                info.url,
                info.durationInMs,
                info.thumbnail
            );
        } else {
            const res = await (play.search(query, {source: { youtube: "video"}}));
            if (res.length === 0) {
                interaction.editReply(`Unable to find tracks under "${query}""`);
                return undefined;
            }
            const info = res[0];
            return new Song(
                query,
                SongType.YouTube,
                info.title ?? "unknown",
                info.url,
                info.durationInSec * 1000,
                info.thumbnails[0].url
            );
        }
    }

    /**
     * Creates a Song from a YouTube query
     * 
     * @param query user query to look up
     */
    public static async createFromYT(query:string): Promise<Song> {
        const res = await yt.search(query, {searchType: "VIDEO"});
        if (res["videos"].length === 0) {
            throw new Error(`No results found for ${query}.`);
        } 
        const video: Video = res["videos"][0];
        return new Song(query, SongType.YouTube, video.title, video.link, video.duration, video.thumbnail);
    }

    /**
     * Creates a Song from a SoundCloud query
     * 
     * @param query user query to look up
     */
    public static async createFromSC(query: string): Promise<Song> {
        throw new Error("not implemented yet");
    }

    /**
     * Creates an AudioResource object from this Song
     */
    public async createAudioResource(): Promise<AudioResource<Song>> {
        if (this.type === SongType.SoundCloud) {
            const stream = await play.stream(this.url);
            return createAudioResource(stream.stream, {metadata: this});
        }
        const stream = ytdl(this.url, { filter: "audioonly" });
        return createAudioResource(stream, {metadata: this});
        
    }
}
