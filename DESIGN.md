# POS System Design System Specification
**Version 4.0 — Strict Pure Black & White (Monochrome) Edition | July 20, 2026**

This document details the extracted UI/UX design system, layout architecture, color tokens, typography, and component specifications strictly enforced as **Pure High-Contrast Black & White (Monochrome)** across every single screen, card, button, badge, and icon in the application.

---

## 1. Color System & Design Tokens (Strict Pure Black & White)

### 1.1 Palette & Color Tokens (No Blue, No Colors)

| Token Name | Tailwind Class | Hex Value | Primary Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `bg-neutral-50` | `#FAFAFA` | Main application background canvas |
| **Surface White** | `bg-white` | `#FFFFFF` | Primary card containers, tables, modals |
| **Surface Black** | `bg-black` | `#000000` | Primary action buttons, active navigation pills, header logo badge |
| **Surface Neutral** | `bg-neutral-100` | `#F5F5F5` | Secondary buttons, input backgrounds, table headers |
| **Border Neutral** | `border-neutral-200` | `#E5E5E5` | Card borders, dividers, subtle outlines |
| **Border Dark** | `border-neutral-800` / `border-black` | `#000000` | Strong borders, active tabs, critical alert indicators |
| **Text Black** | `text-black` / `text-slate-900` | `#0A0A0A` | Headings, product titles, prices, body text |
| **Text Muted** | `text-neutral-500` | `#737373` | Subtitles, SKU labels, timestamps |
| **Text White** | `text-white` | `#FFFFFF` | Text inside solid black buttons, active nav pills |

### 1.2 Functional Badges & Status Tokens (Monochrome Only)

| State | Background Tint | Text Color | Border Tint |
| :--- | :--- | :--- | :--- |
| **Critical / Out of Stock** | `bg-black` | `text-white font-bold` | `border-black` |
| **Warning / Low Stock** | `bg-neutral-200` | `text-black font-bold` | `border-neutral-400` |
| **In Stock / Normal** | `bg-neutral-100` | `text-neutral-700 font-bold` | `border-neutral-200` |
| **Active Nav Pill** | `bg-black` | `text-white font-bold` | `border-black` |

---

## 2. Layout & Component Architecture

### 2.1 Top App Header (`Header.jsx`)
- **Background**: Pure White (`#FFFFFF`) with bottom border (`#E5E5E5`)
- **Brand Title**: **SwiftPOS** in bold black text with solid black icon badge (`bg-black text-white`)
- **Global Search**: Light neutral input (`bg-neutral-100 border-neutral-200 text-black`)
- **Status Indicator**: Black pulse dot with text `Terminal 01`

### 2.2 Left Sidebar (`Sidebar.jsx`)
- **Background**: Off-White (`#FAFAFA`) with right border (`#E5E5E5`)
- **Active Navigation Item**: Solid Black background (`bg-black text-white font-bold rounded-xl`)
- **Inactive Navigation Items**: Dark neutral text (`text-neutral-600 hover:text-black hover:bg-neutral-100`)
- **Mobile Bottom Navigation**: White bar (`bg-white border-t border-neutral-200`) with black active tab indicators

### 2.3 Barcode Scanner (`BarcodeScanner.jsx`)
- **Container Card**: Solid Black camera container (`bg-black text-white rounded-2xl p-4 border border-neutral-800`)
- **Camera Status Badge**: Dark neutral pill (`bg-neutral-900 border-neutral-700 text-white`)
- **Viewfinder Reticle**: Pure white border reticle (`border-white`) with white scan-line
- **Manual Input Bar**: Dark neutral input with solid white search button (`bg-white text-black hover:bg-neutral-200`)

### 2.4 Stock Alerts Page (`AlertsPage.jsx`)
- **Critical Alert Cards**: Pure white card with thick black left accent border (`border-l-4 border-black`), solid black `CRITICAL` badge, and solid black `Restock Now` CTA.
- **Warning Alert Cards**: Pure white card with neutral left accent border (`border-l-4 border-neutral-400`), neutral `WARNING` badge, and outline `Edit Threshold` CTA.
- **Read Alert Cards**: Light gray card (`bg-neutral-50`) with checkmark icon and `Awaiting delivery` status.

---

## 3. Typography System

- **Font Family**: Inter, sans-serif
- **Monospace Font**: JetBrains Mono (for SKU codes, prices, barcodes)
- **Theme Principle**: Strict high-contrast black & white legibility without any color distractions.

---

*— End of Strict Pure Black & White Design Specification —*
