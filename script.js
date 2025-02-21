// Classes and Functions
class ExploreNewAreasFlow {
    constructor() {
        this.currentStep = 0;
        this.data = {
            zipCode: '',
            selectedNeighborhood: '',
            childAge: '',
            selectedSchool: '',
            selectedHousing: [],
            selectedPrograms: [],
            countryOfOrigin: '',
            ethnicity: ''
        };
        this.steps = [
            'location',
            'neighborhoods',
            'schools',
            'housing',
            'programs',
            'summary'
        ];
        this.flowContainer = null;
    }

    init() {
        console.log('Initializing ExploreNewAreasFlow');
        // Get personalization data
        const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');
        if (quizData) {
            console.log('Quiz data found:', quizData);
            // Use the correct field names from the form and ensure age is a number
            this.data.childAge = parseInt(quizData['child1-age']) || 0;
            this.data.countryOfOrigin = quizData['country'] || '';
            this.data.ethnicity = this.mapEthnicityCode(quizData['child1-ethnicity']) || '';
            
            // Log the values for debugging
            console.log('Child age:', this.data.childAge);
            console.log('Country:', this.data.countryOfOrigin);
            console.log('Ethnicity:', this.data.ethnicity);
        } else {
            console.log('No quiz data found');
        }

        // Initialize event listeners
        const moveButton = document.querySelector('.move-btn');
        console.log('Move button found:', moveButton);
        if (moveButton) {
            moveButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Move button clicked');
                this.startFlow();
            });
        }
    }

    mapEthnicityCode(code) {
        const ethnicityMap = {
            'asian': 'Asian',
            'black': 'Black',
            'hispanic': 'Hispanic',
            'native': 'Native American',
            'pacific': 'Pacific Islander',
            'white': 'White',
            'mixed': 'Mixed Race',
            'other': 'Other',
            'prefer-not': 'Prefer not to say'
        };
        return ethnicityMap[code] || '';
    }

    async startFlow() {
        console.log('Starting flow');
        this.currentStep = 0;
        
        // Create or get the flow container
        let flowContainer = document.querySelector('.explore-flow-container');
        if (!flowContainer) {
            flowContainer = document.createElement('div');
            flowContainer.className = 'explore-flow-container';
            const takeActionSection = document.querySelector('#take-action');
            takeActionSection.appendChild(flowContainer);
        }
        this.flowContainer = flowContainer;
        
        await this.showCurrentStep();
        
        // Scroll to the flow container
        this.flowContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async showCurrentStep() {
        // Clear previous content
        this.flowContainer.innerHTML = await this.getStepContent();
        
        // Set up navigation
        const backBtn = this.flowContainer.querySelector('.back-btn');
        const nextBtn = this.flowContainer.querySelector('.next-btn');
        const form = this.flowContainer.querySelector('form');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateStep(-1));
        }
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleStepSubmit(e);
            });
        }

        // For programs step, enable next button when at least one program is selected
        if (this.steps[this.currentStep] === 'programs') {
            const checkboxes = this.flowContainer.querySelectorAll('input[type="checkbox"]');
            const nextButton = this.flowContainer.querySelector('.next-btn');
            
            const updateNextButton = () => {
                const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
                nextButton.disabled = !anyChecked;
            };
            
            checkboxes.forEach(cb => {
                cb.addEventListener('change', updateNextButton);
            });
            
            // Initial check
            updateNextButton();
        }
    }

    async getStepContent() {
        const baseClass = 'flow-step-content';
        
        switch (this.steps[this.currentStep]) {
            case 'location':
                return `
                    <div class="${baseClass}">
                        <h3>Where Would You Like to Move?</h3>
                        <form id="location-form">
                            <p>Do you know where you want to live next?</p>
                            <div class="form-group">
                                <label for="zipCode">Enter ZIP Code:</label>
                                <input type="text" id="zipCode" name="zipCode" pattern="[0-9]{5}" required>
                            </div>
                            <div class="button-group">
                                <button type="submit" class="next-btn">Next</button>
                            </div>
                        </form>
                    </div>
                `;

            case 'neighborhoods':
                return `
                    <div class="${baseClass}">
                        <h3>Explore Neighborhoods</h3>
                        <div id="opportunity-map">
                            <p><em>Opportunity Map Coming Soon</em></p>
                        </div>
                        <form id="neighborhood-form">
                            <h4>Top Neighborhoods in ${this.data.zipCode}</h4>
                            <div class="neighborhood-list">
                                ${await this.getNeighborhoodOptions()}
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-btn">Back</button>
                                <button type="submit" class="next-btn">Next</button>
                            </div>
                        </form>
                    </div>
                `;

            case 'schools':
                return `
                    <div class="${baseClass}">
                        <h3>Schools in ${this.data.selectedNeighborhood}</h3>
                        <form id="schools-form">
                            <p>Showing schools appropriate for children age ${this.data.childAge}:</p>
                            <div class="schools-list">
                                ${await this.getSchoolOptions()}
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-btn">Back</button>
                                <button type="submit" class="next-btn">Next</button>
                            </div>
                        </form>
                    </div>
                `;

            case 'housing':
                return `
                    <div class="${baseClass}">
                        <h3>Housing Options</h3>
                        <form id="housing-form">
                            <div class="housing-links">
                                <h4>Find Housing On:</h4>
                                <div class="housing-options">
                                    <a href="https://www.redfin.com/zipcode/${this.data.zipCode}" target="_blank">Redfin</a>
                                    <a href="https://www.zillow.com/homes/${this.data.zipCode}" target="_blank">Zillow</a>
                                    <a href="https://www.housing8.com/search/${this.data.zipCode}" target="_blank">Housing8</a>
                                    <a href="https://craigslist.org/search/hhh?postal=${this.data.zipCode}" target="_blank">Craigslist</a>
                                </div>
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-btn">Back</button>
                                <button type="submit" class="next-btn">Continue</button>
                            </div>
                        </form>
                    </div>
                `;

            case 'programs':
                return `
                    <div class="${baseClass}">
                        <h3>Community Programs</h3>
                        <form id="programs-form">
                            <div class="programs-list">
                                ${await this.getCommunityPrograms()}
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-btn">Back</button>
                                <button type="submit" class="next-btn">Next</button>
                            </div>
                        </form>
                    </div>
                `;

            case 'summary':
                return `
                    <div class="${baseClass}">
                        <h3>Community Demographics</h3>
                        ${await this.getDemographicsSummary()}
                        <div class="button-group">
                            <button type="button" class="back-btn">Back</button>
                            <button type="button" class="finish-btn">Finish</button>
                        </div>
                    </div>
                `;
        }
    }

    async getSchoolOptions() {
        console.log('Getting school options');
        const schools = [
            { name: 'Washington Elementary', type: 'elementary', ageRange: [5, 11] },
            { name: 'Lincoln Middle School', type: 'middle', ageRange: [11, 14] },
            { name: 'Roosevelt High', type: 'high', ageRange: [14, 18] },
            { name: 'Montessori Academy', type: 'elementary', ageRange: [3, 11] },
            { name: 'STEM Magnet School', type: 'middle', ageRange: [11, 14] },
            { name: 'Early Learning Center', type: 'preschool', ageRange: [3, 5] },
            { name: 'College Prep Academy', type: 'high', ageRange: [14, 18] }
        ];
        
        // Filter schools based on child's age
        const childAge = parseInt(this.data.childAge);
        const appropriateSchools = schools.filter(school => 
            childAge >= school.ageRange[0] && childAge <= school.ageRange[1]
        );
        
        if (appropriateSchools.length === 0) {
            return `<p>No schools found for age ${childAge}. Please contact the local school district for more options.</p>`;
        }
        
        return appropriateSchools.map(s => `
            <div class="radio-option">
                <input type="radio" name="school" value="${s.name}" id="${s.name}" required>
                <label for="${s.name}">
                    ${s.name}
                    <span class="school-type">(${s.type})</span>
                </label>
            </div>
        `).join('');
    }

    async handleStepSubmit(e) {
        console.log('Handling step submit');
        const formData = new FormData(e.target);
        
        switch (this.steps[this.currentStep]) {
            case 'location':
                this.data.zipCode = formData.get('zipCode');
                break;
            case 'neighborhoods':
                this.data.selectedNeighborhood = formData.get('neighborhood');
                break;
            case 'schools':
                this.data.selectedSchool = formData.get('school');
                break;
            case 'housing':
                // Housing selection is optional
                break;
            case 'programs':
                this.data.selectedPrograms = Array.from(formData.getAll('program'));
                break;
            case 'demographics':
                this.data.countryOfOrigin = formData.get('countryOfOrigin');
                this.data.ethnicity = formData.get('ethnicity');
                break;
        }

        // Move to next step
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            await this.showCurrentStep();
        }
    }

    navigateStep(direction) {
        console.log('Navigating step:', direction);
        // Update step
        this.currentStep += direction;
        this.showCurrentStep();
    }

    // Mock data methods - replace with real API calls
    async getNeighborhoodOptions() {
        console.log('Getting neighborhood options');
        const neighborhoods = [
            'Downtown District',
            'Riverside Community',
            'Park Heights',
            'University Area',
            'Tech Corridor'
        ];
        
        return neighborhoods.map(n => `
            <div class="radio-option">
                <input type="radio" name="neighborhood" value="${n}" id="${n}" required>
                <label for="${n}">${n}</label>
            </div>
        `).join('');
    }

    async getCommunityPrograms() {
        console.log('Getting community programs');
        const programs = [
            'After School Program',
            'Youth Sports League',
            'Cultural Center',
            'Library Reading Club',
            'STEM Workshop Series',
            'Art & Music Program',
            'Language Learning Center'
        ];
        
        return programs.map(p => `
            <div class="checkbox-option">
                <input type="checkbox" name="program" value="${p}" id="${p}">
                <label for="${p}">${p}</label>
            </div>
        `).join('') + `
        <p class="helper-text">Please select at least one program to continue</p>
        `;
    }

    async getDemographicsSummary() {
        console.log('Getting demographics summary');
        return `
            <div class="demographics-summary">
                <h4>Community Statistics</h4>
                <div class="stat-group">
                    <h5>Racial Demographics</h5>
                    <ul>
                        <li>Asian: 15%</li>
                        <li>Black: 20%</li>
                        <li>Hispanic: 25%</li>
                        <li>White: 35%</li>
                        <li>Other: 5%</li>
                    </ul>
                </div>
                <div class="stat-group">
                    <h5>Cultural Resources</h5>
                    <ul>
                        <li>Cultural Centers: 3</li>
                        <li>Language Schools: 2</li>
                        <li>Religious Centers: 8</li>
                        <li>International Markets: 4</li>
                    </ul>
                </div>
                <div class="stat-group">
                    <h5>Community Stats</h5>
                    <ul>
                        <li>Median Income: $75,000</li>
                        <li>College Education: 45%</li>
                        <li>Family Households: 65%</li>
                        <li>Average Commute: 25 min</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize progress bar and animations
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
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Map animations
        if (mapSection) {
            const rect = mapSection.getBoundingClientRect();
            const sectionTop = rect.top;
            
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
            if (section) {
                section.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize ExploreNewAreasFlow
    const exploreFlow = new ExploreNewAreasFlow();
    exploreFlow.init();

    // Initialize factor card interactions
    document.querySelectorAll('.factor-card').forEach(card => {
        card.addEventListener('click', () => {
            const factor = card.dataset.factor;
            if (factor) {
                showFactorDetails(factor);
            }
        });
    });

    // Initialize quiz form
    const addChildButton = document.getElementById('add-child');
    const childrenSection = document.getElementById('children-section');
    let childCount = 1;

    if (addChildButton && childrenSection) {
        addChildButton.addEventListener('click', () => {
            childCount++;
            const newChild = createChildForm(childCount);
            childrenSection.appendChild(newChild);
        });
    }

    // Initialize form submission
    const form = document.getElementById('personalization-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const quizData = {
                // Parent Information
                'parent-name': formData.get('parent-name'),
                'parent-email': formData.get('parent-email'),
                'parent-phone': formData.get('parent-phone'),
                'income': formData.get('income'),
                'country': formData.get('country'),
                
                // Child Information (for first child)
                'child1-name': formData.get('child1-name'),
                'child1-age': formData.get('child1-age'),
                'child1-gender': formData.get('child1-gender'),
                'child1-ethnicity': formData.get('child1-ethnicity')
            };
            
            // Save to localStorage
            localStorage.setItem('personalizationQuiz', JSON.stringify(quizData));
            
            // Show success message
            alert('Your information has been saved. We will personalize your experience based on your responses.');
            
            // Refresh ExploreNewAreasFlow if it exists
            const exploreFlow = new ExploreNewAreasFlow();
            exploreFlow.init();
        });
    }

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
});
