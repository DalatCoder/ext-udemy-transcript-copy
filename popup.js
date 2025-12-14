// Popup script để tương tác với user
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
    this.copyTranscriptBtn.addEventListener("click", () =>
      this.copyToClipboard(this.currentTranscript, this.copyTranscriptBtn)
    );

    // Bind sections event listeners
    this.getSectionsBtn.addEventListener("click", () => this.getSections());
    this.copyMkdirBtn.addEventListener("click", () =>
      this.copyToClipboard(this.mkdirCommand, this.copyMkdirBtn)
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
      this.setStatus(this.transcriptStatusEl, "loading", "Đang kiểm tra transcript...");

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      if (!activeTab) {
        this.setStatus(this.transcriptStatusEl, "error", "Không thể truy cập tab hiện tại");
        return;
      }

      if (!activeTab.url.includes("udemy.com")) {
        this.setStatus(this.transcriptStatusEl, "error", "Extension chỉ hoạt động trên Udemy.com");
        return;
      }

      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: "getTranscript",
      });

      if (response && response.success && response.found) {
        this.currentTranscript = response.content;
        this.setStatus(this.transcriptStatusEl, "success", "Đã tìm thấy transcript!");
        this.displayTranscript(response.content);
        this.copyTranscriptBtn.disabled = false;
      } else {
        this.currentTranscript = null;
        this.setStatus(
          this.transcriptStatusEl,
          "error",
          response?.message || "Không tìm thấy transcript panel"
        );
        this.displayTranscript(null);
        this.copyTranscriptBtn.disabled = true;
      }
    } catch (error) {
      console.error("Error checking transcript:", error);
      this.setStatus(
        this.transcriptStatusEl,
        "error",
        "Lỗi kết nối. Hãy refresh trang và thử lại."
      );
      this.displayTranscript(null);
      this.copyTranscriptBtn.disabled = true;
    }
  }

  async getSections() {
    try {
      this.setStatus(this.sectionsStatusEl, "loading", "Đang lấy danh sách sections...");
      this.getSectionsBtn.disabled = true;

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      if (!activeTab) {
        this.setStatus(this.sectionsStatusEl, "error", "Không thể truy cập tab hiện tại");
        this.getSectionsBtn.disabled = false;
        return;
      }

      if (!activeTab.url.includes("udemy.com")) {
        this.setStatus(this.sectionsStatusEl, "error", "Extension chỉ hoạt động trên Udemy.com");
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
          `Đã tìm thấy ${response.count} sections!`
        );
        this.displaySections(response.sections);
        this.generateMkdirCommand(response.sections);
        this.copyMkdirBtn.disabled = false;

        // Update section count badge
        this.sectionCountEl.textContent = response.count;
        this.sectionCountEl.style.display = "inline";
      } else {
        this.currentSections = [];
        this.setStatus(this.sectionsStatusEl, "error", "Không tìm thấy sections");
        this.sectionsContentEl.className = "content-area empty";
        this.sectionsContentEl.textContent = "Chưa có sections...";
        this.mkdirCodeEl.style.display = "none";
        this.copyMkdirBtn.disabled = true;
      }

      this.getSectionsBtn.disabled = false;
    } catch (error) {
      console.error("Error getting sections:", error);
      this.setStatus(
        this.sectionsStatusEl,
        "error",
        "Lỗi kết nối. Hãy refresh trang và thử lại."
      );
      this.getSectionsBtn.disabled = false;
    }
  }

  generateMkdirCommand(sections) {
    // Sanitize folder names: remove/replace invalid characters
    const sanitizedFolders = sections.map((section) => {
      return section
        .replace(/[\/\\:*?"<>|]/g, "-") // Replace invalid chars with dash
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();
    });

    // Generate mkdir command with quoted folder names
    const folderArgs = sanitizedFolders.map((f) => `"${f}"`).join(" \\\n  ");
    this.mkdirCommand = `mkdir -p \\\n  ${folderArgs}`;

    // Display the command
    this.mkdirCodeEl.textContent = this.mkdirCommand;
    this.mkdirCodeEl.style.display = "block";
  }

  displaySections(sections) {
    this.sectionsContentEl.className = "content-area";
    const ul = document.createElement("ul");
    ul.className = "sections-list";

    sections.forEach((section, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${section}`;
      ul.appendChild(li);
    });

    this.sectionsContentEl.innerHTML = "";
    this.sectionsContentEl.appendChild(ul);
  }

  async refreshTranscript() {
    this.refreshBtn.disabled = true;
    this.refreshBtn.innerHTML =
      '<span class="loading-spinner"></span> Đang kiểm tra...';

    await this.checkTranscript();

    this.refreshBtn.disabled = false;
    this.refreshBtn.innerHTML = "🔄 Kiểm tra lại";
  }

  async copyToClipboard(content, button) {
    if (!content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);

      // Show success feedback
      const originalText = button.innerHTML;
      const originalBg = button.style.backgroundColor;
      button.innerHTML = "✅ Đã copy!";
      button.style.backgroundColor = "#28a745";

      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = originalBg;
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  setStatus(element, type, message) {
    element.className = `status ${type}`;

    if (type === "loading") {
      element.innerHTML = '<span class="loading-spinner"></span>' + message;
    } else {
      let icon = "";
      switch (type) {
        case "success":
          icon = "✅";
          break;
        case "error":
          icon = "❌";
          break;
        default:
          icon = "ℹ️";
          break;
      }
      element.innerHTML = icon + " " + message;
    }
  }

  displayTranscript(content) {
    if (content && content.trim()) {
      this.transcriptContentEl.className = "content-area";

      const formattedContent = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n\n");

      this.transcriptContentEl.textContent = formattedContent;
    } else {
      this.transcriptContentEl.className = "content-area empty";
      this.transcriptContentEl.textContent = "Chưa có nội dung transcript...";
    }
  }
}

// Khởi tạo popup controller khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
