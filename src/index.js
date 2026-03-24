document.querySelectorAll('a[href^="#"]').forEach(a => {
a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
});

// Nav scroll effect
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
});

// Mobile toggle
document.getElementById('nav-toggle').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
});

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.step, .domain-card, .measure-card, .role-card').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
});