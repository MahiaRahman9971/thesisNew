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
        this.cachedData = null;
    }

    async init() {
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
            'W': 'White',
            'B': 'Black',
            'H': 'Hispanic',
            'A': 'Asian',
            'O': 'Other'
        };
        return ethnicityMap[code] || 'Unknown';
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
        console.log('Showing step:', this.currentStep);
        if (!this.flowContainer) {
            this.flowContainer = document.createElement('div');
            this.flowContainer.className = 'flow-container';
            document.querySelector('#move-option .card-content').appendChild(this.flowContainer);
        }

        // Show current step content
        this.flowContainer.innerHTML = await this.getStepContent();

        // Add event listeners
        const form = this.flowContainer.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStepSubmit(e);
            });
        }

        // Add back button listener
        const backBtn = this.flowContainer.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateStep(-1));
        }

        // Add finish button listener
        const finishBtn = this.flowContainer.querySelector('.finish-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                console.log('Finish button clicked');
                this.showActionPlanSummary();
            });
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
                    <div class="neighborhood-explorer">
                        <h3>Explore Neighborhoods</h3>
                        <p class="section-description">Discover the best neighborhoods for your family based on your preferences</p>
                        <div class="content">
                            <div id="opportunity-map">
                                <p><em>Opportunity Map Coming Soon</em></p>
                            </div>
                            <div class="neighborhood-selection">
                                <h4>Top Neighborhoods in ${this.data.zipCode}</h4>
                                <form id="neighborhood-form">
                                    <div class="neighborhood-list">
                                        ${await this.getNeighborhoodOptions()}
                                    </div>
                                    <div class="button-group">
                                        <button type="button" class="back-btn">Back</button>
                                        <button type="submit" class="next-btn">Next</button>
                                    </div>
                                </form>
                            </div>
                        </div>
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
                                    <a href="https://www.hud.gov/topics/housing_choice_voucher_program_section_8" target="_blank">Affordable Housing</a>
                                    <a href="https://craigslist.org" target="_blank">Craigslist</a>
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

    async fetchAllData() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay show';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Fetching community data for ${this.data.zipCode}...</div>
        `;
        document.body.appendChild(loadingOverlay);

        try {
            const [neighborhoods, schools, programsResponse] = await Promise.all([
                fetch('/api/neighborhoods', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ zipCode: this.data.zipCode })
                }).then(res => res.json()),
                fetch('/api/schools-move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        zipCode: this.data.zipCode,
                        childAge: this.data.childAge 
                    })
                }).then(res => res.json()),
                fetch('/api/programs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ zipCode: this.data.zipCode })
                }).then(res => res.json())
            ]);

            // Extract programs array from response
            const programs = programsResponse && programsResponse.programs ? programsResponse.programs : [];

            this.cachedData = { 
                neighborhoods, 
                schools,
                programs // Store just the programs array
            };
        } catch (error) {
            console.error('Error fetching data:', error);
            this.cachedData = {
                neighborhoods: [],
                schools: [],
                programs: []
            };
        } finally {
            loadingOverlay.remove();
        }
    }

    async handleStepSubmit(e) {
        e.preventDefault();
        console.log('Handling step submit');
        const formData = new FormData(e.target);
        
        switch (this.steps[this.currentStep]) {
            case 'location':
                this.data.zipCode = formData.get('zipCode');
                // Fetch all data when zipcode is submitted
                await this.fetchAllData();
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
        }

        // Move to next step
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            await this.showCurrentStep();
        } else {
            this.showActionPlanSummary();
        }
    }

    async getNeighborhoodOptions() {
        if (!this.cachedData) {
            return '<p>Please enter a ZIP code first.</p>';
        }

        return this.cachedData.neighborhoods.map(n => `
            <div class="radio-option">
                <input type="radio" name="neighborhood" value="${n.name}" id="${n.name}" required>
                <label for="${n.name}">
                    <h5>${n.name}</h5>
                    <p class="neighborhood-desc">${n.description}</p>
                    <div class="neighborhood-stats">
                    </div>
                </label>
            </div>
        `).join('');
    }

    async getSchoolOptions() {
        if (!this.cachedData) {
            return '<p>Please enter a ZIP code first.</p>';
        }

        return this.cachedData.schools.map(s => `
            <div class="school-card">
                <input type="radio" name="school" value="${s.name}" id="${s.name}" required>
                <div class="school-info">
                    <h3 class="school-name">${s.name}</h3>
                    <div class="school-type">(elementary, K-5)</div>
                    <p class="school-description">${s.description}</p>
                </div>
                <div class="school-rating">
                    <span class="rating-label">Rating</span>
                    <span class="rating-value">${s.rating}/10</span>
                    <div class="school-distance">${s.distance} miles from ${this.data.zipCode}</div>
                </div>
            </div>
        `).join('');
    }

    async getCommunityPrograms() {
        if (!this.cachedData || !this.cachedData.programs) {
            return '<p>Please enter a ZIP code first.</p>';
        }

        // Ensure programs is an array
        const programs = Array.isArray(this.cachedData.programs) ? this.cachedData.programs : [];
        if (programs.length === 0) {
            return '<p>No programs found in this area.</p>';
        }

        const programsHTML = programs.map(program => `
            <div class="checkbox-option">
                <input type="checkbox" name="program" value="${program.id}" id="${program.id}">
                <label for="${program.id}">
                    <strong>${program.name}</strong>
                    <span class="program-type">${program.type}</span>
                    <p class="program-desc">${program.description}</p>
                    <div class="program-details">
                        <p><strong>Age Range:</strong> ${program.ageRange}</p>
                        <p><strong>Location:</strong> ${program.location}</p>
                        <div class="program-contact">
                            <p><strong>Contact:</strong></p>
                            <ul>
                                <li>Phone: ${program.contact.phone}</li>
                                <li>Email: ${program.contact.email}</li>
                                <li>Website: <a href="${program.contact.website}" target="_blank">${program.contact.website}</a></li>
                            </ul>
                        </div>
                    </div>
                </label>
            </div>
        `).join('');

        return programsHTML;
    }

    navigateStep(direction) {
        console.log('Navigating step:', direction);
        // Update step
        this.currentStep += direction;
        this.showCurrentStep();
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

    showActionPlanSummary() {
        // Hide the flow container
        if (this.flowContainer) {
            this.flowContainer.style.display = 'none';
        }

        // Get personalization data
        const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');

        // Show and populate the summary section
        const summarySection = document.getElementById('action-plan-summary');
        if (summarySection) {
            // Update child information section
            const childName = quizData['child1-name'] || '--';
            document.getElementById('child-name-header').textContent = `${childName}'s Information`;
            document.getElementById('summary-child-name').textContent = childName;
            document.getElementById('summary-child-age').textContent = quizData['child1-age'] || '--';
            document.getElementById('summary-child-gender').textContent = quizData['child1-gender'] || '--';
            document.getElementById('summary-child-ethnicity').textContent = this.mapEthnicityCode(quizData['child1-ethnicity']) || '--';
            document.getElementById('summary-country').textContent = quizData['country'] || '--';

            // Update choices section
            document.getElementById('summary-zipcode').textContent = this.data.zipCode || '--';
            document.getElementById('summary-neighborhood').textContent = this.data.selectedNeighborhood || '--';
            document.getElementById('summary-school').textContent = this.data.selectedSchool || '--';
            document.getElementById('summary-programs').textContent = 
                this.data.selectedPrograms.length > 0 ? 
                this.data.selectedPrograms.join(', ') : '--';

            // Show the section
            summarySection.style.display = 'block';

            // Add event listeners for buttons
            const editButton = document.getElementById('edit-choices');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    summarySection.style.display = 'none';
                    if (this.flowContainer) {
                        this.flowContainer.style.display = 'block';
                    }
                    this.currentStep = 0;
                    this.showCurrentStep();
                });
            }

            const downloadButton = document.getElementById('download-summary');
            if (downloadButton) {
                downloadButton.addEventListener('click', () => this.downloadSummaryAsPDF());
            }
        }
    }

    async downloadSummaryAsPDF() {
        // Get personalization data
        const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');
        const childName = quizData['child1-name'] || '--';
        
        // Create HTML content for PDF
        const content = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50; text-align: center;">Action Plan Summary</h1>
                <p style="color: #666; text-align: center;">Generated on ${new Date().toLocaleDateString()}</p>

                <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h2 style="color: #2c3e50;">${childName}'s Information</h2>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div><strong>Name:</strong> ${childName}</div>
                        <div><strong>Age:</strong> ${quizData['child1-age'] || '--'}</div>
                        <div><strong>Gender:</strong> ${quizData['child1-gender'] || '--'}</div>
                        <div><strong>Ethnicity:</strong> ${this.mapEthnicityCode(quizData['child1-ethnicity']) || '--'}</div>
                        <div><strong>Country of Origin:</strong> ${quizData['country'] || '--'}</div>
                    </div>
                </div>

                <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h2 style="color: #2c3e50;">Your Choices</h2>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div><strong>ZIP Code:</strong> ${this.data.zipCode || '--'}</div>
                        <div><strong>Neighborhood:</strong> ${this.data.selectedNeighborhood || '--'}</div>
                        <div><strong>Selected School:</strong> ${this.data.selectedSchool || '--'}</div>
                        <div><strong>Community Programs:</strong> ${this.data.selectedPrograms.length > 0 ? this.data.selectedPrograms.join(', ') : '--'}</div>
                    </div>
                </div>

                <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h2 style="color: #2c3e50;">Recommended Next Steps</h2>
                    <ul style="list-style-type: none; padding: 0;">
                        <li style="margin: 10px 0;">□ Schedule a visit to the selected school</li>
                        <li style="margin: 10px 0;">□ Research housing options in the chosen neighborhood</li>
                        <li style="margin: 10px 0;">□ Contact community programs for enrollment information</li>
                        <li style="margin: 10px 0;">□ Plan moving logistics and timeline</li>
                        <li style="margin: 10px 0;">□ Gather required documents for school enrollment</li>
                    </ul>
                </div>
            </div>
        `;

        try {
            // Create a new window for the PDF content
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write('<html><head><title>Action Plan Summary</title></head><body>');
            printWindow.document.write(content);
            printWindow.document.write('</body></html>');
            printWindow.document.close();

            // Wait for content to load then print
            printWindow.setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('There was an error generating the PDF. Please try again.');
        }
    }
}

class StayAndImproveFlow {
    constructor() {
        this.zipCode = '';
        this.selectedPrograms = new Set();
        this.schoolsData = [];
        this.programsData = [];
        
        // Bind methods to this
        this.handleStayOptionClick = this.handleStayOptionClick.bind(this);
        this.handleProgramSelection = this.handleProgramSelection.bind(this);
        this.handleSavePrograms = this.handleSavePrograms.bind(this);
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const stayActionBtn = document.getElementById('stay-action-btn');
        if (stayActionBtn) {
            stayActionBtn.addEventListener('click', this.handleStayOptionClick);
        }
        
        const saveProgramsBtn = document.getElementById('save-programs-btn');
        if (saveProgramsBtn) {
            saveProgramsBtn.addEventListener('click', this.handleSavePrograms);
        }

        // Add global click handler for program selection
        document.addEventListener('click', (e) => {
            // Handle program selection buttons
            if (e.target.matches('.select-program-btn')) {
                const programId = e.target.dataset.programId;
                if (programId) {
                    this.handleProgramSelection(programId);
                }
            }
            
            // Handle remove buttons in selected programs list
            if (e.target.matches('.remove-program-btn')) {
                const programId = e.target.dataset.programId;
                if (programId) {
                    this.handleProgramSelection(programId);
                }
            }
        });
    }

    async fetchSchools() {
        try {
            const response = await fetch('/api/schools-stay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    zipCode: this.zipCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch schools: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.schools) {
                throw new Error('Invalid school data received');
            }

            this.schoolsData = data.schools;
            this.renderSchools();
        } catch (error) {
            console.error('Error fetching schools:', error);
            throw error;
        }
    }

    async fetchTownshipInfo() {
        try {
            const response = await fetch('/api/township', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    zipCode: this.zipCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch township info: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.township) {
                throw new Error('Invalid township data received');
            }

            this.renderTownshipInfo(data.township);
            return data;
        } catch (error) {
            console.error('Error fetching township info:', error);
            throw error;
        }
    }

    async fetchCommunityPrograms(zipCode) {
        try {
            const response = await fetch('/api/programs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ zipCode })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch programs: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.programs) {
                throw new Error('Invalid response format');
            }

            return data.programs;
        } catch (error) {
            console.error('Error fetching community programs:', error);
            throw error;
        }
    }

    async handleStayOptionClick() {
        const detailsSection = document.getElementById('stay-improve-details');
        const loadingIndicator = detailsSection.querySelector('.loading-indicator');
        
        // Show loading state
        detailsSection.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        
        // Scroll to the details section
        detailsSection.scrollIntoView({ behavior: 'smooth' });
        
        try {
            // Get zip code from local storage
            const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');
            console.log('Quiz data from localStorage:', quizData);
            
            this.zipCode = quizData.zipCode || '';
            console.log('Retrieved zip code:', this.zipCode);
            
            if (!this.zipCode) {
                throw new Error('Please complete the personalization quiz first to provide your zip code.');
            }
            
            // Fetch data in parallel
            await Promise.all([
                this.fetchTownshipInfo(),
                this.fetchSchools(),
                this.fetchCommunityPrograms(this.zipCode)
            ]);
            
        } catch (error) {
            console.error('Error in stay option flow:', error);
            alert(error.message || 'An error occurred while loading your community information. Please try again.');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }

    async handleProgramSelection(programId) {
        if (!programId) return;
        
        console.log('Handling program selection:', programId); // Debug log

        if (this.selectedPrograms.has(programId)) {
            this.selectedPrograms.delete(programId);
        } else {
            this.selectedPrograms.add(programId);
        }

        console.log('Selected programs:', Array.from(this.selectedPrograms)); // Debug log

        // Update all buttons with this program ID
        const buttons = document.querySelectorAll(`[data-program-id="${programId}"]`);
        const isSelected = this.selectedPrograms.has(programId);
        
        buttons.forEach(button => {
            if (button.classList.contains('select-program-btn')) {
                button.textContent = isSelected ? 'Selected' : 'Select Program';
                button.classList.toggle('selected', isSelected);
            }
        });

        this.updateSelectedProgramsList();
    }

    updateSelectedProgramsList() {
        const selectedList = document.getElementById('selected-programs-list');
        if (!selectedList) return;
        
        selectedList.innerHTML = '';
        
        if (this.selectedPrograms.size === 0) {
            selectedList.innerHTML = '<p class="no-results">No programs selected</p>';
            return;
        }

        const selectedProgramsArray = Array.from(this.selectedPrograms)
            .map(id => this.programsData.find(p => p.id === id))
            .filter(Boolean);

        selectedProgramsArray.forEach(program => {
            const programElement = document.createElement('div');
            programElement.className = 'selected-program-item';
            programElement.innerHTML = `
                <span class="program-name">${program.name}</span>
                <button class="remove-program-btn" data-program-id="${program.id}">
                    Remove
                </button>
            `;
            selectedList.appendChild(programElement);
        });
    }

    async handleSavePrograms() {
        try {
            const response = await fetch('/api/save-programs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    zipCode: this.zipCode,
                    selectedPrograms: Array.from(this.selectedPrograms)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save programs');
            }

            // Show success message
            alert('Your program selections have been saved successfully!');
            
        } catch (error) {
            console.error('Error saving programs:', error);
            alert('There was an error saving your program selections. Please try again.');
        }
    }

    generateStars(rating) {
        const fullStar = '★';
        const emptyStar = '☆';
        return Array(5).fill('').map((_, i) => i < rating ? fullStar : emptyStar).join('');
    }

    // Helper method to get child age from quiz data
    getChildAge() {
        const quizData = JSON.parse(localStorage.getItem('personalizationQuiz') || '{}');
        return parseInt(quizData['child1-age']) || 10; // Default to 10 if not found
    }

    renderSchools() {
        const schoolsList = document.getElementById('schools-list');
        if (!schoolsList) return;
        
        schoolsList.innerHTML = '';
        
        if (!Array.isArray(this.schoolsData)) {
            console.error('Schools data is not an array:', this.schoolsData);
            return;
        }

        // Sort schools by rating (highest to lowest)
        const sortedSchools = [...this.schoolsData].sort((a, b) => (b.rating || 0) - (a.rating || 0));

        if (sortedSchools.length === 0) {
            schoolsList.innerHTML = '<p class="no-results">No schools found.</p>';
            return;
        }

        sortedSchools.forEach(school => {
            const schoolElement = document.createElement('div');
            schoolElement.className = 'school-card';
            
            schoolElement.innerHTML = `
                <div class="school-header">
                    <h4 class="school-name">${school.name}</h4>
                    <div class="school-rating">${this.generateStars(school.rating)}</div>
                </div>
                <div class="school-score">${school.score || 'N/A'}</div>
                <p class="school-description">${school.description || 'No description available'}</p>
            `;
            
            schoolsList.appendChild(schoolElement);
        });
    }

    renderTownshipInfo(data) {
        const townshipName = document.getElementById('township-name');
        const townshipDescription = document.getElementById('township-description');
        const townshipWebsite = document.getElementById('township-website');
        
        if (townshipName) {
            townshipName.textContent = data.townshipName || 'Township information not available';
        }
        
        if (townshipDescription) {
            if (Array.isArray(data.description) && data.description.length > 0) {
                const bulletPoints = data.description
                    .map(point => `<li>${point}</li>`)
                    .join('');
                townshipDescription.innerHTML = `<ul class="township-bullets">${bulletPoints}</ul>`;
            } else {
                townshipDescription.textContent = 'Description not available';
            }
        }
        
        if (townshipWebsite) {
            if (data.websiteUrl) {
                const url = data.websiteUrl.startsWith('http') ? data.websiteUrl : `https://${data.websiteUrl}`;
                townshipWebsite.innerHTML = `
                    <a href="${url}" class="township-link" target="_blank" rel="noopener noreferrer">
                        Visit Township Website
                    </a>
                `;
            } else {
                townshipWebsite.innerHTML = `
                    <span class="township-link disabled">Website not available</span>
                `;
            }
        }
    }

    renderPrograms(programs) {
        const programsContainer = document.getElementById('programs-container');
        if (!programsContainer) {
            console.error('Programs container not found');
            return;
        }

        if (!programs || !programs.length) {
            programsContainer.innerHTML = '<p class="text-center">No programs found for your area.</p>';
            return;
        }

        const programsHTML = programs.map(program => `
            <div class="program-card" data-program-id="${program.id}">
                <div class="program-header">
                    <h3>${program.name}</h3>
                    <span class="program-type">${program.type}</span>
                </div>
                <p class="program-description">${program.description}</p>
                <div class="program-details">
                    <p><strong>Age Range:</strong> ${program.ageRange}</p>
                    <p><strong>Location:</strong> ${program.location}</p>
                    <div class="program-contact">
                        <p><strong>Contact:</strong></p>
                        <ul>
                            <li>Phone: ${program.contact.phone}</li>
                            <li>Email: ${program.contact.email}</li>
                            <li>Website: <a href="${program.contact.website}" target="_blank">${program.contact.website}</a></li>
                        </ul>
                    </div>
                </div>
                <button class="select-program-btn" data-program-id="${program.id}">
                    ${this.selectedPrograms.has(program.id) ? 'Selected' : 'Select Program'}
                </button>
            </div>
        `).join('');

        programsContainer.innerHTML = programsHTML;
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

    // Initialize StayAndImproveFlow
    const stayAndImproveFlow = new StayAndImproveFlow();

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
                'zipCode': formData.get('zipCode'), // Match the HTML form field name
                
                // Child Information (for first child)
                'child1-name': formData.get('child1-name'),
                'child1-age': formData.get('child1-age'),
                'child1-gender': formData.get('child1-gender'),
                'child1-ethnicity': formData.get('child1-ethnicity')
            };
            
            console.log('Form data being saved:', quizData); // Debug log
            
            // Save to localStorage
            localStorage.setItem('personalizationQuiz', JSON.stringify(quizData));
            
            // Verify data was saved correctly
            const savedData = JSON.parse(localStorage.getItem('personalizationQuiz'));
            console.log('Data after saving:', savedData); // Debug log
            
            // Show success checkmark
            const checkmark = document.getElementById('submit-success');
            if (checkmark) {
                // Remove and re-add the class to restart animation
                checkmark.classList.remove('show');
                void checkmark.offsetWidth; // Force reflow
                checkmark.classList.add('show');

                // Hide the checkmark after 3 seconds
                setTimeout(() => {
                    checkmark.classList.remove('show');
                }, 3000);
            }
            
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
