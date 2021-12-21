import youtube, { Scraper, Video, Results }  from "@yimura/scraper";
import SongType from "./SongType";

const yt = new youtube.Scraper();

export default class Song {
    public query: string;
    public type: SongType;
    public title: string;
    public url: string;
    public duration: number;
    
    public constructor(query:string, type: SongType, title: string, url: string, duration: number) {
        this.query = query;
        this.type = type;
        this.title = title;
        this.url = url;
        this.duration = duration;
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

        return new Song(query, SongType.YouTube, video.title, video.link, video.duration);
    }

    /**
     * Creates a Song from a SoundCloud query
     * 
     * @param query user query to look up
     */
    public static async createFromSC(query:string): Promise<Song> {
        throw new Error("not implemented yet");
    }
}