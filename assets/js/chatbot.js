(function () {
  'use strict';

  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  const STORAGE_KEY = 'jc.chatbot.apiKey';
  const MAX_SECTION_CHARACTERS = 1800;
  const MAX_PAGE_CHARACTERS = 2200;
  const MAX_MESSAGES = 12;

  function toPlainText(text) {
    if (!text) {
      return '';
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  function clampText(text, limit) {
    if (!text) {
      return '';
    }
    if (text.length <= limit) {
      return text;
    }
    return text.slice(0, limit).trim() + '\u2026 (excerpt truncated)';
  }

  function extractSectionText(heading) {
    if (!heading) {
      return '';
    }
    let collected = '';
    let node = heading.nextElementSibling;
    while (node && !node.matches('h1, h2, h3, h4')) {
      collected += ' ' + toPlainText(node.textContent);
      if (collected.length >= MAX_SECTION_CHARACTERS) {
        break;
      }
      node = node.nextElementSibling;
    }
    return clampText(collected.trim(), MAX_SECTION_CHARACTERS);
  }

  function collectSections() {
    const selectors = [
      'main h2',
      'main h3',
      '.content h2',
      '.content h3',
      'article h2',
      'article h3',
      '.post h2',
      '.post h3'
    ];
    let headings = [];
    selectors.forEach((selector) => {
      headings = headings.concat(Array.from(document.querySelectorAll(selector)));
    });
    if (headings.length === 0) {
      headings = Array.from(document.querySelectorAll('h2, h3'));
    }
    const seenTitles = new Set();
    const sections = [];
    headings.forEach((heading) => {
      const title = toPlainText(heading.textContent);
      if (!title) {
        return;
      }
      const normalized = title.toLowerCase();
      if (seenTitles.has(normalized)) {
        return;
      }
      const body = extractSectionText(heading);
      if (!body || body.length < 40) {
        return;
      }
      seenTitles.add(normalized);
      sections.push({
        title: title,
        content: body
      });
    });
    return sections.slice(0, 6);
  }

  function collectPageText() {
    const candidates = ['main', '.content', '.wrapper', 'body'];
    for (let i = 0; i < candidates.length; i += 1) {
      const element = document.querySelector(candidates[i]);
      if (!element) {
        continue;
      }
      const text = toPlainText(element.textContent);
      if (text && text.length > 80) {
        return clampText(text, MAX_PAGE_CHARACTERS);
      }
    }
    return '';
  }

  function createSuggestionButtons(container) {
    if (!container) {
      return;
    }
    container.innerHTML = '';
    const suggestions = [];

    const pageText = collectPageText();
    if (pageText) {
      suggestions.push({
        label: 'Summarize this page',
        prompt: 'Summarize the following content from Jake Castillo\'s website. Focus on key ideas and keep it concise.\n\n' + pageText
      });
    }

    const sections = collectSections();
    sections.forEach((section) => {
      suggestions.push({
        label: 'Summarize "' + section.title + '"',
        prompt: 'Summarize the following section from the page titled "' + section.title + '". Highlight the main takeaways and mention important details.\n\n' + section.content
      });
    });

    if (suggestions.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'chatbot-suggestions__empty';
      emptyMessage.textContent = 'We could not find sections to suggest yet. Try asking your own question!';
      container.appendChild(emptyMessage);
      return;
    }

    suggestions.forEach((suggestion) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chatbot-button';
      button.textContent = suggestion.label;
      button.dataset.prompt = suggestion.prompt;
      container.appendChild(button);
    });
  }

  function setStatus(statusElement, message, variant) {
    if (!statusElement) {
      return;
    }
    statusElement.textContent = message || '';
    if (variant) {
      statusElement.setAttribute('data-status', variant);
    } else {
      statusElement.removeAttribute('data-status');
    }
  }

  function createMessageElement(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chatbot-message chatbot-message--' + role;
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-message__bubble';
    if (text) {
      text.split('\n').forEach((line, index) => {
        if (index > 0) {
          bubble.appendChild(document.createElement('br'));
        }
        bubble.appendChild(document.createTextNode(line));
      });
    }
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function updateMessageElement(element, text) {
    if (!element) {
      return;
    }
    const bubble = element.querySelector('.chatbot-message__bubble');
    if (!bubble) {
      return;
    }
    while (bubble.firstChild) {
      bubble.removeChild(bubble.firstChild);
    }
    text.split('\n').forEach((line, index) => {
      if (index > 0) {
        bubble.appendChild(document.createElement('br'));
      }
      bubble.appendChild(document.createTextNode(line));
    });
  }

  function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  function initChatbot() {
    const widget = document.getElementById('chatbot-widget');
    if (!widget) {
      return;
    }
    const toggleButtons = Array.prototype.slice.call(document.querySelectorAll('[data-chatbot-toggle]'));
    const legacyToggle = widget.querySelector('[data-action="toggle"]');
    if (!toggleButtons.length && legacyToggle) {
      toggleButtons.push(legacyToggle);
    }
    const panel = widget.querySelector('.chatbot-panel');
    const closeButton = widget.querySelector('[data-action="close"]');
    const suggestionContainer = widget.querySelector('#chatbot-suggestion-list');
    const refreshSuggestionsButton = widget.querySelector('#chatbot-refresh-suggestions');
    const messagesContainer = widget.querySelector('#chatbot-messages');
    const form = widget.querySelector('#chatbot-form');
    const input = widget.querySelector('#chatbot-input');
    const statusElement = widget.querySelector('#chatbot-status');
    const keyInput = widget.querySelector('#chatbot-api-key');
    const saveKeyButton = widget.querySelector('#chatbot-save-key');

    if (!window.fetch) {
      setStatus(statusElement, 'Your browser does not support the features required for this chatbot.', 'error');
      return;
    }

    let conversation = [
      {
        role: 'system',
        content: 'You are Jake Castillo\'s website assistant. Base your replies on the conversation and any content supplied by the visitor. Keep answers under 160 words unless the visitor asks otherwise, and admit when information is not available.'
      }
    ];
    let isOpen = false;
    let isSending = false;
    let hasShownWelcome = false;

    function trimConversation() {
      if (conversation.length > MAX_MESSAGES) {
        const excess = conversation.length - MAX_MESSAGES;
        conversation.splice(1, excess);
      }
    }

    function showWelcomeMessage() {
      if (hasShownWelcome) {
        return;
      }
      hasShownWelcome = true;
      const welcome = createMessageElement('assistant', 'Hi there! I\'m Jake\'s AI assistant. Ask me about the page or use the suggested summaries.');
      messagesContainer.appendChild(welcome);
      scrollToBottom(messagesContainer);
    }

    function togglePanel(open) {
      const shouldOpen = typeof open === 'boolean' ? open : !isOpen;
      isOpen = shouldOpen;
      widget.classList.toggle('chatbot-widget--open', shouldOpen);
      if (toggleButtons.length) {
        toggleButtons.forEach(function (button) {
          button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        });
      }
      if (panel) {
        panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
      }
      if (shouldOpen) {
        createSuggestionButtons(suggestionContainer);
        showWelcomeMessage();
        setTimeout(function () {
          input.focus();
        }, 200);
      }
    }

    function getStoredKey() {
      return localStorage.getItem(STORAGE_KEY) || '';
    }

    function saveKey(key) {
      if (!key) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, key);
    }

    const existingKey = getStoredKey();
    if (existingKey) {
      keyInput.value = existingKey;
      setStatus(statusElement, 'Your OpenAI key is ready to use.', 'success');
    } else {
      setStatus(statusElement, 'Add your OpenAI API key to start chatting.', 'info');
    }

    if (toggleButtons.length) {
      toggleButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          togglePanel();
        });
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        togglePanel(false);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) {
        togglePanel(false);
      }
    });

    if (refreshSuggestionsButton) {
      refreshSuggestionsButton.addEventListener('click', function () {
        createSuggestionButtons(suggestionContainer);
        setStatus(statusElement, 'Suggestions refreshed from this page.', 'info');
      });
    }

    if (suggestionContainer) {
      suggestionContainer.addEventListener('click', function (event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (target.dataset && target.dataset.prompt) {
          const prompt = target.dataset.prompt;
          input.value = prompt;
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      });
    }

    if (saveKeyButton) {
      saveKeyButton.addEventListener('click', function () {
        const key = keyInput.value.trim();
        if (!key) {
          setStatus(statusElement, 'Please paste a valid OpenAI API key before saving.', 'error');
          return;
        }
        saveKey(key);
        setStatus(statusElement, 'Saved your API key locally. You can start chatting now!', 'success');
      });
    }

    if (keyInput) {
      keyInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (saveKeyButton) {
            saveKeyButton.click();
          }
        }
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (isSending) {
          return;
        }
        const message = input.value.trim();
        if (!message) {
          return;
        }
        const apiKey = keyInput.value.trim() || getStoredKey();
        if (!apiKey) {
          setStatus(statusElement, 'Please add your OpenAI API key before sending a message.', 'error');
          return;
        }
        input.value = '';
        const userMessage = createMessageElement('user', message);
        messagesContainer.appendChild(userMessage);
        conversation.push({ role: 'user', content: message });
        trimConversation();
        scrollToBottom(messagesContainer);
        sendMessage(apiKey);
      });
    }

    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      });
    }

    function sendMessage(apiKey) {
      if (isSending) {
        return;
      }
      isSending = true;
      const placeholder = createMessageElement('assistant', 'Thinking…');
      placeholder.classList.add('chatbot-message--loading');
      messagesContainer.appendChild(placeholder);
      scrollToBottom(messagesContainer);
      setStatus(statusElement, 'Waiting for ChatGPT…', 'info');

      fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: conversation,
          temperature: 0.2
        })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { status: response.status, ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            const errorMessage = (result.data && result.data.error && result.data.error.message) || 'Unable to reach OpenAI. Check your API key and usage limits.';
            throw new Error(errorMessage);
          }
          const choice = result.data && result.data.choices && result.data.choices[0];
          const reply = choice && choice.message && choice.message.content ? choice.message.content.trim() : '';
          if (!reply) {
            throw new Error('OpenAI returned an empty response.');
          }
          conversation.push({ role: 'assistant', content: reply });
          trimConversation();
          placeholder.classList.remove('chatbot-message--loading');
          updateMessageElement(placeholder, reply);
          setStatus(statusElement, 'ChatGPT replied.', 'success');
          scrollToBottom(messagesContainer);
        })
        .catch(function (error) {
          messagesContainer.removeChild(placeholder);
          if (conversation.length && conversation[conversation.length - 1].role === 'user') {
            conversation.pop();
          }
          setStatus(statusElement, error.message || 'Something went wrong.', 'error');
          const errorMessage = createMessageElement('system', 'Sorry, something went wrong while contacting OpenAI. Please check the console for details and try again.');
          messagesContainer.appendChild(errorMessage);
          scrollToBottom(messagesContainer);
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('Chatbot error:', error);
          }
        })
        .finally(function () {
          isSending = false;
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
