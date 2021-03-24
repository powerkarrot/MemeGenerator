import {LOCAL_STORAGE, StorageService} from 'ngx-webstorage-service'
import { Inject, Injectable} from '@angular/core'
import {Userdata} from './userdata'

// Key used to access local data
const STORAGE_KEY = 'local_userdata'

@Injectable()
export class LocalStorageService {
    constructor(@Inject(LOCAL_STORAGE) private storage: StorageService) {}

    public storeOnLocalStorage(loginData: Userdata): void {
        const currentUserdada = this.storage.get(STORAGE_KEY) || []

        // Push userdata
        currentUserdada.push(loginData)

        //Insert updated array to local storage
        this.storage.set(STORAGE_KEY, currentUserdada)

        console.log(this.storage.get(STORAGE_KEY) || 'Local storage is emtpy')
    }

    public getLocalStorage(): any {
        const userdata = this.storage.get(STORAGE_KEY) || []
        return userdata
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
}