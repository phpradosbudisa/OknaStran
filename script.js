// Simplified and more informative JavaScript for MVZ - PVC okna in vrata

// Global variables
let items = [];
let currentStep = 1;
const totalSteps = 3;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupFormValidation();
    setupStepNavigation();
    updateProgress();
});

function initializeApp() {
    // Initialize tooltips and enhanced interactions
    setupRealTimeValidation();
    setupFormAutoSave();
}

function setupEventListeners() {
    // Form submission
    document.getElementById('quoteForm').addEventListener('submit', handleFormSubmission);
    
    // Real-time price updates
    document.addEventListener('input', debounce(updateTotalPrice, 300));
    document.addEventListener('change', updateTotalPrice);
}

function setupFormValidation() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
        
        // Add visual feedback for required fields
        if (input.hasAttribute('required')) {
            input.addEventListener('invalid', handleInvalidInput);
        }
    });
}

function setupStepNavigation() {
    // Progress step click handlers
    document.querySelectorAll('.progress-step').forEach(step => {
        step.addEventListener('click', () => {
            const stepNumber = parseInt(step.dataset.step);
            if (stepNumber <= currentStep || canNavigateToStep(stepNumber)) {
                goToStep(stepNumber);
            }
        });
    });
}

function setupRealTimeValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function setupFormAutoSave() {
    // Auto-save form data to localStorage
    const form = document.getElementById('quoteForm');
    
    // Save form data every 5 seconds
    setInterval(() => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        localStorage.setItem('mvzFormData', JSON.stringify(data));
    }, 5000);
    
    // Restore form data on page load
    const savedData = localStorage.getItem('mvzFormData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = data[key];
                }
            });
        } catch (e) {
            console.log('Ni bilo mogoče obnoviti podatkov obrazca');
        }
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            goToStep(currentStep);
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        goToStep(currentStep);
    }
}

