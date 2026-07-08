// Mark that JavaScript is available — animation styles only apply under .js-enabled
document.documentElement.classList.add('js-enabled');

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    const toggleMenu = () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    };
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });

    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Smooth scrolling for same-page navigation links (instant if reduced motion is preferred)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            target.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });

// Scroll-triggered fade-in animations
// Content is fully visible by default; animations only run when JS is enabled,
// IntersectionObserver is supported, and the user has not requested reduced motion.
(function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        return; // Leave everything visible — no animation classes added
    }

    const animatedSelectors = [
        '.portfolio-card',
        '.treasury-card',
        '.timeline-item',
        '.readiness-item',
        '.pillar',
        '.thesis-card',
        '.leadership-card',
        '.org-node'
    ];

    const elements = Array.from(document.querySelectorAll(animatedSelectors.join(', ')));
    if (!elements.length) return;

    const reveal = (el) => el.classList.add('visible');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                reveal(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px 15% 0px' // generous margin so items reveal before entering view
    });

    elements.forEach(el => {
        // Only animate elements below the fold; anything already on screen stays visible
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.95) {
            return;
        }
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Safety net: never let content stay hidden (fast scrolling, observer edge cases)
    setTimeout(() => {
        elements.forEach(reveal);
    }, 4000);

    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();

// "Request Data Room Access" CTA: pre-select Strategic Partner, then scroll to contact
(function initDataRoomCta() {
    const inquirySelect = document.getElementById('cf-type');
    if (!inquirySelect) return;

    // Same-page CTA click (index.html)
    const cta = document.getElementById('dataroomCta');
    if (cta) {
        cta.addEventListener('click', () => {
            inquirySelect.value = 'Strategic Partner';
        });
    }

    // Cross-page preselect via ?inquiry= query param (e.g. from investor-relations.html)
    const inquiry = new URLSearchParams(window.location.search).get('inquiry');
    if (inquiry) {
        const hasOption = Array.from(inquirySelect.options).some(o => o.value === inquiry);
        if (hasOption) inquirySelect.value = inquiry;
    }
})();

// Contact Form Handling
// If a real endpoint is configured via the form's data-endpoint attribute
// (e.g. injected from a CONTACT_FORM_ENDPOINT environment variable at deploy time),
// the form POSTs there as JSON. Otherwise it falls back to a pre-filled email —
// no fake endpoint, no fake success message.
(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('formSubmit');
    const endpoint = (form.dataset.endpoint || '').trim();

    const setStatus = (message, type) => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = 'form-status' + (type ? ' ' + type : '');
    };

    const getField = (name) => form.querySelector('[name="' + name + '"]');

    const validate = () => {
        const errors = [];
        const name = getField('name').value.trim();
        const email = getField('email').value.trim();
        const inquiryType = getField('inquiryType').value;
        const message = getField('message').value.trim();

        if (name.length < 2) errors.push('Please enter your full name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
        if (!inquiryType) errors.push('Please select the nature of your inquiry.');
        if (message.length < 10) errors.push('Please include a brief message (at least 10 characters).');
        return errors;
    };

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const errors = validate();
        if (errors.length) {
            setStatus(errors[0], 'error');
            return;
        }

        const honeypot = getField('website');
        const payload = {
            name: getField('name').value.trim(),
            email: getField('email').value.trim(),
            phone: getField('phone').value.trim(),
            inquiryType: getField('inquiryType').value,
            message: getField('message').value.trim(),
            website: honeypot ? honeypot.value : '',
            source: 'liftfi.io contact form (' + window.location.pathname + ')'
        };

        if (endpoint) {
            try {
                submitBtn.disabled = true;
                setStatus('Submitting your inquiry…', 'pending');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    let serverMessage = '';
                    try {
                        const data = await res.json();
                        if (data && data.error) serverMessage = data.error;
                    } catch (parseErr) { /* fall through to generic message */ }
                    throw new Error(serverMessage || ('Request failed with status ' + res.status));
                }
                setStatus('Thank you. Your inquiry has been received. The Lift Fi team will review and follow up soon.', 'success');
                form.reset();
            } catch (err) {
                setStatus(err.message && err.message.indexOf('Request failed') === -1 && err.message.indexOf('fetch') === -1
                    ? err.message
                    : 'Something went wrong while submitting your inquiry. Please try again or contact admin@liftfi.io.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        } else {
            // Fallback: open the visitor's email client with a pre-filled message
            const subject = 'Lift Fi Inquiry — ' + payload.inquiryType;
            const bodyLines = [
                'Name: ' + payload.name,
                'Email: ' + payload.email,
                payload.phone ? 'Phone: ' + payload.phone : null,
                'Inquiry Type: ' + payload.inquiryType,
                '',
                payload.message
            ].filter(Boolean);
            const mailto = 'mailto:admin@liftfi.io'
                + '?subject=' + encodeURIComponent(subject)
                + '&body=' + encodeURIComponent(bodyLines.join('\n'));
            window.location.href = mailto;
            setStatus('Your email client has been opened with your inquiry pre-filled. If it did not open, please email admin@liftfi.io directly.', 'success');
        }
    });
})();
