// Create Intersection Observers for different animation stages
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: [0.1, 0.5, 0.8] // Different thresholds for different stages
};

// Stage 1: Initial map fade in
const mapFadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-map');
            mapFadeObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Stage 2: County color filtering
const countyFilterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.intersectionRatio > 0.5) {
            const counties = document.querySelectorAll('.county');
            counties.forEach(county => {
                // Keep only counties with color classes 7-11
                const hasTargetColor = Array.from(county.classList).some(className => {
                    const colorNum = parseInt(className.replace('color-', ''));
                    return colorNum >= 7 && colorNum <= 11;
                });
                
                if (!hasTargetColor) {
                    county.classList.add('fade');
                }
            });
            countyFilterObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Stage 3: Text appearance
const textObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.intersectionRatio > 0.8) {
            const textOverlay = document.querySelector('.map-text-overlay');
            if (textOverlay) {
                textOverlay.classList.add('show');
            }
            textObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Set up observers when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mapSection = document.querySelector('#learn-section');
    if (mapSection) {
        mapSection.classList.add('map-animate');
        mapFadeObserver.observe(mapSection);
        countyFilterObserver.observe(mapSection);
        textObserver.observe(mapSection);
    }
});
