document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const fadeElements = document.querySelectorAll(".fade-in");
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = document.querySelectorAll("section[id]");

  /* =========================
     HEADER SCROLL EFFECT
  ========================= */
  function updateHeaderState() {
    if (!header) return;

    if (window.scrollY > 12) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState);

  /* =========================
     FADE IN ON SCROLL
  ========================= */
  if (fadeElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    fadeElements.forEach((el) => observer.observe(el));
  }

  /* =========================
     ACTIVE NAV LINK
  ========================= */
  function updateActiveNav() {
    if (!sections.length || !navLinks.length) return;

    let currentSectionId = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;

      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");

      if (href === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });
  }

  updateActiveNav();
  window.addEventListener("scroll", updateActiveNav);

  /* =========================
     SMOOTH NAV UX
  ========================= */
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
});
