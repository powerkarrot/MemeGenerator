import {LOCAL_STORAGE, StorageService} from 'ngx-webstorage-service'
import { Inject, Injectable} from '@angular/core'
import {Userdata} from './userdata'
import {Meme} from './meme'
import {UserService} from './user.service'

// Key used to access local data
const STORAGE_KEY = 'local_userdata'
// Key used for app settings
const SETTINGS_KEY = 'app_settings'

export interface Setting {
    key: string
    value: any
}

/**
 * This component is used to write data into the browsers local storage
 */
@Injectable()
export class LocalStorageService {

    private userdata : Userdata

    constructor(@Inject(LOCAL_STORAGE) private storage: StorageService, private userService: UserService) {}

    public storeOnLocalStorage(loginData: Userdata): void {
        const currentUserdada = this.storage.get(STORAGE_KEY) || []

        // Push userdata
        currentUserdada.push(loginData)

        //Insert updated array to local storage
        this.storage.set(STORAGE_KEY, currentUserdada)
    }

    public getLocalStorage(): any {
        if(this.hasLocalStorage()){
            const userdata = this.storage.get(STORAGE_KEY)[0]
            return userdata
        }
        return []
    }

    public hasLocalStorage(): boolean {
        const userdata = this.storage.get(STORAGE_KEY) || null
        if(userdata) {
            return true
        } 
        return false
    }

    public deleteLocalStorage(): boolean {
        this.storage.remove(STORAGE_KEY)
        return this.hasLocalStorage()
    }

    private saveSetting(setting: Setting): void {
        let oldSettings = this.storage.get(setting.key) || {}
        oldSettings["value"] = setting.value
        this.storage.set(setting.key, oldSettings)
    }

    private getSetting(setting: Setting): any {
        return this.storage.get(setting.key) || {}   
    }

    public setVoiceControlStatus(status: boolean): void {
        this.saveSetting({key: "VoiceControl", value: status})
    }

    public deleteVoiceControlStatus(): void {
        this.storage.remove("VoiceControl")
    }

    public getVoiceControlStatus(): boolean {
        let setting = this.getSetting({key: "VoiceControl", value: null})    
        return setting.value ?? false
    }

    public updateLocalStorage(): boolean {
        if(this.hasLocalStorage()) {
            const userdata = this.getLocalStorage()
            this.userService.getUserdata(userdata._id, userdata.api_cred).subscribe((res) => {
                const data = <Userdata>res.data
                this.deleteLocalStorage()
                this.storeOnLocalStorage(data)
                this.userdata = this.getLocalStorage()
            })
        }
        return this.hasLocalStorage()
    }

    public getUserID(): number {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage()._id
        }
        throw("No local storage found!")
    }

    public getUsername(): string {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage().username
        }
        throw("No local storage found!")
    }

    public getLikedMemes(): Meme[] {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage().votes
        }
        throw("No local storage found!")
    }

    public getDislikedMemes(): Meme[] {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage().votes
        }
        throw("No local storage found!")
    }

    public getCreatedMemes(): Meme[] {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage().memes
        }
        throw("No local storage found!")
    }

    public getApiKey(): number {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage().api_cred
        }
        throw("No local storage found!")
    }

    public getComments(): Comment[] {
        if(this.hasLocalStorage()) {
            return this.getLocalStorage().comment
        }
        throw("No local storage found!")
    }
}