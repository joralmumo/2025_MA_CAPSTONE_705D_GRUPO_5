import { Component, HostListener, AfterViewInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit {
  showScrollTop = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 300;
    this.checkScroll();
  }

  async scrollToTop() {
    // Se remueven las clases de animación
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .stagger-animation > *');
    animatedElements.forEach((element) => {
      element.classList.remove('visible');
      // Reflow para reiniciar las animaciones
      void (element as HTMLElement).offsetWidth;
    });

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Esperamos a que termine el scroll
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reiniciamos las animaciones del hero
    const heroElement = document.querySelector('.slide-in-left');
    if (heroElement) {
      heroElement.classList.remove('slide-in-left');
      void (heroElement as HTMLElement).offsetWidth;
      heroElement.classList.add('slide-in-left');
    }

    // Verificamos el scroll después de un pequeño delay
    setTimeout(() => this.checkScroll(), 100);
  }

  ngAfterViewInit() {
    this.checkScroll();
  }

  private checkScroll() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const windowHeight = window.innerHeight;

    animatedElements.forEach((element) => {
      const elementTop = (element as HTMLElement).getBoundingClientRect().top;
      if (elementTop < windowHeight * 0.85) {
        element.classList.add('visible');
      } else {
        element.classList.remove('visible');
      }
    });
  }
}
