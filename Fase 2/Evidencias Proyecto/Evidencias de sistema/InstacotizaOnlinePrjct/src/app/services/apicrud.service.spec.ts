import { TestBed } from '@angular/core/testing';
import { ApicrudService } from './apicrud.service';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('ApicrudService', () => {
  let service: ApicrudService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: HttpClient},
        { provide: HttpHandler, useValue: HttpHandler},
      ]
    });
    service = TestBed.inject(ApicrudService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
