let currentPage = 1;
let currentPageDE = 1;
const pageSize = 10;
let hl7Messages = [];
let convertedMessages = [];

function getAllHL7DE() {
    fetch('http://localhost:5054/data/default')
        .then(response => response.text())
        .then(text => {
            // Split messages by "MSH" but keep it at the start of each message
            hl7Messages = text.split(/(?=MSH)/).filter(msg => msg.trim() !== "");

                hl7Messages.shift();
            
            
            // Convert each HL7 message
            convertedMessages = hl7Messages.map(msg => `Converted: ${msg}`);

            if (hl7Messages.length > 0) {
                loadPage(currentPage);
            } else {
                console.error("HL7 file is empty.");
            }
        })
        .catch(error => console.error('Error loading HL7 file:', error)); 
}

function getAllHL7() {
    fetch('http://localhost:5054/data/deID')
        .then(response => response.text())
        .then(text => {
            // Split messages by "MSH" but keep it at the start of each message
            hl7Messages = text.split(/(?=MSH)/).filter(msg => msg.trim() !== "");

                hl7Messages.shift();
            
            
            // Convert each HL7 message
            convertedMessages = hl7Messages.map(msg => `Converted: ${msg}`);

            if (hl7Messages.length > 0) {
                loadPageDE(currentPageDE);
            } else {
                console.error("HL7 file is empty.");
            }
        })
        .catch(error => console.error('Error loading HL7 file:', error)); 
}

