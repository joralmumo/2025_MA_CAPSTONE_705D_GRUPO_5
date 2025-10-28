import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePerfilComponent } from './update-perfil.component';

describe('UpdatePerfilComponent', () => {
  let component: UpdatePerfilComponent;
  let fixture: ComponentFixture<UpdatePerfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePerfilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
