import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instalar-app',
  imports: [CommonModule],
  templateUrl: './instalar-app.component.html',
  styleUrl: './instalar-app.component.css'
})
export class InstalarAppComponent {
  showScrollTop = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
