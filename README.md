# XML Visual Preview & UI Dashboard

**XML Visual Preview** transforms raw, cluttered XML files into clean, elegant, and interactive visual cards, dashboards, and structured tree views directly inside Visual Studio Code.

No more reading through thousands of raw angle brackets (`<tag>...</tag>`). Designed specifically for complex data exports (Jira XML issues, ECR, DFMEA, ASPICE, SOAP payloads, enterprise configs, and POMs).

---

## ✨ Features

- 🎨 **Visual UI Card View (Default)**: Automatically hides raw `<...>` and `</...>` tags! Transforms entities into styled cards, key-value rows, colored badges for attributes, and clickable web links.
- 🌳 **Interactive Tree View**: Hierarchical tree explorer without angle brackets. Collapsible `[▼] / [▶]` nodes for easy navigation of nested structures.
- 💻 **Syntax-Highlighted Code View**: Clean, formatted XML code view powered by `highlight.js` with zero external CDN dependencies (works 100% offline).
- 🔍 **Real-Time Instant Search**: Type any keyword in the search bar to instantly filter cards across the entire document.
- ⚡ **Auto-Sync Preview**: Keep the preview tab open beside your code. Clicking any `.xml` file in your workspace automatically updates the visual preview.
- ⌨️ **Universal Keyboard Shortcut**: Simply press `Ctrl + Shift + V` to toggle the visual preview (same shortcut as Markdown preview).

---

## 🚀 How to Use

1. Open any `.xml` or `.dtd` file in VS Code.
2. Open the Visual Preview using any of these 3 ways:
   - **Keyboard Shortcut**: Press `Ctrl + Shift + V`
   - **Editor Title Bar**: Click the **Preview** icon `$(open-preview)` at the top-right corner of the editor.
   - **Right-Click Context Menu**: Right-click anywhere in the editor or file explorer and select **XML Visual Preview: Open UI Dashboard**.

---

## 🛠️ View Modes

| Mode | Icon | Description |
| :--- | :---: | :--- |
| **Giao diện (UI)** | 🎨 | Clean card-based visual dashboard. Hides all raw XML tags. |
| **Cây phân cấp (Tree)** | 🌳 | Interactive collapsible node tree with clean attribute badges. |
| **Mã XML (Code)** | 💻 | Syntax-highlighted formatted XML code. |

---

## 📋 Release Notes

### 1.0.0
- Initial official release on VS Code Marketplace.
- Full UI Cards rendering with raw tag suppression.
- Interactive tree visualizer and search bar.
- Offline CSS/highlighting support (no external CDN dependencies).
- Auto-sync on active editor change.

---

## 📄 License
MIT License.
