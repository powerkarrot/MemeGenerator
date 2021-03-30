import { Comment } from './comment'
import {Tag} from './tags'

export interface Meme {
    _id: number
    dateAdded: string
    title: string
    topText: string
    topX: number
    topY: number
    bottomText: string
    bottomX: number
    bottomY: number
    url: string
    width: number
    height: number
    box_count: number
    description: string
    votes: number
    views: number
    visibility: string
    createdBy: {
        _id: number
        username: string
    }
    comments: Comment[]
    tags: Tag[]
}
