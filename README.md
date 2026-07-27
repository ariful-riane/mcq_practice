# MCQ Practice

A Node.js-based web application for creating and practicing multiple-choice questions (MCQs). Users can upload question banks in JSON format or manually create questions, then generate randomized quizzes for effective exam preparation and self-assessment.

## ✨ Features

* 📄 Import MCQs from JSON files
* ✍️ Create and edit questions manually
* 🎲 Generate randomized quizzes
* 🎯 Practice with custom question banks
* 📊 Instant scoring and feedback
* 💾 Manage questions locally
* 📱 Responsive user interface

## 🛠️ Technologies

* Node.js
* HTML5
* CSS3
* JavaScript

## 📂 Project Structure

```text
mcq_practice/
├── public/
├── routes/
├── views/
├── package.json
├── server.js
└── README.md
```

> *The exact structure may vary depending on your implementation.*

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

Start the application:

```bash
npm start
```

or, if your project uses a development script:

```bash
npm run dev
```

The application will then be available in your browser at the local address shown in the terminal (commonly `http://localhost:3000`).

## 📋 JSON Question Format

Example:

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

## 🎯 Purpose

This project was developed to provide a flexible platform for practicing multiple-choice questions using custom question banks. It is suitable for university coursework, professional certifications, and general exam preparation.

## 🌐 Deployment

This project is a **Node.js application** and requires a Node.js runtime. It cannot be hosted using GitHub Pages, which only supports static websites.

To deploy online, use a platform that supports Node.js applications, such as:

* Render
* Railway
* Fly.io
* Azure App Service
* AWS Elastic Beanstalk
* DigitalOcean App Platform

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---

Developed by **Ariful Riane**
