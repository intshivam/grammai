// Initialize theme
function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark');
  }
}

// Toggle theme
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Show toast notification
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = document.createElement('span');
  if (type === 'success') {
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else {
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>';
  }
  
  const text = document.createElement('span');
  text.textContent = message;
  
  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
    const copyButton = document.getElementById('copy-button');
    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg><span>Copied!</span>';
    
    setTimeout(() => {
      copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg><span>Copy</span>';
    }, 2000);
  }).catch(err => {
    showToast('Failed to copy text', 'error');
  });
}

// Show error message
function showError(message) {
  const errorContainer = document.getElementById('error-container');
  const errorText = document.getElementById('error-text');
  
  errorText.textContent = message;
  errorContainer.classList.remove('hidden');
}

// Hide error message
function hideError() {
  const errorContainer = document.getElementById('error-container');
  errorContainer.classList.add('hidden');
}

// Toggle loading state
function setLoading(isLoading) {
  const submitButton = document.getElementById('submit-button');
  const spinner = submitButton.querySelector('.spinner');
  const buttonText = submitButton.querySelector('span');
  
  submitButton.disabled = isLoading;
  
  if (isLoading) {
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Improving...';
  } else {
    spinner.classList.add('hidden');
    buttonText.textContent = 'Improve Message';
  }
}

// Toggle custom instructions
function toggleCustomInstructions() {
  const container = document.getElementById('custom-instructions-container');
  const toggleIcon = document.getElementById('toggle-icon');
  
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    toggleIcon.textContent = '▼';
    toggleIcon.style.transform = 'rotate(0deg)';
  } else {
    container.classList.add('hidden');
    toggleIcon.textContent = '▶';
    toggleIcon.style.transform = 'rotate(0deg)';
  }
}

// Show API key info modal
function showApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) {
    modal.classList.remove('hidden');
    // Add no-scroll to body when modal is open
    document.body.style.overflow = 'hidden';
  }
}

// Hide API key info modal
function hideApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) {
    modal.classList.add('hidden');
    // Remove no-scroll from body when modal is closed
    document.body.style.overflow = '';
    console.log('Modal hidden - function called');
  }
}

// Clear saved API key
function clearSavedApiKey() {
  localStorage.removeItem('gemini_api_key');
  document.getElementById('api-key').value = '';
  document.getElementById('remember-api-key').checked = false;
  showToast('Saved API key has been cleared');
}

// Load saved API key
function loadSavedApiKey() {
  const savedApiKey = localStorage.getItem('gemini_api_key');
  if (savedApiKey) {
    document.getElementById('api-key').value = savedApiKey;
    document.getElementById('remember-api-key').checked = true;
  }
}

