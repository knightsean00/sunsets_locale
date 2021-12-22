import youtube, { Scraper, Video, Results }  from "@yimura/scraper";
import SongType from "./SongType";
import { AudioResource, createAudioResource, demuxProbe, ProbeInfo, AudioPlayerEvents, AudioPlayerStatus, StreamType } from "@discordjs/voice";
import ytdl from "ytdl-core";
import play, {YouTubeStream, SoundCloudStream} from "play-dl";

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
    public static async createFromSC(query:string): Promise<Song> {
        throw new Error("not implemented yet");
    }

    /**
     * Creates an AudioResource object from this Song
     */
    public async createAudioResource(): Promise<AudioResource<Song>> {
        const stream = await play.stream(this.url);
        return createAudioResource(stream.stream, {metadata: this});
        // return createAudioResource(ytdl(this.url, { quality: "lowestaudio", filter: "audioonly", highWaterMark: 1 }), {metadata: this});


        // return new Promise((resolve, reject) => {
        //     const stream = ytdl(this.url, { filter: "audioonly" });
        // demuxProbe(stream)
        //     .then((probe: ProbeInfo) => resolve(createAudioResource(probe.stream, {metadata: this, inputType: probe.type})))
        //     .catch((error: Error) => {reject(error);});
        // });
    }
}
