export interface Template {
    _id?:number
    url: string
    dateAdded?: string
    title?: string
    description?: string
    votes?: number
    generated?: number
    voteData?: any[]
    viewData?: any[]
    generatedData?:any[]
    views?: number 
    visibility?: string
}