// Update progress bar as user scrolls
document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('progress-bar');
    const mapSection = document.querySelector('#learn-section');
    const mapTextOverlay = document.querySelector('.map-text-overlay');
    let mapAnimationStarted = false;
    let countyFilterStarted = false;
    let textShown = false;
    
    window.addEventListener('scroll', () => {
        // Progress bar update
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        progressBar.style.width = `${progress}%`;

        // Map animations
        if (mapSection) {
            const rect = mapSection.getBoundingClientRect();
            const sectionTop = rect.top;
            const sectionHeight = rect.height;
            
            // Stage 1: Initial fade in
            if (sectionTop < windowHeight * 0.8 && !mapAnimationStarted) {
                mapSection.classList.add('fade-in-map');
                mapAnimationStarted = true;
            }
            
            // Stage 2: Filter counties
            if (sectionTop < windowHeight * 0.5 && !countyFilterStarted) {
                const counties = document.querySelectorAll('.county');
                counties.forEach(county => {
                    const classList = Array.from(county.classList);
                    const colorClass = classList.find(c => c.startsWith('color-'));
                    if (colorClass) {
                        const colorNum = parseInt(colorClass.split('-')[1]);
                        if (colorNum < 7) {
                            county.style.opacity = '0.1';
                        }
                    }
                });
                countyFilterStarted = true;
            }
            
            // Stage 3: Show text
            if (sectionTop < windowHeight * 0.3 && !textShown && mapTextOverlay) {
                mapTextOverlay.style.opacity = '1';
                mapTextOverlay.style.transform = 'translateX(0)';
                textShown = true;
            }
        }
    });

    // Add smooth scrolling for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const section = document.querySelector(this.getAttribute('href'));
            section.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add intersection observer for fade-in effects
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe all content sections
    document.querySelectorAll('.content-section').forEach((section) => {
        observer.observe(section);
    });
});
