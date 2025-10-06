### 🛠️ How to Use (Local Dev)

1. **Download the project**

   * Either **Clone**:

     ```bash
     git clone github.com/Basak-Unal/dia-new-ui
     ```
   * Or **Download ZIP** and extract it.

2. **Open a terminal/Command Prompt** and **change directory** into the project folder:

   ```bash
   cd path/to/our/project
   ```

3. **Install dependencies**

   * Recommended:

     ```bash
     npm ci
     ```
   * (If you don’t have a `package-lock.json`, use `npm install` once, then prefer `npm ci` next time.)

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   The terminal will print the local URL—open it in your browser (commonly `http://localhost:5173` or `http://localhost:3000`).

#### 🔧 If you hit issues

CONTACT US: at atakanka350@gmail.com

* Reinstall clean:

  ```bash
  rm -rf node_modules package-lock.json
  npm ci
  ```
* Make sure you’re on a recent **Node LTS** (e.g., Node 20).
* Clear cache if needed:

  ```bash
  npm cache clean --force
  npm ci
  ```
* If the dev URL doesn’t open, check the terminal output for the exact port and ensure nothing else is using it.





# 💙 Dialife — Empowering Connection in Diabetes

> _A social, data-driven health platform that transforms diabetes management from isolation into connection._

---

## 🌍 Overview

**Dialife** is a modern health-tech platform designed for people living with diabetes.  
It blends **community, technology, and empathy** to create a space where managing diabetes feels empowering — not exhausting.

Where most health apps reduce people to numbers, Dialife focuses on **connection**.  
It enables users to meet, share, and support each other while the technology quietly handles the rest — scalable, secure, and always available.

---

## 💡 The Problem

Diabetes affects more than **500 million people worldwide**, influencing every aspect of daily life — diet, sleep, emotions, and relationships.  
Despite hundreds of tracking apps, the human side of diabetes remains underserved.  
People face:
- **Isolation** from others who understand their journey  
- **Decision fatigue** from constant health vigilance  
- **Lack of emotional support** and community understanding  

Dialife was built to change that.

---

## ❤️ The Vision

We believe that **connection is therapy**.  
Dialife’s mission is to **rebuild community** among people with diabetes through technology that feels personal, lightweight, and meaningful.  

Our design principles:
- **Empathy before metrics** — focus on people, not just numbers  
- **Simplicity through design** — intuitive, accessible, calm interface  
- **Scalability through technology** — serverless architecture that grows effortlessly  

---

## ⚙️ Architecture Overview

**Frontend:** React + TypeScript  
**Backend:** AWS Lambda (Python) via API Gateway  
**Databases:**  
- **DynamoDB** — event and feed storage  
- **PostgreSQL** — user relationships, followers, and participation  
**Storage:** S3 (optional)  
**Version Control:** GitHub  
**Infrastructure:** Fully serverless, cost-efficient, and globally scalable

### 🔧 System Flow
1. The React frontend sends API calls to **AWS API Gateway**.  
2. Gateway routes each request to the correct **Lambda function**.  
3. Lambdas interact with **DynamoDB** (feeds, activities) and **PostgreSQL** (user metadata).  
4. The responses return instantly, rendering in the user’s browser.  

*(See diagram in `/docs/architecture.drawio`)*

---

## 🚀 Core Features

| Feature | Description | Why It Matters |
|----------|--------------|----------------|
| 🧭 **Event Creation & Participation** | Create, join, and manage real-world or virtual events. Stored in `dialife-activity` DynamoDB table. | Turns social support into real, trackable action. |
| 💬 **Piece Text Feed** | Micro-blog reflections stored in `dialife-piece-text` DynamoDB table. | Promotes emotional expression and community empathy. |
| 👥 **Followers & Social Graph** | User relationships stored in PostgreSQL. | Enables personalized content and deeper connection. |
| ☁️ **Hybrid Cloud Architecture** | Combines NoSQL scalability with SQL structure. | High performance, low latency, strong consistency. |
| ⚙️ **Serverless Lambda Backend** | Modular functions handle CRUD, metrics, and moderation. | Scales on demand — no idle cost. |
| 💻 **React + TypeScript Frontend** | Responsive, type-safe, and dynamic user interface. | Enhances developer velocity and UX consistency. |
| ♿ **User-First Design** | Accessible typography, calming palette, intuitive flow. | Designed for focus and comfort. |

---

## 🧠 Technical Highlights

- **Eventual consistency** for high-volume feeds  
- **Strong relational consistency** for user data  
- **IAM-based least privilege** security for Lambdas  
- **JWT authentication** for secure sessions  
- **CloudWatch monitoring** for real-time reliability  
- **CI-ready GitHub workflow** for rapid iteration  

---

## 🧩 Implementation Timeline

| Phase | Milestone | Status |
|-------|------------|--------|
| Design | Concept, architecture, database schema | ✅ |
| Development | Lambda APIs + DynamoDB schemas | ✅ |
| Integration | React UI + PostgreSQL + authentication | ✅ |
| Testing & Demo | UI polish, user feedback, video showcase | 🔜 |

---

## 📈 Market Insights

Early pilot feedback describes Dialife as  
> “a space where diabetes feels lighter.”

Users especially valued:
- The emotional warmth of the feed  
- The clarity of the interface  
- The instantaneous feel of serverless tech  

---

## 🔮 Future Roadmap

- 🤖 **AI Companions** – personalized daily motivation  
- 📊 **CGM Integration** – connect with Dexcom and similar APIs  
- 🌐 **Multi-region scaling** – expand to global deployment  
- 💬 **Cross-condition support** – expand framework for other chronic communities  

---

## 💪 Our Impact

Dialife bridges the gap between **data and humanity**.  
It empowers people with diabetes to connect, share, and live confidently — supported by community, strengthened by design, and powered by cloud technology.

---

## 🧾 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🧑‍💻 Contributors
| Name | Role |
|------|------|
| [Name] | Frontend Developer |
| [Name] | Backend Developer |
| [Name] | Database Architect |
| [Name] | Project Manager |

---

> “Technology alone doesn’t heal — but it can remind us that we are not alone.”  
> **– The Dialife Team**
