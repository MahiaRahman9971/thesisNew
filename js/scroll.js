// Create Intersection Observer for the animation sequence
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
};

let animationInProgress = false;

function startMapAnimation() {
    if (animationInProgress) return;
    animationInProgress = true;
    
    const counties = document.querySelectorAll('.county');
    
    // Reset all counties to visible
    counties.forEach(county => {
        county.classList.remove('hidden');
    });
    
    // After 2 seconds, hide non-blue counties
    setTimeout(() => {
        counties.forEach(county => {
            const colorClass = Array.from(county.classList)
                .find(cls => cls.startsWith('color-'));
            if (colorClass) {
                const colorNum = parseInt(colorClass.replace('color-', ''));
                // Hide all except blue counties (7-11)
                if (colorNum < 7 || colorNum > 11) {
                    county.classList.add('hidden');
                }
            }
        });
    }, 2000);

    // After 6 seconds, hide blue counties
    setTimeout(() => {
        counties.forEach(county => {
            const colorClass = Array.from(county.classList)
                .find(cls => cls.startsWith('color-'));
            if (colorClass) {
                const colorNum = parseInt(colorClass.replace('color-', ''));
                if (colorNum >= 7 && colorNum <= 11) {
                    county.classList.add('hidden');
                }
            }
        });
    }, 6000);

    // After 7 seconds, show red counties
    setTimeout(() => {
        counties.forEach(county => {
            const colorClass = Array.from(county.classList)
                .find(cls => cls.startsWith('color-'));
            if (colorClass) {
                const colorNum = parseInt(colorClass.replace('color-', ''));
                if (colorNum >= 1 && colorNum <= 5) {
                    county.classList.remove('hidden');
                }
            }
        });
        
        // Reset animation flag after all animations are complete
        setTimeout(() => {
            animationInProgress = false;
        }, 1000);
    }, 7000);
}

const mapFadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            startMapAnimation();
        } else {
            // When scrolling away, reset the animation state
            animationInProgress = false;
            const counties = document.querySelectorAll('.county');
            counties.forEach(county => {
                county.classList.remove('hidden');
            });
        }
    });
}, observerOptions);

// Set up observer when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mapSection = document.querySelector('#learn-section');
    if (mapSection) {
        mapSection.classList.add('map-animate');
        mapFadeObserver.observe(mapSection);
    }
});
