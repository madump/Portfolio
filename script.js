/* ============================================================
   script.js — Portfolio Site Logic
   Loads ./assets/content.md, parses it, and populates the DOM.
   ============================================================ */

(function () {
  "use strict";

  /* --------------------------------------------------------
     1. MARKDOWN LOADER & PARSER
  -------------------------------------------------------- */
  async function loadContent() {
    try {
      const res = await fetch("./assets/content.md");
      if (!res.ok) throw new Error("Could not load content.md");
      const raw = await res.text();
      return parseContent(raw);
    } catch (err) {
      console.warn("content.md load failed:", err.message);
      return null;
    }
  }

  /**
   * Parse the custom-structured markdown into a JS object.
   * Sections are denoted by `# SECTION_NAME` and sub-sections by `## KEY`.
   */
  function parseContent(md) {
    const lines = md.split("\n");
    const data = {};
    let currentSection = null;
    let currentSubKey = null;
    let buffer = [];

    const flush = () => {
      if (!currentSection) return;
      const text = buffer.join("\n").trim();
      if (currentSubKey) {
        if (!data[currentSection]) data[currentSection] = {};
        if (!data[currentSection][currentSubKey]) {
          data[currentSection][currentSubKey] = [];
        }
        data[currentSection][currentSubKey].push(parseBlock(text));
      } else {
        if (!data[currentSection]) data[currentSection] = {};
        parseIntoSection(data[currentSection], text);
      }
      buffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("## ")) {
        flush();
        currentSubKey = line.slice(3).trim();
      } else if (line.startsWith("# ")) {
        flush();
        currentSubKey = null;
        currentSection = line.slice(2).trim();
        if (!data[currentSection]) data[currentSection] = {};
      } else {
        buffer.push(line);
      }
    }
    flush();
    return data;
  }

  /** Parse a block of key:value lines into an object. */
  function parseBlock(text) {
    const obj = {};
    const lines = text.split("\n");
    let lastKey = null;

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith("#")) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && !line.trim().startsWith("-")) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        obj[key] = val;
        lastKey = key;
      } else if (line.trim().startsWith("- ") && lastKey) {
        if (!Array.isArray(obj[lastKey])) {
          obj[lastKey] = obj[lastKey] ? [obj[lastKey]] : [];
        }
        obj[lastKey].push(line.trim().slice(2));
      }
    }
    return obj;
  }

  /** Parse a flat key:value block into an existing section object. */
  function parseIntoSection(sectionObj, text) {
    const lines = text.split("\n");
    let lastKey = null;

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith("#")) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && !line.trim().startsWith("-")) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        sectionObj[key] = val;
        lastKey = key;
      } else if (line.trim().startsWith("- ") && lastKey) {
        if (!Array.isArray(sectionObj[lastKey])) {
          sectionObj[lastKey] = sectionObj[lastKey]
            ? [sectionObj[lastKey]]
            : [];
        }
        sectionObj[lastKey].push(line.trim().slice(2));
      }
    }
  }

  /* --------------------------------------------------------
     2. POPULATE DOM
  -------------------------------------------------------- */
  function populate(data) {
    if (!data) return;

    const S = data;

    /* ---- HERO ---- */
    const hero = S.HERO || {};
    setText("heroEyebrow", hero.eyebrow);
    setHTML("heroHeadline", highlightKey(hero.headline));
    setText("heroSub", hero.subheadline);
    setTextAndAttr("heroCta1", hero.cta_primary);
    setTextAndAttr("heroCta2", hero.cta_secondary);
    setText("heroBadge", hero.badge);

    /* ---- TRUST STRIP ---- */
    const trust = S.TRUST || {};
    const trustItems = Object.values(trust).flat().filter(Boolean);
    const track = el("trustTrack");
    if (track && trustItems.length) {
      const doubled = [...trustItems, ...trustItems]; // for seamless loop
      track.innerHTML = doubled
        .map((t) => `<span class="trust-item">${t}</span>`)
        .join("");
    }

    /* ---- ABOUT ---- */
    const about = S.ABOUT || {};
    setText("aboutEyebrow", about.eyebrow);
    setHTML("aboutHeadline", about.headline);
    const aboutBody = el("aboutBody");
    if (aboutBody) {
      const paras = [about.body_1, about.body_2, about.body_3].filter(Boolean);
      aboutBody.innerHTML = paras.map((p) => `<p>${p}</p>`).join("");
    }
    const statsEl = el("aboutStats");
    if (statsEl) {
      const stats = [
        { v: about.stats_1_value, l: about.stats_1_label },
        { v: about.stats_2_value, l: about.stats_2_label },
        { v: about.stats_3_value, l: about.stats_3_label },
      ];
      statsEl.innerHTML = stats
        .map(
          (s) =>
            `<div class="stat-item">
              <div class="stat-value">${s.v || ""}</div>
              <div class="stat-label">${s.l || ""}</div>
            </div>`,
        )
        .join("");
    }

    /* ---- SERVICES ---- */
    const services = S.SERVICES || {};
    setText("servicesEyebrow", services.eyebrow);
    setHTML("servicesHeadline", services.headline);
    setText("servicesSub", services.subheadline);

    const serviceKeys = Object.keys(S.SERVICES || {}).filter((k) =>
      k.startsWith("SERVICE_"),
    );
    const servicesGrid = el("servicesGrid");
    if (servicesGrid) {
      const serviceItems = serviceKeys
        .map((k) => (S.SERVICES[k] || [])[0])
        .filter(Boolean);
      servicesGrid.innerHTML = serviceItems
        .map(
          (s, i) => `
        <div class="service-card reveal reveal-delay-${(i % 4) + 1}">
          <span class="service-icon">${s.icon || "◈"}</span>
          <h3>${s.title || ""}</h3>
          <p>${s.description || ""}</p>
          <div class="service-features">
            ${(s.features || [])
              .map((f) => `<div class="service-feature">${f}</div>`)
              .join("")}
          </div>
        </div>`,
        )
        .join("");
    }

    /* ---- CASE STUDIES ---- */
    const cs = S.CASE_STUDIES || {};
    setText("caseEyebrow", cs.eyebrow);
    setHTML("caseHeadline", cs.headline);
    setText("caseSub", cs.subheadline);

    const caseKeys = Object.keys(S.CASE_STUDIES || {}).filter((k) =>
      k.startsWith("CASE_"),
    );
    const casesGrid = el("casesGrid");
    if (casesGrid) {
      const caseItems = caseKeys
        .map((k) => (S.CASE_STUDIES[k] || [])[0])
        .filter(Boolean);
      casesGrid.innerHTML = caseItems
        .map(
          (c, i) => `
        <div class="case-card reveal reveal-delay-${i + 1}">
          <div class="case-card-top">
            <div class="case-tag">${c.tag || ""}</div>
            <h3>${c.title || ""}</h3>
          </div>
          <div class="case-card-body">
            <div class="case-section-title">The Challenge</div>
            <p>${c.challenge || ""}</p>
            <div class="case-section-title">The Solution</div>
            <p>${c.solution || ""}</p>
            <div class="case-section-title">The Results</div>
            <div class="case-results">
              ${[c.result_1, c.result_2, c.result_3]
                .filter(Boolean)
                .map((r) => `<div class="case-result">${r}</div>`)
                .join("")}
            </div>
          </div>
        </div>`,
        )
        .join("");
    }

    /* ---- PROCESS ---- */
    const process = S.PROCESS || {};
    setText("processEyebrow", process.eyebrow);
    setHTML("processHeadline", process.headline);
    setText("processSub", process.subheadline);

    const stepKeys = Object.keys(S.PROCESS || {}).filter((k) =>
      k.startsWith("STEP_"),
    );
    const stepsEl = el("processSteps");
    if (stepsEl) {
      const steps = stepKeys
        .map((k) => (S.PROCESS[k] || [])[0])
        .filter(Boolean);
      stepsEl.innerHTML = steps
        .map(
          (s, i) => `
        <div class="process-step reveal reveal-delay-${i + 1}">
          <div class="step-number">${s.number || `0${i + 1}`}</div>
          <h3>${s.title || ""}</h3>
          <p>${s.description || ""}</p>
        </div>`,
        )
        .join("");
    }

    /* ---- DIFFERENTIATORS ---- */
    const diff = S.DIFFERENTIATORS || {};
    setText("diffEyebrow", diff.eyebrow);
    setHTML("diffHeadline", diff.headline);

    const diffKeys = Object.keys(S.DIFFERENTIATORS || {}).filter((k) =>
      k.startsWith("DIFF_"),
    );
    const diffGrid = el("diffGrid");
    if (diffGrid) {
      const diffs = diffKeys
        .map((k) => (S.DIFFERENTIATORS[k] || [])[0])
        .filter(Boolean);
      diffGrid.innerHTML = diffs
        .map(
          (d, i) => `
        <div class="diff-card reveal reveal-delay-${(i % 4) + 1}">
          <span class="diff-icon">${d.icon || "◈"}</span>
          <h3>${d.title || ""}</h3>
          <p>${d.description || ""}</p>
        </div>`,
        )
        .join("");
    }

    /* ---- TESTIMONIALS ---- */
    const test = S.TESTIMONIALS || {};
    setText("testEyebrow", test.eyebrow);
    setHTML("testHeadline", test.headline);

    const testKeys = Object.keys(S.TESTIMONIALS || {}).filter((k) =>
      k.startsWith("TESTIMONIAL_"),
    );
    const testGrid = el("testimonialsGrid");
    if (testGrid) {
      const testimonials = testKeys
        .map((k) => (S.TESTIMONIALS[k] || [])[0])
        .filter(Boolean);
      testGrid.innerHTML = testimonials
        .map(
          (t, i) => `
        <div class="testimonial-card reveal reveal-delay-${i + 1}">
          <p class="testimonial-quote">${t.quote || ""}</p>
          <div class="testimonial-meta">
            <div class="testimonial-name">${t.name || ""}</div>
            <div class="testimonial-title">${t.title || ""}</div>
          </div>
          ${t.result ? `<div class="testimonial-result">${t.result}</div>` : ""}
        </div>`,
        )
        .join("");
    }

    /* ---- CTA ---- */
    const cta = S.CTA || {};
    setText("ctaEyebrow", cta.eyebrow);
    setHTML("ctaHeadline", highlightKey(cta.headline));
    setText("ctaSub", cta.subheadline);
    setTextAndAttr("ctaBtn", cta.cta_primary);
    setText("ctaNote", cta.cta_note);

    /* ---- CONTACT ---- */
    const contact = S.CONTACT || {};
    setText("contactEyebrow", contact.eyebrow);
    setHTML("contactHeadline", contact.headline);
    setText("contactSub", contact.subheadline);

    const contactDetails = el("contactDetails");
    if (contactDetails) {
      contactDetails.innerHTML = `
        <div class="contact-detail">
          <div class="contact-detail-icon">✉</div>
          <div>
            <div class="contact-detail-label">Email</div>
            <div class="contact-detail-text"><a href="mailto:${contact.email}" style="color:var(--c-accent)">${contact.email || ""}</a></div>
          </div>
        </div>
        <div class="contact-detail">
          <div class="contact-detail-icon">◎</div>
          <div>
            <div class="contact-detail-label">Location</div>
            <div class="contact-detail-text">${contact.location || ""}</div>
          </div>
        </div>`;
    }

    /* ---- FOOTER ---- */
    const footer = S.FOOTER || {};
    setText("footerTagline", footer.tagline);
    setText("footerCopy", footer.copyright);

    const footerLinks = el("footerLinks");
    if (footerLinks && footer.links) {
      const links = Array.isArray(footer.links) ? footer.links : [];
      const hrefs = {
        "Book a Call": "#contact",
        Services: "#services",
        "Case Studies": "#work",
        Contact: "#contact",
      };
      footerLinks.innerHTML = links
        .map((l) => `<a href="${hrefs[l] || "#"}">${l}</a>`)
        .join("");
    }
  }

  /* --------------------------------------------------------
     3. DOM HELPERS
  -------------------------------------------------------- */
  function el(id) {
    return document.getElementById(id);
  }

  function setText(id, val) {
    const node = el(id);
    if (node && val) node.textContent = val;
  }

  function setHTML(id, val) {
    const node = el(id);
    if (node && val) node.innerHTML = val;
  }

  function setTextAndAttr(id, val) {
    const node = el(id);
    if (node && val) {
      node.textContent = val;
    }
  }

  /** Wrap last 2–3 words of a headline in an <em> for accent styling */
  function highlightKey(str) {
    if (!str) return "";
    const words = str.split(" ");
    if (words.length < 4) return str;
    const split = Math.max(words.length - 3, Math.floor(words.length * 0.55));
    return (
      words.slice(0, split).join(" ") +
      " <em>" +
      words.slice(split).join(" ") +
      "</em>"
    );
  }

  /* --------------------------------------------------------
     4. NAVIGATION SCROLL BEHAVIOR
  -------------------------------------------------------- */
  function initNav() {
    const navbar = document.getElementById("navbar");
    const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
    const sections = document.querySelectorAll("section[id]");
    const toggle = document.getElementById("navToggle");
    const linksWrap = document.getElementById("navLinks");

    // Scrolled class
    window.addEventListener(
      "scroll",
      () => {
        navbar.classList.toggle("scrolled", window.scrollY > 20);
        highlightActiveNav(sections, navLinks);
      },
      { passive: true },
    );

    // Mobile toggle
    toggle?.addEventListener("click", () => {
      linksWrap?.classList.toggle("open");
    });

    // Close on link click
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        linksWrap?.classList.remove("open");
      });
    });
  }

  function highlightActiveNav(sections, navLinks) {
    let current = "";
    sections.forEach((section) => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) current = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }

  /* --------------------------------------------------------
     5. SCROLL REVEAL
  -------------------------------------------------------- */
  function initReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  /* Observe dynamically added .reveal elements */
  function observeNewReveals() {
    const observer = new MutationObserver(() => {
      document.querySelectorAll(".reveal:not(.observed)").forEach((node) => {
        node.classList.add("observed");
        const io = new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              io.unobserve(e.target);
            }
          },
          { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
        );
        io.observe(node);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* --------------------------------------------------------
     6. CONTACT FORM
  -------------------------------------------------------- */
  function initForm() {
    const form = document.getElementById("contactForm");
    const success = document.getElementById("formSuccess");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Simulate submission (replace with real endpoint)
      form.style.display = "none";
      if (success) success.style.display = "flex";
    });
  }

  /* --------------------------------------------------------
     7. BOOT
  -------------------------------------------------------- */
  async function init() {
    initNav();
    observeNewReveals();
    initForm();

    const data = await loadContent();
    if (data) {
      populate(data);
    } else {
      // Fallback: site still renders, content just won't populate from MD
      console.warn(
        "Running without content.md — serve this via a local server (e.g., npx serve .) to load the markdown file.",
      );
    }

    // Trigger reveal for anything visible on load
    requestAnimationFrame(() => {
      initReveal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
