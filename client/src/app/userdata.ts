import { Meme } from './meme'

export interface Userdata {
    _id: number
    username: string
    memes: {
        liked: Meme[]
        disliked: Meme[]
        created: Meme[]
    }
    api_cred: string

}
