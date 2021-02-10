export interface Meme {
    _id: number;
    title: string;
    topText: string;
    topX: number;
    topY: number;
    bottomText: string;
    bottomX: number;
    bottomY: number;
    url: string;
    width: number;
    height: number;
    box_count: number;
    description: string;
    votes: number;
}