import { TestBed } from '@angular/core/testing'
import { UserService } from "./user.service"
import {Userdata} from "./userdata"
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing'
import {environment} from '../environments/environment'

describe("UserService", () => {
  let userService: UserService
  let httpTestingController: HttpTestingController

  beforeEach(()=>{

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService
      ]
    })

    userService = TestBed.get(UserService)
    httpTestingController = TestBed.get(HttpTestingController)
  })
  
  it('should be created', () => {
    expect(userService).toBeTruthy();
  })

  it('should get userdata', () => {
    const testData: Userdata = {
      _id: 1,
      username: "test",
      votes: [],
      memes: [],
      drafts: [],
      api_cred: 5434534631323757456,
      comment: []
    }

    userService.getUserdata(testData._id, testData.api_cred).subscribe((res)=>{
      expect(res).toEqual(testData)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/userdata')

    expect(req.request.method).toEqual('POST')

    req.flush(testData)

    httpTestingController.verify()
  })

  it('should register user', () => {
    const testData = {
      _id: 1,
      username: "test",
      salt: "1sadassjdhhwjjkjnxncnjjqqiiuuisdnnmw",
      pw: "9G79j6jbqrtoxTjsBMVRkePHrYWQfCry",
      votes: [],
      memes: []
  }

    userService.register("test", "1234").subscribe((res)=>{
      expect(res).toEqual(testData)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/register')

    expect(req.request.method).toEqual('POST')

    req.flush(testData)

    httpTestingController.verify()
  })

  it('should login', () => {
    const testData = {
      status: "OK",
      data: {
        _id: 1,
        username: "test",
        votes: [],
        memes: [],
        api_cred: 5434534631323757456
      }
    }

    userService.login("test", "1234").subscribe((res)=>{
      expect(res).toEqual(testData)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/login')

    expect(req.request.method).toEqual('POST')

    req.flush(testData)

    httpTestingController.verify()
  })

})
