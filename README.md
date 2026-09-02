# Verdant CRM — Premium B2B SaaS Platform

An enterprise-grade commercial operations & CRM web application built with **Spring Boot 3**, **PostgreSQL 16**, **Flyway**, **Spring Security**, and an **editorial Warm Cream / Dark Moss design system** in Vanilla HTML5/CSS3/ES6+.

---

## Visual Design Reference & Aesthetics
- **Canvas / Paper**: Warm cream background (`--cream: #f7f5f0`), crisp paper surfaces (`--paper: #ffffff`).
- **Sidebar**: Deep charcoal / moss (`--moss: #141e18`) with subtle borders and illuminated active states.
- **Accents**: Sophisticated forest green (`--green: #2c593f`), terracotta/clay (`--clay: #c55a38`), sun honey (`--sun: #cb9229`), and slate blue (`--blue: #3d6a87`).
- **Typography**: 
  - Display Serifs: `Newsreader` (Headings, Hero metrics, Amounts)
  - Clean Sans: `Plus Jakarta Sans` (Body, Buttons, Navigation, Forms, Tables)
  - Monospace: `JetBrains Mono` (Codes, IDs, Margins, Timestamps)

---

## Core Capabilities & Modules

1. **Command Center Dashboard**
   - **Hero Metric**: "Revenue asking for attention" calculating total exposure across delayed projects, unfollowed proposals, and overdue receivables.
   - **Pipeline Velocity**: Interactive circular step tracker (`Incoming` → `On-site` → `Quoted` → `In Flight` → `Collections`).
   - **Needs Your Decision**: Immediate actionable queue for low-margin proposals, overdue receivables, and delayed project timelines.
   - **Movement Today**: Real-time activity timeline.
   - **On the Ground**: Field schedule for technicians and specialists.

2. **Flow & Execution Modules**
   - **Leads**: Opportunity lifecycle, contact logs, value estimates, assignments, and notes.
   - **Site Surveys**: Dimension recordings, scheduling, technician assignments, and completion logs.
   - **Quotes**: Automatic gross margin calculation (`Amount - Cost`) & margin % with <15% low-margin safeguards.
   - **Projects**: Execution milestone tracking, progress percentages, and budget management.
   - **Payments**: Milestone billing, overdue calculations, and single-click payment clearance.

3. **Aftercare & 360 Client View**
   - **Customers**: Portfolio management with 360-degree account drawer pulling all associated leads, surveys, quotes, projects, and invoices.
   - **Service & Warranty**: Aftercare support ticketing, diagnostic logs, priority levels, and target resolution tracking.

4. **Omni-Search & Toasts**
   - Instant global search across Leads, Customers, Quotes, Projects, and Invoices with `⌘K` / `/` shortcut.
   - Non-blocking toast notification system.

---

## Technology Stack

- **Backend**: Spring Boot 3.2.5, Java 17, Spring Data JPA, Hibernate, Bean Validation, Flyway migrations, JJWT.
- **Database**: PostgreSQL 16.
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Design Tokens), ES6+ Vanilla JS, Fetch API. Zero React/Vue/Bootstrap/Tailwind dependencies.

---

## Getting Started

### 1. Database Setup
Make sure PostgreSQL is running on `localhost:5432` with a database named `crm_db`.
Flyway will automatically create and seed all tables upon backend startup.

### 2. Run the Application
```bash
cd backend
mvn spring-boot:run
```

The application will launch on:
👉 **`http://localhost:8080`**

### 3. Demo Credentials
- **Executive Admin**: `admin@verdantcrm.com` / `Admin@123`
- **Field & Solutions Staff**: `sarah.chen@verdantcrm.com` / `Staff@123`
