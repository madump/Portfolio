/* ============================================================
   JHIM RICK MARCO - PORTFOLIO JS
   Navigation, animations, filtering, contact form, and utilities
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const WORKER_URL = 'https://jhimrick.jhimrickofficial.workers.dev/';

  /* Mobile navigation */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  function closeMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  /* Smooth anchor scrolling */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Entrance animations */
  const animatedElements = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animatedElements.forEach(function (element) { observer.observe(element); });
  } else {
    animatedElements.forEach(function (element) { element.classList.add('visible'); });
  }

  /* Portfolio filtering */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      filterButtons.forEach(function (item) { item.classList.remove('active'); });
      button.classList.add('active');
      const filter = button.dataset.filter || 'all';

      projectCards.forEach(function (card) {
        const categories = (card.dataset.category || '').split(' ');
        card.style.display = filter === 'all' || categories.includes(filter) ? '' : 'none';
      });
    });
  });

  /* Contact form submission through the existing Cloudflare Worker */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : 'Send Project Inquiry';

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        if (status) status.textContent = 'Please complete the required fields before sending.';
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const fullName = String(data.get('name') || '').trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      const firstName = nameParts.shift() || '';
      const lastName = nameParts.join(' ');
      const business = String(data.get('business') || '').trim();
      const budget = String(data.get('budget') || '').trim();
      const projectMessage = String(data.get('message') || '').trim();

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: String(data.get('email') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        service: String(data.get('service') || '').trim(),
        message: [
          business ? `Business: ${business}` : '',
          budget ? `Estimated budget: ${budget}` : '',
          projectMessage ? `Project details: ${projectMessage}` : ''
        ].filter(Boolean).join('\n\n')
      };

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }
      if (status) status.textContent = 'Sending your project inquiry...';

      try {
        const response = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let result = {};
        try { result = JSON.parse(responseText); } catch (error) { result = {}; }

        if (!response.ok) {
          throw new Error(result.error || 'Your inquiry could not be sent. Please try again.');
        }

        form.reset();
        if (status) status.textContent = result.message || 'Thank you! Your project inquiry has been sent successfully.';
      } catch (error) {
        console.error('Contact form submission error:', error);
        if (status) status.textContent = error.message || 'Something went wrong. Please try again.';
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  }

  /* Scroll-to-top button */
  const scrollTopButton = document.getElementById('scroll-top');
  if (scrollTopButton) {
    function updateScrollTopButton() {
      scrollTopButton.classList.toggle('show', window.scrollY > 600);
    }
    window.addEventListener('scroll', updateScrollTopButton, { passive: true });
    updateScrollTopButton();
    scrollTopButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Current year */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});