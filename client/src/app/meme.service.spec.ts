import { TestBed } from '@angular/core/testing'
import { MemeService } from './meme.service'
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing'
import {environment} from '../environments/environment'
import {Meme} from './meme'


describe('MemeService', () => {
  let service: MemeService
  let httpTestingController: HttpTestingController
  let testMeme : Meme

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MemeService]
    })

    service = TestBed.get(MemeService)
    httpTestingController = TestBed.get(HttpTestingController)
    testMeme = {
      _id: 60203760050750522,
      dateAdded: "2021-03-16T11:50:23.820Z",
      createdBy: {_id: 60203760050750523, username: "Testimport"},
      title: "Wenn Vodafone nicht geht",
      topText: "Wenn Vodafone",
      topSize: 20,
      topX: 0,
      topY: 0,
      topBold: true,
      topItalic: false,
      topColor: true,
      bottomText: "nicht geht",
      bottomSize: 20,
      bottomX: 0,
      bottomY: 0,
      bottomBold: true,
      bottomItalic: false,
      bottomColor: false,
      url: "http://localhost:3007/memes/test1.jpg",
      width: 1920,
      height: 1080,
      box_count: 2,
      description: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam",
      votes: 0,
      voteData: [],
      viewData: [],
      views: 0,
      visibility: "public",
      template: "Burning house",
      tags: [{"name": "testTag"}],
      comments: [
          {
              "username": "ex3c",
              "comment": "nice xD",
              "date": "2021-03-16T11:52:00.820Z"
          }
      ]
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update meme', () => {
    service.updateMeme(testMeme._id, testMeme).subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme/' + testMeme._id)

    expect(req.request.method).toEqual('POST')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should vote meme', () => {
    service.voteMeme(testMeme._id, true, 237618861, "testuser", 2367862178637782187).subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme/vote/' + testMeme._id)

    expect(req.request.method).toEqual('POST')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should take screenshot', () => {
    const data = {
      path : 'test.jpg',
      url : 'http://localhost:3007/uploads/test.jpg',
      title: "Test"
    } 

    service.takeScreenshot("http://google.de").subscribe((res) => {
      expect(res).toEqual(data)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/screenshot')

    expect(req.request.method).toEqual('POST')

    req.flush(data)

    httpTestingController.verify()

  });

  it('should update template', () => {
    const data = {
      path : 'test.jpg',
      url : 'http://localhost:3007/uploads/test.jpg',
      title: "Test"
    } 

    service.updateTemplate(data,false, false).subscribe((res) => {
      expect(res).toEqual(data)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/template')

    expect(req.request.method).toEqual('POST')

    req.flush(data)

    httpTestingController.verify()
  });

  it('should vote template', () => {
    const data = {
      path : 'test.jpg',
      url : 'http://localhost:3007/uploads/test.jpg',
      title: "Test"
    } 

    service.voteTemplate(testMeme._id, true, 23467823876784, "testuser", 377681278378, null).subscribe((res) => {
      expect(res).toEqual(data)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/template/vote/' + testMeme._id)

    expect(req.request.method).toEqual('POST')

    req.flush(data)

    httpTestingController.verify()
  });

  it('should comment meme', () => {
    const data = {
      path : 'test.jpg',
      url : 'http://localhost:3007/uploads/test.jpg',
      title: "Test"
    } 

    service.commentMeme(testMeme._id, 23467823876784, "testuser", 377681278378, "This is comment").subscribe((res) => {
      expect(res).toEqual(data)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme/comment/' + testMeme._id)

    expect(req.request.method).toEqual('POST')

    req.flush(data)

    httpTestingController.verify()
  });

  it('should delete meme', () => {
    service.deleteMeme(testMeme._id).subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme/' + testMeme._id)

    expect(req.request.method).toEqual('DELETE')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should delete draft', () => {
    service.deleteDraft(testMeme._id, 3274732784237, 89378944237898794).subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/draft/delete/' + testMeme._id)

    expect(req.request.method).toEqual('POST')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should get meme', () => {
    service.getMeme(testMeme._id).subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme/' + testMeme._id)

    expect(req.request.method).toEqual('GET')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should get random meme', () => {
    service.getRandomMeme().subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme/random')

    expect(req.request.method).toEqual('GET')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should get memes', () => {
    service.getMemes().subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/meme?q={}&o={}')

    expect(req.request.method).toEqual('GET')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should get drafts', () => {
    service.getDrafts().subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/drafts?q={}&o={}')

    expect(req.request.method).toEqual('GET')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should load templates', () => {
    service.loadTemplates().subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/templates')

    expect(req.request.method).toEqual('GET')

    req.flush(testMeme)

    httpTestingController.verify()
  });

  it('should get meme stats', () => {
    service.getMemeStats(testMeme._id).subscribe((res) => {
      expect(res).toEqual(testMeme)
    })

    const req = httpTestingController.expectOne(environment.apiUrl + '/stats/' + testMeme._id)

    expect(req.request.method).toEqual('GET')

    req.flush(testMeme)

    httpTestingController.verify()
  });



});
