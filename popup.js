// Popup script - Modern UI Controller
class PopupController {
  constructor() {
    // Transcript elements
    this.transcriptStatusEl = document.getElementById("transcriptStatus");
    this.transcriptContentEl = document.getElementById("transcriptContent");
    this.refreshBtn = document.getElementById("refreshBtn");
    this.copyTranscriptBtn = document.getElementById("copyTranscriptBtn");

    // Sections elements
    this.sectionsStatusEl = document.getElementById("sectionsStatus");
    this.sectionsContentEl = document.getElementById("sectionsContent");
    this.mkdirCodeEl = document.getElementById("mkdirCode");
    this.getSectionsBtn = document.getElementById("getSectionsBtn");
    this.copyMkdirBtn = document.getElementById("copyMkdirBtn");
    this.sectionCountEl = document.getElementById("sectionCount");

    // Tab elements
    this.tabBtns = document.querySelectorAll(".tab-btn");

    // Data
    this.currentTranscript = null;
    this.currentSections = [];
    this.mkdirCommand = "";

    this.init();
  }

  init() {
    // Bind tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    // Bind transcript event listeners
    this.refreshBtn.addEventListener("click", () => this.refreshTranscript());
    this.copyTranscriptBtn.addEventListener("click", () => this.copyTranscriptAndClose());

    // Bind sections event listeners
    this.getSectionsBtn.addEventListener("click", () => this.getSections());
    this.copyMkdirBtn.addEventListener("click", () =>
      this.copyToClipboard(this.mkdirCommand, this.copyMkdirBtn, "📁 Copy mkdir Command")
    );

    // Auto check transcript khi popup mở
    this.checkTranscript();
  }

  switchTab(tabName) {
    // Update tab buttons
    this.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update tab content
    document.getElementById("transcriptTab").classList.toggle("active", tabName === "transcript");
    document.getElementById("sectionsTab").classList.toggle("active", tabName === "sections");

    // Auto-load sections when switching to sections tab
    if (tabName === "sections" && this.currentSections.length === 0) {
      this.getSections();
    }
  }

  async checkTranscript() {
    try {
      this.setStatus(this.transcriptStatusEl, "loading", "Checking for transcript...");

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      if (!activeTab) {
        this.setStatus(this.transcriptStatusEl, "error", "Cannot access current tab");
        return;
      }

      if (!activeTab.url.includes("udemy.com")) {
        this.setStatus(this.transcriptStatusEl, "error", "Please open a Udemy course page");
        return;
      }

      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: "getTranscript",
      });

