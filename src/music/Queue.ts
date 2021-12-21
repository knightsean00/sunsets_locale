import Song from "./Song";
import SongType from "./SongType";
import youtube from "@yimura/scraper";

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
     * Gets the song at the specified index
     * 
     * @param idx index to find song 
     */
    public getIndex(idx: number): Song {
        return this.songs[idx];
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
        return this.songs.push(...(res.playlists[0].preview.map(info => new Song(query, SongType.YouTube, info.title, info.link, info.duration))));
    }
}