function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show current step
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // Update progress
    currentStep = stepNumber;
    updateProgress();
    
    // Update navigation buttons
    updateStepButtons();
    
    // Special handling for step 3
    if (stepNumber === 3) {
        populateReview();
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Update progress bar
    const progressPercentage = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    
    // Update step indicators
    progressSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

function updateStepButtons() {
    const nextButton = document.querySelector('#nextToStep3');
    if (nextButton) {
        nextButton.disabled = items.length === 0;
    }
}

function canNavigateToStep(stepNumber) {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return validateStep1();
    if (stepNumber === 3) return validateStep1() && items.length > 0;
    return false;
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

function validateStep1() {
    const requiredFields = ['name', 'email', 'phone'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Prosimo, izpolnite vse obvezne podatke', 'error');
    }
    
    return isValid;
}

function validateStep2() {
    if (items.length === 0) {
        showNotification('Dodajte vsaj en izdelek v ponudbo', 'error');
        return false;
    }
    
    // Validate that all items have dimensions
    const invalidItems = items.filter(item => !item.width || !item.height);
    if (invalidItems.length > 0) {
        showNotification('Prosimo, izpolnite dimenzije za vse izdelke', 'error');
        return false;
    }
    
    return true;
}

function validateStep3() {
    return true; // Step 3 is just review
}

function addItem(type) {
    const itemId = Date.now() + Math.random();
    const item = {
        id: itemId,
        type: type,
        width: '',
        height: '',
        material: type === 'window' ? 'PVC' : (type === 'door' ? 'PVC' : 'Aluminum'),
        glass: type === 'window' ? 'Double' : '',
        color: 'White',
        quantity: 1
    };
    
    items.push(item);
    
    // Create and animate the item card
    const itemCard = createItemCard(item);
    itemCard.style.opacity = '0';
    itemCard.style.transform = 'translateY(20px)';
    
    document.getElementById('itemsContainer').appendChild(itemCard);
    
    // Trigger animation
    setTimeout(() => {
        itemCard.style.transition = 'all 0.4s ease';
        itemCard.style.opacity = '1';
        itemCard.style.transform = 'translateY(0)';
    }, 10);
    
    updateTotalPrice();
    updateStepButtons();
    
    const typeNames = {
        window: 'okno',
        door: 'vrata',
        balcony: 'balkonska vrata'
    };
    showNotification(`Dodano ${typeNames[type]} v vašo ponudbo`, 'success');
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = item.id;
    
    const typeIcons = {
        window: 'fas fa-window-maximize',
        door: 'fas fa-door-open',
        balcony: 'fas fa-home'
    };
    
    const typeNames = {
        window: 'Okno',
        door: 'Vrata',
        balcony: 'Balkonska vrata'
    };
    
    card.innerHTML = `
        <div class="item-header">
            <div class="item-title">
                <i class="${typeIcons[item.type]}"></i>
                ${typeNames[item.type]} #${items.indexOf(item) + 1}
            </div>
            <div class="item-number">${items.indexOf(item) + 1}</div>
            <button type="button" class="remove-item-btn" onclick="removeItem(${item.id})">
                <i class="fas fa-trash"></i>
                Odstrani
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label for="width-${item.id}">Širina (cm)</label>
                <input type="number" id="width-${item.id}" name="width-${item.id}" 
                       value="${item.width}" min="50" max="300" 
                       onchange="updateItem(${item.id}, 'width', this.value)"
                       placeholder="npr. 120">
                <div class="field-help">Vnesite širino odprtine</div>
            </div>
            
            <div class="form-group">
                <label for="height-${item.id}">Višina (cm)</label>
                <input type="number" id="height-${item.id}" name="height-${item.id}" 
                       value="${item.height}" min="50" max="300" 
                       onchange="updateItem(${item.id}, 'height', this.value)"
                       placeholder="npr. 150">
                <div class="field-help">Vnesite višino odprtine</div>
            </div>
            
            <div class="form-group">
                <label for="material-${item.id}">Material</label>
                <select id="material-${item.id}" name="material-${item.id}" 
                        onchange="updateItem(${item.id}, 'material', this.value)">
                    <option value="PVC" ${item.material === 'PVC' ? 'selected' : ''}>PVC (Najbolj priljubljen)</option>
                    <option value="Aluminum" ${item.material === 'Aluminum' ? 'selected' : ''}>Aluminij (Premium)</option>
                    <option value="Wood" ${item.material === 'Wood' ? 'selected' : ''}>Les (Luksuz)</option>
                </select>
                <div class="field-help">PVC je najbolj ekonomična izbira</div>
            </div>
            
            ${item.type === 'window' ? `
            <div class="form-group">
                <label for="glass-${item.id}">Vrsta stekla</label>
                <select id="glass-${item.id}" name="glass-${item.id}" 
                        onchange="updateItem(${item.id}, 'glass', this.value)">
                    <option value="Single" ${item.glass === 'Single' ? 'selected' : ''}>Enojno (Osnovno)</option>
                    <option value="Double" ${item.glass === 'Double' ? 'selected' : ''}>Dvojno (Priporočeno)</option>
                    <option value="Triple" ${item.glass === 'Triple' ? 'selected' : ''}>Trojno (Premium)</option>
                </select>
                <div class="field-help">Dvojno steklo je najboljša izbira za energetsko učinkovitost</div>
            </div>
            ` : ''}
            
            <div class="form-group">
                <label for="color-${item.id}">Barva</label>
                <select id="color-${item.id}" name="color-${item.id}" 
                        onchange="updateItem(${item.id}, 'color', this.value)">
                    <option value="White" ${item.color === 'White' ? 'selected' : ''}>Bela (Standardna)</option>
                    <option value="Brown" ${item.color === 'Brown' ? 'selected' : ''}>Rjava (Lesena)</option>
                    <option value="Black" ${item.color === 'Black' ? 'selected' : ''}>Črna (Moderna)</option>
                    <option value="Gray" ${item.color === 'Gray' ? 'selected' : ''}>Siva (Nevtralna)</option>
                </select>
                <div class="field-help">Bela je najbolj priljubljena barva</div>
            </div>
            
            <div class="form-group">
                <label for="quantity-${item.id}">Količina</label>
                <input type="number" id="quantity-${item.id}" name="quantity-${item.id}" 
                       value="${item.quantity}" min="1" max="10" 
                       onchange="updateItem(${item.id}, 'quantity', this.value)"
                       placeholder="1">
                <div class="field-help">Koliko enakih izdelkov potrebujete</div>
            </div>
        </div>
        
        <div class="item-price">
            <span class="price-label">Cena:</span>
            <span class="price-value" id="price-${item.id}">€0,00</span>
        </div>
    `;
    
    return card;
}

function updateItem(itemId, property, value) {
    const item = items.find(item => item.id === itemId);
    if (item) {
        item[property] = value;
        updateTotalPrice();
    }
}

function removeItem(itemId) {
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
        
        // Animate removal
        itemCard.style.transition = 'all 0.3s ease';
        itemCard.style.opacity = '0';
        itemCard.style.transform = 'translateX(-100px)';
        
        setTimeout(() => {
            items.splice(itemIndex, 1);
            itemCard.remove();
            updateTotalPrice();
            updateStepButtons();
            showNotification('Izdelek odstranjen iz ponudbe', 'info');
        }, 300);
    }
}

function updateTotalPrice() {
    let total = 0;
    let breakdown = '';
    
    items.forEach((item, index) => {
        const basePrice = getItemBasePrice(item);
        const area = (item.width || 0) * (item.height || 0) / 10000; // Convert to m²
        const itemPrice = basePrice * area * (item.quantity || 1);
        total += itemPrice;
        
        const typeNames = {
            window: 'Okno',
            door: 'Vrata',
            balcony: 'Balkonska vrata'
        };
        
        breakdown += `${typeNames[item.type]} #${index + 1}: €${itemPrice.toFixed(2)}<br>`;
        
        // Update individual item price
        const priceElement = document.getElementById(`price-${item.id}`);
        if (priceElement) {
            priceElement.textContent = `€${itemPrice.toFixed(2)}`;
        }
    });
    
    // Update total price display
    const totalPriceElement = document.getElementById('totalPrice');
    const breakdownElement = document.getElementById('priceBreakdown');
    const itemsSummary = document.getElementById('itemsSummary');
    
    if (totalPriceElement) {
        totalPriceElement.textContent = `€${total.toFixed(2)}`;
    }
    
    if (breakdownElement) {
        if (items.length > 0) {
            breakdownElement.innerHTML = breakdown;
            if (itemsSummary) {
                itemsSummary.style.display = 'block';
            }
        } else {
            breakdownElement.textContent = 'Dodajte izdelke za ogled cenovnega razčlenitve';
            if (itemsSummary) {
                itemsSummary.style.display = 'none';
            }
        }
    }
    
    // Update review total if on step 3
    const reviewTotal = document.getElementById('reviewTotal');
    if (reviewTotal) {
        reviewTotal.textContent = `€${total.toFixed(2)}`;
    }
}

function populateReview() {
    // Populate customer review
    const customerReview = document.getElementById('customerReview');
    const name = document.getElementById('name').value || 'N/A';
    const email = document.getElementById('email').value || 'N/A';
    const phone = document.getElementById('phone').value || 'N/A';
    const address = document.getElementById('address').value || 'N/A';
    const message = document.getElementById('message').value || 'N/A';
    
    customerReview.innerHTML = `
        <div class="review-item">
            <strong>Ime:</strong> ${name}
        </div>
        <div class="review-item">
            <strong>E-pošta:</strong> ${email}
        </div>
        <div class="review-item">
            <strong>Telefon:</strong> ${phone}
        </div>
        <div class="review-item">
            <strong>Naslov:</strong> ${address}
        </div>
        <div class="review-item">
            <strong>Opombe:</strong> ${message}
        </div>
    `;
    
    // Populate items review
    const itemsReview = document.getElementById('itemsReview');
    let itemsHtml = '';
    
    const typeNames = {
        window: 'Okno',
        door: 'Vrata',
        balcony: 'Balkonska vrata'
    };
    
    items.forEach((item, index) => {
        const basePrice = getItemBasePrice(item);
        const area = (item.width || 0) * (item.height || 0) / 10000;
        const itemPrice = basePrice * area * (item.quantity || 1);
        
        itemsHtml += `
            <div class="review-item">
                <strong>${typeNames[item.type]} #${index + 1}</strong><br>
                Dimenzije: ${item.width || 0} × ${item.height || 0} cm<br>
                Material: ${item.material}<br>
                ${item.glass ? `Steklo: ${item.glass}<br>` : ''}
                Barva: ${item.color}<br>
                Količina: ${item.quantity}<br>
                <strong>Cena: €${itemPrice.toFixed(2)}</strong>
            </div>
        `;
    });
    
    itemsReview.innerHTML = itemsHtml;
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'To polje je obvezno');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        if (!isValidEmail(value)) {
            showFieldError(field, 'Vnesite veljaven e-poštni naslov');
            return false;
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        if (!isValidPhone(value)) {
            showFieldError(field, 'Vnesite veljavno telefonsko številko');
            return false;
        }
    }
    
    return true;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showFieldError(field, message) {
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
}

function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.startsWith('386')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+386' + value.substring(1);
        } else if (!value.startsWith('+')) {
            value = '+386' + value;
        }
    }
    event.target.value = value;
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    if (validateForm()) {
        showNotification('Obračunava vašo ponudbo...', 'info');
        
        setTimeout(() => {
            generatePDF();
            showNotification('Ponudba uspešno ustvarjena! Preverite svojo e-pošto.', 'success');
            
            // Clear form after successful submission
            setTimeout(() => {
                document.getElementById('quoteForm').reset();
                items = [];
                document.getElementById('itemsContainer').innerHTML = '';
                currentStep = 1;
                goToStep(1);
                updateTotalPrice();
            }, 2000);
        }, 1500);
    }
}

