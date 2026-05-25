const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const themeToggle = qs("#themeToggle");
const modeText = qs("#mode-text");
const menuToggle = qs(".menu-toggle");
const siteMenu = qs("#site-menu");
const searchInput = qs("#projectSearch");
const filterButtons = qsa(".filter-button");
const certTabs = qsa(".cert-tab");
const certRail = qs("#certRail");
const railButtons = qsa(".rail-button");
const searchableItems = qsa(".searchable");
const modal = qs("#certificateModal");
const modalImage = qs("#modalImage");
const modalTitle = qs("#modalTitle");
const modalClose = qs("#modalClose");

let activeFilter = "all";
let activeCertFilter = "all";

const setTheme = (theme) => {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("portfolio-theme", nextTheme);

    if (themeToggle && modeText) {
        themeToggle.setAttribute("aria-pressed", String(nextTheme === "light"));
        modeText.textContent = nextTheme === "light" ? "Light" : "Dark";
    }
};

const initTheme = () => {
    const savedTheme = localStorage.getItem("portfolio-theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(savedTheme || systemTheme);

    themeToggle?.addEventListener("click", () => {
        setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
};

const initMenu = () => {
    menuToggle?.addEventListener("click", () => {
        const isOpen = siteMenu.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    qsa("a", siteMenu).forEach((link) => {
        link.addEventListener("click", () => {
            siteMenu.classList.remove("open");
            menuToggle?.setAttribute("aria-expanded", "false");
        });
    });
};

const itemMatchesFilter = (item) => {
    if (activeFilter === "all") return true;
    return (item.dataset.category || "").split(" ").includes(activeFilter);
};

const itemMatchesCertFilter = (item) => {
    if (activeCertFilter === "all") return true;
    return (item.dataset.certCategory || "").split(" ").includes(activeCertFilter);
};

const itemMatchesSearch = (item, query) => {
    if (!query) return true;
    return `${item.textContent} ${item.dataset.keywords || ""}`.toLowerCase().includes(query);
};

const applySearchAndFilters = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();

    searchableItems.forEach((item) => {
        const isProject = item.classList.contains("project-card");
        const isCertificate = item.classList.contains("cert-card");
        const visibleByFilter = !isProject || itemMatchesFilter(item);
        const visibleByCertFilter = !isCertificate || itemMatchesCertFilter(item);
        const visibleBySearch = itemMatchesSearch(item, query);
        item.classList.toggle("is-hidden", !(visibleByFilter && visibleByCertFilter && visibleBySearch));
    });
};

const initFiltering = () => {
    searchInput?.addEventListener("input", applySearchAndFilters);

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter || "all";
            filterButtons.forEach((control) => control.classList.toggle("active", control === button));
            applySearchAndFilters();
        });
    });
};

const initCertificateTabs = () => {
    certTabs.forEach((button) => {
        button.addEventListener("click", () => {
            activeCertFilter = button.dataset.certFilter || "all";
            certTabs.forEach((control) => control.classList.toggle("active", control === button));
            applySearchAndFilters();
            certRail?.scrollTo({ left: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
        });
    });

    railButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!certRail) return;
            const direction = button.dataset.rail === "prev" ? -1 : 1;
            certRail.scrollBy({
                left: direction * Math.min(certRail.clientWidth * 0.86, 760),
                behavior: prefersReducedMotion.matches ? "auto" : "smooth"
            });
        });
    });
};

const initReveal = () => {
    const targets = qsa(".reveal");

    targets.forEach((target, index) => {
        target.style.setProperty("--reveal-delay", `${Math.min((index % 5) * 70, 280)}ms`);
    });

    if (prefersReducedMotion.matches) {
        targets.forEach((target) => target.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );

    targets.forEach((target) => observer.observe(target));
};

const initActiveNav = () => {
    const links = qsa(".site-menu a");
    const sections = qsa("main section[id]");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.getAttribute("id");
                links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
            });
        },
        { threshold: 0.1, rootMargin: "-34% 0px -54% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
};

const initMotion = () => {
    const heroPanel = qs(".hero-panel");

    if (!prefersReducedMotion.matches) {
        window.addEventListener(
            "pointermove",
            (event) => {
                document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
                document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
            },
            { passive: true }
        );
    }

    window.addEventListener(
        "scroll",
        () => {
            if (prefersReducedMotion.matches || !heroPanel) return;
            heroPanel.style.setProperty("--hero-y", `${Math.min(window.scrollY * 0.055, 32)}px`);
        },
        { passive: true }
    );
};

const closeModal = () => {
    if (!modal?.open) return;
    modal.close();
    document.body.classList.remove("modal-open");
};

const initCertificateModal = () => {
    qsa(".cert-preview").forEach((button) => {
        button.addEventListener("click", () => {
            const image = button.dataset.image;
            const title = button.dataset.title || "Certificate preview";

            if (!modal || !modalImage || !modalTitle || !image) return;

            modalImage.src = image;
            modalImage.alt = title;
            modalTitle.textContent = title;
            document.body.classList.add("modal-open");
            modal.showModal();
        });
    });

    modalClose?.addEventListener("click", closeModal);

    modal?.addEventListener("click", (event) => {
        const rect = modal.getBoundingClientRect();
        const isBackdropClick =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;

        if (isBackdropClick) closeModal();
    });

    modal?.addEventListener("close", () => {
        document.body.classList.remove("modal-open");
    });
};

const init = () => {
    initTheme();
    initMenu();
    initFiltering();
    initCertificateTabs();
    initReveal();
    initActiveNav();
    initMotion();
    initCertificateModal();
};

init();
