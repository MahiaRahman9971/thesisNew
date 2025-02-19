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

    // Factor card interactions
    document.querySelectorAll('.factor-card').forEach(card => {
        card.addEventListener('click', () => {
            const factor = card.dataset.factor;
            showFactorDetails(factor);
        });
    });

    function showFactorDetails(factor) {
        const factorInfo = {
            segregation: {
                title: "Understanding Segregation",
                content: "Segregation means that different groups of people live in separate areas. This can limit access to good schools, jobs, and other opportunities."
            },
            income: {
                title: "Income Inequality",
                content: "When there's a big gap between rich and poor families in an area, it can be harder for children from lower-income families to access the same opportunities."
            },
            schools: {
                title: "School Quality Matters",
                content: "Good schools provide better education, more resources, and better preparation for college. This gives children more opportunities for their future."
            },
            family: {
                title: "Family Structure",
                content: "Strong family support and stability helps children succeed. This includes having consistent care, guidance, and encouragement at home."
            },
            social: {
                title: "Community Connections",
                content: "Strong communities provide mentorship, job connections, and support networks that help families succeed together."
            }
        };

        const info = factorInfo[factor];
        
        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${info.title}</h3>
                <p>${info.content}</p>
                <button class="close-modal">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Check area button
    document.getElementById('check-area-btn').addEventListener('click', () => {
        // Smooth scroll to map section
        document.getElementById('map-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    });

    // Add modal styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        
        .close-modal {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            cursor: pointer;
            margin-top: 1rem;
            transition: background 0.3s ease;
        }
        
        .close-modal:hover {
            background: #c0392b;
        }
    `;
    document.head.appendChild(style);

    // Quiz form handling
    const addChildButton = document.getElementById('add-child');
    const childrenSection = document.getElementById('children-section');
    let childCount = 1;

    addChildButton.addEventListener('click', () => {
        childCount++;
        const newChild = createChildForm(childCount);
        childrenSection.appendChild(newChild);
    });

    function createChildForm(number) {
        const childDiv = document.createElement('div');
        childDiv.className = 'child-form';
        childDiv.id = `child${number}`;

        childDiv.innerHTML = `
            <div class="form-header">
                <h4>Child ${number}</h4>
                <button type="button" class="remove-child" aria-label="Remove child">&times;</button>
            </div>
            <div class="form-group">
                <label for="child${number}-name">Name*</label>
                <input type="text" id="child${number}-name" name="child${number}-name" required>
            </div>
            
            <div class="form-group">
                <label for="child${number}-gender">Gender*</label>
                <select id="child${number}-gender" name="child${number}-gender" required>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="child${number}-age">Age*</label>
                <input type="number" id="child${number}-age" name="child${number}-age" min="0" max="18" required>
            </div>
            
            <div class="form-group">
                <label for="child${number}-ethnicity">Ethnicity*</label>
                <select id="child${number}-ethnicity" name="child${number}-ethnicity" required>
                    <option value="">Select ethnicity</option>
                    <option value="asian">Asian</option>
                    <option value="black">Black or African American</option>
                    <option value="hispanic">Hispanic or Latino</option>
                    <option value="native">Native American</option>
                    <option value="pacific">Pacific Islander</option>
                    <option value="white">White</option>
                    <option value="mixed">Mixed Race</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                </select>
            </div>
        `;

        // Add remove button functionality
        const removeButton = childDiv.querySelector('.remove-child');
        removeButton.addEventListener('click', () => {
            childDiv.remove();
            if (childrenSection.querySelectorAll('.child-form').length === 0) {
                childCount = 0;
            }
        });

        return childDiv;
    }

    // Form submission
    const form = document.getElementById('personalization-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Here you would typically send the data to your backend
        console.log('Form data:', data);
        
        // For now, just show a success message
        alert('Thank you! Your personalized guidance is being prepared.');
    });

    // Add some additional styles for the remove button
    const additionalStyle = document.createElement('style');
    additionalStyle.textContent = `
        .form-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .remove-child {
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 1.2rem;
            line-height: 1;
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .remove-child:hover {
            background: #c0392b;
        }
    `;
    document.head.appendChild(additionalStyle);
});