function validateForm() {
    if (!validateStep1()) {
        goToStep(1);
        return false;
    }
    
    if (!validateStep2()) {
        goToStep(2);
        return false;
    }
    
    return true;
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MVZ - PVC okna in vrata', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Okrog 5, 3232 Ponikva', 20, 40);
    doc.text('Tel: 070 774 343, 070 662 211', 20, 50);
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PONUDBA ZA PVC OKNA IN VRATA', 20, 70);
    
    // Customer Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Podatki stranke:', 20, 90);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const name = document.getElementById('name').value || 'N/A';
    const email = document.getElementById('email').value || 'N/A';
    const phone = document.getElementById('phone').value || 'N/A';
    const address = document.getElementById('address').value || 'N/A';
    
    doc.text(`Ime: ${name}`, 20, 100);
    doc.text(`E-pošta: ${email}`, 20, 110);
    doc.text(`Telefon: ${phone}`, 20, 120);
    doc.text(`Naslov: ${address}`, 20, 130);
    
    // Items
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Izdelki:', 20, 150);
    
    let yPosition = 160;
    let total = 0;
    
    const typeNames = {
        window: 'Okno',
        door: 'Vrata',
        balcony: 'Balkonska vrata'
    };
    
    items.forEach((item, index) => {
        const basePrice = getItemBasePrice(item);
        const area = (item.width || 0) * (item.height || 0) / 10000;
        const itemPrice = basePrice * area * (item.quantity || 1);
        total += itemPrice;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${typeNames[item.type]} #${index + 1}`, 20, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Dimenzije: ${item.width || 0} x ${item.height || 0} cm`, 30, yPosition + 7);
        doc.text(`Material: ${item.material}`, 30, yPosition + 14);
        if (item.glass) {
            doc.text(`Steklo: ${item.glass}`, 30, yPosition + 21);
        }
        doc.text(`Barva: ${item.color}`, 30, yPosition + 28);
        doc.text(`Količina: ${item.quantity}`, 30, yPosition + 35);
        doc.text(`Cena: €${itemPrice.toFixed(2)}`, 30, yPosition + 42);
        
        yPosition += 55;
    });
    
    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Skupaj: €${total.toFixed(2)}`, 20, yPosition + 10);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Ponudba velja 30 dni od datuma izdaje.', 20, 280);
    doc.text('Vključuje montažo in kakovostno izvedbo.', 20, 285);
    doc.text('Družinsko podjetje v Ponikvi - prilagodljivost, odzivnost, zanesljivost.', 20, 290);
    
    // Save PDF
    const fileName = `ponudba_mvz_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

function getItemBasePrice(item) {
    let basePrice = 0;
    
    // Base price by type
    switch (item.type) {
        case 'window':
            basePrice = 150;
            break;
        case 'door':
            basePrice = 300;
            break;
        case 'balcony':
            basePrice = 400;
            break;
    }
    
    // Material multiplier
    switch (item.material) {
        case 'PVC':
            basePrice *= 1.0;
            break;
        case 'Aluminum':
            basePrice *= 1.5;
            break;
        case 'Wood':
            basePrice *= 2.0;
            break;
    }
    
    // Glass type multiplier (for windows)
    if (item.glass) {
        switch (item.glass) {
            case 'Single':
                basePrice *= 0.8;
                break;
            case 'Double':
                basePrice *= 1.0;
                break;
            case 'Triple':
                basePrice *= 1.3;
                break;
        }
    }
    
    return basePrice;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 