import { Comment } from './comment'
import {Tag} from './tags'

export interface Meme {
    _id: number
    dateAdded: string
    title: string
    topText: string
    topSize: number
    topX: number
    topY: number
    topBold: boolean
    topItalic: boolean
    topColor: boolean
    bottomText: string
    bottomSize: number
    bottomX: number
    bottomY: number
    bottomBold: boolean
    bottomItalic: boolean
    bottomColor: boolean
    url: string
    width: number
    height: number
    box_count: number
    description: string
    votes: number
    voteData: any[]
    viewData: any[]
    views: number
    visibility: string
    createdBy: {
        _id: number
        username: string
    }
    template: string
    comments: Comment[]
    tags: Tag[]
}