function loadPage(page) {
    let start = (page - 1) * pageSize;
    let end = start + pageSize;
    let hl7Subset = hl7Messages.slice(start, end);

    let hl7List = document.getElementById("hl7List");

    let outputHtml = `<div class="accordion" id="hl7Accordion">`;

    hl7Subset.forEach((msg, index) => {
        let collapseId = `collapse${start + index}`;
        let headerId = `heading${start + index}`;

        // Split the HL7 message into segments based on specific HL7 segment types
        let segments = msg.split(/(?=MSH|EVN|PID|PV1|OBR|ORC)/).filter(seg => seg.trim() !== "");

        // Format segments with field highlighting
        let formattedSegments = segments.map(seg => {
            // Get the segment type (first 3 characters)
            let segmentType = seg.substring(0, 3);
            
            // Split the segment by field separator (|)
            let fields = seg.split('|');
            
            // Format each field with hover capability
            let formattedFields = fields.map((field, fieldIndex) => {
                // Skip the first "field" as it contains the segment type
                if (fieldIndex === 0) {
                    return `<span>${field}</span>`;
                }
                // Make MRN clickable for PID segment, field 3
                if (segmentType === 'PID' && fieldIndex === 3) {
                    const mrn = field.split('^')[0] || field; // Extract MRN from potentially complex field
                    return `<span class="hl7-field" 
                                data-segment="${segmentType}" 
                                data-field-num="${fieldIndex}"
                                title="${segmentType}-${fieldIndex} (Click to filter by this MRN)">|<a href="#" onclick="searchByMRN('${mrn}'); return false;" class="mrn-link">${field}</a></span>`;
                }
                
                // Create a span with data attributes for the tooltip
                return `<span class="hl7-field" 
                              data-segment="${segmentType}" 
                              data-field-num="${fieldIndex}"
                              title="${segmentType}-${fieldIndex + 1}">|${field}</span>`;
            }).join('');
            
            return `<div class="p-1 border-bottom hl7-segment">${formattedFields}</div>`;
        }).join('');

        outputHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        <pre>${msg}</pre>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#hl7Accordion">
                    <div class="accordion-body">
                        <strong>HL7 Message Segments:</strong>
                        <div class="bg-light p-2">${formattedSegments}</div>
                        <hr>
                    </div>
                </div>
            </div>
        `;
    });

    outputHtml += `</div>`; // Close accordion div

    hl7List.innerHTML = outputHtml;

    // Add CSS for field highlighting
    addFieldHighlightingStyles();
    
    // Initialize tooltips if using Bootstrap
    initializeTooltips();

    // Update pagination indicator
    document.getElementById("pageIndicator").textContent = page;
}

// New function to search by MRN when clicked
function searchByMRN(mrn) {
    // Set the search input and category
    document.getElementById("searchInput").value = mrn;
    document.getElementById("searchCategory").value = "mrn";
    
    // Call the existing search function
    searchHL7();
}

function addFieldHighlightingStyles() {
    // Check if the style already exists
    if (!document.getElementById('hl7-field-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'hl7-field-styles';
        styleElement.textContent = `
            .hl7-field {
                cursor: pointer;
                padding: 2px;
                border-radius: 3px;
            }
            .hl7-field:hover {
                background-color: #ffffc0;
                box-shadow: 0 0 3px #ffcc00;
                position: relative;
            }
                .mrn-link {
                color: #0066cc;
                text-decoration: underline;
                font-weight: bold;
            }
            
            .mrn-link:hover {
                color: #004080;
                background-color: rgba(0, 102, 204, 0.1);
            }
            
            /* Optional: Custom tooltip if not using Bootstrap tooltips */
            .hl7-field[data-tooltip]:hover:after {
                content: attr(data-tooltip);
                position: absolute;
                top: -25px;
                left: 0;
                background: #333;
                color: white;
                padding: 3px 6px;
                border-radius: 3px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 100;
            }
        `;
        document.head.appendChild(styleElement);
    }
}

function initializeTooltips() {
    // If using Bootstrap tooltips
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('.hl7-field'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } else {
        // Fallback for custom tooltips if Bootstrap isn't available
        const fields = document.querySelectorAll('.hl7-field');
        fields.forEach(field => {
            const segment = field.getAttribute('data-segment');
            const fieldNum = field.getAttribute('data-field-num');
            
            field.setAttribute('data-tooltip', `${segment}-${fieldNum}`);
        });
    }
}

function searchHL7() {
    let query = document.getElementById("searchInput").value.trim().toLowerCase();
    let category = document.getElementById("searchCategory").value;

    if (query === "") {
        loadPage(1); // Reset if search is empty
        return;
    }

    let filteredMessages = hl7Messages.filter(msg => {
        // Parse the message properly
        let segments = msg.split(/(?=MSH|EVN|PID|PV1|OBR|ORC)/);
        
        // Find the relevant segment and field based on category
        if (category === "controlId") {
            // MSH-10: Message Control ID (usually in the MSH segment)
            const mshSegment = segments.find(seg => seg.startsWith('MSH'));
            if (mshSegment) {
                const fields = mshSegment.split('|');
                return fields[9] && fields[9].toLowerCase().includes(query);
            }
        } else if (category === "mrn") {
            // PID-3: Patient ID (MRN)
            const pidSegment = segments.find(seg => seg.startsWith('PID'));
            if (pidSegment) {
                const fields = pidSegment.split('|');
                if (fields[3]) {
                    // Handle if MRN is in a complex format (e.g., "MRN^TYPE^SYSTEM")
                    const mrnParts = fields[3].split('^');
                    return mrnParts[0].toLowerCase().includes(query) || fields[3].toLowerCase().includes(query);
                }
            }
        } else if (category === "lastName") {
            // PID-5: Patient Name (contains last name)
            const pidSegment = segments.find(seg => seg.startsWith('PID'));
            if (pidSegment) {
                const fields = pidSegment.split('|');
                if (fields[5]) {
                    const nameParts = fields[5].split('^');
                    return nameParts[0] && nameParts[0].toLowerCase().includes(query);
                }
            }
        }
        return false;
    });

    displayFilteredMessages(filteredMessages);
}

function displayFilteredMessages(filteredMessages) {
    // Update global variable to track the filtered messages
    let filteredHL7Messages = filteredMessages;
    
    // Update pagination to use filtered messages
    currentPage = 1;
    
    // Calculate total pages based on filtered messages
    let totalPages = Math.ceil(filteredMessages.length / pageSize);
    
    // Display first page of filtered results
    let start = 0;
    let end = Math.min(pageSize, filteredMessages.length);
    let hl7Subset = filteredMessages.slice(start, end);
    
    let hl7List = document.getElementById("hl7List");
    
    // Use the same formatting approach as in loadPage
    let outputHtml = `<div class="accordion" id="hl7Accordion">`;
    
    hl7Subset.forEach((msg, index) => {
        let collapseId = `collapse${index}`;
        let headerId = `heading${index}`;
        
        // Split the message into segments
        let segments = msg.split(/(?=MSH|EVN|PID|PV1|OBR|ORC)/).filter(seg => seg.trim() !== "");
        
        // Format segments with field highlighting (same as in loadPage)
        let formattedSegments = segments.map(seg => {
            let segmentType = seg.substring(0, 3);
            let fields = seg.split('|');
            
            let formattedFields = fields.map((field, fieldIndex) => {
                if (fieldIndex === 0) {
                    return `<span>${field}</span>`;
                }
                // Make MRN clickable for PID segment, field 3
                if (segmentType === 'PID' && fieldIndex === 3) {
                    const mrn = field.split('^')[0] || field; // Extract MRN from potentially complex field
                    return `<span class="hl7-field" 
                                data-segment="${segmentType}" 
                                data-field-num="${fieldIndex}"
                                title="${segmentType}-${fieldIndex} (Click to filter by this MRN)">|<a href="#" onclick="searchByMRN('${mrn}'); return false;" class="mrn-link">${field}</a></span>`;
                }
                const hl7FieldNumber = fieldIndex + 1;
                return `<span class="hl7-field" 
                              data-segment="${segmentType}" 
                              data-field-num="${fieldIndex}"
                              title="${segmentType}-${fieldIndex}">|${field}</span>`;
            }).join('');
            
            return `<div class="p-1 border-bottom hl7-segment">${formattedFields}</div>`;
        }).join('');
        
        outputHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        Message ${index + 1} of ${filteredMessages.length} results
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#hl7Accordion">
                    <div class="accordion-body">
                        <strong>HL7 Message Segments:</strong>
                        <div class="bg-light p-2">${formattedSegments}</div>
                        <hr>
                    </div>
                </div>
            </div>
        `;
    });
    
    outputHtml += `</div>`;
    
    hl7List.innerHTML = outputHtml;
    
    // Add CSS for field highlighting
    addFieldHighlightingStyles();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Update pagination indicator
    document.getElementById("pageIndicator").textContent = currentPage;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadPage(currentPage);
    }
}

