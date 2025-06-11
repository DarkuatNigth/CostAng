import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrmenvioxmlnatComponent } from './frmenvioxmlnat.component';

describe('FrmenvioxmlnatComponent', () => {
  let component: FrmenvioxmlnatComponent;
  let fixture: ComponentFixture<FrmenvioxmlnatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmenvioxmlnatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FrmenvioxmlnatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
