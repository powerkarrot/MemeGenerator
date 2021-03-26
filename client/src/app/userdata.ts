import { Meme } from './meme'
import {Comment} from './comment'

export interface Userdata {
    _id: number
    username: string
    votes: Meme[]
    memes: Meme[]
    api_cred: number
    comment: Comment[]
}
