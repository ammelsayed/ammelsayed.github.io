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

    // Function to fetch JSON data from files
    async function fetchJSONData(url, fallback = []) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Could not fetch data from ${url}:`, error);
            return fallback; // return safe fallback instead of null
        }
    }

    async function extractAllWebsiteContent() {
        const basePath = window.location.pathname.includes('/about/') ? '..' : '.';

        const content = {
            about: await fetchJSONData(`${basePath}/about/about.json`, {}),   // object
            publications: await fetchJSONData(`${basePath}/publications/publications.json`, []),
            projects: await fetchJSONData(`${basePath}/projects/projects.json`, []),
            events: await fetchJSONData(`${basePath}/events/events.json`, []),  
            blogs: await fetchJSONData(`${basePath}/blog/blogs.json`, [])
        };
        return content;
    }

    // Helper: clone an element and copy a set of computed styles inline to each node
    // This improves html2canvas fidelity on iOS/webkit browsers.
    function cloneAndInlineComputedStyles(sourceEl) {
        const clone = sourceEl.cloneNode(true);

        // List of computed properties to copy (exclude width/margins/positioning that can cause overflow)
        const propertiesToCopy = [
            'background-color','background-image','background-size','background-position','background-repeat',
            'color','font','font-family','font-size','font-weight','font-style','line-height',
            'text-align','text-decoration','letter-spacing','word-spacing',
            'padding','padding-top','padding-right','padding-bottom','padding-left',
            // exclude margin & width values to avoid pushing layout off-page
            //'margin','margin-top','margin-right','margin-bottom','margin-left',
            //'width','min-width','max-width',
            'border','border-width','border-style','border-color','border-radius',
            'box-shadow','display','height','min-height','max-height','box-sizing',
            'vertical-align','white-space','list-style','list-style-type'
        ];

        function applyStyles(src, dst) {
            let cs;
            try {
                cs = window.getComputedStyle(src);
            } catch (e) {
                cs = null;
            }
            // preserve existing inline styles first
            let inline = dst.getAttribute('style') || '';
            if (cs) {
                for (const prop of propertiesToCopy) {
                    try {
                        const val = cs.getPropertyValue(prop);
                        if (val) inline += `${prop}:${val};`;
                    } catch (e) {
                        // ignore
                    }
                }
            }
            dst.setAttribute('style', inline);
        }

        // Walk source and clone in parallel to copy computed styles
        const srcNodes = [sourceEl];
        const dstNodes = [clone];

        while (srcNodes.length) {
            const s = srcNodes.shift();
            const d = dstNodes.shift();
            applyStyles(s, d);

            const sChildren = s.children || [];
            const dChildren = d.children || [];
            for (let i = 0; i < sChildren.length; i++) {
                srcNodes.push(sChildren[i]);
                if (dChildren[i]) dstNodes.push(dChildren[i]);
            }
        }

        return clone;
    }

    // Function to create CV HTML content from JSON data
    // Restored original centered header; keeps all inline styles and uses a small scoped stylesheet
    function createCVContent(data) {
        const about = data.about || {};

        // Scoped styles: control page size, centering, and subtle polish only.
        const pageFixStyles = `
            <style>
                @page { size: A4; margin: 12mm; }
                /* Render inner CV content at printable width: A4 width minus 2*12mm margins */
                #cv-content {
                    width: 186mm; /* 210mm - 24mm */
                    box-sizing: border-box;
                    margin: 12mm auto;
                    background: white;
                    color: #111;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* Keep headings crisp but DO NOT override inline sizes */
                #cv-content h1, #cv-content h2, #cv-content h3, #cv-content h4, #cv-content h5 {
                    margin: 0;
                    padding: 0;
                    line-height: 1.1;
                }

                /* Slight rounding & subtle shadow for the light boxes while preserving your inline styles */
                #cv-content div[style*="background-color: #f8f9fa"] {
                    border-radius: 6px;
                    box-shadow: 0 1px 4px rgba(16,24,40,0.04);
                }

                /* Ensure links render nicely and are readable in PDF */
                #cv-content a { color: #0066cc; text-decoration: none; }

                /* Force consistent list spacing */
                #cv-content ul { margin: 0; padding-left: 18px; }

                /* Prevent awkward breaks */
                #cv-content .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }

                @media print {
                    #cv-content { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    #cv-content .page-break-avoid { page-break-inside: avoid; }
                }
            </style>
        `;

        // Original centered title/header restored exactly (keeps inline styles you used)
        const cvHTML = `
            ${pageFixStyles}
            <div id="cv-content" style="display: none; /* width & margin handled above */ padding: 40px; background: white; color: black; line-height: 1.6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                
                <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #007bff; padding-bottom: 20px;">
                    <h1 style="font-size: 36px; margin-bottom: 20px; color: #333;">${about?.profile?.name || 'Ahmed M. M. Elsayed'}</h1>
                    <h2 style="font-size: 18px; color: #666; font-weight: 400; margin-bottom: 5px; ">${about?.profile?.title || 'Particle Physicist & Software Engineer'}</h2>
                    <p>University of Science and Technology of China | Hefei, China</p>
                    <p>🌐 <a href="https://ammelsayed.tech/" target="_blank" rel="noopener noreferrer">ammelsayed.tech</a> | ✉ ahmedphysica@outlook.com | ✆ (+86) 15212439344</p>
                </div>

                ${about?.profile?.description ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Profile</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <div style="text-align: justify; font-size: 14px;">${(about.profile?.description || '').replace(/<br><br>/g, ' ').replace(/<[^>]*>/g, '')}</div>
                    </div>
                </div>
                ` : ''}

                ${about?.profile?.research_interests ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Research Interests</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <ul style="margin: 0; padding-left: 20px;">
                            ${(about.profile?.research_interests || []).map(interest => `<li style="margin-bottom: 5px; font-size: 14px;">${interest}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                ${about?.profile?.disciplines ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Disciplines</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <div style="font-size: 14px;">${(about.profile?.disciplines || []).join(' - ')}</div>
                    </div>
                </div>
                ` : ''}

                ${about?.profile?.languages ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Languages</h3>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                        <div style="font-size: 14px;">${(about.profile?.languages || []).join(', ')}</div>
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
                            <div><strong><a href="${edu.institution_url || '#'}" style="color: #007bff; text-decoration: none;">${edu.institution}</a></strong>, ${edu.location}</div>
                            <div style="margin-top: 10px; text-align: justify; font-size: 14px;">${edu.research_focus || ''}</div>
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
                            <div><strong><a href="${exp.company_url || '#'}" style="color: #007bff; text-decoration: none;">${exp.company}</a></strong>, ${exp.location}</div>
                            <div style="margin-top: 10px; text-align: justify; font-size: 14px;">${exp.description || ''}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${about?.programming_skills && Object.keys(about.programming_skills || {}).length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">Programming Skills</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        ${Object.entries(about.programming_skills || {}).map(([category, skills]) => `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; page-break-inside: avoid;">
                                <h5 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #333;">${category}</h5>
                                <div style="font-size: 13px; color: #666;">${(skills || []).map(skill => skill.name || skill).join(', ')}</div>
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
                            <div style="font-style: italic; color: #666; font-size: 14px;">${pub.paper_type || ''} - ${pub.date || ''}${pub.journal ? `, ${pub.journal}` : ''}</div>
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
                            <div style="font-style: italic; color: #666; font-size: 14px;">${project.type || ''}</div>
                            ${project.link && project.link !== '#' ? `<div style="margin-top: 8px; font-size: 12px; color: #007bff;">Website: <a href="${project.link}" style="color: #007bff; text-decoration: none;">${project.link}</a></div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${data.events && data.events.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 20px; color: #007bff; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef;">
                        Events & Activities
                    </h3>
                    ${data.events.map(event => `
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; page-break-inside: avoid;">
                            <h4 style="font-size: 16px; margin-bottom: 8px; color: #333;">
                                ${event.link 
                                    ? `<a href="${event.link}" style="color: #007bff; text-decoration: none;">${event.title}</a>`
                                    : event.title}
                            </h4>
                            <div style="font-style: italic; color: #666; font-size: 14px;">
                                ${event.date || ''} – ${event.location || ''}
                            </div>
                            ${event.image_soruce 
                                ? `<div style="margin-top: 10px; text-align: center;">
                                        <img src="${event.image_soruce}" alt="${event.title}" 
                                            style="max-width:100%; max-height:200px; border-radius:4px; margin-top:5px;">
                                </div>` 
                                : ''}
                            ${event.description 
                                ? `<div style="margin-top: 10px; font-size: 14px; text-align: justify;">${event.description}</div>` 
                                : ''}
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
        const originalText = button ? button.innerHTML : 'Download CV';
        
        // Show loading state
        if (button) {
            button.disabled = true;
            button.innerHTML = '<div style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ffffff; border-radius: 50%; border-top-color: transparent; animation: spin 1s ease-in-out infinite;"></div> Generating...';
        }

        // Helper to cleanup DOM nodes safely
        function safeRemove(node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        }

        try {
            // Extract content from JSON files
            const websiteData = await extractAllWebsiteContent();
            
            // Create CV HTML
            const cvHTML = createCVContent(websiteData);
            
            // Add CV content to page temporarily
            const tempDiv = document.createElement('div');
            tempDiv.style.padding = '0';
            tempDiv.style.margin = '0';
            tempDiv.style.background = 'transparent';
            tempDiv.innerHTML = cvHTML;
            document.body.appendChild(tempDiv);
            
            const cvElement = tempDiv.querySelector('#cv-content');
            if (!cvElement) throw new Error('Could not find CV content element');

            // Ensure it's visible for computed styles measurement
            cvElement.style.display = 'block';

            // Force physical page size for content (A4 printable area = 210mm - 2*12mm margins = 186mm).
            cvElement.style.width = '186mm';
            cvElement.style.boxSizing = 'border-box';
            cvElement.style.padding = cvElement.style.padding || '40px';
            cvElement.style.margin = '12mm auto';
            // ensure white background for capture
            cvElement.style.background = '#ffffff';

            // --- Create a clone and inline computed styles for better cross-browser fidelity ---
            const clone = cloneAndInlineComputedStyles(cvElement);

            // Ensure clone root does not carry width/margin that can push it off-center:
            clone.style.width = '100%';
            clone.style.maxWidth = '100%';
            clone.style.margin = '0 auto';
            clone.style.boxSizing = 'border-box';
            // move padding to captureWrapper; remove padding from clone to avoid double-padding
            clone.style.padding = '0';
            clone.style.background = '#ffffff';

            // Wrap clone in a capture container (this container will be passed to html2pdf)
            const captureWrapper = document.createElement('div');
            captureWrapper.style.width = '186mm';
            captureWrapper.style.maxWidth = '186mm';
            captureWrapper.style.boxSizing = 'border-box';
            captureWrapper.style.margin = '12mm auto';
            // keep your original inner padding visually identical by setting wrapper padding
            captureWrapper.style.padding = '40px';
            captureWrapper.style.background = '#ffffff';
            captureWrapper.style.display = 'block';
            captureWrapper.appendChild(clone);

            // Append capture wrapper to DOM (must be visible to html2canvas)
            tempDiv.parentNode.insertBefore(captureWrapper, tempDiv.nextSibling);

            // Configure PDF options with fixed units and improved scale and white background
            const opt = {
                margin: [12, 12, 12, 12], // mm margins for jsPDF unit:mm
                filename: 'Ahmed_Elsayed_CV.pdf', // fallback; we'll force filename via blob download
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    // use devicePixelRatio to keep rendering crisp; ensure at least 2 for good quality
                    scale: Math.max(2, window.devicePixelRatio || 1),
                    useCORS: true,
                    letterRendering: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { 
                    unit: 'mm', 
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

            // Generate PDF as blob
            let pdfBlob;
            try {
                pdfBlob = await html2pdf().set(opt).from(captureWrapper).output('blob');
            } catch (err) {
                console.warn('html2pdf output(\'blob\') failed, attempting save() fallback', err);
                await html2pdf().set(opt).from(captureWrapper).save();
                safeRemove(captureWrapper);
                safeRemove(tempDiv);
                return;
            }

            // Create download link to force filename (works better on iOS browsers)
            const blobUrl = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'Ahmed_Elsayed_CV.pdf';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
                safeRemove(a);
            }, 1000);

            // Cleanup capture + temp nodes
            safeRemove(captureWrapper);
            safeRemove(tempDiv);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            // Reset button state
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = originalText;
            }
        }
    }

    // Function to add CSS styles (for the download button and small UI tweaks)
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
                box-shadow: 0 3px 10px rgba(0, 123, 255, 0.18);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .cv-download-btn svg { opacity: 0.95; }

            .cv-download-btn:hover {
                background: linear-gradient(135deg, #0056b3, #004085);
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(0, 86, 179, 0.14);
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

            /* PDF-specific styles for page breaks (these classes are used inside the CV content) */
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

        // Create download button HTML (no download counter)
        const downloadButtonHTML = `
            <div class="cv-download-container">
                <button id="downloadBtn" class="cv-download-btn" title="Generate a PDF copy of the CV">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    Download CV
                </button>
            </div>
        `;

        // Add button to page-top
        pageTop.insertAdjacentHTML('beforeend', downloadButtonHTML);

        // Add event listener
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', generatePDF);
        }
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
