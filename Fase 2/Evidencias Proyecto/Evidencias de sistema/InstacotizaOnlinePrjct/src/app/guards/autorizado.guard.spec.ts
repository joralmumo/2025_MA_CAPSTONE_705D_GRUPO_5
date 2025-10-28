import { TestBed } from '@angular/core/testing';

import { NgModule } from '@angular/core';
import { AutorizadoGuard } from './autorizado.guard';
import { ToastrService } from 'ngx-toastr';
import { ToastrModule } from 'ngx-toastr';
import { AuthService } from '../services/auth.service'; 
import { HttpClient } from '@angular/common/http';

describe('AutorizadoGuard', () => {
  let guard: AutorizadoGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastrService, useValue: ToastrService},
        { provide: HttpClient, useValue: HttpClient},
        { provide: AuthService, useValue: AuthService}
      ],
      imports: [ToastrModule.forRoot()],
      declarations: []
    });
    guard = TestBed.inject(AutorizadoGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
