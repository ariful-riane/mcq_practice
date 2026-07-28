# MCQ Practice

A React + Vite web application for creating and practicing multiple-choice questions (MCQs). Import question banks from JSON, CSV, or Excel files — or build them manually — then generate randomized quizzes for effective exam preparation and self-assessment.

🔗 **Live Demo:** [mcq-practice-sigma.vercel.app](https://mcq-practice-sigma.vercel.app/)

## ✨ Features

* 📄 Import MCQs from JSON, CSV, or Excel (.xlsx) files
* ✍️ Create and edit questions manually
* 🎲 Generate randomized quizzes
* 🎯 Practice with custom question banks
* 📊 Instant scoring and feedback
* 💾 Manage questions locally in the browser
* 📱 Responsive user interface

## 🛠️ Technologies

* React 18
* Vite
* PapaParse (CSV parsing)
* SheetJS / xlsx (Excel parsing)
* uuid
* JavaScript (JSX), HTML5, CSS3

## 📂 Project Structure

```text
mcq_practice/
├── src/
│   ├── main.jsx
│   └── ...
├── index.html
├── package.json
├── package-lock.json
├── vite.config.mjs
└── README.md
```
> *The exact structure of `src/` may vary as the project evolves.*

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or later recommended)
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/ariful-riane/mcq_practice.git
cd mcq_practice
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will then be available in your browser at the local address shown in the terminal (commonly `http://localhost:5173`).

### Building for Production

```bash
npm run build
```

This outputs a static, production-ready build to the `dist/` folder. You can preview it locally with:

```bash
npm run preview
```

## 📋 Question Bank Formats

### JSON

```json
[
  {
    "question": "What does HTML stand for?",
    "options": [
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyper Transfer Markup Language",
      "Home Tool Markup Language"
    ],
    "answer": 0
  }
]
```

Where:
* `question` – The question text.
* `options` – An array of answer choices.
* `answer` – The zero-based index of the correct answer.

### CSV / Excel

Question banks can also be imported from `.csv` or `.xlsx` files (parsed with PapaParse and SheetJS respectively). Structure your spreadsheet with a header row for the question and each option, plus a column indicating the correct answer, following the same pattern as the JSON format above.

## 🎯 Purpose

This project was developed to provide a flexible platform for practicing multiple-choice questions using custom question banks. It is suitable for university coursework, professional certifications, and general exam preparation.

## 🌐 Deployment

Since this is a static, client-side React app built with Vite, the production build (`dist/`) can be deployed to any static hosting provider, including:

* GitHub Pages
* Vercel
* Netlify
* Render (static site)
* Cloudflare Pages

Run `npm run build` and deploy the contents of the generated `dist/` folder.

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---

Developed by **Ariful Riane**
