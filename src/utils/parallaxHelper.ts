/**
 * Parallax Helper - Manages parallax scroll effects across the page
 * Elements move at 30% slower speed than scroll for depth effect
 */

export function useParallaxEffect() {
  const handleScroll = () => {
    const parallaxElements = document.querySelectorAll('[data-parallax-speed]');
    const scrollY = window.scrollY;

    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.getAttribute('data-parallax-speed') || '0.3');
      const offset = scrollY * speed;
      (element as HTMLElement).style.transform = `translateY(${offset}px)`;
    });
  };

  return { handleScroll };
}

/**
 * Apply parallax effect to an element
 * Usage: <div data-parallax-speed="0.3">Content</div>
 */
export function setupParallaxListener() {
  window.addEventListener('scroll', () => {
    const parallaxElements = document.querySelectorAll('[data-parallax-speed]');
    const scrollY = window.scrollY;

    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.getAttribute('data-parallax-speed') || '0.3');
      const offset = scrollY * speed;
      (element as HTMLElement).style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });
}

/**
 * Apply floating animation to an element
 * Usage: <div data-float-duration="4">Content</div>
 */
export function setupFloatingElements() {
  const floatingElements = document.querySelectorAll('[data-float-duration]');
  floatingElements.forEach((element, idx) => {
    const duration = parseFloat(element.getAttribute('data-float-duration') || '4');
    const delay = (idx * 0.2) % duration;
    (element as HTMLElement).style.animation = `subtleFloat ${duration}s ease-in-out ${delay}s infinite`;
  });
}

/**
 * Setup micro-waggle animation for empty state and error icons
 */
export function setupMicroWaggleElements() {
  const waggleElements = document.querySelectorAll('[data-micro-waggle]');
  waggleElements.forEach((element) => {
    const duration = parseFloat(element.getAttribute('data-micro-waggle') || '3');
    (element as HTMLElement).style.animation = `microWaggle ${duration}s ease-in-out infinite`;
  });
}

/**
 * Initialize all premium animations on page load
 */
export function initializePremiumAnimations() {
  setupParallaxListener();
  setupFloatingElements();
  setupMicroWaggleElements();
}
