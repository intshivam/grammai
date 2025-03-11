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
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}

// Copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast('Copied to clipboard!');
      })
      .catch(() => {
        showToast('Failed to copy to clipboard', 'error');
      });
  } else {
    // Fallback for browsers that don't support clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      showToast(successful ? 'Copied to clipboard!' : 'Failed to copy to clipboard', successful ? 'success' : 'error');
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textarea);
  }
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
  
  if (isLoading) {
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Improving...';
    submitButton.disabled = true;
  } else {
    spinner.classList.add('hidden');
    buttonText.textContent = 'Improve Message';
    submitButton.disabled = false;
  }
}

// Toggle custom instructions
function toggleCustomInstructions() {
  const container = document.getElementById('custom-instructions-container');
  const toggleIcon = document.getElementById('toggle-icon');
  const isHidden = container.classList.contains('hidden');
  
  if (isHidden) {
    container.classList.remove('hidden');
    toggleIcon.style.transform = 'rotate(90deg)';
  } else {
    container.classList.add('hidden');
    toggleIcon.style.transform = 'rotate(0deg)';
  }
}

// Show API key info modal
function showApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) {
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  }
}

// Hide API key info modal
function hideApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) {
    modal.classList.remove('visible');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Clear saved API key
function clearSavedApiKey() {
  localStorage.removeItem('api-key');
  document.getElementById('api-key').value = '';
  document.getElementById('remember-api-key').checked = false;
  showToast('API key cleared from local storage');
}

// Load saved API key
function loadSavedApiKey() {
  const savedApiKey = localStorage.getItem('api-key');
  if (savedApiKey) {
    document.getElementById('api-key').value = savedApiKey;
    document.getElementById('remember-api-key').checked = true;
  }
}

// Improve message using Google Generative AI
async function improveMessage(message, tone, template, customInstructions, apiKey) {
  try {
    // Initialize the API client
    const genAI = new window.GoogleGenerativeAI(apiKey);
    
    // Try to use the Gemini Pro model, fall back to Gemini if not available
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
    } catch (error) {
      console.log('Falling back to gemini model');
      model = genAI.getGenerativeModel({ model: "gemini" });
    }
    
    // Build the prompt
    let prompt = `Improve the following message to make it more ${tone}`;
    
    if (template !== 'none') {
      prompt += ` and format it as a ${template.replace(/-/g, ' ')}`;
    }
    
    prompt += ':\n\n' + message;
    
    if (customInstructions) {
      prompt += `\n\nAdditional instructions: ${customInstructions}`;
    }
    
    // Set a timeout for the API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    // Make the API call with timeout
    const responsePromise = model.generateContent(prompt);
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    const result = response.response;
    return result.text();
  } catch (error) {
    console.error('Error improving message:', error);
    throw new Error(error.message || 'Failed to improve message. Please try again.');
  }
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault();
  
  // Hide any previous errors
  hideError();
  
  // Get form values
  const apiKey = document.getElementById('api-key').value.trim();
  const message = document.getElementById('message').value.trim();
  const tone = document.getElementById('tone').value;
  const template = document.getElementById('template').value;
  const customInstructions = document.getElementById('custom-instructions')?.value.trim() || '';
  const rememberApiKey = document.getElementById('remember-api-key').checked;
  
  // Validate inputs
  if (!apiKey) {
    showError('Please enter your Google API key');
    return;
  }
  
  if (!message) {
    showError('Please enter a message to improve');
    return;
  }
  
  // Save API key if remember is checked
  if (rememberApiKey) {
    localStorage.setItem('api-key', apiKey);
  }
  
  // Set loading state
  setLoading(true);
  
  try {
    // Improve the message
    const improvedMessage = await improveMessage(message, tone, template, customInstructions, apiKey);
    
    // Display the result
    document.getElementById('improved-message').textContent = improvedMessage;
    document.getElementById('result-container').classList.remove('hidden');
    
    // Scroll to result
    document.getElementById('result-container').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    showError(error.message);
  } finally {
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
  const modal = document.getElementById('api-key-modal');
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideApiKeyModal);
  }
  
  // Close modal when clicking outside of it
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideApiKeyModal();
      }
    });
    
    // Prevent clicks inside modal content from closing the modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }
  
  // Add keyboard support for closing modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('visible')) {
      hideApiKeyModal();
    }
  });
  
  // Add copy button event listener
  const copyButton = document.getElementById('copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const improvedMessage = document.getElementById('improved-message').textContent;
      copyToClipboard(improvedMessage);
    });
  }
}); 