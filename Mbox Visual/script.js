(function () {
  const header = document.querySelector(".header");
  const burger = document.getElementById("burger");
  const mobile = document.getElementById("mobile");
  const year = document.getElementById("year");

  // Ano automático
  if (year) year.textContent = new Date().getFullYear();

  // Header sólido ao rolar
  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add("is-solid");
    else header.classList.remove("is-solid");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menu mobile
  const openMenu = () => {
    mobile.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    mobile.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    mobile.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mobile.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  burger?.addEventListener("click", () => {
    const isOpen = mobile.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  mobile?.addEventListener("click", (e) => {
    if (e.target === mobile) closeMenu();
  });

  document.querySelectorAll(".mobile__link").forEach((a) => {
    a.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closePrivacy();
    }
  });

  // ===== Modal Política de Privacidade =====
  const privacyModal = document.getElementById("privacyModal");
  const privacyDate = document.getElementById("privacyDate");
  const openPrivacyButtons = document.querySelectorAll("[data-open-privacy]");
  const closePrivacyButtons = document.querySelectorAll("[data-close-privacy]");

  if (privacyDate) {
    const d = new Date();
    privacyDate.textContent = d.toLocaleDateString("pt-BR");
  }

  const openPrivacy = () => {
    if (!privacyModal) return;
    privacyModal.classList.add("is-open");
    privacyModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeMenu(); // se estiver aberto, fecha o menu mobile
  };

  const closePrivacy = () => {
    if (!privacyModal) return;
    privacyModal.classList.remove("is-open");
    privacyModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openPrivacyButtons.forEach((btn) => btn.addEventListener("click", openPrivacy));
  closePrivacyButtons.forEach((btn) => btn.addEventListener("click", closePrivacy));

  // ===== Link ativo no menu conforme seção =====
  const navLinks = document.querySelectorAll('.nav a.nav__link[href^="#"]');
  const sections = Array.from(document.querySelectorAll("main section[id]"));

  const setActive = (hash) => {
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === hash);
    });
  };

  // Clique: seta ativo na hora
  navLinks.forEach((a) => {
    a.addEventListener("click", () => {
      const href = a.getAttribute("href");
      if (href) setActive(href);
    });
  });

  // Scroll: observa qual seção está visível
  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) setActive("#" + visible.target.id);
      },
      { root: null, threshold: [0.35, 0.55, 0.7] }
    );

    sections.forEach((s) => obs.observe(s));
  }
})();