function nextPage() {
    if (currentPage < Math.ceil(hl7Messages.length / pageSize)) {
        currentPage++;
        loadPage(currentPage);
    }
}

function prevPageDE() {
    if (currentPageDE > 1) {
        currentPageDE--;
        loadPageDE(currentPagDE);
    }
}

function nextPageDE() {
    if (currentPageDE < Math.ceil(hl7Messages.length / pageSize)) {
        currentPageDE++;
        loadPageDE(currentPageDE);
    }
}

function loadPageDE(pageDE) {
    let startDE = (pageDE - 1) * pageSize;
    let endDE = startDE + pageSize;
    let hl7Subset = hl7Messages.slice(startDE, endDE);

    let hl7List = document.getElementById("convertedList");

    let outputHtml = `<div class="accordion" id="hl7Accordion">`;

    hl7Subset.forEach((msg, index) => {
        let collapseId = `collapse${startDE + index}`;
        let headerId = `heading${startDE + index}`;

        // Split the HL7 message into segments based on specific HL7 segment types
        let segments = msg.split(/(?=MSH|EVN|PID|PV1|OBR|ORC)/).filter(seg => seg.trim() !== "");

        // Format segments with field highlighting
        let formattedSegments = segments.map(seg => {
            // Get the segment type (first 3 characters)
            let segmentType = seg.substring(0, 3);
            
            // Split the segment by field separator (|)
            let fields = seg.split('|');
            
            // Format each field with hover capability
            let formattedFields = fields.map((field, fieldIndex) => {
                // Skip the first "field" as it contains the segment type
                if (fieldIndex === 0) {
                    return `<span>${field}</span>`;
                }

                // Make MRN clickable for PID segment, field 3
                if (segmentType === 'PID' && fieldIndex === 3) {
                    const mrn = field.split('^')[0] || field; // Extract MRN from potentially complex field
                    return `<span class="hl7-field" 
                                data-segment="${segmentType}" 
                                data-field-num="${fieldIndex}"
                                title="${segmentType}-${fieldIndex} (Click to filter by this MRN)">|<a href="#" onclick="searchByMRN('${mrn}'); return false;" class="mrn-link">${field}</a></span>`;
                }
                
                // Create a span with data attributes for the tooltip
                return `<span class="hl7-field" 
                              data-segment="${segmentType}" 
                              data-field-num="${fieldIndex}"
                              title="${segmentType}-${fieldIndex + 1}">|${field}</span>`;
            }).join('');
            
            return `<div class="p-1 border-bottom hl7-segment">${formattedFields}</div>`;
        }).join('');

        outputHtml += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        <pre>${msg}</pre>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#hl7Accordion">
                    <div class="accordion-body">
                        <strong>HL7 Message Segments:</strong>
                        <div class="bg-light p-2">${formattedSegments}</div>
                        <hr>
                    </div>
                </div>
            </div>
        `;
    });

    outputHtml += `</div>`; // Close accordion div

    hl7List.innerHTML = outputHtml;

    // Add CSS for field highlighting
    addFieldHighlightingStyles();
    
    // Initialize tooltips if using Bootstrap
    initializeTooltips();

    // Update pagination indicator
    document.getElementById("pageIndicatorDE").textContent = pageDE;
}