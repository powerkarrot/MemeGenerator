import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import {UserService} from '../user.service'
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing'
import {HttpClient} from '@angular/common/http'

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let userService: UserService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, {provide: HttpClient, useValue: HttpClientTestingModule}],
      declarations: [ RegisterComponent ]
    })
    component = TestBed.inject(RegisterComponent)
    userService = TestBed.inject(UserService)
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
