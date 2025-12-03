import { TestBed } from '@angular/core/testing';

import { NgModule } from '@angular/core';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service'; 
import { HttpClient } from '@angular/common/http';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: HttpClient},
        { provide: AuthService, useValue: AuthService}
      ],
      imports: [],
      declarations: []
    });
    guard = TestBed.inject(AdminGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
