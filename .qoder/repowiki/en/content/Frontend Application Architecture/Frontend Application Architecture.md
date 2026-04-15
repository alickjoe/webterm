# Frontend Application Architecture

<cite>
**Referenced Files in This Document**
- [App.vue](file://frontend/src/App.vue)
- [main.ts](file://frontend/src/main.ts)
- [router/index.ts](file://frontend/src/router/index.ts)
- [views/LoginView.vue](file://frontend/src/views/LoginView.vue)
- [views/DashboardView.vue](file://frontend/src/views/DashboardView.vue)
- [views/WorkspaceView.vue](file://frontend/src/views/WorkspaceView.vue)
- [views/ConnectionPanel.vue](file://frontend/src/views/ConnectionPanel.vue)
- [views/FileEditorModal.vue](file://frontend/src/views/FileEditorModal.vue)
- [stores/auth.store.ts](file://frontend/src/stores/auth.store.ts)
- [stores/connections.store.ts](file://frontend/src/stores/connections.store.ts)
- [stores/workspace.store.ts](file://frontend/src/stores/workspace.store.ts)
- [composables/useTerminal.ts](file://frontend/src/composables/useTerminal.ts)
- [composables/useSftp.ts](file://frontend/src/composables/useSftp.ts)
- [composables/useFileEditor.ts](file://frontend/src/composables/useFileEditor.ts)
- [composables/useSSE.ts](file://frontend/src/composables/useSSE.ts)
- [i18n/index.ts](file://frontend/src/i18n/index.ts)
- [i18n/locales/en.ts](file://frontend/src/i18n/locales/en.ts)
- [i18n/locales/zh.ts](file://frontend/src/i18n/locales/zh.ts)
- [components/LanguageSwitcher.vue](file://frontend/src/components/LanguageSwitcher.vue)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive internationalization documentation covering the new i18n framework
- Documented the vue-i18n integration and translation system
- Added language switching component documentation
- Included multilingual support implementation across all application views
- Updated component analysis to reflect translation usage patterns

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Internationalization Framework](#internationalization-framework)
6. [Detailed Component Analysis](#detailed-component-analysis)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
This document describes the frontend architecture of a Vue.js 3 Single Page Application that provides SSH terminal and SFTP capabilities in the browser. It focuses on component hierarchy, routing, state management, and the API integration layer built around composables for real-time terminal sessions, SFTP operations, and file editing. The application now includes comprehensive internationalization support with English and Chinese languages, featuring a dynamic language switching component and centralized translation management.

## Project Structure
The frontend is organized by feature and technology:
- Views: Route-level components for Login, Dashboard, Workspace, ConnectionPanel, and FileEditorModal
- Router: Vue Router 4 configuration with guards and lazy-loaded route components
- Stores: Pinia stores for authentication, connections, and workspace state
- Composables: Reusable logic for terminal, SFTP, file editor, and SSE
- API: Typed API modules for auth, connections, SFTP, terminal, and history
- Utilities: Editor language and theme helpers
- **Internationalization**: vue-i18n framework with locale management and language switching

```mermaid
graph TB
subgraph "Runtime"
A_App["App.vue"]
A_Main["main.ts"]
R_Index["router/index.ts"]
end
subgraph "Views"
V_Login["LoginView.vue"]
V_Dash["DashboardView.vue"]
V_WS["WorkspaceView.vue"]
V_CP["ConnectionPanel.vue"]
V_Edit["FileEditorModal.vue"]
end
subgraph "State"
S_Auth["auth.store.ts"]
S_Conn["connections.store.ts"]
S_WS["workspace.store.ts"]
end
subgraph "Composables"
C_Term["useTerminal.ts"]
C_SFTP["useSftp.ts"]
C_File["useFileEditor.ts"]
C_SSE["useSSE.ts"]
end
subgraph "i18n System"
I_Index["i18n/index.ts"]
I_Locales["locales/en.ts & zh.ts"]
I_Switcher["LanguageSwitcher.vue"]
end
A_Main --> A_App
A_App --> R_Index
R_Index --> V_Login
R_Index --> V_Dash
R_Index --> V_WS
V_Dash --> S_Auth
V_Dash --> S_Conn
V_Dash --> S_WS
V_WS --> V_CP
V_CP --> C_Term
V_CP --> C_SFTP
V_CP --> V_Edit
V_Edit --> C_File
C_Term --> C_SSE
I_Index --> I_Locales
I_Index --> I_Switcher
```

**Diagram sources**
- [main.ts:1-13](file://frontend/src/main.ts#L1-L13)
- [App.vue:1-21](file://frontend/src/App.vue#L1-L21)
- [router/index.ts:1-44](file://frontend/src/router/index.ts#L1-L44)
- [views/LoginView.vue:1-183](file://frontend/src/views/LoginView.vue#L1-L183)
- [views/DashboardView.vue:1-408](file://frontend/src/views/DashboardView.vue#L1-L408)
- [views/WorkspaceView.vue:1-361](file://frontend/src/views/WorkspaceView.vue#L1-L361)
- [views/ConnectionPanel.vue:1-667](file://frontend/src/views/ConnectionPanel.vue#L1-L667)
- [views/FileEditorModal.vue:1-430](file://frontend/src/views/FileEditorModal.vue#L1-L430)
- [stores/auth.store.ts:1-54](file://frontend/src/stores/auth.store.ts#L1-L54)
- [stores/connections.store.ts:1-43](file://frontend/src/stores/connections.store.ts#L1-L43)
- [stores/workspace.store.ts:1-83](file://frontend/src/stores/workspace.store.ts#L1-L83)
- [composables/useTerminal.ts:1-237](file://frontend/src/composables/useTerminal.ts#L1-L237)
- [composables/useSftp.ts:1-154](file://frontend/src/composables/useSftp.ts#L1-L154)
- [composables/useFileEditor.ts:1-187](file://frontend/src/composables/useFileEditor.ts#L1-L187)
- [composables/useSSE.ts:1-84](file://frontend/src/composables/useSSE.ts#L1-L84)
- [i18n/index.ts:1-43](file://frontend/src/i18n/index.ts#L1-L43)
- [i18n/locales/en.ts:1-114](file://frontend/src/i18n/locales/en.ts#L1-L114)
- [i18n/locales/zh.ts:1-114](file://frontend/src/i18n/locales/zh.ts#L1-L114)
- [components/LanguageSwitcher.vue:1-126](file://frontend/src/components/LanguageSwitcher.vue#L1-L126)

**Section sources**
- [main.ts:1-13](file://frontend/src/main.ts#L1-L13)
- [router/index.ts:1-44](file://frontend/src/router/index.ts#L1-L44)

## Core Components
- LoginView: Handles authentication forms, registration, and redirects after login/logout. Now includes language switching integration.
- DashboardView: Manages user connections, tests connectivity, and opens terminal/SFTP tabs. Features localized UI elements and language switcher.
- WorkspaceView: Hosts the tabbed interface for multiple hosts and command history. Includes language switcher and localized command history.
- ConnectionPanel: Hosts Terminal and SFTP sub-tabs, integrates XTerm.js and SFTP operations. Fully translated with localized action buttons and dialogs.
- FileEditorModal: Provides a CodeMirror 6-based editor with language-aware formatting. Features localized status bar, headers, and tooltips.
- **LanguageSwitcher**: Dedicated component for language selection with dropdown interface and persistent storage.

**Section sources**
- [views/LoginView.vue:1-183](file://frontend/src/views/LoginView.vue#L1-L183)
- [views/DashboardView.vue:1-408](file://frontend/src/views/DashboardView.vue#L1-L408)
- [views/WorkspaceView.vue:1-361](file://frontend/src/views/WorkspaceView.vue#L1-L361)
- [views/ConnectionPanel.vue:1-667](file://frontend/src/views/ConnectionPanel.vue#L1-L667)
- [views/FileEditorModal.vue:1-430](file://frontend/src/views/FileEditorModal.vue#L1-L430)
- [components/LanguageSwitcher.vue:1-126](file://frontend/src/components/LanguageSwitcher.vue#L1-L126)

## Architecture Overview
The SPA initializes Pinia and Vue Router, then renders route components. Authentication state drives navigation guards. The WorkspaceView manages multiple ConnectionPanel instances via Pinia workspace state. Real-time terminal streams use Server-Sent Events (SSE) with XTerm.js. SFTP operations are performed through a session-backed API with CodeMirror 6 for editing. The internationalization framework provides seamless language switching with persistent locale storage.

```mermaid
sequenceDiagram
participant U as "User"
participant R as "Router"
participant D as "DashboardView"
participant WS as "WorkspaceView"
participant CP as "ConnectionPanel"
participant LS as "LanguageSwitcher"
participant I18N as "i18n System"
participant Term as "useTerminal"
participant SSE as "useSSE"
participant API_T as "terminal.api"
U->>R : Navigate to "/workspace"
R-->>WS : Render WorkspaceView
U->>LS : Click language switcher
LS->>I18N : setLocale(newLocale)
I18N->>I18N : Update locale in localStorage
I18N-->>WS : Trigger re-render with new locale
U->>D : Click "Terminal" on a connection
D->>WS : addTab(connection, "terminal")
R-->>CP : Render ConnectionPanel for active tab
CP->>Term : connect(connectionId)
Term->>API_T : createTerminalSession(connectionId)
API_T-->>Term : { sessionId }
Term->>SSE : useSSE("/api/terminal/sessions/{id}/stream?token=...")
SSE-->>Term : "output", "connected", "error", "close"
Term-->>CP : connected=true, write output to XTerm
```

**Diagram sources**
- [router/index.ts:1-44](file://frontend/src/router/index.ts#L1-L44)
- [views/DashboardView.vue:143-153](file://frontend/src/views/DashboardView.vue#L143-L153)
- [views/WorkspaceView.vue:58-68](file://frontend/src/views/WorkspaceView.vue#L58-L68)
- [views/ConnectionPanel.vue:24-26](file://frontend/src/views/ConnectionPanel.vue#L24-L26)
- [components/LanguageSwitcher.vue:46-49](file://frontend/src/components/LanguageSwitcher.vue#L46-L49)
- [i18n/index.ts:29-37](file://frontend/src/i18n/index.ts#L29-L37)
- [composables/useTerminal.ts:132-179](file://frontend/src/composables/useTerminal.ts#L132-L179)
- [composables/useSSE.ts:11-50](file://frontend/src/composables/useSSE.ts#L11-L50)

## Internationalization Framework

### vue-i18n Integration
The application uses vue-i18n v9 with Composition API for modern internationalization support. The framework provides:
- **Composition API**: Uses `useI18n()` composable for reactive translations
- **TypeScript Support**: Strongly typed locale definitions and translation keys
- **Dynamic Loading**: Translations loaded on-demand with lazy imports
- **Fallback System**: English as fallback locale for missing translations

### Locale Management
The i18n system manages two locales with comprehensive coverage:
- **English (en)**: Complete translation for all UI elements, forms, and error messages
- **Chinese (zh)**: Full localization including technical terms and user interface elements

### Language Switcher Component
The LanguageSwitcher component provides an intuitive dropdown interface:
- **Persistent Storage**: Uses localStorage to remember user's language preference
- **Real-time Updates**: Immediately switches language without page reload
- **Visual Feedback**: Shows current language and highlights active selection
- **Responsive Design**: Dropdown menu with hover states and keyboard navigation

### Translation Usage Patterns
All views utilize the `$t()` function for consistent translation:
- **Static Text**: Labels, placeholders, and button text
- **Dynamic Content**: Confirmation messages with variables
- **Error Handling**: User-friendly error messages
- **Form Validation**: Placeholder texts and validation messages

**Section sources**
- [i18n/index.ts:1-43](file://frontend/src/i18n/index.ts#L1-L43)
- [i18n/locales/en.ts:1-114](file://frontend/src/i18n/locales/en.ts#L1-L114)
- [i18n/locales/zh.ts:1-114](file://frontend/src/i18n/locales/zh.ts#L1-L114)
- [components/LanguageSwitcher.vue:1-126](file://frontend/src/components/LanguageSwitcher.vue#L1-L126)
- [views/LoginView.vue:65](file://frontend/src/views/LoginView.vue#L65)
- [views/DashboardView.vue:116](file://frontend/src/views/DashboardView.vue#L116)
- [views/WorkspaceView.vue:83](file://frontend/src/views/WorkspaceView.vue#L83)

## Detailed Component Analysis

### Routing and Navigation Guards
- Routes: login, dashboard, workspace
- Guards:
  - requiresAuth: blocks unauthenticated users from dashboard/workspace
  - guest: blocks authenticated users from login
  - workspace guard prevents navigation to workspace without open tabs

```mermaid
flowchart TD
Start(["Route Change"]) --> CheckMeta["Read route meta"]
CheckMeta --> RequiresAuth{"requiresAuth?"}
RequiresAuth --> |Yes| IsAuth{"isAuthenticated?"}
IsAuth --> |No| ToLogin["Redirect to login"]
IsAuth --> |Yes| GuestCheck{"meta.guest?"}
RequiresAuth --> |No| GuestCheck
GuestCheck --> |Yes| IsAuth2{"isAuthenticated?"}
IsAuth2 --> |Yes| ToDash["Redirect to dashboard"]
IsAuth2 --> |No| Next["Allow navigation"]
GuestCheck --> |No| WorkspaceGuard{"to.name == 'workspace'?"}
WorkspaceGuard --> HasTabs{"workspace.hasOpenTabs?"}
HasTabs --> |No| ToDash2["Redirect to dashboard"]
HasTabs --> |Yes| Next
ToLogin --> End(["Navigation blocked"])
ToDash --> End
ToDash2 --> End
Next --> End
```

**Diagram sources**
- [router/index.ts:29-41](file://frontend/src/router/index.ts#L29-L41)

**Section sources**
- [router/index.ts:1-44](file://frontend/src/router/index.ts#L1-L44)

### Authentication Store and App Lifecycle
- Persists token in localStorage
- Exposes login/register/fetchUser/logout
- Clears workspace tabs on logout

```mermaid
classDiagram
class AuthStore {
+user
+token
+loading
+isAuthenticated
+login(username,password)
+register(username,email,password)
+fetchUser()
+logout()
}
class AppLifecycle {
+onMounted()
}
AppLifecycle --> AuthStore : "reads isAuthenticated"
```

**Diagram sources**
- [stores/auth.store.ts:7-53](file://frontend/src/stores/auth.store.ts#L7-L53)
- [App.vue:15-19](file://frontend/src/App.vue#L15-L19)

**Section sources**
- [stores/auth.store.ts:1-54](file://frontend/src/stores/auth.store.ts#L1-L54)
- [App.vue:1-21](file://frontend/src/App.vue#L1-L21)

### Connections Store and Dashboard Interactions
- CRUD for connections
- Test connection and update UI state
- Open terminal/SFTP tabs via workspace store

```mermaid
sequenceDiagram
participant D as "DashboardView"
participant Conn as "connections.store.ts"
participant WS as "workspace.store.ts"
participant R as "router"
D->>Conn : fetchConnections()
D->>Conn : add/edit/remove/test
D->>WS : addTab(conn,"terminal"|"sftp")
D->>R : push({name : "workspace"})
```

**Diagram sources**
- [views/DashboardView.vue:139-149](file://frontend/src/views/DashboardView.vue#L139-L149)
- [views/DashboardView.vue:143-153](file://frontend/src/views/DashboardView.vue#L143-L153)
- [stores/connections.store.ts:10-39](file://frontend/src/stores/connections.store.ts#L10-L39)
- [stores/workspace.store.ts:15-33](file://frontend/src/stores/workspace.store.ts#L15-L33)

**Section sources**
- [views/DashboardView.vue:1-408](file://frontend/src/views/DashboardView.vue#L1-L408)
- [stores/connections.store.ts:1-43](file://frontend/src/stores/connections.store.ts#L1-L43)
- [stores/workspace.store.ts:1-83](file://frontend/src/stores/workspace.store.ts#L1-L83)

### Workspace Tabs and Command History
- Hosts multiple ConnectionPanel instances
- Tab management via workspace store
- Command history dropdown with API integration

```mermaid
flowchart TD
WS["WorkspaceView"] --> Tabs["Render tabs from workspaceStore.tabs"]
WS --> CP["ConnectionPanel per tab"]
WS --> History["Command History dropdown"]
History --> API_H["history.api.getCommandHistory()"]
CP --> Term["useTerminal"]
CP --> SFTP["useSftp"]
CP --> Edit["FileEditorModal"]
```

**Diagram sources**
- [views/WorkspaceView.vue:58-68](file://frontend/src/views/WorkspaceView.vue#L58-L68)
- [views/WorkspaceView.vue:98-126](file://frontend/src/views/WorkspaceView.vue#L98-L126)
- [stores/workspace.store.ts:15-64](file://frontend/src/stores/workspace.store.ts#L15-L64)

**Section sources**
- [views/WorkspaceView.vue:1-361](file://frontend/src/views/WorkspaceView.vue#L1-L361)
- [stores/workspace.store.ts:1-83](file://frontend/src/stores/workspace.store.ts#L1-L83)

### ConnectionPanel: Terminal and SFTP
- Sub-tabs: Terminal and SFTP
- Terminal:
  - Initializes XTerm.js, FitAddon, WebLinksAddon
  - Batches input and sends UTF-8 via base64 encoding
  - SSE for real-time output, resize events, and lifecycle
- SFTP:
  - Session-based file listing, navigation, uploads, downloads, renames, deletes
  - Path input normalization and refresh behavior
  - **Fully localized**: All buttons, dialogs, and status messages translated

```mermaid
classDiagram
class ConnectionPanel {
+props : connectionId, isActive, activeSubTab
+subTabChange()
+close()
+initTerminal()
+connect()
+disconnect()
+listDir()
+upload()
+download()
+navigateTo()
+mkdir()
+rename()
+refresh()
}
class useTerminal {
+sessionId
+connected
+error
+initTerminal()
+connect()
+disconnect()
+fit()
+writeText()
}
class useSftp {
+sessionId
+currentPath
+files
+loading
+error
+connect()
+listDir()
+navigateTo()
+goUp()
+refresh()
+download()
+upload()
+remove()
+mkdir()
+rename()
+disconnect()
}
ConnectionPanel --> useTerminal : "uses"
ConnectionPanel --> useSftp : "uses"
```

**Diagram sources**
- [views/ConnectionPanel.vue:169-199](file://frontend/src/views/ConnectionPanel.vue#L169-L199)
- [composables/useTerminal.ts:12-236](file://frontend/src/composables/useTerminal.ts#L12-L236)
- [composables/useSftp.ts:5-153](file://frontend/src/composables/useSftp.ts#L5-L153)

**Section sources**
- [views/ConnectionPanel.vue:1-667](file://frontend/src/views/ConnectionPanel.vue#L1-L667)
- [composables/useTerminal.ts:1-237](file://frontend/src/composables/useTerminal.ts#L1-L237)
- [composables/useSftp.ts:1-154](file://frontend/src/composables/useSftp.ts#L1-L154)

### FileEditorModal: CodeMirror 6 Integration
- Dynamically loads language and lint extensions
- Tracks dirty state and cursor position
- Saves via SFTP API and formats with Prettier when supported
- **Fully localized**: Status bar, headers, tooltips, and error messages translated

```mermaid
sequenceDiagram
participant CP as "ConnectionPanel"
participant FE as "FileEditorModal"
participant File as "useFileEditor"
participant API as "sftp.api"
CP->>FE : openEditor(file) or openNewFile()
FE->>File : openFile(sessionId,file) or createNewFile()
File->>API : readFileContent(sessionId,path)
API-->>File : {content}
File-->>FE : originalContent, fileName, language info
FE->>File : saveFile(sessionId,content,currentPath)
File->>API : writeFileContent(sessionId,path,content)
API-->>File : success
File-->>FE : isDirty=false
```

**Diagram sources**
- [views/ConnectionPanel.vue:336-353](file://frontend/src/views/ConnectionPanel.vue#L336-L353)
- [views/FileEditorModal.vue:64-278](file://frontend/src/views/FileEditorModal.vue#L64-L278)
- [composables/useFileEditor.ts:29-84](file://frontend/src/composables/useFileEditor.ts#L29-L84)

**Section sources**
- [views/FileEditorModal.vue:1-430](file://frontend/src/views/FileEditorModal.vue#L1-L430)
- [composables/useFileEditor.ts:1-187](file://frontend/src/composables/useFileEditor.ts#L1-L187)

### Real-Time Streaming with SSE
- useSSE wraps EventSource with exponential backoff
- useTerminal subscribes to "output", "connected", "error", "close" events
- Token appended to URL for authentication

```mermaid
sequenceDiagram
participant Term as "useTerminal"
participant SSE as "useSSE"
participant BE as "backend SSE endpoint"
Term->>SSE : connect("/api/terminal/sessions/{id}/stream?token=...")
SSE->>BE : Establish SSE connection
BE-->>SSE : "connected"
SSE-->>Term : connected=true
BE-->>SSE : "output"(base64)
SSE-->>Term : output decoded
Term->>Term : terminal.write(decoded)
BE-->>SSE : "error"/"close"
SSE-->>Term : error message / connected=false
```

**Diagram sources**
- [composables/useTerminal.ts:146-174](file://frontend/src/composables/useTerminal.ts#L146-L174)
- [composables/useSSE.ts:11-50](file://frontend/src/composables/useSSE.ts#L11-L50)

**Section sources**
- [composables/useTerminal.ts:1-237](file://frontend/src/composables/useTerminal.ts#L1-L237)
- [composables/useSSE.ts:1-84](file://frontend/src/composables/useSSE.ts#L1-L84)

## Dependency Analysis
- Component coupling:
  - WorkspaceView depends on workspace.store for tabs and active tab
  - ConnectionPanel depends on useTerminal/useSftp and emits events to WorkspaceView
  - FileEditorModal depends on useFileEditor and SFTP API
  - **LanguageSwitcher** integrates with i18n system for locale management
- State management:
  - Pinia stores encapsulate data fetching and mutations
  - Stores are reactive and consumed by views/composables
- External integrations:
  - XTerm.js for terminal emulation
  - CodeMirror 6 for editor
  - Server-Sent Events for real-time terminal updates
  - **vue-i18n for internationalization**

```mermaid
graph LR
WS["WorkspaceView"] --> WSS["workspace.store"]
CP["ConnectionPanel"] --> Term["useTerminal"]
CP --> SFTP["useSftp"]
FE["FileEditorModal"] --> File["useFileEditor"]
Term --> SSE["useSSE"]
Term --> API_T["terminal.api"]
SFTP --> API_S["sftp.api"]
File --> API_S
LS["LanguageSwitcher"] --> I18N["i18n System"]
I18N --> Locales["Translation Locales"]
```

**Diagram sources**
- [views/WorkspaceView.vue:76-140](file://frontend/src/views/WorkspaceView.vue#L76-L140)
- [views/ConnectionPanel.vue:161-200](file://frontend/src/views/ConnectionPanel.vue#L161-L200)
- [views/FileEditorModal.vue:75-89](file://frontend/src/views/FileEditorModal.vue#L75-L89)
- [components/LanguageSwitcher.vue:29-30](file://frontend/src/components/LanguageSwitcher.vue#L29-L30)
- [i18n/index.ts:19-27](file://frontend/src/i18n/index.ts#L19-L27)

**Section sources**
- [views/WorkspaceView.vue:1-361](file://frontend/src/views/WorkspaceView.vue#L1-L361)
- [views/ConnectionPanel.vue:1-667](file://frontend/src/views/ConnectionPanel.vue#L1-L667)
- [views/FileEditorModal.vue:1-430](file://frontend/src/views/FileEditorModal.vue#L1-L430)
- [components/LanguageSwitcher.vue:1-126](file://frontend/src/components/LanguageSwitcher.vue#L1-L126)
- [composables/useTerminal.ts:1-237](file://frontend/src/composables/useTerminal.ts#L1-L237)
- [composables/useSftp.ts:1-154](file://frontend/src/composables/useSftp.ts#L1-L154)
- [composables/useFileEditor.ts:1-187](file://frontend/src/composables/useFileEditor.ts#L1-L187)
- [composables/useSSE.ts:1-84](file://frontend/src/composables/useSSE.ts#L1-L84)
- [i18n/index.ts:1-43](file://frontend/src/i18n/index.ts#L1-L43)

## Performance Considerations
- Lazy loading:
  - Routes use dynamic imports to split bundles
  - **Translation files loaded on-demand with vue-i18n**
- Memory management:
  - useTerminal disposes XTerm and SSE on unmount
  - useSftp resets state on disconnect
  - FileEditorModal destroys EditorView on unmount
  - **LanguageSwitcher maintains state without full component recreation**
- Real-time update optimization:
  - Terminal input is batched with a short timer to reduce network calls
  - Fit addon recalculates dimensions on container resize
- Rendering:
  - keep-alive caches WorkspaceView to avoid reinitializing panels on navigation
  - **i18n system uses reactive locale updates without full page reload**

**Section sources**
- [router/index.ts:11, 17, 23](file://frontend/src/router/index.ts#L11,L17,L23)
- [App.vue:3](file://frontend/src/App.vue#L3)
- [composables/useTerminal.ts:234-236](file://frontend/src/composables/useTerminal.ts#L234-L236)
- [composables/useSftp.ts:124-133](file://frontend/src/composables/useSftp.ts#L124-L133)
- [views/FileEditorModal.vue:271-277](file://frontend/src/views/FileEditorModal.vue#L271-L277)
- [components/LanguageSwitcher.vue:46-49](file://frontend/src/components/LanguageSwitcher.vue#L46-L49)

## Troubleshooting Guide
- Authentication
  - If login fails, error messages are shown and stored in the form; ensure token persistence and API availability
- Terminal
  - If terminal does not connect, verify session creation and SSE URL with token; check for escape sequence handling and input batching
  - If output is garbled, ensure base64-to-UTF-8 decoding is applied
- SFTP
  - If file operations fail, confirm session ID exists and path normalization is correct
  - Large file uploads/downloads may fail; consider chunking or server-side limits
- Editor
  - If formatting fails, verify language-specific Prettier plugin availability and configuration
- **Internationalization**
  - If language switching doesn't work, check localStorage permissions and i18n initialization
  - If translations appear blank, verify translation keys match locale files
  - If fallback locale isn't working, ensure English translations are complete
- General
  - Use browser devtools to inspect SSE connection state and network requests

**Section sources**
- [views/LoginView.vue:70-90](file://frontend/src/views/LoginView.vue#L70-L90)
- [composables/useTerminal.ts:146-174](file://frontend/src/composables/useTerminal.ts#L146-L174)
- [composables/useSftp.ts:12-24](file://frontend/src/composables/useSftp.ts#L12-L24)
- [composables/useFileEditor.ts:86-141](file://frontend/src/composables/useFileEditor.ts#L86-L141)
- [components/LanguageSwitcher.vue:46-49](file://frontend/src/components/LanguageSwitcher.vue#L46-L49)

## Conclusion
The frontend employs a clean separation of concerns: route-driven views, Pinia stores for state, and composable modules for real-time terminal and SFTP operations. The architecture supports multi-host workspaces, real-time streaming, and a capable file editor, while maintaining performance and maintainability through lazy loading, lifecycle cleanup, and modular design. The newly integrated internationalization framework provides seamless multilingual support with persistent language preferences and comprehensive translation coverage across all application views.

## Appendices
- Extending with new features:
  - Add a new Pinia store for domain state
  - Create a new route component and add it to router/index.ts
  - Implement a composable for new backend integration if needed
  - Integrate with existing SSE or API patterns
  - **Add new translation keys to locale files for internationalization**
- Maintaining code organization:
  - Keep composables focused and reusable
  - Encapsulate side effects and resource cleanup
  - Use typed APIs and store interfaces consistently
  - **Follow i18n patterns: use $t() function for all user-facing text**
  - **Maintain consistent translation key naming conventions**