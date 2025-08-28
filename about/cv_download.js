/*---------------------------------------*\
    CV Download Button Integration
    For JSON-based website structure
    Updated with enhanced features
    Author: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

// CV Download Button Integration Script
(function() {
    'use strict';

    // Download counter functionality
    function getDownloadCount() {
        return parseInt(localStorage.getItem('cvDownloadCount') || '0');
    }

    function incrementDownloadCount() {
        const count = getDownloadCount() + 1;
        localStorage.setItem('cvDownloadCount', count.toString());
        updateCounterDisplay();
        return count;
    }

    function updateCounterDisplay() {
        const counterElement = document.getElementById('downloadCount');
        if (counterElement) {
            counterElement.textContent = getDownloadCount();
        }
    }

    // Function to fetch JSON data from files
    async function fetchJSONData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Could not fetch data from ${url}:`, error);
            return null;
        }
    }

    // Function to extract all website content from JSON files
    async function extractAllWebsiteContent() {
        const content = {
            about: await fetchJSONData('./about.json'),
            publications: await fetchJSONData('../publications/publications.json'),
            projects: await fetchJSONData('../projects/projects.json'),
            events: await fetchJSONData('../events/events.json')
        };

        // Try to fetch blog data if it exists
        try {
            content.blogs = await fetchJSONData('../blog/blogs.json');
        } catch (error) {
            content.blogs = [];
        }

        return content;
    }

    // Function to create CV HTML content from JSON data
    function createCVContent(data) {
        const about = data.about;
        const cvHTML = `
            <div id="cv-content" style="display: none; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: black; line-height: 1.6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                
                <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #007bff; padding-bottom: 20px;">
                    <h1 style="font-size: 36px; margin-bottom: 10px; color: #333;">${about?.profile?.name || 'Ahmed M. M. Elsayed'}</h1>
                    <h2 style="font-size: 18px; color: #666; font-weight: 400;">${about?.profile?.title || 'Particle Physicist & Software Engineer'}</h2>
                    <p>University of Science and Technology of China | Hefei, China</p>
                    <p>ORCID: 0000-0002-4955-4958 | ✉ ahmedphysica@outlook.com</p>
                </div>

                ${about?.profile?.description ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Profile</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <div style="text-align: justify; font-size: 14px;">${about.profile.description.replace(/<br><br>/g, ' ').replace(/<[^>]*>/g, '')}</div>
                    </div>
                </div>
                ` : ''}

                ${about?.profile?.research_interests ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Research Interests</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <ul style="margin: 0; padding-left: 20px;">
                            ${about.profile.research_interests.map(interest => `<li style="margin-bottom: 5px; font-size: 14px;">${interest}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                ${about?.profile?.disciplines ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Disciplines</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <div style="font-size: 14px;">${about.profile.disciplines.join(' - ')}</div>
                    </div>
                </div>
                ` : ''}

                ${about?.profile?.languages ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Languages</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <div style="font-size: 14px;">${about.profile.languages.join(', ')}</div>
                    </div>
                </div>
                ` : ''}

                ${about?.education && about.education.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Education</h3>
                    ${about.education.map(edu => `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; page-break-inside: avoid;">
                            <h4 style="font-size: 16px; margin-bottom: 8px; color: #333;">${edu.degree}</h4>
                            <div style="font-style: italic; color: #666; font-size: 14px;">${edu.date}</div>
                            <div><strong><a href="${edu.institution_url}" style="color: #007bff; text-decoration: none;">${edu.institution}</a></strong>, ${edu.location}</div>
                            <div style="margin-top: 10px; text-align: justify; font-size: 14px;">${edu.research_focus}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${about?.work_experience && about.work_experience.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Work Experience</h3>
                    ${about.work_experience.map(exp => `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; page-break-inside: avoid;">
                            <h4 style="font-size: 16px; margin-bottom: 8px; color: #333;">${exp.role}</h4>
                            <div style="font-style: italic; color: #666; font-size: 14px;">${exp.date}</div>
                            <div><strong><a href="${exp.company_url}" style="color: #007bff; text-decoration: none;">${exp.company}</a></strong>, ${exp.location}</div>
                            <div style="margin-top: 10px; text-align: justify; font-size: 14px;">${exp.description}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${about?.programming_skills && Object.keys(about.programming_skills).length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Programming Skills</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        ${Object.entries(about.programming_skills).map(([category, skills]) => `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; page-break-inside: avoid;">
                                <h5 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #333;">${category}</h5>
                                <div style="font-size: 13px; color: #666;">${skills.map(skill => skill.name || skill).join(', ')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${data.publications && data.publications.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Publications</h3>
                    ${data.publications.map(pub => `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; page-break-inside: avoid;">
                            <h4 style="font-size: 16px; margin-bottom: 8px; color: #333;">
                                ${pub.link ? `<a href="${pub.link}" style="color: #007bff; text-decoration: none;">${pub.title}</a>` : pub.title}
                            </h4>
                            <div style="font-style: italic; color: #666; font-size: 14px;">${pub.paper_type} - ${pub.date}, ${pub.journal}</div>
                            ${pub.link ? `<div style="margin-top: 8px; font-size: 12px; color: #007bff;">DOI: <a href="${pub.link}" style="color: #007bff; text-decoration: none;">${pub.link}</a></div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${data.projects && data.projects.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Projects</h3>
                    ${data.projects.map(project => `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; page-break-inside: avoid;">
                            <h4 style="font-size: 16px; margin-bottom: 8px; color: #333;">
                                ${project.link && project.link !== '#' ? `<a href="${project.link}" style="color: #007bff; text-decoration: none;">${project.title}</a>` : project.title}
                            </h4>
                            <div style="font-style: italic; color: #666; font-size: 14px;">${project.type}</div>
                            ${project.link && project.link !== '#' ? `<div style="margin-top: 8px; font-size: 12px; color: #007bff;">Website: <a href="${project.link}" style="color: #007bff; text-decoration: none;">${project.link}</a></div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${data.events && data.events.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Events & Activities</h3>
                    ${data.events.map(event => `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; page-break-inside: avoid;">
                            <h4 style="font-size: 16px; margin-bottom: 8px; color: #333;">
                                ${event.link ? `<a href="${event.link}" style="color: #007bff; text-decoration: none;">${event.title}</a>` : event.title}
                            </h4>
                            <div style="font-style: italic; color: #666; font-size: 14px;">${event.date} - ${event.location}</div>
                            ${event.link ? `<div style="margin-top: 8px; font-size: 12px; color: #007bff;">Website: <a href="${event.link}" style="color: #007bff; text-decoration: none;">${event.link}</a></div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

            </div>
        `;

        return cvHTML;
    }

    // PDF generation function
    async function generatePDF() {
        const button = document.getElementById('downloadBtn');
        const originalText = button.innerHTML;
        
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<div style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent; animation: spin 1s ease-in-out infinite;"></div> Generating...';

        try {
            // Extract content from JSON files
            const websiteData = await extractAllWebsiteContent();
            
            // Create CV HTML
            const cvHTML = createCVContent(websiteData);
            
            // Add CV content to page temporarily
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cvHTML;
            document.body.appendChild(tempDiv);
            
            const cvElement = tempDiv.querySelector('#cv-content');
            cvElement.style.display = 'block';

            // Configure PDF options with enhanced page break handling
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: 'Ahmed_Elsayed_CV.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    allowTaint: true
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'a4', 
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { 
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.page-break-before',
                    after: '.page-break-after',
                    avoid: '.page-break-avoid'
                }
            };

            // Generate PDF
            await html2pdf().set(opt).from(cvElement).save();

            // Remove temporary content
            document.body.removeChild(tempDiv);

            // Increment download counter
            incrementDownloadCount();

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            // Reset button state
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    // Function to add CSS styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .cv-download-container {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .cv-download-btn {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 3px 10px rgba(0, 123, 255, 0.3);
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .cv-download-btn:hover {
                background: linear-gradient(135deg, #0056b3, #004085);
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
            }

            .cv-download-btn:active {
                transform: translateY(0);
            }

            .cv-download-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .download-counter {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
            }

            .counter-number {
                font-size: 18px;
                font-weight: bold;
                color: #007bff;
            }

            .counter-label {
                font-size: 10px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media screen and (max-width: 900px) {
                .cv-download-container {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .cv-download-btn {
                    font-size: 12px;
                    padding: 8px 16px;
                }
            }

            /* PDF-specific styles for page breaks */
            @media print {
                .page-break-avoid {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                
                .page-break-before {
                    page-break-before: always !important;
                    break-before: page !important;
                }
                
                .page-break-after {
                    page-break-after: always !important;
                    break-after: page !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Function to initialize the download button
    function initializeDownloadButton() {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            console.error('html2pdf library not found. Please include it in your page.');
            return;
        }

        // Find the page title
        const pageTop = document.querySelector('.page-top');
        if (!pageTop) {
            console.error('Could not find .page-top element to add download button');
            return;
        }

        // Create download button HTML
        const downloadButtonHTML = `
            <div class="cv-download-container">
                <button id="downloadBtn" class="cv-download-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    Download CV
                </button>
                
                <div class="download-counter">
                    <div class="counter-number" id="downloadCount">0</div>
                    <div class="counter-label">Downloads</div>
                </div>
            </div>
        `;

        // Add button to page-top
        pageTop.insertAdjacentHTML('beforeend', downloadButtonHTML);

        // Add event listener
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', generatePDF);
        }

        // Update counter display
        updateCounterDisplay();
    }

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addStyles();
                initializeDownloadButton();
            });
        } else {
            addStyles();
            initializeDownloadButton();
        }
    }

    // Start initialization
    init();

})();

