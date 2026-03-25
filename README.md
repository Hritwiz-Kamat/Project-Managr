# ProjectManagr 🗂️

A backend REST API for a task and project management application, built while learning backend development with Node.js, Express.js, and MongoDB.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose)
- **Tools**: Postman (API testing), Git & GitHub

## 📁 Project Structure
```
ProjectManagr/
├── controllers/
│ └── projectController.js
├── models/
│ └── projectModel.js
├── routes/
│ └── projectRoutes.js
├── middleware/
├── config/
│ └── db.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```


## ⚙️ Getting Started

### Prerequisites

- Node.js installed
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/ProjectManagr.git
   cd ProjectManagr
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   ```

4. Start the server
   ```bash
   npm start
   ```

## 🔗 API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:id` | Get task by ID |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## 📌 Status

> 🚧 Currently backend only. Frontend integration planned.
> > ⚠️ This project is for learning purposes and not production-ready yet.

## 🧑‍💻 Author

**Hritwiz Kamat**  
[GitHub](https://github.com/Hritwiz-Kamat)

## 📄 License

This project is licensed under the [MIT License](LICENSE).
