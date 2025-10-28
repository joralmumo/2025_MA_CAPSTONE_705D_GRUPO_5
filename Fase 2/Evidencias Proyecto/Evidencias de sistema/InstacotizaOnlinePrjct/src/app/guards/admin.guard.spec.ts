import { TestBed } from '@angular/core/testing';

import { NgModule } from '@angular/core';
import { AdminGuard } from './admin.guard';
import { ToastrService } from 'ngx-toastr';
import { ToastrModule } from 'ngx-toastr';
import { AuthService } from '../services/auth.service'; 
import { HttpClient } from '@angular/common/http';

describe('AdminGuard', () => {
  let guard: AdminGuard;

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
    guard = TestBed.inject(AdminGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
