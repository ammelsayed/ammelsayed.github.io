# Personal Website & Portfolio

A clean, structured, and scalable personal website built with HTML, CSS, and JavaScript.

## 🚀 Key Features
- **Centralized Data**: All site content (blog, projects, events, publications) is stored in the `data/` directory as JSON files for easy updates.
- **Global Theme**: Consistent styling across the site using CSS variables in `styles/theme.css`.
- **Reusable Components**: Custom Web Components for Header and Footer to reduce redundancy.
- **Unified Card Rendering**: A shared `CardRenderer` utility in `styles/utils.js` for consistent card layouts with search and highlight functionality.
- **Dynamic Content**: Data is fetched and rendered dynamically, allowing for easy scaling without manual HTML updates.

## 📁 Project Structure
- `data/`: Centralized JSON data files.
- `styles/`: Global styles, theme variables, and shared components.
- `images/`: Site-wide images and icons.
- `blog/`, `projects/`, `events/`, `publications/`: Section-specific pages and assets.
- `user/`: Personal information and social link management scripts.

## 🛠️ How to Add Content
To add a new blog post, project, or event, simply update the corresponding JSON file in the `data/` directory. The website will automatically reflect the changes on the next reload.