// Improve message using Google Generative AI
async function improveMessage(message, tones, template, customInstructions, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Convert tones array to a readable string
    const tonesString = Array.isArray(tones) && tones.length > 0 
      ? tones.join(' and ') 
      : "professional";
    
    // Create the prompt
    let prompt = `Improve the following message to make it ${tonesString} and ${template !== 'none' ? template : "concise"}. Return ONLY the improved message as plain text, without any markdown formatting, explanations, or additional content.`;
    
    if (customInstructions) {
      prompt += ` Additional instructions: ${customInstructions}`;
    }
    
    prompt += `\n\nMessage to improve: ${message}`;
    
    // Try different model versions in order of preference
    const modelVersions = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    let result = null;
    let lastError = null;
    
    for (const modelVersion of modelVersions) {
      try {
        const model = genAI.getGenerativeModel({ model: modelVersion });
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request to ${modelVersion} timed out after 25 seconds`));
          }, 25000);
        });
        
        // Race the model request against the timeout
        result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise
        ]);
        
        break; // If successful, exit the loop
      } catch (error) {
        lastError = error;
        console.error(`Error with model ${modelVersion}:`, error);
        // Continue to the next model version
      }
    }
    
    if (!result) {
      throw new Error(lastError || 'Failed to improve message with any model version');
    }
    
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error improving message:', error);
    throw error;
  }
}

// Add this function to initialize tone selection
function initializeToneSelection() {
  const dropdown = document.getElementById('tone-dropdown');
  const selectedDisplay = dropdown.querySelector('.dropdown-selected span');
  const menu = dropdown.querySelector('.dropdown-menu');
  const selectedTones = new Set();

  // Toggle dropdown
  dropdown.querySelector('.dropdown-selected').addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });

  // Prevent menu clicks from closing dropdown
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Handle tone selection
  menu.querySelectorAll('.tone-option').forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      
      if (selectedTones.has(value)) {
        selectedTones.delete(value);
        option.classList.remove('selected');
      } else {
        selectedTones.add(value);
        option.classList.add('selected');
      }

      // Update selected display
      updateSelectedDisplay();
    });
  });

  // Function to update the selected tones display
  function updateSelectedDisplay() {
    if (selectedTones.size === 0) {
      selectedDisplay.textContent = 'Select tones...';
    } else {
      selectedDisplay.textContent = Array.from(selectedTones).join(', ');
    }
  }

  // Add function to get selected tones
  window.getSelectedTones = () => Array.from(selectedTones);

  // Close dropdown when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });
}

// Update the handleSubmit function to use the new tone selection
async function handleSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const message = document.getElementById('message').value.trim();
  const selectedTones = window.getSelectedTones();
  const template = window.getSelectedTemplate();
  const customInstructions = document.getElementById('custom-instructions').value.trim();
  const apiKey = document.getElementById('api-key').value.trim();
  const rememberApiKey = document.getElementById('remember-api-key').checked;
  
  // Validate form
  if (!message) {
    showError('Please enter a message to improve');
    return;
  }
  
  if (!apiKey) {
    showError('Please enter your Google API key');
    return;
  }
  
  if (selectedTones.length === 0) {
    showError('Please select at least one tone');
    return;
  }
  
  // Hide previous results and errors
  hideError();
  document.getElementById('result-container').classList.add('hidden');
  
  // Save API key if remember is checked
  if (rememberApiKey) {
    localStorage.setItem('gemini_api_key', apiKey);
  } else {
    localStorage.removeItem('gemini_api_key');
  }
  
  // Set loading state
  setLoading(true);
  
  try {
    // Improve message
    const improvedMessage = await improveMessage(message, selectedTones, template, customInstructions, apiKey);
    
    // Display result
    document.getElementById('improved-message').textContent = improvedMessage;
    document.getElementById('result-container').classList.remove('hidden');
    
    // Show success toast
    showToast('Message improved successfully!');
  } catch (error) {
    // Show error message
    showError(error.message || 'Failed to improve message. Please try again.');
    showToast('Failed to improve message', 'error');
  } finally {
    // Reset loading state
    setLoading(false);
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initTheme();
  
  // Load saved API key
  loadSavedApiKey();
  
  // Add event listeners for basic functionality
  const themeToggle = document.getElementById('theme-toggle');
  const messageForm = document.getElementById('message-form');
  const customInstructionsToggle = document.getElementById('toggle-custom-instructions');
  const apiKeyInfoButton = document.getElementById('api-key-info');
  const clearApiKeyButton = document.getElementById('clear-api-key');
  
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (messageForm) messageForm.addEventListener('submit', handleSubmit);
  if (customInstructionsToggle) customInstructionsToggle.addEventListener('click', toggleCustomInstructions);
  if (apiKeyInfoButton) apiKeyInfoButton.addEventListener('click', showApiKeyModal);
  if (clearApiKeyButton) clearApiKeyButton.addEventListener('click', clearSavedApiKey);
  
  // Set up modal close handlers
  const closeModalBtn = document.getElementById('close-modal');
  const closeModalFooterBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('api-key-modal');
  
  // Handler for the top close button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Close button clicked');
      hideApiKeyModal();
    });
  }
  
  // Handler for the footer close button
  if (closeModalFooterBtn) {
    closeModalFooterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Footer close button clicked');
      hideApiKeyModal();
    });
  }
  
  // Handler for clicking outside the modal
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Outside modal clicked');
        hideApiKeyModal();
      }
    });
  }
  
  // Add copy button event listener
  const copyButton = document.getElementById('copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const improvedMessage = document.getElementById('improved-message').textContent;
      copyToClipboard(improvedMessage);
    });
  }
  
  // Prevent modal content clicks from closing the modal
  const modalContent = modal?.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Add keyboard support for closing modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
      hideApiKeyModal();
    }
  });
  
  // Initialize tone selection
  initializeToneSelection();
  
  // Initialize template selection
  initializeTemplateSelection();
});

// Modal functionality
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyModal = document.getElementById('api-key-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const apiKeyInfoBtn = document.getElementById('api-key-info'); // You'll need to add this button

  // Function to open modal
  function openModal() {
    apiKeyModal.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  }

  // Function to close modal
  function closeModal() {
    apiKeyModal.classList.remove('visible');
    document.body.style.overflow = '';
  }

  // Event listeners
  if (apiKeyInfoBtn) {
    apiKeyInfoBtn.addEventListener('click', openModal);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking outside of it
  apiKeyModal.addEventListener('click', (e) => {
    if (e.target === apiKeyModal) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && apiKeyModal.classList.contains('visible')) {
      closeModal();
    }
  });
});

function initializeTemplateSelection() {
  const dropdown = document.getElementById('template-dropdown');
  const selectedDisplay = dropdown.querySelector('.dropdown-selected span');
  const menu = dropdown.querySelector('.dropdown-menu');
  let selectedTemplate = 'none'; // Default value

  // Toggle dropdown
  dropdown.querySelector('.dropdown-selected').addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });

  // Prevent menu clicks from closing dropdown
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Handle template selection
  menu.querySelectorAll('.template-option').forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      
      // Remove selected class from all options
      menu.querySelectorAll('.template-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      option.classList.add('selected');
      
      // Update selected value and display
      selectedTemplate = value;
      selectedDisplay.textContent = option.textContent;
      
      // Close dropdown after selection
      dropdown.classList.remove('open');
    });
  });

  // Add function to get selected template
  window.getSelectedTemplate = () => selectedTemplate;

  // Close dropdown when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });
} 