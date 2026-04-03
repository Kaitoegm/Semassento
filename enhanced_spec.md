# SciStat v4: Production-Ready Statistical Intelligence System

A fully functional, high-performance web application for scientific data analysis and clinical trial monitoring, built with a "Zero Placeholders" philosophy.

**DESIGN SYSTEM (REQUIRED):**
- **Platform**: Web (Desktop-first, Responsive)
- **Visual Language**: High-fidelity scientific aesthetics. "Deep Navy" (#0a0a1a) backgrounds with "Emerald Glow" (#00ffa3) primary accents. Glassmorphism surfaces with backdrop-blur-2xl.
- **Typography**: Inter (UI), JetBrains Mono (Data/Code/Stats).
- **Interactions**: Fluid motion via Framer Motion. 300ms transitions. High-contrast indicators for statistical significance.

**CORE REQUIREMENTS (TOTAL FUNCTIONALITY):**
1. **Authentication (Neon Auth)**:
   - Secure login and registration via managed Neon Auth (Better Auth).
   - Session persistence and Protected Routes for analysis workspace.
   - User-specific data isolation in PostgreSQL.

2. **Analysis Engine (Sync & Persistent)**:
   - **Upload & Execute**: Real-time CSV/Excel processing via FastAPI. No local cached "ghosts".
   - **Persistence**: Every analysis must be saved to the Neon `analyses` table with metadata (P-values, coefficients, test types).
   - **Real Calculations**: All calculators (Power, Survival, Meta) must hit backend endpoints for accurate scientific computation (SciPy/Statsmodels).

3. **Data Integrity (No Fakes)**:
   - **Profile**: Dynamic fetching of user roles and institution.
   - **Archive**: Real-time pagination and filtering of the entire analysis history.
   - **Clinical Trials**: Live CRUD operations on the `trials` table.

4. **UI Stability**:
   - Every button must have a deterministic action (API call, State change, or Navigation).
   - Robust error handling for network failures or malformed datasets.
   - Global loading states and meaningful progress indicators.

---
💡 **Tip:** This specification is optimized for GSD execution. For consistent designs across multiple screens, ensure the DESIGN.md file is synchronized with the CSS variables in index.css.