      if (response && response.success && response.found) {
        this.currentTranscript = response.content;
        this.setStatus(this.transcriptStatusEl, "success", "Transcript found!");
        this.displayTranscript(response.content);
        this.copyTranscriptBtn.disabled = false;
      } else {
        this.currentTranscript = null;
        this.setStatus(
          this.transcriptStatusEl,
          "error",
          response?.message || "No transcript panel found"
        );
        this.displayTranscript(null);
        this.copyTranscriptBtn.disabled = true;
      }
    } catch (error) {
      console.error("Error checking transcript:", error);
      this.setStatus(
        this.transcriptStatusEl,
        "error",
        "Connection error. Please refresh the page."
      );
      this.displayTranscript(null);
      this.copyTranscriptBtn.disabled = true;
    }
  }

  async getSections() {
    try {
      this.setStatus(this.sectionsStatusEl, "loading", "Loading sections...");
      this.getSectionsBtn.disabled = true;

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      if (!activeTab) {
        this.setStatus(this.sectionsStatusEl, "error", "Cannot access current tab");
        this.getSectionsBtn.disabled = false;
        return;
      }

      if (!activeTab.url.includes("udemy.com")) {
        this.setStatus(this.sectionsStatusEl, "error", "Please open a Udemy course page");
        this.getSectionsBtn.disabled = false;
        return;
      }

      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: "getSections",
      });

      if (response && response.success && response.sections.length > 0) {
        this.currentSections = response.sections;
        this.setStatus(
          this.sectionsStatusEl,
          "success",
          `Found ${response.count} sections!`
        );
        this.displaySections(response.sections);
        this.generateMkdirCommand(response.sections);
        this.copyMkdirBtn.disabled = false;

        // Update section count badge
        this.sectionCountEl.textContent = response.count;
        this.sectionCountEl.style.display = "inline";
      } else {
        this.currentSections = [];
        this.setStatus(this.sectionsStatusEl, "error", "No sections found");
        this.sectionsContentEl.className = "content-box empty";
        this.sectionsContentEl.textContent = "No sections found yet...";
        this.mkdirCodeEl.style.display = "none";
        this.copyMkdirBtn.disabled = true;
      }

      this.getSectionsBtn.disabled = false;
    } catch (error) {
      console.error("Error getting sections:", error);
      this.setStatus(
        this.sectionsStatusEl,
        "error",
        "Connection error. Please refresh the page."
      );
      this.getSectionsBtn.disabled = false;
    }
  }

  generateMkdirCommand(sections) {
    // Transform section titles to clean folder names
    // "Section 1: Welcome, Welcome, Welcome!" → "01-welcome-welcome-welcome"
    const sanitizedFolders = sections.map((section, index) => {
      // Extract just the title part after "Section X:"
      let title = section
        .replace(/^Section\s+\d+:\s*/i, '') // Remove "Section X:" prefix
        .replace(/^PART\s+\d+:\s*/i, '')    // Remove "PART X:" prefix if exists
        .trim();
      
      // Convert to kebab-case
      const kebabName = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')           // Remove special chars except spaces and dashes
        .replace(/\s+/g, '-')               // Replace spaces with dashes
        .replace(/-+/g, '-')                // Collapse multiple dashes
        .replace(/^-|-$/g, '');             // Remove leading/trailing dashes
      
      // Add zero-padded number prefix
      const num = String(index + 1).padStart(2, '0');
      return `${num}-${kebabName}`;
    });

    // Generate mkdir command
    const folderArgs = sanitizedFolders.map((f) => `"${f}"`).join(" \\\n  ");
    this.mkdirCommand = `mkdir -p \\\n  ${folderArgs}`;

    // Display the command
    this.mkdirCodeEl.textContent = this.mkdirCommand;
    this.mkdirCodeEl.style.display = "block";
  }

  displaySections(sections) {
    this.sectionsContentEl.className = "content-box";
    const ul = document.createElement("ul");
    ul.className = "sections-list";

    sections.forEach((section, index) => {
      const li = document.createElement("li");
      
      const numSpan = document.createElement("span");
      numSpan.className = "section-num";
      numSpan.textContent = String(index + 1).padStart(2, '0');
      
      const textSpan = document.createElement("span");
      textSpan.textContent = section;
      
      li.appendChild(numSpan);
      li.appendChild(textSpan);
      ul.appendChild(li);
    });

    this.sectionsContentEl.innerHTML = "";
    this.sectionsContentEl.appendChild(ul);
  }

  async copyTranscriptAndClose() {
    if (!this.currentTranscript) {
      return;
    }

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(this.currentTranscript);

      // Show success feedback
      const originalHTML = this.copyTranscriptBtn.innerHTML;
      this.copyTranscriptBtn.innerHTML = "✅ Copied!";

      // Close the transcript panel
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: "closeTranscriptPanel",
        }).catch((err) => console.log("Could not close panel:", err));
      }

      setTimeout(() => {
        this.copyTranscriptBtn.innerHTML = "📋 Copy Transcript";
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      this.copyTranscriptBtn.innerHTML = "❌ Failed";
      setTimeout(() => {
        this.copyTranscriptBtn.innerHTML = "📋 Copy Transcript";
      }, 2000);
    }
  }

  async refreshTranscript() {
    this.refreshBtn.disabled = true;
    this.refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';

    await this.checkTranscript();

    this.refreshBtn.disabled = false;
    this.refreshBtn.innerHTML = "🔄 Refresh";
  }

  async copyToClipboard(content, button, originalLabel) {
    if (!content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);

      // Show success feedback
      const originalHTML = button.innerHTML;
      button.innerHTML = "✅ Copied!";
      button.classList.add("copied");

      setTimeout(() => {
        button.innerHTML = originalLabel;
        button.classList.remove("copied");
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      button.innerHTML = "❌ Failed";
      setTimeout(() => {
        button.innerHTML = originalLabel;
      }, 2000);
    }
  }

  setStatus(element, type, message) {
    element.className = `status-card ${type}`;

    let iconHTML = "";
    switch (type) {
      case "loading":
        iconHTML = '<span class="spinner"></span>';
        break;
      case "success":
        iconHTML = "✅";
        break;
      case "error":
        iconHTML = "❌";
        break;
      default:
        iconHTML = "ℹ️";
        break;
    }

    element.innerHTML = `
      <span class="status-icon">${iconHTML}</span>
      <span>${message}</span>
    `;
  }

  displayTranscript(content) {
    if (content && content.trim()) {
      this.transcriptContentEl.className = "content-box";

      const formattedContent = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n\n");

      this.transcriptContentEl.textContent = formattedContent;
    } else {
      this.transcriptContentEl.className = "content-box empty";
      this.transcriptContentEl.textContent = "No transcript available yet...";
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
