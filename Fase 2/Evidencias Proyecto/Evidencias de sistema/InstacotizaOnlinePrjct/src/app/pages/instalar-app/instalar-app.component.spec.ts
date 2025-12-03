import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstalarAppComponent } from './instalar-app.component';

describe('InstalarAppComponent', () => {
  let component: InstalarAppComponent;
  let fixture: ComponentFixture<InstalarAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstalarAppComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstalarAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
