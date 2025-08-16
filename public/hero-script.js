// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Initialize hero animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Hide page transition on load
    hidePageTransition();
    
    // Check if user is already logged in
    if (localStorage.getItem("username")) {
        // Redirect to whiteboard if already logged in
        showPageTransition();
        setTimeout(() => {
            window.location.href = "whiteboard.html";
        }, 500);
        return;
    }
    
    initParticles();
    initHeroAnimations();
    initScrollAnimations();
    initHeroCanvas();
    initInteractiveElements();
    initThemeToggle();
});

// Theme toggle
function initThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        body.classList.toggle('dark-theme');

        // Save theme preference
        if (body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    }
}

// Particles animation
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.hue = Math.random() * 60 + 200; // Blue to purple range
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        particles.forEach((particle, i) => {
            particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Hero section animations
function initHeroAnimations() {
    // Create timeline for hero entrance
    const heroTl = gsap.timeline({ delay: 0.5 });
    
    // Animate hero title lines
    heroTl.to('.hero-title', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    })
    .to('.title-line', {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
    }, "-=0.5")
    .to('.hero-description', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.3")
    .to('.hero-buttons', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.3")
    .to('.whiteboard-preview', {
        opacity: 1,
        scale: 1,
        rotationY: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.5");

    // Animate floating tools
    gsap.to('.tool-item', {
        y: -20,
        duration: 2,
        stagger: 0.3,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
    });

    // Header scroll effect
    ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        toggleClass: {className: "scrolled", targets: ".header"}
    });
}

// Scroll-triggered animations
function initScrollAnimations() {
    // Section title animations
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.fromTo(title, {
            opacity: 0,
            y: 50
        }, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: title,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Category cards animation
    gsap.utils.toArray('.category-card').forEach((card, index) => {
        gsap.fromTo(card, {
            opacity: 0,
            y: 100,
            scale: 0.8
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: index * 0.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Feature items animation
    gsap.utils.toArray('.feature-item').forEach((item, index) => {
        gsap.fromTo(item, {
            opacity: 0,
            y: 50
        }, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.15,
            ease: "power3.out",
            scrollTrigger: {
                trigger: item,
                start: "top 85%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

// Interactive canvas for hero section
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;
    
    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let hue = 0;
    
    // Auto-drawing animation
    let autoDrawing = true;
    let autoPath = [];
    let autoIndex = 0;
    
    // Create an interesting path for auto-drawing
    function createAutoPath() {
        autoPath = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        
        // Create a spiral pattern
        for (let angle = 0; angle < Math.PI * 6; angle += 0.1) {
            const x = centerX + Math.cos(angle) * (radius * (angle / (Math.PI * 6)));
            const y = centerY + Math.sin(angle) * (radius * (angle / (Math.PI * 6)));
            autoPath.push({ x, y });
        }
    }
    
    createAutoPath();
    
    function draw(e) {
        if (!isDrawing) return;
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        
        [lastX, lastY] = [e.offsetX, e.offsetY];
        hue += 2;
        if (hue >= 360) hue = 0;
    }
    
    function autoDrawStep() {
        if (!autoDrawing || autoIndex >= autoPath.length) {
            autoIndex = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setTimeout(() => {
                if (autoDrawing) autoDrawStep();
            }, 2000);
            return;
        }
        
        const point = autoPath[autoIndex];
        
        if (autoIndex === 0) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = `hsl(${(autoIndex * 3) % 360}, 70%, 60%)`;
            
            const prevPoint = autoPath[autoIndex - 1];
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        
        autoIndex++;
        setTimeout(() => {
            if (autoDrawing) autoDrawStep();
        }, 50);
    }
    
    // Start auto-drawing
    autoDrawStep();
    
    // Mouse events for manual drawing
    canvas.addEventListener('mousedown', (e) => {
        autoDrawing = false;
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);
    
    // Resume auto-drawing when mouse leaves
    canvas.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!isDrawing) {
                autoDrawing = true;
                autoIndex = 0;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                autoDrawStep();
            }
        }, 3000);
    });
}

// Interactive elements
function initInteractiveElements() {
    // Enhanced card hover effects
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        const cardFront = card.querySelector('.card-front');
        const cardBack = card.querySelector('.card-back');

        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                transform: 'rotateY(180deg)',
                duration: 1.2,
                ease: 'power4.inOut'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                transform: 'rotateY(0deg)',
                duration: 1.2,
                ease: 'power4.inOut'
            });
        });
    });
    
    // Button hover effects
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .plan-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            gsap.to(button, {
                scale: 1.05,
                duration: 0.2,
                ease: "power2.out"
            });
        });
        
        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        });
    });
    
    // Navigation smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: target,
                    ease: "power2.inOut"
                });
            }
        });
    });
}

// Page transition functions
function showPageTransition() {
    const transition = document.getElementById('pageTransition');
    transition.classList.add('active');
}

function hidePageTransition() {
    const transition = document.getElementById('pageTransition');
    transition.classList.remove('active');
}

function goToLogin() {
    showPageTransition();
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

function goToSignup() {
    // For now, redirect to login - you can create a separate signup page later
    goToLogin();
}

function startCollaborating() {
    showPageTransition();
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

function watchDemo() {
    // Scroll to features section with animation
    const featuresSection = document.getElementById('features');
    gsap.to(window, {
        duration: 1.5,
        scrollTo: featuresSection,
        ease: "power2.inOut"
    });
}

function selectPlan(planType) {
    // Show plan selection animation
    const card = document.querySelector(`[data-category="${planType}"]`);
    
    gsap.to(card, {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
            // Here you can add logic to handle plan selection
            console.log(`Selected plan: ${planType}`);
            // For now, redirect to login
            setTimeout(() => {
                goToLogin();
            }, 500);
        }
    });
}

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const toggle = document.querySelector('.nav-mobile-toggle');
    
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Add mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.nav-mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
});

// Parallax effect for background elements
function initParallaxEffects() {
    gsap.utils.toArray('.hero::before').forEach(element => {
        gsap.to(element, {
            yPercent: -50,
            ease: "none",
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
}

// Initialize parallax on load
document.addEventListener('DOMContentLoaded', initParallaxEffects);

// Cursor trail effect (optional enhancement)
function initCursorTrail() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: "power2.out"
        });
    });
}

// Add to CSS for cursor trail
const cursorTrailCSS = `
.cursor-trail {
    position: fixed;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.6) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: screen;
}
`;

// Add cursor trail styles
const styleSheet = document.createElement('style');
styleSheet.textContent = cursorTrailCSS;
document.head.appendChild(styleSheet);

// Initialize cursor trail
document.addEventListener('DOMContentLoaded', initCursorTrail);
