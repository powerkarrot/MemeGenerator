import { Meme } from './meme'
import {Comment} from './comment'

export interface Userdata {
    _id: number
    username: string
    votes: Meme[]
    memes: any[]
    api_cred: number
    comment: Comment[]
}
