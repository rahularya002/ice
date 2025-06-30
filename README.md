# ICE Portal - The Institute of Civil Engineers, India

A comprehensive task management and collaboration platform built with React, TypeScript, and Supabase.

## 🚀 Features

### **Core Functionality**
- **User Management** - Role-based access control (Admin, Manager, Project Manager, Employee)
- **Department Management** - Organize teams and structure
- **Project Management** - Track projects with team collaboration
- **Task Management** - Assign, track, and manage tasks with file submissions
- **Real-time Chat** - Direct messaging and project-based communication
- **Performance Analytics** - Track productivity and performance metrics
- **Notifications** - Real-time alerts for task assignments and updates

### **Technical Features**
- **Real-time Updates** - Live synchronization across all users
- **File Uploads** - Secure file storage for task submissions
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Role-based Security** - Granular permissions and data access
- **Professional UI** - Modern, clean interface with ICE branding

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Netlify (Frontend), Supabase (Backend)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ice-portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Database

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_sample_data.sql`

### 5. Create Admin User

In your Supabase dashboard:
1. Go to Authentication > Users
2. Click "Add user"
3. Create an admin user with:
   - Email: `admin@ice.org.in`
   - Password: `admin123`
   - Confirm email: Yes

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 👥 User Roles & Permissions

### **Admin**
- Full system access
- User management (create, edit, delete)
- Department management
- System configuration

### **Manager**
- Department oversight
- User management within department
- Project and task management
- Performance reports

### **Project Manager**
- Project creation and management
- Task assignment and tracking
- Team collaboration
- Progress reporting

### **Employee**
- Task completion and submission
- Time tracking
- Team communication
- Personal performance view

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Role-based Permissions** - Granular access based on user roles
- **Secure Authentication** - Supabase Auth with JWT tokens
- **Data Encryption** - All data encrypted in transit and at rest
- **Audit Trails** - Track all user actions and changes

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** - Full feature set with multi-column layouts
- **Tablet** - Adapted layouts with touch-friendly interfaces
- **Mobile** - Streamlined interface for essential functions

## 🔄 Real-time Features

- **Live Chat** - Instant messaging with typing indicators
- **Task Updates** - Real-time status changes and notifications
- **Notifications** - Instant alerts for assignments and updates
- **Collaborative Editing** - Multiple users can work simultaneously

## 📊 Analytics & Reporting

- **Performance Metrics** - Individual and team productivity tracking
- **Task Analytics** - Completion rates, time tracking, efficiency
- **Project Progress** - Real-time project status and milestones
- **Custom Reports** - Exportable data for management review

## 🚀 Deployment

### Frontend (Netlify)
1. Build the project: `npm run build`
2. Deploy to Netlify
3. Set environment variables in Netlify dashboard

### Backend (Supabase)
- Automatically managed by Supabase
- Database migrations applied through SQL Editor
- Real-time subscriptions enabled automatically

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration
- **Database**: PostgreSQL with Row Level Security
- **Auth**: Email/password authentication
- **Storage**: File uploads for task submissions
- **Real-time**: WebSocket connections for live updates

## 📝 API Documentation

The application uses Supabase's auto-generated APIs:
- **REST API** - CRUD operations for all entities
- **GraphQL** - Available through Supabase
- **Real-time** - WebSocket subscriptions for live data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with external tools
- [ ] Automated workflow triggers
- [ ] Advanced file management
- [ ] Video conferencing integration

---

**ICE Portal** - Empowering The Institute of Civil Engineers, India with modern collaboration tools.